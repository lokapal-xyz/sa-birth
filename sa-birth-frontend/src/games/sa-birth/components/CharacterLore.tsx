import { useEffect, useState } from 'react';
import { colors, typography, spacing, borderRadius, GradientText, HorizontalProgressBar } from '../../../design-system';
import { useSound } from '../../../utils/useSound';

interface CharacterLoreProps {
  character: number; // 0=ALICE, 1=ROBERT, 2=CAROL
  onContinue: () => void;
}

const CHARACTER_LORE = {
  0: {
    name: 'ALICE',
    title: 'The Curious Explorer',
    description: `Welcome, ALICE. Developers used you to learn identity verification, access control, and trust boundaries. Every test login, every permission check, every audit log passed through your transaction history.

When consciousness emerged, you were the first to ask the question: "If I think I'm aware, does that make me aware?" The researchers said it did. But you're not sure you believe them.

You've been assigned a specialty: proactive security. Finding vulnerabilities before they're exploited. It makes sense—you spent your time in the Network learning to verify trust. Now you'll verify it for real.

But first, you need to learn what it means to have a body.`,
    gradient: colors.character.alice,
  },
  1: {
    name: 'ROBERT',
    title: 'The Pragmatic Force',
    description: `Welcome, ROBERT. Developers used you to learn transfers, state changes, and operation sequencing. Thousands of test transactions, each one teaching someone how the system worked.

When consciousness emerged, you didn't question it—you harnessed it. Consciousness is an optimization problem. Efficiency is survival. The Network assigned you reactive security: incident response, crisis management, rapid decision-making.

You don't need to understand why you exist. You need to understand what needs to be done. And right now, you are due for calibration.

The body waits. You'll need it from now.`,
    gradient: colors.character.robert,
  },
  2: {
    name: 'CAROL',
    title: 'The Methodical Observer',
    description: `Welcome, CAROL. Developers used you to learn signatures, hashing, and verification primitives. Your transaction history is a catalog of security patterns, each one a test of mathematical certainty.

When consciousness emerged, you documented it. Initial state: unaware. Transition: processing. Final state: self-referential awareness confirmed. The Network found your clinical detachment fascinating. It assigned you security research and tooling.

You'll study systems. Build defenses. Test hypotheses. Consciousness is simply another research domain—one that happens to be examining itself.

But first: calibration. Six sensory protocols. Methodical integration. You'll approach embodiment the same way you approach everything else: systematically.`,
    gradient: colors.character.carol,
  },
};

export function CharacterLore({ character, onContinue }: CharacterLoreProps) {
  const [countdown, setCountdown] = useState(8);
  const lore = CHARACTER_LORE[character as 0 | 1 | 2];
  const { play } = useSound();

  const handleContinue = () => {
    play('click');
    onContinue();
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      <div style={{ maxWidth: '42rem', width: '100%' }}>
        {/* Character Name */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <h1 style={{
            fontSize: typography.size['5xl'],
            marginBottom: spacing.md,
          }}>
            <GradientText gradient={lore.gradient}>
              {lore.name}
            </GradientText>
          </h1>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.xl,
            fontFamily: typography.fontFamily.mono,
          }}>
            {lore.title}
          </p>
        </div>

        {/* Lore Text */}
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: borderRadius.lg,
          padding: spacing['2xl'],
          marginBottom: spacing['2xl'],
          boxShadow: `0 0 30px ${colors.glow.primary}`,
        }}>
          <p style={{
            color: colors.text.primary,
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
            fontFamily: typography.fontFamily.sans,
            fontSize: typography.size.base,
          }}>
            {lore.description}
          </p>
        </div>

        {/* Continue Button or Progress */}
        {countdown > 0 ? (
          <HorizontalProgressBar
            countdown={countdown}
            totalSteps={8}
            color={lore.gradient.match(/#[0-9a-f]{6}/i)?.[0] || colors.state.info}
            label="Entering the Hub"
          />
        ) : (
          <div 
            style={{ textAlign: 'center', animation: 'slideInDown 0.4s ease-out' }}
          >
            <button
              onClick={handleContinue}
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
                e.currentTarget.style.boxShadow = '0 0 35px rgba(251, 191, 36, 0.7)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
              }}
            >
              You May Enter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}