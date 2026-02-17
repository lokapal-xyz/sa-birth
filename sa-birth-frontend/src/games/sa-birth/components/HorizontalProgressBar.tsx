/**
 * HorizontalProgressBar.tsx
 * 
 * Reusable horizontal progress bar component
 * Matches the existing loading pattern in CharacterLore
 */

interface HorizontalProgressBarProps {
  /** Current countdown value (decreases to 0) */
  countdown: number;
  /** Total steps (default 8) */
  totalSteps?: number;
  /** Gradient color classes (default purple) */
  gradientColor?: string;
  /** Label text above the bar */
  label?: string;
}

export function HorizontalProgressBar({ 
  countdown, 
  totalSteps = 8,
  gradientColor = 'from-purple-500 to-pink-500',
  label = 'Processing'
}: HorizontalProgressBarProps) {
  const progress = totalSteps - countdown;

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-gray-500 text-sm uppercase tracking-widest text-center">
          {label}
        </div>
      )}
      <div className="flex justify-center gap-1">
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            className={`w-8 h-1 rounded transition-all duration-300 ${
              i < progress
                ? `bg-gradient-to-r ${gradientColor}`
                : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}