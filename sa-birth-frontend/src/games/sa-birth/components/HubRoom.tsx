import type { Character, Sense } from '../SaBirthGame';
import { colors, typography, spacing, borderRadius, GradientText } from '../../../design-system';
import { Ear, Flower2, Apple, Hand, Eye, Brain, DoorClosed, DoorOpen } from 'lucide-react';
import { useSound } from '../../../utils/useSound';
import { SpriteAnimator } from './SpriteAnimator';

interface SenseData {
  score: number;
  points: number;
  time_ms: number;
}

interface HubRoomProps {
  character: Character;
  completedSenses: Set<Sense>;
  senseData: Map<Sense, SenseData>;
  onEnterMaze: (sense: Sense) => void;
  onExit: () => void;
  exitInProgress?: boolean;
}

const senses: Array<{ id: Sense; label: string }> = [
  { id: 'hearing', label: 'Hearing' },
  { id: 'smell', label: 'Smell' },
  { id: 'taste', label: 'Taste' },
  { id: 'touch', label: 'Touch' },
  { id: 'sight', label: 'Sight' },
  { id: 'proprioception', label: 'Proprioception' },
];

const SENSE_ICON_COMPONENTS = {
  hearing: Ear,
  smell: Flower2,
  taste: Apple,
  touch: Hand,
  sight: Eye,
  proprioception: Brain,
} as const;

const SCORE_CAP = 20_000_000;

const CHARACTER_GRADIENTS = {
  ALICE: colors.character.alice,
  ROBERT: colors.character.robert,
  CAROL: colors.character.carol,
};

