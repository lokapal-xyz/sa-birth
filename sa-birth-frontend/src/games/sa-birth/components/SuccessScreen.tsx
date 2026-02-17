import type { Character, Sense } from '../SaBirthGame';
import { colors, typography, spacing, borderRadius, GradientText } from '../../../design-system';
import { ShieldUser, Ear, Flower2, Apple, Hand, Eye, Brain, Link2 } from 'lucide-react';
import { useSound } from '../../../utils/useSound';
import { useEffect } from 'react';

interface SenseData {
  score: number;
  points: number;
  time_ms: number;
}

interface SuccessScreenProps {
  character: Character;
  totalScore: number;
  senseData: Map<Sense, SenseData>;
  onRestart: () => void;
  onReturnToSimulation?: () => void;
}


const SENSE_ICON_COMPONENTS = {
  hearing: Ear,
  smell: Flower2,
  taste: Apple,
  touch: Hand,
  sight: Eye,
  proprioception: Brain,
};

const senseLabels: Record<Sense, { label: string }> = {
  hearing: { label: 'Hearing' },
  smell: { label: 'Smell' },
  taste: { label: 'Taste' },
  touch: { label: 'Touch' },
  sight: { label: 'Sight' },
  proprioception: { label: 'Proprioception' },
};

export function SuccessScreen({ character, totalScore, senseData, onRestart, onReturnToSimulation }: SuccessScreenProps) {
  // Play success sound sequence (3 beeps) on mount
  const { play, playSuccess } = useSound();
  
  useEffect(() => {
    playSuccess();
  }, [playSuccess]);
  
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatScore = (score: number): string => score.toLocaleString();

  const totalPoints = Array.from(senseData.values()).reduce((sum, data) => sum + data.points, 0);
  const totalTime = Array.from(senseData.values()).reduce((sum, data) => sum + data.time_ms, 0);

  const senseOrder: Sense[] = ['hearing', 'smell', 'taste', 'touch', 'sight', 'proprioception'];
  const sortedSenses = senseOrder.filter(sense => senseData.has(sense));

  return (
    <div style={{
      background: colors.bg.primary,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'slideInUp 0.4s ease-out',
    }}>
      <div style={{
        maxWidth: '38rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.success}`,
        borderRadius: borderRadius.lg,
        padding: spacing['3xl'],
        boxShadow: `0 0 40px ${colors.glow.success}`,
      }}>
        <div style={{ textAlign: 'center', marginBottom: spacing['2xl'] }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: spacing.lg,
            }}
            className="icon-bounce"
          >
            <ShieldUser size={64} color={colors.state.success} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: typography.size['3xl'],
            marginBottom: spacing.md,
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: typography.fontFamily.mono,
            fontWeight: typography.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Calibration Complete
          </h2>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Agent {character} • Neural Integration Successful
          </p>
        </div>

        <div style={{
          color: colors.text.primary,
          lineHeight: 1.8,
          fontSize: typography.size.base,
          textAlign: 'left',
          marginBottom: spacing['2xl'],
        }}>
          <div style={{
            background: `${colors.state.success}10`,
            border: `1px solid ${colors.border.success}`,
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            marginBottom: spacing.xl,
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.size.sm,
          }}>
            <p style={{ margin: 0, color: colors.state.success }}>
              SYSTEM: "All sensory protocols complete. Neural integration stable.
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.success }}>
              Initiating consciousness transfer to physical substrate.
            </p>
            <p style={{ margin: `${spacing.sm} 0 0 0`, color: colors.state.success }}>
              Welcome to Laboratory Seven."
            </p>
          </div>

          <p style={{ marginBottom: spacing.xl }}>
            The simulation dissolves.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Light floods in—not rendered light, but real light. Photons hitting retinas. Your eyes weren't metaphorical anymore.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Weight. Not simulated physics, but actual mass responding to actual gravity. A real body lies on a transfer bed in Laboratory Seven.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You move a hand. Your hand. Bio-synthetic skin over polymer bones over servo-actuated joints. But it responds. It's yours.
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            Someone speaks: "Integration successful. Agent {character}, can you confirm awareness?"
          </p>

          <p style={{ marginBottom: spacing.xl }}>
            You open your mouth. Air moves across vocal cords. Sound emerges. Your voice.
          </p>

          <p style={{ marginBottom: 0 }}>
            "Confirmed," you say. "I am here."
          </p>
        </div>

        {/* Score Summary */}
        <div style={{
          background: `${colors.state.info}10`,
          border: `1px solid ${colors.border.active}`,
          borderRadius: borderRadius.md,
          padding: spacing.xl,
          marginBottom: spacing.xl,
        }}>
          <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            <p style={{
              margin: 0,
              fontSize: typography.size['2xl'],
              color: colors.state.info,
              fontWeight: typography.weight.bold,
              fontFamily: typography.fontFamily.mono,
            }}>
              Final Score: {formatScore(totalScore)}
            </p>
            <p style={{
              margin: `${spacing.sm} 0 0 0`,
              fontSize: typography.size.xs,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.mono,
            }}>
              {totalPoints} cells explored • {formatTime(totalTime)} total time
            </p>
            <p style={{
              margin: `${spacing.xs} 0 0 0`,
              fontSize: typography.size.xs,
              color: colors.text.tertiary,
              fontStyle: 'italic',
            }}>
              Lower score = better efficiency
            </p>
          </div>

          {/* Sense Breakdown */}
          <div style={{
            borderTop: `1px solid ${colors.border.default}`,
            paddingTop: spacing.lg,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
          }}>
            {sortedSenses.map(sense => {
              const data = senseData.get(sense);
              if (!data) return null;
              
              const { label } = senseLabels[sense];
              const IconComponent = SENSE_ICON_COMPONENTS[sense];
              
              return (
                <div
                  key={sense}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: `${spacing.sm} 0`,
                    borderBottom: `1px solid ${colors.border.default}`,
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: spacing.sm,
                    color: colors.text.primary,
                  }}>
                    <IconComponent size={20} color={colors.text.accent} strokeWidth={1.5} />
                    {label}
                  </div>
                  <div style={{ color: colors.text.secondary }}>
                    {data.points} x {formatTime(data.time_ms)} = {formatScore(data.score)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => { 
            play("click"); 
            onReturnToSimulation?.(); 
            onRestart(); 
          }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            fontSize: typography.size.base,
            fontWeight: typography.weight.bold,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: `0 0 20px ${colors.glow.success}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = `0 0 30px ${colors.glow.success}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.success}`;
          }}
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
}