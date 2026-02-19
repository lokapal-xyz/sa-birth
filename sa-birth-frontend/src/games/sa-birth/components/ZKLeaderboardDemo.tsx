import { useState } from 'react';
import { colors, typography, spacing, borderRadius, GradientText } from '../../../design-system';
import { Trophy, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { SpriteAnimator } from './SpriteAnimator';
import type { SpriteCharacter } from './SpriteAnimator';
import { useSound } from '../../../utils/useSound';

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

interface ZKLeaderboardDemoProps {
  onBack: () => void;
}

const CHARACTER_NAMES = ['ALICE', 'ROBERT', 'CAROL'] as const;
type CharacterIndex = 0 | 1 | 2;

const CHARACTER_GRADIENTS: Record<CharacterIndex, string> = {
  0: colors.character.alice,
  1: colors.character.robert,
  2: colors.character.carol,
};

const CHARACTER_SPRITES: Record<CharacterIndex, SpriteCharacter> = {
  0: 'ALICE',
  1: 'ROBERT',
  2: 'CAROL',
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — clearly labelled as sample entries
// 4 per character, scores 1M–4M (lower = better), ascending order
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ENTRIES = [
  // ALICE (character 0)
  { player: 'CSAMPLE1', character: 0, total_score: 1_000_000, timestamp: 1_740_000_000 },
  { player: 'CSAMPLE2', character: 0, total_score: 2_000_000, timestamp: 1_739_900_000 },
  { player: 'CSAMPLE3', character: 0, total_score: 3_000_000, timestamp: 1_739_800_000 },
  { player: 'CSAMPLE4', character: 0, total_score: 4_000_000, timestamp: 1_739_700_000 },
  // ROBERT (character 1)
  { player: 'CSAMPLE1', character: 1, total_score: 1_000_000, timestamp: 1_740_000_100 },
  { player: 'CSAMPLE5', character: 1, total_score: 2_000_000, timestamp: 1_739_950_000 },
  { player: 'CSAMPLE2', character: 1, total_score: 3_000_000, timestamp: 1_739_850_000 },
  { player: 'CSAMPLE6', character: 1, total_score: 4_000_000, timestamp: 1_739_750_000 },
  // CAROL (character 2)
  { player: 'CSAMPLE3', character: 2, total_score: 1_000_000, timestamp: 1_740_000_200 },
  { player: 'CSAMPLE6', character: 2, total_score: 2_000_000, timestamp: 1_739_970_000 },
  { player: 'CSAMPLE4', character: 2, total_score: 3_000_000, timestamp: 1_739_870_000 },
  { player: 'CSAMPLE5', character: 2, total_score: 4_000_000, timestamp: 1_739_770_000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ZKLeaderboardDemo({ onBack }: ZKLeaderboardDemoProps) {
  const { play } = useSound();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterIndex>(0);
  const [zkExpanded, setZkExpanded] = useState(false);

  const filtered = MOCK_ENTRIES.filter(e => e.character === selectedCharacter);

  const formatScore = (score: number) => score.toLocaleString();
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const rankColors = ['#f59e0b', '#e5e7eb', '#ea580c'];

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

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.xl,
            marginBottom: spacing.lg,
          }}>
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
            marginBottom: spacing.sm,
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


        {/* ── SAMPLE DATA BANNER ── */}
        <div style={{
          background: `${colors.state.warning}18`,
          border: `1px solid ${colors.state.warning}`,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing['2xl'],
          textAlign: 'center',
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.size.sm,
          color: colors.state.warning,
          letterSpacing: '0.08em',
        }}>
          ⚠ SAMPLE DATA — This is a demonstration of the leaderboard format.
          Complete a full calibration run to see your real score here.
        </div>

          {/* Character Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.sm }}>
            {([0, 1, 2] as CharacterIndex[]).map((charIndex) => (
              <button
                key={charIndex}
                onClick={() => { play('click'); setSelectedCharacter(charIndex); }}
                style={{
                  padding: `${spacing.sm} ${spacing.xl}`,
                  borderRadius: borderRadius.lg,
                  fontWeight: typography.weight.semibold,
                  fontFamily: typography.fontFamily.mono,
                  fontSize: typography.size.sm,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  ...(selectedCharacter === charIndex ? {
                    background: CHARACTER_GRADIENTS[charIndex],
                    color: 'white',
                    boxShadow: `0 0 20px ${colors.glow.primary}`,
                  } : {
                    background: colors.bg.tertiary,
                    color: colors.text.secondary,
                  }),
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
        </div>


        {/* ── TABLE ── */}
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          marginBottom: spacing.xl,
          boxShadow: `0 0 30px ${colors.glow.primary}`,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{
              background: colors.bg.tertiary,
              borderBottom: `1px solid ${colors.border.default}`,
            }}>
              <tr>
                {['Rank', 'Agent', 'Character', 'Score', 'Date'].map((h, i) => (
                  <th key={h} style={{
                    padding: spacing.lg,
                    textAlign: i >= 3 ? 'right' : 'left',
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: typography.fontFamily.mono,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, index) => (
                <tr
                  key={`${entry.player}-${entry.character}-${index}`}
                  style={{
                    borderBottom: `1px solid ${colors.border.default}`,
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${colors.bg.tertiary}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: spacing.lg }}>
                    <span style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.bold,
                      color: index < 3 ? rankColors[index] : colors.text.tertiary,
                      fontFamily: typography.fontFamily.mono,
                    }}>
                      #{index + 1}
                    </span>
                  </td>
                  <td style={{ padding: spacing.lg }}>
                    <code style={{
                      fontSize: typography.size.sm,
                      color: colors.text.primary,
                    }}>
                      {entry.player}
                    </code>
                  </td>
                  <td style={{ padding: spacing.lg }}>
                    <span style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold }}>
                      <GradientText gradient={CHARACTER_GRADIENTS[entry.character as CharacterIndex]}>
                        {CHARACTER_NAMES[entry.character]}
                      </GradientText>
                    </span>
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                    <span style={{ color: colors.text.primary, fontFamily: typography.fontFamily.mono }}>
                      {formatScore(entry.total_score)}
                    </span>
                  </td>
                  <td style={{ padding: spacing.lg, textAlign: 'right' }}>
                    <span style={{ color: colors.text.secondary, fontSize: typography.size.sm }}>
                      {formatDate(entry.timestamp)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── ZK EXPLANATION ── */}
        <div style={{
          background: `${colors.state.success}08`,
          border: `1px solid ${colors.border.success}`,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.xl,
          overflow: 'hidden',
        }}>
          {/* Collapsible header */}
          <button
            onClick={() => { play('click'); setZkExpanded(prev => !prev); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.xl,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <ShieldCheck size={20} color={colors.state.success} strokeWidth={1.5} />
              <span style={{
                color: colors.state.success,
                fontFamily: typography.fontFamily.mono,
                fontWeight: typography.weight.bold,
                fontSize: typography.size.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                What is a ZK Leaderboard?
              </span>
            </div>
            {zkExpanded
              ? <ChevronUp size={18} color={colors.state.success} />
              : <ChevronDown size={18} color={colors.state.success} />
            }
          </button>

          {zkExpanded && (
            <div style={{
              padding: `0 ${spacing.xl} ${spacing.xl}`,
              borderTop: `1px solid ${colors.border.success}`,
              animation: 'fadeIn 0.2s ease-out',
            }}>

              {/* Three pillars */}
              {[
                {
                  title: 'Definition',
                  body: `A ZK Leaderboard is a competitive ranking where every submitted score is accompanied by a Zero-Knowledge proof — a cryptographic attestation that the score was computed correctly from real gameplay, without revealing how the game was played. Instead of trusting the client or the server, you trust the math. No one can post a fabricated score because no one can forge the proof.`,
                },
                {
                  title: 'How it works in SA:BIRTH today',
                  body: `After each maze run, a Noir UltraHonk ZK proof is generated in the browser using @aztec/bb.js before any transaction is built. The circuit asserts three things: score = cells_explored × time_ms, score ≤ the 20,000,000 cap, and maze_id encodes the correct character and sense. The frontend verifies the proof locally — a fraudulent score can't produce a valid proof, so it never reaches the chain.`,
                },
                {
                  title: 'On-chain arithmetic validation',
                  body: `The Soroban contract independently re-derives the score formula and rejects any submission where score ≠ points × time_ms, or where maze_id doesn't match (character << 8) | sense_id. The proof bytes are a required non-empty argument, tying each submission to a completed proof generation. Leaderboard entries in the Soroban contract are only written after all six senses clear both layers.`,
                },
                {
                  title: 'Roadmap: full on-chain verification',
                  body: `Cryptographic verification of the Barretenberg UltraHonk proof inside the Soroban VM is the intended next step. The contract already receives the proof bytes and the architecture is in place — it awaits a production-ready Soroban-native verifier. When that lands, the trust model shifts from "the client proved it honestly" to "the chain verified it independently."`,
                },
              ].map(({ title, body }) => (
                <div key={title} style={{
                  marginTop: spacing.xl,
                  paddingLeft: spacing.lg,
                  borderLeft: `2px solid ${colors.border.success}`,
                }}>
                  <p style={{
                    margin: `0 0 ${spacing.sm} 0`,
                    color: colors.state.success,
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                  }}>
                    {title}
                  </p>
                  <p style={{
                    margin: 0,
                    color: colors.text.secondary,
                    fontSize: typography.size.sm,
                    lineHeight: 1.7,
                  }}>
                    {body}
                  </p>
                </div>
              ))}

              {/* Tech stack pill row */}
              <div style={{
                marginTop: spacing.xl,
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}>
                {[
                  'Noir UltraHonk circuit',
                  '@aztec/bb.js proving',
                  'Soroban score validation',
                  'On-chain leaderboard',
                  'Stellar Testnet',
                ].map(tag => (
                  <span key={tag} style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    background: `${colors.state.success}15`,
                    border: `1px solid ${colors.border.success}`,
                    borderRadius: borderRadius.sm,
                    fontSize: typography.size.xs,
                    color: colors.state.success,
                    fontFamily: typography.fontFamily.mono,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BACK BUTTON ── */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => { play('click'); onBack(); }}
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
            ← Back to Game
          </button>
        </div>

      </div>
    </div>
  );
}