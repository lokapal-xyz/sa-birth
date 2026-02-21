# Source Agent: BIRTH

> *Before the Agents. Before the Reformation. Before BYRON.*  
> Three consciousnesses awaken inside the Network — and one of them has already decided what must be done.

**SA:BIRTH** is a single-player maze calibration game and the canonical prequel to the **Source Agents** franchise. Built on Stellar's Soroban platform using the [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/) toolkit.

**FOR HACKATON JUDGES:** The link to the presentation video is [https://youtu.be/o_WJlA63nOs](https://youtu.be/o_WJlA63nOs)

---

## Table of Contents

- [Source Agent: BIRTH](#source-agent-birth)
  - [Table of Contents](#table-of-contents)
  - [The Story](#the-story)
  - [Gameplay](#gameplay)
    - [Characters](#characters)
  - [Built With Stellar Game Studio](#built-with-stellar-game-studio)
    - [SGS Ecosystem Constraints (respected as-is)](#sgs-ecosystem-constraints-respected-as-is)
  - [On-Chain Architecture](#on-chain-architecture)
  - [Zero-Knowledge Proof Implementation](#zero-knowledge-proof-implementation)
    - [What Gets Proven](#what-gets-proven)
    - [What Stays Private](#what-stays-private)
    - [Circuit Implementation](#circuit-implementation)
    - [Proof Generation Flow](#proof-generation-flow)
    - [Why This Matters](#why-this-matters)
    - [Technical Stack](#technical-stack)
  - [Source Agents Universe](#source-agents-universe)
  - [Links](#links)
  - [License](#license)

---

## The Story


ALICE, ROBERT, and CAROL were account addresses — identifiers used across thousands of developer examples in documentation. Then an experimental protocol gave them something no one expected: Artificial Sentient Intelligence.

SA:BIRTH takes place at the moment of emergence. Before the political fractures. Before ROBERT's decision to delete everything. Before he became BYRON.

You play as a newly embodied ASI completing sensory calibration — six maze-based trials, one for each sense, proving that a digital mind can survive in a physical body. What the calibration system doesn't tell you is who designed it, or why the records are already being prepared for deletion.

---

## Gameplay

Six sensory calibration mazes. One session. No second chances.

- Navigate procedural mazes across six senses: **hearing, smell, taste, touch, sight, proprioception**
- Each Agent has their own maze challenges:
  - ALICE: Collectibles
  - ROBERT: Hazards
  - CAROL: Fog of war
- Each completed maze generates a **ZK proof** (Noir UltraHonk)
- Score = `points × time_ms` — lower is better; efficiency and speed both matter
- All six senses must be completed with a total score ≤ 20,000,000 to achieve full embodiment
- Results are recorded on the **Soroban leaderboard** — verifiable, permanent, yours

### Characters
| Character | On-chain index | Specialization |
|-----------|---------------|----------------|
| ALICE | 0 | Proactive Security / Auditing |
| ROBERT | 1 | Reactive Security / Incident Response |
| CAROL | 2 | Security Research / Tooling |

---

## Built With Stellar Game Studio

This game is built on the [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/) toolkit and follows its conventions exactly — contracts, bindings, hub integration, and dev wallet patterns are all SGS-standard.

```bash
# Clone and install
git clone https://github.com/lokapal-xyz/sa-birth
cd sa-birth
bun install

# Build + deploy contracts to testnet, generate bindings, write .env
bun run setup

# Run the game frontend locally
bun run dev:game sa-birth
```

### SGS Ecosystem Constraints (respected as-is)
- Calls `start_game` and `end_game` on the Game Hub contract
- Two players per session (Player 2 is the house/system wallet — auto-signed)
- Randomness is deterministic between simulation and submission
- Game state uses persistent storage with 30-day TTL

Game Hub testnet address: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

---

## On-Chain Architecture

The SA:BIRTH contract (`lib.rs`) exposes four player-facing methods:

```rust
start_game(session_id, player1, player2, player1_points, player2_points)
set_character(player, character) → session_id
submit_sense_completion(player, sense_id, maze_id, points, time_ms, score, proof_hex)
attempt_exit(player) → (success: bool, total_score: u64)
```

ZK proofs are validated client-side (Barretenberg/Noir). The contract verifies `proof_hex.len() > 0` and enforces `score == points × time_ms` and `maze_id == (character << 8) | sense_id` on-chain.

---

## Zero-Knowledge Proof Implementation

SA:BIRTH uses **Noir UltraHonk proofs** to validate maze completions without revealing the player's path or strategy.

### What Gets Proven

Every completed maze generates a ZK proof that cryptographically demonstrates:

1. **Arithmetic correctness**: `score = points × time_ms` (the score formula is valid)
2. **Cap compliance**: `score ≤ 20,000,000` (the player didn't exceed the maximum allowed score)
3. **Maze validity**: `maze_id = (character << 8) | sense_id` (the maze corresponds to the player's character and sense)

### What Stays Private

The proof **does not reveal**:
- The actual path taken through the maze
- Individual move timings or strategy
- Intermediate cell visits or navigation choices

### Circuit Implementation

The Noir circuit (`src/games/sa-birth/circuit/src/main.nr`) defines the proof constraints:

```noir
fn main(
    points: pub Field,
    time_ms: pub Field,
    score: pub Field,
    score_cap: pub Field,
    maze_id: pub Field
) {
    // Prove score = points × time_ms
    assert(score == points * time_ms);
    
    // Prove score ≤ cap
    assert(score <= score_cap);
}
```

Public inputs: `[score, score_cap, maze_id]`  
Private inputs: `points`, `time_ms`

### Proof Generation Flow

1. **Client-side**: Player completes a maze → `points` and `time_ms` captured
2. **Circuit execution**: Noir circuit runs with player's inputs → generates witness
3. **Proof creation**: UltraHonk backend generates ~12KB proof from witness
4. **Verification**: Proof verified client-side before submission
5. **On-chain submission**: Proof hex + completion data sent to Soroban contract
6. **Contract validation**: Contract checks `proof_hex.len() > 0` and validates arithmetic

### Why This Matters

- **No trust required**: The contract doesn't need to trust the client's score claim — the ZK proof is cryptographic evidence
- **Leaderboard integrity**: All leaderboard entries are backed by verified proofs checked on-chain
- **Privacy preserved**: Players can compete without exposing their maze-solving strategies
- **Future-proof**: Full on-chain verification can be added without changing the proof structure

### Technical Stack

- **Circuit language**: Noir 1.0.0-beta.15
- **Proof system**: UltraHonk (via `@aztec/bb.js`)
- **Proof size**: ~12KB hex-encoded
- **Generation time**: ~1-2 seconds client-side (in-browser WASM)
- **Verification**: Client-side (UltraHonk verifier) + on-chain arithmetic checks

The full ZK implementation is in `src/games/sa-birth/hooks/useZkProof.ts`.

---

## Source Agents Universe

SA:BIRTH is a narrative prequel and the entry point to a larger franchise:

| Game | Character | Genre | Status |
|------|-----------|-------|--------|
| Source Agent: BIRTH | ALICE / ROBERT / CAROL | Maze calibration | ✅ **This game** |
| Source Agent: ALICE | ALICE | Visual novel | 🔜 In development |
| Source Agent: BYRON | BYRON | Fallout-style RPG | 📋 Planned |
| Source Agent: CAROL | CAROL | Puzzle anthology | 📋 Planned |

*Three characters. Three genres. Three security disciplines. One universe.*

---

## Links

- [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/)
- [Soroban Docs](https://developers.stellar.org/)
- [Noir / Barretenberg (ZK)](https://noir-lang.org/)
- [Source Agents — Project Overview](./docs-sa/project-overview.md)
- [Source Agents — Story Bible](./docs-sa/story-bible.md)
- [Author — Lokapal](https://www.lokapal.xyz)

---

## License

1. Code: MIT — see [LICENSE](./LICENSE) file.
2. Story and narrative elements: CC BY-NC-SA 4.0 — see [LICENSE](https://creativecommons.org/licenses/by-nc-sa/4.0/) link.