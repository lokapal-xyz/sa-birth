/**
 * design-system.tsx
 * 
 * Unified design tokens and icon components for SA:BIRTH
 * Dark cyberpunk aesthetic with consistent colors, typography, and iconography
 * Uses Lucide React for all icons
 */

import {
  ShieldUser,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Ear,
  Apple,
  Flower2,
  Eye,
  Hand,
  Brain,
  OctagonAlert,
  CircleX,
  CircleCheck,
  DoorClosed,
  DoorOpen,
  Shield,
  Star,
  Trophy,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Background layers
  bg: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#22222e',
  },
  
  // Character gradients
  character: {
    alice: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    robert: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    carol: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  },
  
  // State colors
  state: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    neutral: '#6b7280',
  },
  
  // Borders
  border: {
    default: '#2a2a38',
    active: '#3b82f6',
    success: '#10b981',
    error: '#ef4444',
  },
  
  // Text
  text: {
    primary: '#e5e7eb',
    secondary: '#9ca3af',
    tertiary: '#6b7280',
    accent: '#3b82f6',
  },
  
  // Glow effects
  glow: {
    primary: 'rgba(59, 130, 246, 0.3)',
    success: 'rgba(16, 185, 129, 0.3)',
    error: 'rgba(239, 68, 68, 0.3)',
    purple: 'rgba(168, 85, 247, 0.3)',
  },
};

export const typography = {
  fontFamily: {
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    sans: "'Inter', -apple-system, sans-serif",
  },
  
  size: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '3rem',
};

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

// ─────────────────────────────────────────────────────────────────────────────
// Icon Components (Lucide React)
// ─────────────────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Re-export Lucide icons with consistent interface
export const CheckIcon = CircleCheck;
export const AlertIcon = OctagonAlert;
export const TrophyIcon = Trophy;
export const SparkleIcon = ShieldUser;
export const DoorIconClosed = DoorClosed;
export const DoorIconOpen = DoorOpen;
// Direct re-exports for components that import from lucide-react
export { 
  DoorClosed, 
  DoorOpen,
  CircleCheck,
  CircleX,
  OctagonAlert,
  ShieldUser,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Ear,
  Apple,
  Flower2,
  Eye,
  Hand,
  Brain,
  Shield,
  Star,
  Trophy,
};
export const LockIcon = ShieldCheck;
export const BrainIcon = Brain;
export const TargetIcon = Star;
export const ErrorIcon = CircleX;
export const SlowIcon = OctagonAlert;

// Character icons
export const CharacterIcons = {
  ALICE: ShieldCheck,
  ROBERT: ShieldAlert,
  CAROL: ShieldQuestion,
};

// Sense icons with cyberpunk design
export const SenseIcons = {
  hearing: Ear,
  smell: Flower2,
  taste: Apple,
  touch: Hand,
  sight: Eye,
  proprioception: Brain,
};

// Player/Goal icons for mazes
export const PlayerIcon = Shield;
export const GoalIcon = Star;

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────────────────────────────────────

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GlowCard = ({ children, glowColor = colors.glow.primary, className = '', style = {} }: GlowCardProps) => (
  <div
    className={className}
    style={{
      background: colors.bg.secondary,
      border: `1px solid ${colors.border.default}`,
      borderRadius: borderRadius.lg,
      padding: spacing['2xl'],
      boxShadow: `0 0 20px ${glowColor}`,
      ...style,
    }}
  >
    {children}
  </div>
);

interface GradientTextProps {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GradientText = ({ children, gradient = colors.character.alice, className = '', style = {} }: GradientTextProps) => (
  <span
    className={className}
    style={{
      background: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: typography.weight.bold,
      ...style,
    }}
  >
    {children}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

interface HorizontalProgressBarProps {
  countdown: number;
  totalSteps?: number;
  color?: string;
  label?: string;
}

export const HorizontalProgressBar = ({ 
  countdown, 
  totalSteps = 8,
  color = colors.state.info,
  label = 'Processing'
}: HorizontalProgressBarProps) => {
  const progress = totalSteps - countdown;

  return (
    <div style={{ textAlign: 'center', marginTop: spacing.xl }}>
      {label && (
        <div style={{
          color: colors.text.tertiary,
          fontSize: typography.size.xs,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: typography.fontFamily.mono,
          marginBottom: spacing.md,
        }}>
          {label}
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: spacing.xs,
      }}>
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '2rem',
              height: '0.25rem',
              borderRadius: borderRadius.sm,
              background: i < progress ? color : colors.bg.tertiary,
              transition: 'all 0.3s ease',
              boxShadow: i < progress ? `0 0 8px ${color}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
};