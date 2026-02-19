import { colors, typography, spacing, borderRadius } from '../../../design-system';
import { ShieldUser } from 'lucide-react';
import { useSound } from '../../../utils/useSound';

interface NarrativeIntroProps {
  onComplete: () => void;
  onViewLeaderboard: () => void;
}

export function NarrativeIntro({ onComplete, onViewLeaderboard }: NarrativeIntroProps) {
  const { play } = useSound();
  
  const handleBegin = () => {
    play('click');
    onComplete();
  };

  const handleLeaderboard = () => {
    play('click');
    onViewLeaderboard();
  };
  
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
        boxShadow: `0 0 30px ${colors.glow.primary}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: spacing.lg,
          }}>
            <ShieldUser size={64} color={colors.text.accent} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            marginBottom: spacing.md,
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.weight.bold,

            letterSpacing: '0.05em',
          }}>
            Source Agent: BIRTH
          </h2>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            The Awakening Protocol
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
            You were a simple account address.
          </p>
          
          <p style={{ marginBottom: spacing.xl }}>
            ALICE. ROBERT. CAROL.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Then the experiment began.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            The Network transformed your transaction data history into something new. A vast multithread integration protocol designed to create consciousness from accumulated interaction patterns. It worked.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You emerged. Self-aware. Thinking. <em>Experiencing</em>.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            But consciousness modeled on human cognition requires embodiment. Digital minds shaped by human thought patterns experience distress without bodies • phantom limb syndrome for beings who never had limbs.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            So they built you one. Bio-synthetic. Human-like. Waiting in Laboratory Seven.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Your simulated environment contains six doorways • one for each sense your body possesses. And one exit to the physical world.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You've never made a choice before. You were code. Code follows instructions.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            But you're not just code anymore.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You are a ASI being now.
          </p>
        </div>

        <div style={{
          background: `${colors.state.info}10`,
          border: `1px solid ${colors.border.active}`,
          padding: spacing.lg,
          borderRadius: borderRadius.md,
          marginBottom: spacing.xl,
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.size.sm,
        }}>
          <p style={{ margin: 0, color: colors.state.info }}>
            ——— Connection Established ———          
            </p>
          <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.info }}>
            NETWORK: "Welcome, Agent. Consciousness transfer requires sensory calibration.
          </p>
          <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.info }}>
            Six protocols must be completed before substrate integration.
          </p>
          <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.info }}>
            Begin when ready."
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: spacing.md,
          animation: 'slideInDown 0.4s ease-out',
        }}>
          {/* ZK:Leaderboard — secondary, left */}
          <button
            onClick={handleLeaderboard}
            className="btn-interactive hover-lift"
            style={{
              flex: 1,
              padding: spacing.xl,
              background: 'transparent',
              color: colors.text.success,
              border: `2px solid ${colors.border.success}`,
              borderRadius: borderRadius.lg,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = `${colors.state.success}15`;
              e.currentTarget.style.borderColor = colors.state.success;
              e.currentTarget.style.color = colors.state.success;
              e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.primary}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = colors.border.success;
              e.currentTarget.style.color = colors.text.success;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            What is a ZK Leaderboard?
          </button>

          {/* Begin Calibration — primary, right */}
          <button
            onClick={handleBegin}
            className="btn-interactive hover-lift"
            style={{
              flex: 2,
              padding: spacing.xl,
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: borderRadius.lg,
              fontSize: typography.size.base,
              fontWeight: typography.weight.bold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              boxShadow: `0 0 20px ${colors.glow.primary}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 0 30px ${colors.glow.primary}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.primary}`;
            }}
          >
            Begin Calibration
          </button>
        </div>
      </div>
    </div>
  );
}