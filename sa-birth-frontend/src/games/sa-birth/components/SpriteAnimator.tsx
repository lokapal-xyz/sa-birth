import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SpriteCharacter = 'ALICE' | 'ROBERT' | 'CAROL';
export type SpriteAnimation = 'idle' | 'run' | 'death' | 'jump' | 'doublejump';

interface SpriteConfig {
  frames: number;
  fps: number;
  loop: boolean;
}

// ─────────────────────────────────────────────
// Config  (48 × 48 px per frame, confirmed from sheets)
// ─────────────────────────────────────────────

const SPRITE_CONFIG: Record<SpriteAnimation, SpriteConfig> = {
  idle:       { frames: 4, fps: 8,  loop: true  },
  run:        { frames: 6, fps: 12, loop: true  },
  death:      { frames: 6, fps: 8,  loop: false },
  jump:       { frames: 4, fps: 10, loop: false },
  doublejump: { frames: 6, fps: 10, loop: false },
};

// All sheets are now uniform — no per-character frame overrides needed
const FRAME_OVERRIDES: Partial<Record<SpriteCharacter, Partial<Record<SpriteAnimation, number>>>> = {};

// ─────────────────────────────────────────────
// Helper: resolve sprite image path
// Files are named: alice_idle.png, robert_run.png, carol_death.png etc.
// Place them in /public/sprites/
// ─────────────────────────────────────────────

function spritePath(character: SpriteCharacter, animation: SpriteAnimation): string {
  return `/sprites/${character.toLowerCase()}_${animation}.png`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface SpriteAnimatorProps {
  character: SpriteCharacter;
  animation: SpriteAnimation;
  /** Pixel scale multiplier (default 2 → 96×96 rendered) */
  scale?: number;
  /** Flip horizontally (face left) */
  flip?: boolean;
  /** Called once when a non-looping animation finishes */
  onComplete?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export function SpriteAnimator({
  character,
  animation,
  scale = 2,
  flip = false,
  onComplete,
  style,
  className,
}: SpriteAnimatorProps) {
  const FRAME_W = 48;
  const FRAME_H = 48;

  const config = SPRITE_CONFIG[animation];
  const totalFrames = FRAME_OVERRIDES[character]?.[animation] ?? config.frames;

  const [frame, setFrame] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when character or animation changes
  useEffect(() => {
    setFrame(0);
    setDone(false);
  }, [character, animation]);

  // Animation ticker
  useEffect(() => {
    if (done) return;

    intervalRef.current = setInterval(() => {
      setFrame((prev) => {
        const next = prev + 1;
        if (next >= totalFrames) {
          if (config.loop) {
            return 0;
          } else {
            clearInterval(intervalRef.current!);
            setDone(true);
            onComplete?.();
            return totalFrames - 1;
          }
        }
        return next;
      });
    }, 1000 / config.fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animation, character, config.fps, config.loop, done, totalFrames, onComplete]);

  const src = spritePath(character, animation);
  const displayW = FRAME_W * scale;
  const displayH = FRAME_H * scale;

  // background-image spritesheet approach: far more reliable than <img> translateX
  // because the browser never tries to reflow or aspect-ratio-correct it.
  return (
    <div
      className={className}
      style={{
        width: displayW,
        height: displayH,
        flexShrink: 0,
        transform: flip ? 'scaleX(-1)' : undefined,
        // The spritesheet is rendered as a background, scaled up to our display size,
        // then offset left by (frame * displayW) to reveal only the current frame.
        backgroundImage: `url("${src}")`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${totalFrames * displayW}px ${displayH}px`,
        backgroundPosition: `-${frame * displayW}px 0px`,
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}