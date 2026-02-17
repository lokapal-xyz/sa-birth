/**
 * useSound.ts
 * 
 * React hook for safely integrating sounds into components
 * Handles initialization and cleanup automatically
 */

import { useEffect, useCallback, useRef } from 'react';
import { playSound, playSuccessSequence, initializeSounds, type SoundName } from './sound';

/**
 * Hook to safely play sounds in React components
 * Automatically initializes sound system on first user interaction
 * 
 * @example
 * const { play } = useSound();
 * 
 * <button onClick={() => play('click')}>Click me</button>
 */
export function useSound() {
  const initializedRef = useRef(false);

  // Initialize sounds on mount (will only run once globally)
  useEffect(() => {
    if (!initializedRef.current) {
      // Initialize on first user interaction to respect autoplay policies
      const initOnInteraction = () => {
        initializeSounds();
        initializedRef.current = true;
        
        // Remove listeners after first interaction
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
      };

      document.addEventListener('click', initOnInteraction, { once: true });
      document.addEventListener('keydown', initOnInteraction, { once: true });

      return () => {
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
      };
    }
  }, []);

  // Memoized play function
  const play = useCallback((soundName: SoundName) => {
    playSound(soundName);
  }, []);
  
  // Memoized success sequence function
  const playSuccess = useCallback(() => {
    playSuccessSequence();
  }, []);

  return { play, playSuccess };
}

/**
 * Hook for components that need to play sounds on mount/unmount
 * 
 * @example
 * useEffectSound('success'); // Plays on mount
 */
export function useEffectSound(soundName: SoundName, playOnMount = true) {
  const { play } = useSound();

  useEffect(() => {
    if (playOnMount) {
      play(soundName);
    }
  }, [play, soundName, playOnMount]);
}

/**
 * Hook that provides a click handler with sound
 * 
 * @example
 * const handleClick = useSoundClick('click', () => console.log('clicked'));
 * <button onClick={handleClick}>Click me</button>
 */
export function useSoundClick(
  soundName: SoundName,
  onClick?: () => void
): () => void {
  const { play } = useSound();

  return useCallback(() => {
    play(soundName);
    onClick?.();
  }, [play, soundName, onClick]);
}