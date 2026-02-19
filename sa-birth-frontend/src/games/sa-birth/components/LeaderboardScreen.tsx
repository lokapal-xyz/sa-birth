import { useEffect, useState } from 'react';
import { useSound } from '../../../utils/useSound';
import { colors, typography, spacing, borderRadius, GradientText } from '../../../design-system';
import { Trophy, Link2 } from 'lucide-react';
import { SpriteAnimator } from './SpriteAnimator';
import type { SpriteCharacter } from './SpriteAnimator';

type Character = 'ALICE' | 'ROBERT' | 'CAROL';

interface LeaderboardEntry {
  player: string;
  character: number;
  total_score: number;
  timestamp: number;
}

interface LeaderboardScreenProps {
  playerAddress: string;
  currentScore: number;
  currentCharacter: Character;
  onContinue: () => void;
}

const CHARACTER_NAMES = ['ALICE', 'ROBERT', 'CAROL'];
const CHARACTER_GRADIENTS = {
  0: colors.character.alice,
  1: colors.character.robert,
  2: colors.character.carol,
};
const CHARACTER_SPRITES: Record<number, SpriteCharacter> = {
  0: 'ALICE',
  1: 'ROBERT',
  2: 'CAROL',
};

export function LeaderboardScreen({ 
  playerAddress, 
  currentScore,
  currentCharacter,
  onContinue 
}: LeaderboardScreenProps) {
  const { play } = useSound();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<number>(
    CHARACTER_NAMES.indexOf(currentCharacter)
  );

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const contractId = import.meta.env.VITE_SA_BIRTH_CONTRACT_ID;
      if (!contractId) {
        console.error('[Leaderboard] Contract ID not configured');
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      console.log('[Leaderboard] Fetching from contract:', contractId);

      const { Contract, Address, Account, TransactionBuilder, Networks } = await import('@stellar/stellar-sdk');
      
      const rpcUrl = 'https://soroban-testnet.stellar.org';
      const contract = new Contract(contractId);
      
      const nullAccount = new Account(
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        '0'
      );
      
      const builtTx = new TransactionBuilder(nullAccount, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(contract.call('get_leaderboard'))
        .setTimeout(30)
        .build();
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'simulateTransaction',
          params: {
            transaction: builtTx.toXDR(),
          },
        }),
      });

      const data = await response.json();
      
      if (!data.result?.results?.[0]?.xdr) {
        console.warn('[Leaderboard] No result from simulation');
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { xdr } = await import('@stellar/stellar-sdk');
      const resultXdr = data.result.results[0].xdr;
      const scVal = xdr.ScVal.fromXDR(resultXdr, 'base64');
      
      const entriesVec = scVal.vec();
      
      if (!entriesVec || entriesVec.length === 0) {
        console.log('[Leaderboard] Empty leaderboard');
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const parsedEntries: LeaderboardEntry[] = [];
      
      for (const entry of entriesVec) {
        const fields = entry.map();
        if (!fields) continue;
        
        let player = '';
        let character = 0;
        let total_score = 0;
        let timestamp = 0;
        
        for (let i = 0; i < fields.length; i++) {
          const mapEntry = fields[i];
          const key = mapEntry.key();
          const val = mapEntry.val();
          
          const fieldName = key.sym()?.toString();
          
          if (fieldName === 'player') {
            player = Address.fromScVal(val).toString();
          } else if (fieldName === 'character') {
            character = val.u32();
          } else if (fieldName === 'total_score') {
            total_score = Number(val.u64().toBigInt());
          } else if (fieldName === 'timestamp') {
            timestamp = Number(val.u64().toBigInt());
          }
        }
        
        parsedEntries.push({ player, character, total_score, timestamp });
      }
      
      console.log('[Leaderboard] Fetched', parsedEntries.length, 'entries');
      setLeaderboard(parsedEntries);
      setLoading(false);
      
    } catch (err) {
      console.error('[Leaderboard] Failed to fetch:', err);
      setLeaderboard([]);
      setLoading(false);
    }
  };

  const formatScore = (score: number) => score.toLocaleString();
  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredLeaderboard = leaderboard.filter(entry => entry.character === selectedCharacter);
  const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => a.total_score - b.total_score);
  
  const currentRank = sortedLeaderboard.findIndex(
    entry => entry.player === playerAddress && entry.total_score === currentScore
  ) + 1;

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div style={{ maxWidth: '56rem', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: spacing.xl,
              marginBottom: spacing.lg,
            }}
          >
            <SpriteAnimator
              character={CHARACTER_SPRITES[selectedCharacter]}
              animation="run"
              scale={3}
              flip
            />
            <Trophy size={56} color={colors.state.warning} strokeWidth={1.5} />
            <SpriteAnimator
              character={CHARACTER_SPRITES[selectedCharacter]}
              animation="run"
              scale={3}
            />
          </div>
          <h1 style={{
            fontSize: typography.size['4xl'],
            fontWeight: typography.weight.bold,
            marginBottom: spacing.md,
          }}>
            <GradientText gradient="linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)">
              ZK:LEADERBOARD
            </GradientText>
          </h1>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.lg,
            marginBottom: spacing.lg,
            fontFamily: typography.fontFamily.mono,
          }}>
            SA:BIRTH Calibration Rankings
          </p>
          
          {/* Character Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}>
            {[0, 1, 2].map((charIndex) => (
              <button
                key={charIndex}
                onClick={() => setSelectedCharacter(charIndex)}
                style={{
                  padding: `${spacing.sm} ${spacing.xl}`,
                  borderRadius: borderRadius.lg,
                  fontWeight: typography.weight.semibold,
                  transition: 'all 0.2s ease',
                  fontFamily: typography.fontFamily.mono,
                  fontSize: typography.size.sm,
                  cursor: 'pointer',
                  border: 'none',
                  ...(selectedCharacter === charIndex ? {
                    background: CHARACTER_GRADIENTS[charIndex as 0 | 1 | 2],
                    color: 'white',
                    boxShadow: `0 0 20px ${colors.glow.primary}`,
                  } : {
                    background: colors.bg.tertiary,
                    color: colors.text.secondary,
                  })
                }}
                onMouseEnter={(e) => {
                  if (selectedCharacter !== charIndex) {
                    e.currentTarget.style.background = colors.bg.elevated;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCharacter !== charIndex) {
                    e.currentTarget.style.background = colors.bg.tertiary;
                  }
                }}
              >
                {CHARACTER_NAMES[charIndex]}
              </button>
            ))}
          </div>
          
          {currentRank > 0 && selectedCharacter === CHARACTER_NAMES.indexOf(currentCharacter) && (
            <p style={{
              color: colors.state.success,
              fontSize: typography.size.sm,
              fontFamily: typography.fontFamily.mono,
            }}>
              Your Rank: #{currentRank} as {CHARACTER_NAMES[selectedCharacter]}
            </p>
          )}
        </div>

        {/* Leaderboard Table */}
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          marginBottom: spacing.xl,
          boxShadow: `0 0 30px ${colors.glow.primary}`,
        }}>
          {loading ? (
            <div style={{
              padding: spacing['3xl'],
              textAlign: 'center',
              color: colors.text.tertiary,
            }}>
              <div style={{ fontFamily: typography.fontFamily.mono }}>
                Loading leaderboard...
              </div>
            </div>
          ) : sortedLeaderboard.length === 0 ? (
            <div style={{
              padding: spacing['3xl'],
              textAlign: 'center',
              color: colors.text.tertiary,
            }}>
              <p style={{ marginBottom: spacing.sm }}>
                No {CHARACTER_NAMES[selectedCharacter]} calibrations yet.
              </p>
              <p style={{ fontSize: typography.size.sm }}>
                Be the first to complete with this character!
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{
                background: colors.bg.tertiary,
                borderBottom: `1px solid ${colors.border.default}`,
              }}>
                <tr>
                  <th style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>Rank</th>
                  <th style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>Agent</th>
                  <th style={{
                    padding: spacing.lg,
                    textAlign: 'left',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>Character</th>
                  <th style={{
                    padding: spacing.lg,
                    textAlign: 'right',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>Score</th>
                  <th style={{
                    padding: spacing.lg,
                    textAlign: 'right',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, index) => {
                  const isCurrentPlayer = entry.player === playerAddress && entry.total_score === currentScore;
                  const rankColors = ['#f59e0b', '#e5e7eb', '#ea580c'];
                  const rankColor = index < 3 ? rankColors[index] : colors.text.tertiary;
                  
                  return (
                    <tr
                      key={`${entry.player}-${entry.timestamp}`}
                      style={{
                        borderBottom: `1px solid ${colors.border.default}`,
                        background: isCurrentPlayer ? `${colors.state.success}15` : 'transparent',
                        borderLeft: isCurrentPlayer ? `4px solid ${colors.state.success}` : 'none',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentPlayer) {
                          e.currentTarget.style.background = `${colors.bg.tertiary}80`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentPlayer) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <td style={{ padding: spacing.lg }}>
                        <span style={{
                          fontSize: typography.size.lg,
                          fontWeight: typography.weight.bold,
                          color: rankColor,
                          fontFamily: typography.fontFamily.mono,
                        }}>
                          #{index + 1}
                        </span>
                      </td>
                      <td style={{ padding: spacing.lg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                          <code style={{
                            fontSize: typography.size.sm,
                            color: colors.text.primary,
                          }}>
                            {formatAddress(entry.player)}
                          </code>
                          {isCurrentPlayer && (
                            <span style={{
                              fontSize: typography.size.xs,
                              background: colors.state.success,
                              color: 'white',
                              padding: '0.125rem 0.5rem',
                              borderRadius: borderRadius.sm,
                              fontWeight: typography.weight.semibold,
                            }}>
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: spacing.lg }}>
                        <span style={{
                          fontSize: typography.size.sm,
                          fontWeight: typography.weight.semibold,
                        }}>
                          <GradientText gradient={CHARACTER_GRADIENTS[entry.character as 0 | 1 | 2]}>
                            {CHARACTER_NAMES[entry.character]}
                          </GradientText>
                        </span>
                      </td>
                      <td style={{
                        padding: spacing.lg,
                        textAlign: 'right',
                      }}>
                        <span style={{
                          color: colors.text.primary,
                          fontFamily: typography.fontFamily.mono,
                        }}>
                          {formatScore(entry.total_score)}
                        </span>
                      </td>
                      <td style={{
                        padding: spacing.lg,
                        textAlign: 'right',
                      }}>
                        <span style={{
                          color: colors.text.secondary,
                          fontSize: typography.size.sm,
                        }}>
                          {formatDate(entry.timestamp)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Continue Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { play('click'); onContinue(); }}
            style={{
              padding: `${spacing.lg} ${spacing['2xl']}`,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#0a0a0f',
              fontWeight: typography.weight.bold,
              borderRadius: borderRadius.lg,
              fontSize: typography.size.lg,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              border: 'none',
              fontFamily: typography.fontFamily.mono,
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.7)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            }}
          >
            Experience Another Awakening
          </button>
        </div>
      </div>
    </div>
  );
}