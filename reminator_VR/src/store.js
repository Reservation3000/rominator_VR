import { create } from 'zustand';


// Zustand store for VR angles========================================================
export const useVRStore = create((set) => ({
  angleR: 0,
  setAngles: (angleR) => set({ angleR }),
}));

export const useMouseStore = create((set) => ({
  mouseXR: 0,
  setMouseXR: (mouseXR) => set({ mouseXR }),
}));

// Zustand store for rotate judge angle===============================================
export const useRotateJudgeResult = create((set) => ({
  rotateJudgeAngle: 0,
  setRotateJudgeResult: (angle) => set({ rotateJudgeAngle: angle }),
}));

// Zustand store for music time in milliseconds=======================================
export const useMusicTimeStore = create((set) => ({
  musicTimeMs: 0,
  setMusicTimeMs: (time) => set({ musicTimeMs: time }),
}));


// Zustand store for perfect, good, and miss counts===================================
export const usePerfectStore = create((set) => ({
  perfect: 0,
  setPerfect: (time) => set({ perfect: time }),
}));

export const useGoodStore = create((set) => ({
  good: 0,
  setGood: (time) => set({ good: time }),
}));

export const useMissStore = create((set) => ({
  miss: 0,
  setMiss: (time) => set({ miss: time }),
}));

