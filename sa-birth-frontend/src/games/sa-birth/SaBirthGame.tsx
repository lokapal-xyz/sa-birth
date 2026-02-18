/**
 * SaBirthGame.tsx
 *
 * Transaction handling follows the exact DiceDuelGame pattern:
 *   - SaBirthService (service class) instead of useStellarContract hook
 *   - getContractSigner() from useWallet for signing
 *   - runAction + actionLock ref to prevent double-submissions
 *   - devWalletService for quickstart / dev mode
 *
 * Game flow:
 *   intro → select → lore → hub → maze (×6) → integration → success/failure/overload
 */

import { useState, useRef, useEffect } from 'react';
import { SaBirthService }              from './saBirthService';
import { requestCache, createCacheKey } from '@/utils/requestCache';
import { useWallet }                   from '@/hooks/useWallet';
import { SA_BIRTH_CONTRACT }           from '@/utils/constants';
import { devWalletService, DevWalletService } from '@/services/devWalletService';
import { CharacterSelect }             from './components/CharacterSelect';
import { CharacterLore }               from './components/CharacterLore';
import { ExitConfirmation }            from './components/ExitConfirmation';
import { SenseIntegration }            from './components/SenseIntegration';
import { SenseFailure }                from './components/SenseFailure';
import { HubRoom }                     from './components/HubRoom';
import { NarrativeIntro }              from './components/NarrativeIntro';
import { SuccessScreen }               from './components/SuccessScreen';
import { LeaderboardScreen }           from './components/LeaderboardScreen';
import { FailureScreen }               from './components/FailureScreen';
import { OverloadFailureScreen }       from './components/OverloadFailureScreen';
import { Maze }                        from './components/Maze';
import { useZkProof }                  from './hooks/useZkProof';
import type { ProofResult }            from './hooks/useZkProof';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Character = 'ALICE' | 'ROBERT' | 'CAROL';
export type Sense     = 'hearing' | 'smell' | 'taste' | 'touch' | 'sight' | 'proprioception';
export type GamePhase =
  | 'intro'
  | 'select'
  | 'lore'
  | 'hub'
  | 'maze'
  | 'integration'
  | 'senseFailure'
  | 'success'
  | 'leaderboard'
  | 'failure'
  | 'overload';

