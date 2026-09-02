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
  // 保留最近一次有效旋轉的音樂時間，讓音符可在判定窗內接住輸入，
  // 而不是只依賴抵達終點那一幀的瞬時方向。
  lastRotateEvent: null,
  setRotateJudgeResult: (angle, musicTimeMs) =>
    set((state) => {
      if (angle === 0) {
        return state.rotateJudgeAngle === 0 ? state : { rotateJudgeAngle: 0 };
      }

      return {
        rotateJudgeAngle: angle,
        lastRotateEvent: {
          direction: angle,
          musicTimeMs,
        },
      };
    }),
  resetRotateJudgeResult: () =>
    set({ rotateJudgeAngle: 0, lastRotateEvent: null }),
}));

// Zustand store for music time in milliseconds=======================================
export const useMusicTimeStore = create((set) => ({
  musicTimeMs: 0,
  setMusicTimeMs: (time) => set({ musicTimeMs: time }),
}));


// Zustand store for perfect, good, and miss counts===================================
export const usePerfectStore = create((set) => ({
  perfect: 0,
  setPerfect: (value) =>
    set((state) => ({
      perfect: typeof value === 'function' ? value(state.perfect) : value,
    })),
}));

export const useGoodStore = create((set) => ({
  good: 0,
  setGood: (value) =>
    set((state) => ({
      good: typeof value === 'function' ? value(state.good) : value,
    })),
}));

export const useMissStore = create((set) => ({
  miss: 0,
  setMiss: (time) => 
    set((state) => ({
      miss: typeof time === 'function' ? time(state.miss) : time,
    })),
}));

export const useComboStore = create((set) => ({
  combo: 0,
  setCombo: (value) => 
    set((state) => ({
      combo: typeof value === 'function' ? value(state.combo) : value,
    })),
}));

export const useTotalComboStore = create((set) => ({
  totalCombo: 0,
  setTotalCombo: (value) => 
    set((state) => ({
      totalCombo: typeof value === 'function' ? value(state.totalCombo) : value,
    })),
}));

export const useJudgeStatus = create((set) => ({
  judgeStatus:null,
  setJudgeStatus: (char) =>
    set((state) => ({
      judgeStatus: typeof char === 'function' ? char(state.judgeStatus) : char,
    })),
}));


