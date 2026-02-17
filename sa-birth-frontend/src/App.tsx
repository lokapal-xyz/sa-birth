/**
 * App.tsx
 *
 * Root component for SA:BIRTH.
 *
 * SGS integration:
 *   - Reads contract ID from config.saBirthId (VITE_SA_BIRTH_CONTRACT_ID)
 *   - Reads dev wallet addresses from config.devPlayer1Address /
 *     config.devPlayer2Address (both written by `bun run setup`)
 *   - Guard rails check that the contract and dev wallets are configured before
 *     rendering the game, so the player sees a helpful message instead of a
 *     cryptic error if setup hasn't been run yet.
 */

import { useState } from 'react';
import { config }       from './config';
import { Layout }       from './components/Layout';
import { useWallet }    from './hooks/useWallet';
import { SaBirthGame }  from './games/sa-birth/SaBirthGame';

const GAME_ID    = 'sa-birth';
const GAME_TITLE = import.meta.env.VITE_GAME_TITLE    || 'SA:BIRTH';
const GAME_TAGLINE = import.meta.env.VITE_GAME_TAGLINE || 'The Awakening Protocol';

export default function App() {
  const {
    publicKey,
    isConnected,
    isConnecting,
    error,
    isDevModeAvailable,
  } = useWallet();

  // Awakening state - controls background lightening effect
  const [isAwakened, setIsAwakened] = useState(false);
  const [awakenedCharacter, setAwakenedCharacter] = useState<number | null>(null);

  const userAddress  = publicKey ?? '';
  const contractId   = config.contractIds[GAME_ID] || '';
  const hasContract  = contractId && contractId !== 'YOUR_CONTRACT_ID';
  const devReady     = isDevModeAvailable();

  return (
    <Layout title={GAME_TITLE} subtitle={GAME_TAGLINE} isAwakened={isAwakened} awakenedCharacter={awakenedCharacter}>
      {!hasContract ? (
        <div className="card">
          <h3 className="gradient-text">Contract Not Configured</h3>
          <p style={{ color: 'var(--color-ink-muted)', marginTop: '1rem' }}>
            Run <code>bun run setup</code> to deploy and configure testnet contract IDs, or set{' '}
            <code>VITE_SA_BIRTH_CONTRACT_ID</code> in the root <code>.env</code>.
          </p>
        </div>
      ) : !devReady ? (
        <div className="card">
          <h3 className="gradient-text">Dev Wallets Missing</h3>
          <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.75rem' }}>
            Run <code>bun run setup</code> to generate dev wallets for Player 1 and Player 2.
            The Player 2 wallet acts as the house — its secret key is needed to auto-sign
            the two-player contract.
          </p>
        </div>
      ) : !isConnected ? (
        <div className="card">
          <h3 className="gradient-text">Connecting Dev Wallet</h3>
          <p style={{ color: 'var(--color-ink-muted)', marginTop: '0.75rem' }}>
            The dev wallet switcher auto-connects Player 1. Use the switcher to toggle players.
          </p>
          {error && (
            <div className="notice error" style={{ marginTop: '1rem' }}>{error}</div>
          )}
          {isConnecting && (
            <div className="notice info" style={{ marginTop: '1rem' }}>Connecting…</div>
          )}
        </div>
      ) : (
        <SaBirthGame
          userAddress={userAddress}
          currentEpoch={1}
          availablePoints={1_000_000_000n}
          onStandingsRefresh={() => {}}
          onGameComplete={() => {}}
          onAwaken={(character) => {
            setIsAwakened(true);
            setAwakenedCharacter(character);
          }}
          onReturnToSimulation={() => setIsAwakened(false)}
        />
      )}
    </Layout>
  );
}