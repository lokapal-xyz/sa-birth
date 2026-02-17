import { colors, typography, spacing, borderRadius } from '../../../design-system';
import { XCircle } from 'lucide-react';
import { useSound } from '../../../utils/useSound';
import type { Sense } from '../SaBirthGame';

interface SenseFailureProps {
  sense: Sense;
  score: number;
  onReturnToHub: () => void;
}

const SENSE_NAMES: Record<Sense, string> = {
  hearing: 'Hearing',
  smell: 'Smell',
  taste: 'Taste',
  touch: 'Touch',
  sight: 'Sight',
  proprioception: 'Proprioception',
};

export function SenseFailure({ sense, score, onReturnToHub }: SenseFailureProps) {
  const { play } = useSound();

  const handleReturn = () => {
    play('click');
    onReturnToHub();
  };

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
      <div style={{ maxWidth: '42rem', width: '100%', textAlign: 'center' }}>
        {/* Failure Icon */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: spacing['2xl'],
          animation: 'fadeIn 0.6s ease-out',
        }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: `${colors.state.error}20`,
            border: `3px solid ${colors.state.error}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <XCircle size={40} color={colors.state.error} strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: typography.size['4xl'],
          color: colors.state.error,
          fontWeight: typography.weight.bold,
          marginBottom: spacing.lg,
          fontFamily: typography.fontFamily.mono,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Calibration Failed
        </h1>

        {/* Sense Name */}
        <p style={{
          color: colors.text.secondary,
          fontSize: typography.size.xl,
          marginBottom: spacing['2xl'],
          fontFamily: typography.fontFamily.mono,
        }}>
          {SENSE_NAMES[sense]} Test
        </p>

        {/* Failure Message */}
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.error}`,
          borderRadius: borderRadius.lg,
          padding: spacing['2xl'],
          marginBottom: spacing['2xl'],
          boxShadow: `0 0 30px ${colors.glow.error}`,
        }}>
          <p style={{
            color: colors.text.primary,
            lineHeight: 1.8,
            marginBottom: spacing.lg,
            fontFamily: typography.fontFamily.sans,
          }}>
            <strong style={{ color: colors.state.error }}>Performance Insufficient.</strong>
          </p>
          <p style={{
            color: colors.text.secondary,
            lineHeight: 1.8,
            fontFamily: typography.fontFamily.sans,
            marginBottom: spacing.md,
          }}>
            Your calibration time was too slow for this sense test. Neural integration requires faster response patterns.
          </p>
          <p style={{
            color: colors.text.tertiary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
            marginTop: spacing.lg,
          }}>
            Final Score: {score.toLocaleString()}
          </p>
        </div>

        {/* System Status */}
        <div style={{
          background: `${colors.state.error}15`,
          border: `1px solid ${colors.border.error}`,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing['2xl'],
        }}>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
            margin: 0,
          }}>
            <strong style={{ color: colors.state.error }}>NETWORK:</strong> Test incomplete. This sense has not been calibrated. Please return to the hub and retry.
          </p>
        </div>

        {/* Return Button */}
        <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <button
            onClick={handleReturn}
            className="btn-interactive"
            style={{
              padding: `${spacing.lg} ${spacing['2xl']}`,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#0a0a0f',
              fontWeight: typography.weight.bold,
              borderRadius: borderRadius.lg,
              border: 'none',
              fontSize: typography.size.lg,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
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
            Return to Hub
          </button>
        </div>
      </div>
    </div>
  );
}