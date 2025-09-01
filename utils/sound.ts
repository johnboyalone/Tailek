// utilities for playing sounds (browser-safe, SSR-safe)
// Exports a named `soundManager` so other components can import { soundManager } from '../utils/sound'

type TimerId = number;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export const soundManager = {
  // เล่นไฟล์เสียงทันที (คืนค่า HTMLAudioElement หรือ null เมื่อไม่ใช่ browser)
  play(soundUrl: string): HTMLAudioElement | null {
    if (!isBrowser()) return null;
    const audio = new Audio(soundUrl);
    audio.play().catch((err) => {
      // ปัญหาเช่น autoplay blocked จะถูกจับไว้ไม่ให้เป็น unhandled rejection
      console.warn('soundManager: failed to play audio', err);
    });
    return audio;
  },

  // เล่นเสียงหลัง delay (คืนค่า timer id แบบ number เพื่อให้ใช้ clearTimeout ได้)
  playWithDelay(soundUrl: string, delayMs: number): TimerId {
    if (!isBrowser()) return -1;
    const timer = window.setTimeout(() => {
      const audio = new Audio(soundUrl);
      audio.play().catch((err) => console.warn('soundManager: failed to play audio', err));
    }, delayMs);
    return timer as unknown as TimerId;
  },

  // ยกเลิก timer ที่คืนมาจาก playWithDelay
  cancelTimer(timerId: TimerId | -1) {
    if (!isBrowser()) return;
    if (timerId === -1) return;
    clearTimeout(timerId);
  },

  // สร้างและคืน Audio object โดยยังไม่เรียก play() — ให้ผู้เรียกจัดการ .play() ด้วยตัวเอง (useful for preloading / user gesture play)
  createAudio(soundUrl: string): HTMLAudioElement | null {
    if (!isBrowser()) return null;
    const audio = new Audio(soundUrl);
    // ไม่เรียก play() ที่นี่
    return audio;
  },
};

// legacy / convenience exports (ถ้ามีที่อื่นเรียกเป็นฟังก์ชันเดี่ยว)
export function playSoundWithDelay(sound: string, delay: number): number {
  return soundManager.playWithDelay(sound, delay);
}

export function cancelSoundTimer(timerId: number) {
  soundManager.cancelTimer(timerId);
}