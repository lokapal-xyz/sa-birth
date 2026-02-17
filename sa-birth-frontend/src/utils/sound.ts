/**
 * sound.ts
 * 
 * Safe Web Audio API sound utility for SA:BIRTH
 * Generates simple beep sounds programmatically (no external files needed)
 * 
 * Sound Strategy:
 * - Uses Web Audio API with careful error handling
 * - Generates simple sine wave beeps at different frequencies
 * - Machine/computer aesthetic sounds
 * - Low volume, subtle feedback
 * - Graceful degradation if blocked
 */

// Sound configuration with frequencies and durations
const SOUND_PARAMS = {
  click: { freq: 800, duration: 0.05, volume: 0.15 },
  hover: { freq: 600, duration: 0.03, volume: 0.1 },
  mazeMove: { freq: 400, duration: 0.02, volume: 0.08 },
  mazeComplete: { freq: 1000, duration: 0.2, volume: 0.12 },
  senseIntegrated: { freq: 1200, duration: 0.15, volume: 0.18 },
  success: { freq: 1000, duration: 0.25, volume: 0.12 },  // Lowered from 1400Hz to 1000Hz, softer
  failure: { freq: 200, duration: 0.3, volume: 0.10 },
  warning: { freq: 400, duration: 0.2, volume: 0.15 },
  processing: { freq: 600, duration: 0.1, volume: 0.15 },
} as const;

type SoundName = keyof typeof SOUND_PARAMS;

// Web Audio Context (created lazily)
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
const getAudioContext = (): AudioContext | null => {
  if (audioContext) return audioContext;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.debug('Web Audio API not supported');
      return null;
    }
    
    audioContext = new AudioContextClass();
    console.debug('Audio context initialized');
    return audioContext;
  } catch (error) {
    console.debug('Failed to create audio context:', error);
    return null;
  }
};

// Generate and play a beep sound
const playBeep = (freq: number, duration: number, volume: number) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Resume context if suspended (required for autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        console.debug('Could not resume audio context');
      });
    }
    
    // Create oscillator (sound generator)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure oscillator
    oscillator.type = 'sine'; // Simple sine wave
    oscillator.frequency.value = freq;
    
    // Configure volume envelope (fade in/out to avoid clicks)
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Fade in
    gainNode.gain.linearRampToValueAtTime(volume, now + duration - 0.01); // Hold
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // Fade out
    
    // Connect nodes: oscillator -> gain -> speakers
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play sound
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    // Clean up after sound finishes
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  } catch (error) {
    // Any error - just skip sound, never break UI
    console.debug('Sound playback error:', error);
  }
};

// Play sound safely
export const playSound = (soundName: SoundName) => {
  try {
    const params = SOUND_PARAMS[soundName];
    if (!params) return;
    
    playBeep(params.freq, params.duration, params.volume);
  } catch (error) {
    // Any error - just skip sound, never break UI
    console.debug(`Sound error: ${soundName}`, error);
  }
};

// Play success sound sequence (3 beeps with delays)
export const playSuccessSequence = () => {
  try {
    const params = SOUND_PARAMS.success;
    if (!params) return;
    
    // First beep - immediate
    playBeep(params.freq, params.duration, params.volume);
    
    // Second beep - after 800ms
    setTimeout(() => {
      playBeep(params.freq, params.duration, params.volume);
    }, 1200);
    
    // Third beep - after 1600ms
    setTimeout(() => {
      playBeep(params.freq, params.duration, params.volume);
    }, 2400);
  } catch (error) {
    console.debug('Success sequence error:', error);
  }
};

// Initialize sounds on first user interaction
let initialized = false;

export const initializeSounds = () => {
  if (initialized) return;
  
  try {
    // Just create the audio context - actual sounds are generated on-demand
    getAudioContext();
    initialized = true;
  } catch (error) {
    console.debug('Sound initialization failed (non-critical):', error);
  }
};

// Helper to play sound with delay
export const playSoundDelayed = (soundName: SoundName, delayMs: number) => {
  setTimeout(() => playSound(soundName), delayMs);
};

// Mute/unmute functionality
let muted = false;

export const toggleMute = () => {
  muted = !muted;
  
  if (muted && audioContext) {
    audioContext.suspend().catch(() => {});
  } else if (!muted && audioContext) {
    audioContext.resume().catch(() => {});
  }
  
  return muted;
};

export const isMuted = () => muted;

// Clean up (called on unmount if needed)
export const cleanupSounds = () => {
  try {
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
    audioContext = null;
    initialized = false;
  } catch (error) {
    console.debug('Sound cleanup error (non-critical):', error);
  }
};

// Export types
export type { SoundName };
export { SOUND_PARAMS as SOUND_CONFIG };