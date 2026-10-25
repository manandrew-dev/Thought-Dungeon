import { useCallback } from "react";
import { useAppStore } from "../store";

// Soft tones synthesized with Web Audio: no audio files to license, credit, or download.
type SoundName = "move" | "calm" | "tamed";
type Note = { freq: number; start: number; duration: number };

const SOUNDS: Record<SoundName, { notes: Note[]; gain: number }> = {
  move: { notes: [{ freq: 660, start: 0, duration: 0.3 }], gain: 0.06 },
  calm: {
    notes: [
      { freq: 440, start: 0, duration: 0.4 },
      { freq: 554, start: 0.18, duration: 0.4 },
      { freq: 659, start: 0.36, duration: 0.7 },
    ],
    gain: 0.05,
  },
  tamed: {
    notes: [
      { freq: 392, start: 0, duration: 1.4 },
      { freq: 494, start: 0.05, duration: 1.4 },
      { freq: 587, start: 0.1, duration: 1.4 },
    ],
    gain: 0.035,
  },
};

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (!context) {
    const AudioCtor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    context = new AudioCtor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function playSound(name: SoundName) {
  const ctx = getContext();
  if (!ctx) return;
  const { notes, gain } = SOUNDS[name];
  for (const note of notes) {
    const start = ctx.currentTime + note.start;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    // Quick fade in, long fade out, so nothing clicks or startles.
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(gain, start + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
    osc.connect(env).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.duration + 0.05);
  }
}

/** Returns play(name), which does nothing when sound is off in Settings. */
export function useSound() {
  const enabled = useAppStore((state) => state.settings.sound);
  return useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      try {
        playSound(name);
      } catch {
        // Audio is a nice-to-have; never let it break an encounter.
      }
    },
    [enabled],
  );
}
