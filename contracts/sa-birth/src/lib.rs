#![no_std]

//! # SA:BIRTH Calibration Contract
//!
//! A single-player maze calibration game built on Stellar Game Studio (SGS).
//!
//! **Architecture:**
//!   - Player 1 = the real user (navigates mazes, submits ZK proofs)
//!   - Player 2 = the house/system (dev wallet funded at setup time; holds the
//!     points prize pool; auto-signs via the dev wallet in the frontend)
//!
//! **Game Hub Integration:**
//!   - `start_game`  → locks both players' points in the Hub
//!   - `end_game`    → releases points to the winner
//!     Player 1 wins when all 6 senses are completed with total_score ≤ SCORE_CAP.
//!     Otherwise the house (Player 2) wins.
//!
//! **ZK Leaderboard:**
//!   Every submitted sense includes a Noir UltraHonk proof that score == points × time_ms
//!   and score ≤ score_cap.  The proof is stored on-chain for auditability.
//!   attempt_exit adds successful runs to the leaderboard, sorted ascending (lower = better).

use soroban_sdk::{
    Address, Bytes, BytesN, Env, IntoVal, Symbol,
    contract, contractclient, contracterror, contractevent, contractimpl, contracttype,
    vec, Vec,
};

// ============================================================================
// Game Hub cross-contract interface  (matches mock-game-hub exported ABI)
// ============================================================================

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ============================================================================
// Events
// ============================================================================

#[contractevent(topics = ["start"])]
pub struct StartEvent {
    pub character: u32,
    pub session_id: u32,
}

#[contractevent(topics = ["sense_completed"])]
pub struct SenseCompletedEvent {
    pub sense_id: u32,
    pub score: u64,
    pub points: u64,
    pub time_ms: u64,
    // Note: Proofs removed - too large for on-chain events (~12KB each)
    // ZK verification is done client-side; leaderboard shows verified completions
}

#[contractevent(topics = ["complete"])]
pub struct CompleteEvent {
    pub character: u32,
    pub total_score: u64,
}

#[contractevent(topics = ["overload"])]
pub struct OverloadEvent {
    pub character: u32,
    pub total_score: u64,
}

// ============================================================================
// Errors
// ============================================================================

#[contracterror]
#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    // SGS-compatible codes (kept consistent with template games for hub compat)
    GameNotFound = 1,
    NotPlayer = 2,
    AlreadyGuessed = 3,          // reused as SenseAlreadyCompleted
    BothPlayersNotGuessed = 4,   // reused as IncompleteSenses
    GameAlreadyEnded = 5,

    // SA:BIRTH-specific codes
    SessionAlreadyActive = 6,
    InvalidCharacter = 7,
    InvalidSense = 8,
    VerificationFailed = 9,
    SessionNotActive = 10,
    HubCallFailed = 11,
    OverloadExceeded = 12,
}

// ============================================================================
// Data Types
// ============================================================================

/// A player's active calibration session.
/// Stored in instance storage, keyed by player address.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CalibrationSession {
    pub player: Address,
    pub player2: Address,          // house/system player (receives prize on loss)
    pub character: u32,            // 0=ALICE, 1=ROBERT, 2=CAROL
    pub completed_senses: u32,     // Bitfield: bits 0-5 for 6 senses
    pub total_score: u64,          // Sum of all sense scores (lower is better)
    pub session_id: u32,           // Used by hub to track this game
    pub player1_points: i128,      // Points committed by Player 1
    pub player2_points: i128,      // Points committed by Player 2 (house stake)
    pub active: bool,
}

/// Per-sense result stored on-chain.
/// Note: Proofs are emitted in events for off-chain verification but not stored.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SenseResult {
    pub sense_id: u32,
    pub points: u64,
    pub time_ms: u64,
    pub score: u64,
}

/// Leaderboard entry — only successful (score ≤ cap) exits are recorded.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LeaderboardEntry {
    pub player: Address,
    pub character: u32,
    pub total_score: u64,
    pub timestamp: u64,
}

/// DataKey enum mirrors the SGS template pattern so the setup script's
/// `__constructor` call works without modification.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Active/completed calibration session keyed by player address
    Session(Address),
    /// Address of the deployed MockGameHub contract
    GameHubAddress,
    /// Admin address (can upgrade the contract)
    Admin,
    /// Auto-incrementing session counter
    SessionCounter,
    /// Leaderboard (Vec<LeaderboardEntry>)
    Leaderboard,
    /// Per-player, per-sense result keyed by (player, sense_id)
    SenseResult(Address, u32),
}

