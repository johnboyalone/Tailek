export function playSoundWithDelay(sound: string, delay: number): number {
  // ถ้าเป็น server-side (SSR) จะไม่มี window — ไม่พยายามเล่นเสียง
  if (typeof window === 'undefined') {
    return -1;
  }

  const timer = window.setTimeout(() => {
    const audio = new Audio(sound);
    // audio.play() คืนค่า Promise — catch เพื่อป้องกัน unhandled rejection (เช่น autoplay blocked)
    audio.play().catch((err) => {
      console.warn('Failed to play audio:', err);
    });
  }, delay);

  return timer;
}

// ตัวช่วยถ้าต้องการคืน handle ที่สามารถยกเลิกได้
export function playSoundWithCancel(sound: string, delay: number) {
  if (typeof window === 'undefined') {
    return {
      timer: -1,
      cancel: () => {},
    };
  }

  const timer = window.setTimeout(() => {
    const audio = new Audio(sound);
    audio.play().catch((err) => console.warn('Failed to play audio:', err));
  }, delay);

  return {
    timer,
    cancel: () => {
      clearTimeout(timer);
    },
  };
}