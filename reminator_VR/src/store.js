import { create } from 'zustand';


// Zustand store for VR angles========================================================
export const useVRStore = create((set) => ({
  angleR: 0,
  setAngles: (angleR) => set({ angleR }),
}));


// Zustand store for rotate judge angle===============================================
export const useRotateJudgeResult = create((set) => ({
  rotateJudgeAngle: 0,
  setRotateJudgeResult: (angle) => set({ rotateJudgeAngle: angle }),
}));