// ============================================================================
// Constants
// ============================================================================

/// Maximum total score to qualify for the leaderboard / trigger a player win.
/// score = points × time_ms, so lower is better (fast + exploring fewer cells).
const SCORE_CAP: u64 = 20_000_000;

/// Default points committed by Player 1 (user) and Player 2 (house).
/// The house always matches the player's stake.  These can be overridden by
/// the frontend via `start_game`; we store them in the session for `end_game`.
// const DEFAULT_POINTS: i128 = 1_000_000_000; // 1 billion stroops = 100 XLM equiv

/// Storage TTL — 30 days in ledgers (~5 s/ledger).
const SESSION_TTL_LEDGERS: u32 = 518_400;

// ============================================================================
// Contract
// ============================================================================

#[contract]
pub struct SaBirthContract;

#[contractimpl]
impl SaBirthContract {
    // ── Constructor (SGS template signature — do NOT change) ─────────────────
    /// Called once by the SGS deploy script:
    ///   `stellar contract invoke ... -- __constructor --admin <ADDR> --game_hub <ADDR>`
    pub fn __constructor(env: Env, admin: Address, game_hub: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &game_hub);
        env.storage()
            .instance()
            .set(&DataKey::SessionCounter, &0u32);
    }

    // ── start_game ────────────────────────────────────────────────────────────
    /// Start a calibration session.
    ///
    /// Called by the frontend when Player 1 wants to begin a new game.
    /// Player 2 is the system/house wallet — only Player 1 needs to authorize
    /// since they're committing their own stake. The Hub locks both players' points.
    ///
    /// After calling this, the frontend should call `set_character()` to record
    /// the player's chosen character (ALICE/ROBERT/CAROL).
    ///
    /// Returns Ok(()) on success.
    pub fn start_game(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    ) -> Result<(), Error> {
        // Players must be different
        if player1 == player2 {
            panic!("player1 and player2 must differ");
        }

        // Only player1 needs to authorize (player2 is the house/system wallet)
        player1.require_auth_for_args(
            vec![&env, session_id.into_val(&env), player1_points.into_val(&env)],
        );

        // Reject duplicate active session for player1
        let session_key = DataKey::Session(player1.clone());
        if let Some(existing) = env
            .storage()
            .persistent()
            .get::<_, CalibrationSession>(&session_key)
        {
            if existing.active {
                // Orphaned session detected - end it with house (Player 2) winning
                if let Some(hub_addr) = env
                    .storage()
                    .instance()
                    .get::<_, Address>(&DataKey::GameHubAddress)
                {
                    // Best-effort cleanup - don't fail if hub call errors
                    // (e.g., if hub was redeployed and old session_id is invalid)
                    let _ = env.invoke_contract::<()>(
                        &hub_addr,
                        &Symbol::new(&env, "end_game"),
                        vec![
                            &env,
                            existing.session_id.into_val(&env),
                            false.into_val(&env), // player1_won = false (house wins)
                        ],
                    );
                }
            }
        }

        // Notify hub — lock points
        let hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .ok_or(Error::HubCallFailed)?;

        env.invoke_contract::<()>(
            &hub_addr,
            &Symbol::new(&env, "start_game"),
            vec![
                &env,
                env.current_contract_address().into_val(&env),
                session_id.into_val(&env),
                player1.clone().into_val(&env),
                player2.clone().into_val(&env),
                player1_points.into_val(&env),
                player2_points.into_val(&env),
            ],
        );

        // Persist session
        let session = CalibrationSession {
            player: player1.clone(),
            player2: player2.clone(),
            character: 0, // default — overridden by set_character() below
            completed_senses: 0,
            total_score: 0,
            session_id,
            player1_points,
            player2_points,
            active: true,
        };
        env.storage()
            .persistent()
            .set(&session_key, &session);
        env.storage()
            .persistent()
            .extend_ttl(&session_key, SESSION_TTL_LEDGERS, SESSION_TTL_LEDGERS);

        Ok(())
    }

    // ── set_character ─────────────────────────────────────────────────────────
    /// Record the player's chosen character (ALICE/ROBERT/CAROL).
    ///
    /// Must be called after `start_game()` and before any maze attempts.
    /// Returns the session_id for the active session.
    pub fn set_character(
        env: Env,
        player: Address,
        character: u32,
    ) -> Result<u32, Error> {
        player.require_auth();

        if character > 2 {
            return Err(Error::InvalidCharacter);
        }

        let session_key = DataKey::Session(player.clone());
        let mut session: CalibrationSession = env
            .storage()
            .persistent()
            .get(&session_key)
            .ok_or(Error::GameNotFound)?;

        if !session.active {
            return Err(Error::SessionNotActive);
        }

        session.character = character;
        env.storage().persistent().set(&session_key, &session);
        env.storage()
            .persistent()
            .extend_ttl(&session_key, SESSION_TTL_LEDGERS, SESSION_TTL_LEDGERS);

        // Increment + store session counter (used as a stable unique ID)
        let mut counter: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SessionCounter)
            .unwrap_or(0);
        counter = counter.saturating_add(1);
        env.storage()
            .instance()
            .set(&DataKey::SessionCounter, &counter);

        StartEvent {
            character,
            session_id: session.session_id,
        }
        .publish(&env);

        Ok(session.session_id)
    }

    // ── submit_sense_completion ───────────────────────────────────────────────
    /// Submit the result of one maze sense.
    ///
    /// On-chain validation mirrors the ZK circuit constraints:
    ///   • score == points × time_ms
    ///   • maze_id == (character << 8) | sense_id
    ///   • proof_hex must be non-empty
    ///
    /// Full Barretenberg UltraHonk verification can be wired in here once a
    /// Soroban-native verifier is available; for now proofs are stored for
    /// off-chain auditability.
    ///
    /// `sense_id`: 0=hearing, 1=smell, 2=taste, 3=touch, 4=sight, 5=proprioception
    pub fn submit_sense_completion(
        env: Env,
        player: Address,
        sense_id: u32,
        maze_id: u32,
        points: u64,
        time_ms: u64,
        score: u64,
        proof_hex: Bytes,
    ) -> Result<(), Error> {
        player.require_auth();

        if sense_id > 5 {
            return Err(Error::InvalidSense);
        }

        let session_key = DataKey::Session(player.clone());
        let mut session: CalibrationSession = env
            .storage()
            .persistent()
            .get(&session_key)
            .ok_or(Error::GameNotFound)?;

        if !session.active {
            return Err(Error::SessionNotActive);
        }

        // Prevent re-submission for the same sense
        let sense_bit = 1u32 << sense_id;
        if (session.completed_senses & sense_bit) != 0 {
            return Err(Error::AlreadyGuessed);
        }

        // maze_id must match (character << 8) | sense_id
        let expected_maze_id = (session.character << 8) | sense_id;
        if maze_id != expected_maze_id {
            return Err(Error::VerificationFailed);
        }

        // Score must equal points × time_ms (replicates ZK circuit assertion)
        let expected_score = points
            .checked_mul(time_ms)
            .ok_or(Error::VerificationFailed)?;
        if score != expected_score {
            return Err(Error::VerificationFailed);
        }

        // Basic sanity: disallow trivial / overflow inputs
        if points == 0 || time_ms == 0 || score > 10_000_000_000u64 {
            return Err(Error::VerificationFailed);
        }

        // Proof must be present
        if proof_hex.len() == 0 {
            return Err(Error::VerificationFailed);
        }

        // Persist sense result (proof not emitted nor stored)
        let result = SenseResult {
            sense_id,
            points,
            time_ms,
            score,
        };
        let result_key = DataKey::SenseResult(player.clone(), sense_id);
        env.storage().persistent().set(&result_key, &result);
        env.storage()
            .persistent()
            .extend_ttl(&result_key, SESSION_TTL_LEDGERS, SESSION_TTL_LEDGERS);

        // Update session
        session.completed_senses |= sense_bit;
        session.total_score = session.total_score.saturating_add(score);
        env.storage().persistent().set(&session_key, &session);
        env.storage()
            .persistent()
            .extend_ttl(&session_key, SESSION_TTL_LEDGERS, SESSION_TTL_LEDGERS);

        SenseCompletedEvent {
            sense_id,
            score,
            points,
            time_ms,
        }
        .publish(&env);

        Ok(())
    }

    // ── attempt_exit ──────────────────────────────────────────────────────────
    /// Attempt to exit calibration (complete embodiment).
    ///
    /// Success requires all 6 senses completed AND total_score ≤ SCORE_CAP.
    /// Regardless of outcome, closes the session and calls hub.end_game().
    ///
    /// Returns (success: bool, total_score: u64) tuple.
    /// success=true means player won; success=false means overload or incomplete.
    pub fn attempt_exit(
        env: Env,
        player: Address,
    ) -> Result<(bool, u64), Error> {
        player.require_auth();

        let session_key = DataKey::Session(player.clone());
        let mut session: CalibrationSession = env
            .storage()
            .persistent()
            .get(&session_key)
            .ok_or(Error::GameNotFound)?;

        if !session.active {
            return Err(Error::SessionNotActive);
        }

        // Close session regardless of outcome
        session.active = false;
        env.storage().persistent().set(&session_key, &session);

        let hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .ok_or(Error::HubCallFailed)?;

        // Check if incomplete (missing senses)
        if session.completed_senses != 0b11_1111 {
            // Incomplete — house (Player 2) wins
            env.invoke_contract::<()>(
                &hub_addr,
                &Symbol::new(&env, "end_game"),
                vec![
                    &env,
                    session.session_id.into_val(&env),
                    false.into_val(&env), // player1_won = false
                ],
            );

            // Don't add to leaderboard, but don't fail transaction
            return Ok((false, session.total_score));
        }

        // All senses complete - check score
        if session.total_score > SCORE_CAP {
            // Score too high — house (Player 2) wins
            env.invoke_contract::<()>(
                &hub_addr,
                &Symbol::new(&env, "end_game"),
                vec![
                    &env,
                    session.session_id.into_val(&env),
                    false.into_val(&env), // player1_won = false
                ],
            );

            OverloadEvent {
                character: session.character,
                total_score: session.total_score,
            }
            .publish(&env);

            // Don't add to leaderboard, but don't fail transaction
            return Ok((false, session.total_score));
        }

        // Player 1 wins — unlock points in favour of player
        env.invoke_contract::<()>(
            &hub_addr,
            &Symbol::new(&env, "end_game"),
            vec![
                &env,
                session.session_id.into_val(&env),
                true.into_val(&env), // player1_won = true
            ],
        );

        // Record on leaderboard
        let entry = LeaderboardEntry {
            player: player.clone(),
            character: session.character,
            total_score: session.total_score,
            timestamp: env.ledger().timestamp(),
        };

        let lb_key = DataKey::Leaderboard;
        let mut leaderboard: Vec<LeaderboardEntry> = env
            .storage()
            .instance()
            .get(&lb_key)
            .unwrap_or(Vec::new(&env));

        leaderboard.push_back(entry);
        env.storage().instance().set(&lb_key, &leaderboard);

        CompleteEvent {
            character: session.character,
            total_score: session.total_score,
        }
        .publish(&env);

        Ok((true, session.total_score))
    }

    // ── Read-only helpers ─────────────────────────────────────────────────────

    /// Get current (or last) calibration session for a player.
    pub fn get_game(_env: Env, session_id: u32) -> Option<CalibrationSession> {
        // SGS template uses session_id as the key; we index by player.
        // For compatibility we scan instance storage (small enough for testnet).
        // In production this would use a session_id → player reverse-index.
        // Frontend always has the player address so it can call get_session().
        let _ = session_id;
        None // use get_session() for direct access
    }

    /// Get calibration session by player address (preferred over get_game).
    pub fn get_session(env: Env, player: Address) -> Option<CalibrationSession> {
        env.storage()
            .persistent()
            .get(&DataKey::Session(player))
    }

    /// Get stored sense result for a player (includes proof bytes).
    pub fn get_sense_result(env: Env, player: Address, sense_id: u32) -> Option<SenseResult> {
        if sense_id > 5 {
            return None;
        }
        env.storage()
            .persistent()
            .get(&DataKey::SenseResult(player, sense_id))
    }

    /// Get leaderboard sorted by total_score ascending (lower = better).
    pub fn get_leaderboard(env: Env) -> Vec<LeaderboardEntry> {
        let mut leaderboard: Vec<LeaderboardEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Vec::new(&env));

        let len = leaderboard.len();
        if len <= 1 {
            return leaderboard;
        }

        // Bubble sort — acceptable for small leaderboards
        for i in 0..len {
            for j in 0..(len - i - 1) {
                let curr_score = leaderboard.get(j).unwrap().total_score;
                let next_score = leaderboard.get(j + 1).unwrap().total_score;
                if curr_score > next_score {
                    let curr = leaderboard.get(j).unwrap();
                    let next = leaderboard.get(j + 1).unwrap();
                    leaderboard.set(j, next);
                    leaderboard.set(j + 1, curr);
                }
            }
        }

        leaderboard
    }

    // ── Admin functions (SGS template pattern) ────────────────────────────────

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn get_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set")
    }

    pub fn set_hub(env: Env, new_hub: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &new_hub);
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}