export interface SenseData {
  score:   number;
  points:  number;
  time_ms: number;
  proof?:  ProofResult | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Total score cap — player wins when total_score ≤ SCORE_CAP. */
const SCORE_CAP = 20_000_000;

/** Per-sense score cap — sense fails immediately if exceeded. */
const SENSE_SCORE_CAP = 10_000_000;

/** Maps character name → on-chain index. */
const CHARACTER_INDEX: Record<Character, number> = {
  ALICE:  0,
  ROBERT: 1,
  CAROL:  2,
};

/** Maps sense name → on-chain index. */
const SENSE_INDEX: Record<Sense, number> = {
  hearing:        0,
  smell:          1,
  taste:          2,
  touch:          3,
  sight:          4,
  proprioception: 5,
};

// Default points locked per session (matches contract DEFAULT_POINTS comment)
const DEFAULT_POINTS = BigInt(1_000_000_000);

// ─────────────────────────────────────────────────────────────────────────────
// Service instance (module-level, stable reference like DiceDuelGame)
// ─────────────────────────────────────────────────────────────────────────────

const saBirthService = new SaBirthService(SA_BIRTH_CONTRACT);

// ─────────────────────────────────────────────────────────────────────────────
// Session ID helper (same pattern as DiceDuelGame.createRandomSessionId)
// ─────────────────────────────────────────────────────────────────────────────

const createRandomSessionId = (): number => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    let value = 0;
    const buffer = new Uint32Array(1);
    while (value === 0) {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    }
    return value;
  }
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface SaBirthGameProps {
  userAddress:           string;
  currentEpoch:          number;
  availablePoints:       bigint;
  onStandingsRefresh:    () => void;
  onGameComplete:        () => void;
  onAwaken:              (character: number) => void;
  onReturnToSimulation?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SaBirthGame({
  userAddress,
  onStandingsRefresh,
  onGameComplete,
  onAwaken,
  onReturnToSimulation,
}: SaBirthGameProps) {

  // ── Game state ─────────────────────────────────────────────────────────────
  const [gamePhase,            setGamePhase]            = useState<GamePhase>('intro');
  const [character,            setCharacter]            = useState<Character | null>(null);
  const [completedSenses,      setCompletedSenses]      = useState<Set<Sense>>(new Set());
  const [currentMaze,          setCurrentMaze]          = useState<Sense | null>(null);
  const [lastCompletedSense,   setLastCompletedSense]   = useState<Sense | null>(null);
  const [totalScore,           setTotalScore]           = useState<number>(0);
  const [senseData,            setSenseData]            = useState<Map<Sense, SenseData>>(new Map());
  const [showExitConfirmation, setShowExitConfirmation] = useState<boolean>(false);
  const [exitInProgress,       setExitInProgress]       = useState<boolean>(false);
  const [sessionId,            setSessionId]            = useState<number>(() => createRandomSessionId());

  // ── Transaction UI state (mirrors DiceDuelGame loading/error pattern) ──────
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { getContractSigner, walletType } = useWallet();

  const {
    status: zkStatus,
    error:  zkError,
    generateMazeProof,
    reset:  zkReset,
  } = useZkProof();

  // ── Action lock (prevents double-submission, same as DiceDuelGame) ─────────
  const actionLock           = useRef(false);
  const isBusy               = loading;
  const mazeCompleteInFlight = useRef(false);

  const runAction = async (action: () => Promise<void>) => {
    if (actionLock.current || isBusy) return;
    actionLock.current = true;
    try {
      await action();
    } finally {
      actionLock.current = false;
    }
  };

  // ── Dev / quickstart availability (mirrors DiceDuelGame) ──────────────────
  const quickstartAvailable =
    walletType === 'dev' &&
    DevWalletService.isDevModeAvailable() &&
    DevWalletService.isPlayerAvailable(1) &&
    DevWalletService.isPlayerAvailable(2);

  // ─────────────────────────────────────────────────────────────────────────
  // Game flow handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleIntroComplete = () => setGamePhase('select');

  /**
   * Character selected → start transactions in background during lore screen.
   * Mirrors the pattern where DiceDuelGame kicks off transactions before
   * the user sees the next screen.
   */
  const handleCharacterSelect = (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
    setGamePhase('lore');

    // Fire-and-forget: start_game + set_character during lore countdown.
    // Errors surface via the error badge; they don't block the game.
    runAction(async () => {
      try {
        setLoading(true);
        setError(null);

        const signer = getContractSigner();

        // Get player 2 (house) address — init player 2, read key, restore player 1
        const originalPlayer = devWalletService.getCurrentPlayer();
        await devWalletService.initPlayer(2);
        const player2Address = devWalletService.getPublicKey();
        if (originalPlayer) {
          await devWalletService.initPlayer(originalPlayer);
        }

        const sid = sessionId;

        await saBirthService.startGame(
          sid,
          userAddress,
          player2Address,
          DEFAULT_POINTS,
          DEFAULT_POINTS,
          signer
        );
        console.info(`[Contract] start_game ✓  session_id=${sid}`);

        const returnedSessionId = await saBirthService.setCharacter(
          userAddress,
          CHARACTER_INDEX[selectedCharacter],
          signer
        );
        // Contract returns the session_id from set_character — use it for consistency
        setSessionId(returnedSessionId);
        console.info(`[Contract] set_character ✓  character=${selectedCharacter}  session_id=${returnedSessionId}`);

        onStandingsRefresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[Contract] startCalibration failed:', msg);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleLoreComplete = () => setGamePhase('hub');

  const handleEnterMaze = (sense: Sense) => {
    if (exitInProgress) return;
    mazeCompleteInFlight.current = false;
    setCurrentMaze(sense);
    setGamePhase('maze');
  };

  /**
   * Maze completed — generate ZK proof then submit to contract.
   * Guard against StrictMode double-invoke with mazeCompleteInFlight ref.
   */
  const handleMazeComplete = async (
    sense:   Sense,
    score:   number,
    points:  number,
    time_ms: number,
  ) => {
    if (mazeCompleteInFlight.current) return;
    mazeCompleteInFlight.current = true;

    // Per-sense cap check — fail immediately, don't submit
    if (score > SENSE_SCORE_CAP) {
      console.log(`[Maze] Sense ${sense} failed: score ${score} > ${SENSE_SCORE_CAP}`);
      setLastCompletedSense(sense);
      setSenseData(prev => new Map([...prev, [sense, { score, points, time_ms, proof: null }]]));
      setCurrentMaze(null);
      setGamePhase('senseFailure');
      mazeCompleteInFlight.current = false;
      return;
    }

    const mazeId = (CHARACTER_INDEX[character!] << 8) | SENSE_INDEX[sense];

    setCurrentMaze(null);
    setLastCompletedSense(sense);
    setGamePhase('integration');

    // ── Step 1: Generate ZK proof ────────────────────────────────────────
    let proof: ProofResult | null = null;
    if (score <= SCORE_CAP) {
      proof = await generateMazeProof({ points, time_ms, score, mazeId }).catch((err) => {
        console.warn('[ZK] proof generation failed:', err);
        return null;
      });
    }

    // ── Step 2: Submit to contract ───────────────────────────────────────
    if (proof && score <= SCORE_CAP) {
      await runAction(async () => {
        try {
          setLoading(true);
          setError(null);

          const signer = getContractSigner();
          await saBirthService.submitSenseCompletion(
            userAddress,
            SENSE_INDEX[sense],
            mazeId,
            BigInt(points),
            BigInt(time_ms),
            BigInt(score),
            proof!.proofHex,
            signer
          );
          console.info(`[Contract] submit_sense_completion ✓  sense=${sense}  score=${score.toLocaleString()}`);
        } catch (err) {
          // Non-fatal: local state still updates; player can continue
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          console.warn('[Contract] submit_sense_completion failed:', msg);
        } finally {
          setLoading(false);
        }
      });
    }

    // ── Step 3: Commit to local state ────────────────────────────────────
    setCompletedSenses(prev => new Set([...prev, sense]));
    setSenseData(prev => new Map([...prev, [sense, { score, points, time_ms, proof }]]));
    setTotalScore(prev => prev + score);
  };

  const handleIntegrationComplete = () => setGamePhase('hub');

  const handleSenseFailureReturn = () => {
    setGamePhase('hub');
    mazeCompleteInFlight.current = false;
  };

  const handleExitClick = () => {
    if (exitInProgress) return;
    const allComplete = completedSenses.size === 6;
    if (allComplete) {
      // Complete (win or overload) — go directly, no warning needed
      handleExitConfirmed();
    } else {
      // Incomplete — show warning
      setShowExitConfirmation(true);
    }
  };

  const handleExitConfirmed = async () => {
    setShowExitConfirmation(false);
    setExitInProgress(true);

    const allComplete = completedSenses.size === 6;

    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);

        const signer = getContractSigner();
        const result = await saBirthService.attemptExit(userAddress, signer);
        const [success, _finalScore] = result;

        setExitInProgress(false);

        if (success) {
          setGamePhase('success');
          if (character !== null) onAwaken(CHARACTER_INDEX[character]);
          onGameComplete();
          onStandingsRefresh();
        } else {
          if (totalScore > SCORE_CAP) {
            setGamePhase('overload');
          } else {
            setGamePhase('failure');
          }
          onGameComplete();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setExitInProgress(false);
        console.error('[Contract] attempt_exit failed:', msg);

        // Fallback to local state on RPC failure
        if (!allComplete) {
          setGamePhase('failure');
        } else if (totalScore > SCORE_CAP) {
          setGamePhase('overload');
          onGameComplete();
        } else {
          setGamePhase('success');
          if (character !== null) onAwaken(CHARACTER_INDEX[character]);
          onGameComplete();
        }
      } finally {
        setLoading(false);
      }
    });
  };

  const handleExitCancelled = () => setShowExitConfirmation(false);

  const handleRestart = () => {
    setGamePhase('intro');
    setCharacter(null);
    setCompletedSenses(new Set());
    setCurrentMaze(null);
    setTotalScore(0);
    setSenseData(new Map());
    setShowExitConfirmation(false);
    setExitInProgress(false);
    setSessionId(createRandomSessionId());
    setError(null);
    mazeCompleteInFlight.current = false;
    zkReset();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Status badges (same pattern as DiceDuelGame error/loading display)
  // ─────────────────────────────────────────────────────────────────────────

  const zkBadge =
    zkStatus === 'proving' || zkStatus === 'verifying' ? (
      <div style={{
        position: 'fixed', bottom: '1rem', right: '1rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.95), rgba(168,85,247,0.95))',
        backdropFilter: 'blur(10px)',
        color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
        border: '1px solid rgba(139,92,246,0.3)', fontSize: '0.85rem',
        fontFamily: 'monospace', zIndex: 1000,
        boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {zkStatus === 'proving' ? '🔐 Generating ZK Proof' : '✓ Verifying Proof'}
        </div>
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '60%', height: '100%', background: 'white', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    ) : zkStatus === 'error' && zkError ? (
      <div style={{
        position: 'fixed', bottom: '1rem', right: '1rem',
        background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(10px)',
        color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
        border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8rem',
        fontFamily: 'monospace', maxWidth: '280px', zIndex: 1000,
        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
      }}>
        ⚠️ ZK Error: {zkError}
      </div>
    ) : null;

  const contractBadge =
    loading ? (
      <div style={{
        position: 'fixed',
        bottom: (zkStatus === 'proving' || zkStatus === 'verifying') ? '3.75rem' : '1rem',
        left: '1rem',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.95), rgba(59,130,246,0.95))',
        backdropFilter: 'blur(10px)',
        color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
        border: '1px solid rgba(14,165,233,0.3)', fontSize: '0.85rem',
        fontFamily: 'monospace', zIndex: 1000,
        boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          📡 Submitting to Stellar
        </div>
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '60%', height: '100%', background: 'white', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    ) : error ? (
      <div style={{
        position: 'fixed', bottom: '1rem', left: '1rem',
        background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(10px)',
        color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px',
        border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.8rem',
        fontFamily: 'monospace', maxWidth: '280px', zIndex: 1000,
        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
      }}>
        ⚠️ Contract Error: {error}
      </div>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="game-container" style={{
      width: '100%', maxWidth: '800px', margin: '0 auto',
      borderRadius: '1rem', overflow: 'hidden',
    }}>
      {zkBadge}
      {contractBadge}

      {gamePhase === 'intro' && (
        <NarrativeIntro onComplete={handleIntroComplete} />
      )}

      {gamePhase === 'select' && (
        <CharacterSelect onSelect={handleCharacterSelect} />
      )}

      {gamePhase === 'lore' && character && (
        <CharacterLore
          character={CHARACTER_INDEX[character]}
          onContinue={handleLoreComplete}
        />
      )}

      {gamePhase === 'hub' && character && (
        <HubRoom
          character={character}
          completedSenses={completedSenses}
          senseData={senseData}
          onEnterMaze={handleEnterMaze}
          onExit={handleExitClick}
          exitInProgress={exitInProgress}
        />
      )}

      {gamePhase === 'maze' && currentMaze && character && (
        <Maze
          sense={currentMaze}
          character={character}
          onComplete={(score, points, time_ms) =>
            handleMazeComplete(currentMaze, score, points, time_ms)
          }
          onBack={() => {
            mazeCompleteInFlight.current = false;
            setCurrentMaze(null);
            setGamePhase('hub');
          }}
        />
      )}

      {gamePhase === 'integration' && lastCompletedSense && character && (
        <SenseIntegration
          sense={lastCompletedSense}
          character={character}
          score={senseData.get(lastCompletedSense)?.score || 0}
          onContinue={handleIntegrationComplete}
        />
      )}

      {gamePhase === 'senseFailure' && lastCompletedSense && (
        <SenseFailure
          sense={lastCompletedSense}
          score={senseData.get(lastCompletedSense)?.score || 0}
          onReturnToHub={handleSenseFailureReturn}
        />
      )}

      {gamePhase === 'success' && character && (
        <SuccessScreen
          character={character}
          totalScore={totalScore}
          senseData={senseData}
          onRestart={() => setGamePhase('leaderboard')}
          onReturnToSimulation={onReturnToSimulation}
        />
      )}

      {gamePhase === 'leaderboard' && character && (
        <LeaderboardScreen
          playerAddress={userAddress}
          currentScore={totalScore}
          currentCharacter={character}
          onContinue={handleRestart}
        />
      )}

      {gamePhase === 'failure' && character && (
        <FailureScreen character={character} onRestart={handleRestart} />
      )}

      {gamePhase === 'overload' && character && (
        <OverloadFailureScreen
          character={character}
          totalScore={totalScore}
          senseData={senseData}
          onRestart={handleRestart}
        />
      )}

      {showExitConfirmation && character && (
        <ExitConfirmation
          character={character}
          completedSenses={completedSenses.size}
          onConfirm={handleExitConfirmed}
          onCancel={handleExitCancelled}
        />
      )}
    </div>
  );
}