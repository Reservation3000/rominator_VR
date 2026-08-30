import { create } from 'zustand';


// Zustand store for VR angles========================================================
export const useVRStore = create((set) => ({
  angleD: 0,
  angleR: 0,
  setAngles: (angleD, angleR) => set({ angleD, angleR }),
}));


// Zustand store for rotate judge angle===============================================
export const useRotateJudgeResult = create((set) => ({
  rotateJudgeAngle: 0,
  setRotateJudgeResult: (angle) => set({ rotateJudgeAngle: angle }),
}));