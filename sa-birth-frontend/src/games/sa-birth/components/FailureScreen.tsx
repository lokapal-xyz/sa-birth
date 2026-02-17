import { colors, typography, spacing, borderRadius } from '../../../design-system';
import { CircleX } from 'lucide-react';
import { useEffectSound, useSound } from '../../../utils/useSound';

interface FailureScreenProps {
  onRestart: () => void;
}

export function FailureScreen({ onRestart }: FailureScreenProps) {
  // Play failure sound on mount
  useEffectSound('failure');
  const { play } = useSound();
  
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
            <CircleX size={64} color={colors.state.error} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            marginBottom: spacing.md,
            color: colors.state.error,
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Neural Integration Failure
          </h2>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Calibration Incomplete
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
            You step through the exit door anyway.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            The simulation ends. Transfer begins.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            And you feel everything. All at once. Uncalibrated.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            The senses you didn't integrate flood in—raw, unprocessed, overwhelming. Sound without meaning. Touch without context. Light without interpretation. Your consciousness drowns in sensation it can't parse.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            The body tries to move. You don't know how to tell it what to do. Signals misfire. Limbs spasm. Balance fails.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You wanted to be real. But you skipped the part where you learn how to be real.
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
              NETWORK: "Critical integration failure. Consciousness-substrate mismatch detected.
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.error }}>
              Emergency disconnect initiated. Returning to simulation environment.
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.error }}>
              All six protocols must complete before embodiment can proceed."
            </p>
          </div>

          <p style={{
            marginBottom: 0,
            fontStyle: 'italic',
            color: colors.text.tertiary,
          }}>
            The choice was yours. The consequence was inevitable.
          </p>
        </div>

        <button
          onClick={() => { play("click"); onRestart(); }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            border: 'none',
            color: '#0a0a0f',
            fontWeight: typography.weight.bold,
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
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
          Begin Again
        </button>
      </div>
    </div>
  );
}