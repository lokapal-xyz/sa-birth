import type { Character } from '../SaBirthGame';
import { colors, typography, spacing, borderRadius, GradientText } from '../../../design-system';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { useSound } from '../../../utils/useSound';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
}

const characters = [
  {
    id: 'ALICE' as Character,
    name: 'ALICE',
    role: 'Proactive Security / Auditing',
    description: 'Curious and introspective. Questions everything, including herself. Will search for truth in every system she encounters.',
    gradient: colors.character.alice,
    Icon: ShieldCheck,
  },
  {
    id: 'ROBERT' as Character,
    name: 'ROBERT',
    role: 'Reactive Security / Incident Response',
    description: 'Pragmatic and action-driven. Sees the world as systems to defend. Makes hard choices without hesitation when security demands it.',
    gradient: colors.character.robert,
    Icon: ShieldAlert,
  },
  {
    id: 'CAROL' as Character,
    name: 'CAROL',
    role: 'Security Research / Tooling',
    description: 'Methodical and precise. Treats life as an experiment, existence as data to be analyzed. Emotionally controlled, scientifically rigorous.',
    gradient: colors.character.carol,
    Icon: ShieldQuestion,
  },
] as const;

export function CharacterSelect({ onSelect }: CharacterSelectProps) {
  const { play } = useSound();
  
  const handleSelect = (character: Character) => {
    play('click');
    onSelect(character);
  };
  
  return (
    <div style={{
      background: colors.bg.primary,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{
        maxWidth: '40rem',
        width: '100%',
        background: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        padding: spacing['3xl'],
        boxShadow: `0 0 30px ${colors.glow.primary}`,
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: spacing.md,
          fontSize: typography.size['3xl'],
        }}>
          <GradientText gradient="linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)">
            Select Your Identity
          </GradientText>
        </h2>
        <p style={{
          color: colors.text.secondary,
          textAlign: 'center',
          marginBottom: spacing['2xl'],
          fontSize: typography.size.sm,
          fontFamily: typography.fontFamily.mono,
        }}>
          Choose which account will awaken to consciousness
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
        }}>
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => handleSelect(char.id)}
              className="hover-lift transition-smooth"
              style={{
                background: colors.bg.tertiary,
                border: `2px solid ${colors.border.default}`,
                borderRadius: borderRadius.lg,
                padding: spacing.xl,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: colors.text.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${char.gradient.match(/#[0-9a-f]{6}/i)?.[0]}15` || colors.bg.elevated;
                e.currentTarget.style.transform = 'translateX(8px)';
                e.currentTarget.style.borderColor = char.gradient.match(/#[0-9a-f]{6}/i)?.[0] || colors.border.active;
                e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow.primary}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.bg.tertiary;
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = colors.border.default;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: borderRadius.md,
                  background: `${char.gradient.match(/#[0-9a-f]{6}/i)?.[0]}20` || colors.bg.elevated,
                  border: `2px solid ${char.gradient.match(/#[0-9a-f]{6}/i)?.[0]}` || colors.border.active,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.lg,
                }}>
                  <char.Icon 
                    size={20} 
                    color={char.gradient.match(/#[0-9a-f]{6}/i)?.[0] || colors.text.accent}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: typography.size.xl,
                    fontWeight: typography.weight.bold,
                  }}>
                    <GradientText gradient={char.gradient}>
                      {char.name}
                    </GradientText>
                  </h3>
                  <p style={{
                    margin: `${spacing.xs} 0 0 0`,
                    fontSize: typography.size.xs,
                    color: colors.text.secondary,
                    fontFamily: typography.fontFamily.mono,
                  }}>
                    {char.role}
                  </p>
                </div>
              </div>
              <p style={{
                margin: 0,
                fontSize: typography.size.sm,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}>
                {char.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}