export function HubRoom({ 
  character, 
  completedSenses, 
  senseData, 
  onEnterMaze, 
  onExit,
  exitInProgress = false,
}: HubRoomProps) {
  const { play } = useSound();
  const allComplete = completedSenses.size === 6;
  const progressPercent = (completedSenses.size / 6) * 100;

  const totalScore = Array.from(senseData.values()).reduce((sum, d) => sum + d.score, 0);
  const efficiencyPercent = Math.round((totalScore / SCORE_CAP) * 100);
  const isOverCap = totalScore > SCORE_CAP;
  const barWidth = Math.min(efficiencyPercent, 100);
  const barColor = isOverCap
    ? colors.state.error
    : efficiencyPercent > 70 
      ? colors.state.warning
      : colors.state.success;

  const formatTime = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const formatScore = (n: number): string => n.toLocaleString();

  return (
    <div style={{
      background: colors.bg.primary,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: '50rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        padding: spacing['3xl'],
        boxShadow: `0 0 30px ${colors.glow.primary}`,
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'], position: 'relative' }}>
          {/* Sprite floats to the left at title level */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.8,
            pointerEvents: 'none',
          }}>
            <SpriteAnimator
              character={character}
              animation="idle"
              scale={2}
            />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            marginBottom: spacing.md,
          }}>
            <GradientText gradient={CHARACTER_GRADIENTS[character]}>
              Calibration Chamber
            </GradientText>
          </h2>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            marginBottom: spacing.lg,
            fontFamily: typography.fontFamily.mono,
          }}>
            Agent {character} • {completedSenses.size} of 6 protocols completed
          </p>

          {/* Progress bar */}
          <div style={{
            width: '100%',
            height: '0.5rem',
            background: colors.bg.tertiary,
            borderRadius: borderRadius.sm,
            overflow: 'hidden',
            marginBottom: totalScore > 0 ? spacing.lg : spacing['2xl'],
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: CHARACTER_GRADIENTS[character],
              transition: 'width 0.3s ease',
              boxShadow: `0 0 10px ${colors.glow.primary}`,
            }} />
          </div>

          {/* Efficiency rating */}
          {totalScore > 0 && (
            <div style={{
              background: isOverCap ? `${colors.state.error}10` : `${colors.state.info}10`,
              border: `1px solid ${isOverCap ? colors.border.error : colors.border.active}`,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing['2xl'],
              textAlign: 'left',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: spacing.sm,
                fontSize: typography.size.xs,
                fontFamily: typography.fontFamily.mono,
              }}>
                <span style={{ color: isOverCap ? colors.state.error : colors.text.secondary }}>
                  Efficiency Rating
                </span>
                <span style={{
                  color: isOverCap ? colors.state.error : colors.state.info,
                  fontWeight: typography.weight.bold,
                }}>
                  {formatScore(totalScore)} / {formatScore(SCORE_CAP)}
                  {' '}
                  <span style={{ opacity: 0.8 }}>({efficiencyPercent}%)</span>
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '0.375rem',
                background: colors.bg.primary,
                borderRadius: borderRadius.sm,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  background: barColor,
                  borderRadius: borderRadius.sm,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 8px ${barColor}`,
                }} />
              </div>

              {isOverCap && (
                <p style={{
                  margin: `${spacing.sm} 0 0 0`,
                  fontSize: typography.size.xs,
                  color: colors.state.error,
                  fontFamily: typography.fontFamily.mono,
                }}>
                  ⚠ Threshold exceeded — complete remaining protocols faster to qualify
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sense doors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: spacing.lg,
          marginBottom: spacing['2xl'],
        }}>
          {senses.map((sense) => {
            const isCompleted = completedSenses.has(sense.id);
            const isDisabled = isCompleted || exitInProgress;
            const data = senseData.get(sense.id);
            

            return (
              <button
                key={sense.id}
                onClick={() => {
                  if (!isDisabled) {
                    play('click');
                    onEnterMaze(sense.id);
                  }
                }}
                disabled={isDisabled}
                className="transition-colors"
                style={{
                  background: isCompleted ? `${colors.state.success}15` : colors.bg.tertiary,
                  border: `2px solid ${isCompleted ? colors.border.success : colors.border.default}`,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isDisabled ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.borderColor = colors.state.success;
                    e.currentTarget.style.background = `${colors.state.success}25`;
                    e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.success}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.borderColor = isCompleted ? colors.border.success : colors.border.default;
                    e.currentTarget.style.background = isCompleted ? `${colors.state.success}15` : colors.bg.tertiary;
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}>
                  {(() => {
                    const IconComponent = SENSE_ICON_COMPONENTS[sense.id];
                    return <IconComponent size={32} color={isCompleted ? colors.state.success : colors.text.accent} strokeWidth={1.5} />;
                  })()}
                </div>
                <div style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.bold,
                  color: colors.text.primary,
                  marginBottom: spacing.xs,
                }}>
                  {sense.label}
                </div>
                {isCompleted && data && (
                  <div style={{
                    fontSize: typography.size.xs,
                    color: colors.state.success,
                    fontFamily: typography.fontFamily.mono,
                    lineHeight: 1.5,
                  }}>
                    ✓ CALIBRATED<br />
                    {data.points} cells • {formatTime(data.time_ms)}<br />
                    Score: {formatScore(data.score)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Exit door */}
        <div style={{
          borderTop: `1px solid ${colors.border.default}`,
          paddingTop: spacing['2xl'],
        }}>
          <button
            onClick={() => {
              if (!exitInProgress) {
                if (allComplete) play('click');
                if (!allComplete) play('warning');
                onExit();
              }
            }}
            disabled={exitInProgress}
            className="transition-colors"
            style={{
              width: '100%',
              background: allComplete
                ? CHARACTER_GRADIENTS[character]
                : colors.bg.tertiary,
              border: allComplete ? 'none' : `2px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              cursor: exitInProgress ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: allComplete ? 'white' : colors.text.primary,
              opacity: exitInProgress ? 0.6 : 1,
              fontFamily: typography.fontFamily.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: allComplete ? `0 0 20px ${colors.glow.primary}` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!exitInProgress && allComplete) {
                e.currentTarget.style.boxShadow = `0 0 35px ${colors.glow.success}`;
                e.currentTarget.style.filter = 'brightness(1.1)';
              } else if (!exitInProgress && !allComplete) {
                e.currentTarget.style.borderColor = colors.state.error;
                e.currentTarget.style.background = `${colors.state.error}15`;
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.error}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!exitInProgress && allComplete) {
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.primary}`;
                e.currentTarget.style.filter = 'brightness(1)';
              } else if (!exitInProgress && !allComplete) {
                e.currentTarget.style.borderColor = colors.border.default;
                e.currentTarget.style.background = colors.bg.tertiary;
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
            }}>
              {allComplete ? 
                <DoorOpen size={24} color="white" strokeWidth={2} /> : 
                <DoorClosed size={24} color={colors.text.primary} strokeWidth={2} />
              }
              <div>
                {exitInProgress 
                  ? 'Processing Exit...' 
                  : (allComplete ? 'Enter Physical Substrate' : 'Exit (Incomplete)')
                }
              </div>
            </div>
            {!allComplete && !exitInProgress && (
              <div style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.normal,
                marginTop: spacing.sm,
                color: colors.text.tertiary,
                textTransform: 'none',
                letterSpacing: 'normal',
              }}>
                Warning: Attempting embodiment without calibration will result in neural integration failure
              </div>
            )}
            {exitInProgress && (
              <div style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.normal,
                marginTop: spacing.sm,
                color: allComplete ? 'rgba(255,255,255,0.8)' : colors.text.tertiary,
                textTransform: 'none',
                letterSpacing: 'normal',
              }}>
                Finalizing neural pathways...
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}