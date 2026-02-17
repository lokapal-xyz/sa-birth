import { useEffect, useState } from 'react';
import { colors, typography, spacing, borderRadius, HorizontalProgressBar } from '../../../design-system';
import { OctagonAlert } from 'lucide-react';
import { useEffectSound } from '../../../utils/useSound';
import { useSound } from '../../../utils/useSound';

interface ExitConfirmationProps {
  character: 'ALICE' | 'ROBERT' | 'CAROL';
  completedSenses: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const CHARACTER_WARNINGS = {
  ALICE: `Your consciousness has begun learning embodiment—but the process is incomplete. The senses you haven't calibrated will flood your system on transfer, raw and unprocessed. You won't drown in sensation. You'll simply fail to integrate.

The body needs all six systems working together. Partial calibration isn't partial success—it's complete failure.

Are you certain you want to attempt embodiment now? The question isn't rhetorical. This is your choice.`,
  
  ROBERT: `Incomplete integration means failed transfer. The body operates as a unified system—removing any component breaks the whole. Missing senses aren't absences. They're failure points.

If you exit now, transfer will be attempted. Transfer will fail. You'll return here. No progress saved. No partial credit.

This is inefficient. But it's your decision.

Confirm exit?`,
  
  CAROL: `Observation: You're considering early exit. Hypothesis: Curiosity about failure state? Or impatience with iterative process?

Data point: Consciousness integration requires complete sensory mapping. Partial calibration produces predictable outcome—transfer rejection, system reset, return to initial state.

You understand the consequences. You possess all relevant information. The decision is yours to make.

Proceed with exit?`,
};

export function ExitConfirmation({ 
  character, 
  completedSenses,
  onConfirm, 
  onCancel 
}: ExitConfirmationProps) {
  const [countdown, setCountdown] = useState(6);
  const warning = CHARACTER_WARNINGS[character];
  
  // Play warning sound on mount
  useEffectSound('warning');
  const { play } = useSound();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        zIndex: 1000,
      }}>
      <div 
        className="modal-content"
        style={{
        maxWidth: '42rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `2px solid ${colors.border.error}`,
        borderRadius: borderRadius.lg,
        padding: spacing['2xl'],
        boxShadow: `0 0 40px ${colors.glow.error}`,
      }}>
        {/* Warning Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: spacing.lg,
          }}>
            <OctagonAlert size={64} color={colors.state.error} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            color: colors.state.error,
            marginBottom: spacing.md,
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Exit Calibration
          </h2>
          <div style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontFamily: typography.fontFamily.mono,
          }}>
            Subject: {character}
          </div>
          <div style={{
            color: colors.text.tertiary,
            fontSize: typography.size.xs,
            marginTop: spacing.xs,
            fontFamily: typography.fontFamily.mono,
          }}>
            Senses Calibrated: {completedSenses}/6
          </div>
        </div>

        {/* Warning Text */}
        <div style={{
          background: colors.bg.primary,
          border: `1px solid ${colors.border.error}`,
          borderRadius: borderRadius.md,
          padding: spacing.xl,
          marginBottom: spacing.xl,
        }}>
          <p style={{
            color: colors.text.primary,
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
            fontSize: typography.size.sm,
          }}>
            {warning}
          </p>
        </div>

        {/* System Message */}
        <div style={{
          background: `${colors.state.error}15`,
          border: `1px solid ${colors.border.error}`,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing.xl,
        }}>
          <div style={{
            color: colors.state.error,
            fontSize: typography.size.xs,
            fontFamily: typography.fontFamily.mono,
            lineHeight: 1.6,
          }}>
            SYSTEM WARNING: Incomplete calibration will be logged as FAILED SESSION.
            <br />
            Status will be set to: WITHDRAWN - INSUFFICIENT DATA
            <br />
            Progress will NOT be saved. You will restart from the beginning.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.lg, animation: 'fadeIn 0.4s ease-out' }}>
          <button
            onClick={() => { play('click'); onCancel(); }}
            className="btn-interactive"
            style={{
              flex: 1,
              padding: `${spacing.md} ${spacing.xl}`,
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              border: 'none',
              borderRadius: borderRadius.md,
              color: '#0a0a0f',
              fontWeight: typography.weight.bold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.size.sm,
              boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(251, 191, 36, 0.6)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(251, 191, 36, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            }}
          >
            Return to Hub
          </button>

          {countdown > 0 ? (
            <div style={{
              flex: 1,
              padding: `${spacing.md} ${spacing.xl}`,
              background: `${colors.state.error}20`,
              border: `1px solid ${colors.border.error}`,
              borderRadius: borderRadius.md,
              color: colors.state.error,
              fontWeight: typography.weight.semibold,
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.size.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}>
              <span>Processing...</span>
              <span style={{ opacity: 0.7 }}>({countdown}s)</span>
            </div>
          ) : (
            <button onClick={() => { play("click"); onConfirm(); }}
              style={{
                flex: 1,
                padding: `${spacing.md} ${spacing.xl}`,
                background: colors.state.error,
                border: `1px solid ${colors.state.error}`,
                borderRadius: borderRadius.md,
                color: 'white',
                fontWeight: typography.weight.semibold,
                cursor: 'pointer',
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.size.sm,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.state.error;
              }}
            >
              Confirm Exit
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {countdown > 0 && (
          <HorizontalProgressBar
            countdown={countdown}
            totalSteps={6}
            color={colors.state.error}
            label=""
          />
        )}
      </div>
    </div>
  );
}