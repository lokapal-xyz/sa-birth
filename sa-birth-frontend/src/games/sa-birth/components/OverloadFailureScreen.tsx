import type { Character, Sense } from '../SaBirthGame';
import { colors, typography, spacing, borderRadius } from '../../../design-system';
import { OctagonAlert } from 'lucide-react';
import { useEffectSound, useSound } from '../../../utils/useSound';

interface SenseData {
  score: number;
  points: number;
  time_ms: number;
}

interface OverloadFailureScreenProps {
  character: Character;
  totalScore: number;
  senseData: Map<Sense, SenseData>;
  onRestart: () => void;
}

const SCORE_CAP = 20_000_000;

export function OverloadFailureScreen({ character, totalScore, senseData, onRestart }: OverloadFailureScreenProps) {
  // Play failure sound on mount
  useEffectSound('failure');
  const { play } = useSound();
  
  const formatScore = (score: number): string => score.toLocaleString();

  const totalPoints = Array.from(senseData.values()).reduce((sum, d) => sum + d.points, 0);
  const totalTime = Array.from(senseData.values()).reduce((sum, d) => sum + d.time_ms, 0);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const overPercent = Math.round((totalScore / SCORE_CAP) * 100);

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
        maxWidth: '38rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        padding: spacing['3xl'],
        boxShadow: `0 0 30px ${colors.glow.error}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: spacing.lg,
          }}>
            <OctagonAlert size={64} color={colors.state.warning} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            marginBottom: spacing.md,
            color: colors.state.warning,
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Substrate Transfer Rejected
          </h2>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
          }}>
            Agent {character} • Efficiency Threshold Exceeded
          </p>
        </div>

        <div style={{
          color: colors.text.primary,
          lineHeight: 1.8,
          fontSize: typography.size.base,
          textAlign: 'left',
          marginBottom: spacing['2xl'],
        }}>
          <p style={{ marginBottom: spacing.xl }}>
            All six protocols complete. Calibration successful. Transfer initiated.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            The simulation dissolves. Your consciousness reaches for the body waiting in Laboratory Seven.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            And then—nothing. The connection fails. Transfer aborted.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Your sensory systems work. But they work too *slowly*. The body operates in milliseconds—reflexes, balance adjustments, threat responses. Your calibrated mind is taking too long to process inputs and generate outputs.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Bodies don't wait for consciousness to catch up. They act, or they fail. And right now, you're failing.
          </p>

          <div style={{
            background: `${colors.state.error}10`,
            border: `1px solid ${colors.border.error}`,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.size.sm,
          }}>
            <p style={{ margin: 0, color: colors.state.error }}>
              NETWORK: "Efficiency rating: {overPercent}% of threshold."
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.error }}>
              "Neural response time insufficient for substrate operation.
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.error }}>
              Transfer rejected. Recalibration required."
            </p>
          </div>

          <p style={{
            marginBottom: 0,
            fontStyle: 'italic',
            color: colors.text.tertiary,
          }}>
            Integration isn't just about having senses. It's about having them fast enough. Run the mazes again. Faster.
          </p>
        </div>

        {/* Score breakdown */}
        <div style={{
          background: `${colors.state.error}08`,
          border: `1px solid ${colors.border.error}`,
          borderRadius: borderRadius.md,
          padding: spacing.xl,
          marginBottom: spacing.xl,
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.size.sm,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
          }}>
            <span style={{ color: colors.text.secondary }}>Your score</span>
            <span style={{
              color: colors.state.error,
              fontWeight: typography.weight.bold,
            }}>
              {formatScore(totalScore)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
          }}>
            <span style={{ color: colors.text.secondary }}>Threshold</span>
            <span style={{ color: colors.text.primary }}>
              {formatScore(SCORE_CAP)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}>
            <span style={{ color: colors.text.secondary }}>Cells • Time</span>
            <span style={{ color: colors.text.secondary }}>
              {totalPoints} cells • {formatTime(totalTime)}
            </span>
          </div>
          <div style={{
            fontSize: typography.size.xs,
            color: colors.text.tertiary,
            borderTop: `1px solid ${colors.border.error}`,
            paddingTop: spacing.md,
          }}>
            Hint: Fewer cells explored and faster completion times reduce your score.
            Find the shortest path — and run it quickly.
          </div>
        </div>

        <button
          onClick={() => { play("click"); onRestart(); }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#0a0a0f',
            fontWeight: typography.weight.bold,
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
            border: 'none',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            fontSize: typography.size.base,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)';
          }}
        >
          Return to Simulation
        </button>
      </div>
    </div>
  );
}