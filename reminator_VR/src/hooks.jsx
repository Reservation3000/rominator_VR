import { useRef, useEffect ,  useState } from 'react';
import { useFrame} from '@react-three/fiber';
import {
  useRotateJudgeResult,
  useVRStore,
  useMouseStore,
  useMusicTimeStore,
} from './store.js';

// 自訂顏色透明度減弱動畫的function ==================================================
export function useFadeOut(trigger , starValue , triggerValue) {
  const [transparency, setTransparency] = useState(1);

  useEffect(() => {
    const fadeDurationMs = 300;
    let frameId;

    // 延到下一個動畫影格重設，可在不於 effect 中同步 setState 的情況下，
    // 確保每次 trigger 改變都從完全不透明開始。
    frameId = requestAnimationFrame((startTime) => {
      setTransparency(1);

      const fade = (now) => {
        const nextTransparency = Math.max(starValue, triggerValue - (now - startTime) / fadeDurationMs);
        setTransparency(nextTransparency);

        if (nextTransparency > 0) {
          frameId = requestAnimationFrame(fade);
        }
      };

      frameId = requestAnimationFrame(fade);
    });

    return () => cancelAnimationFrame(frameId);
  }, [trigger]);

  return transparency;
}

// 自訂 Rotate 旋轉判定的 function ==================================================
export function useRotateJudge(getUseMouse) {
  const setRotateJudgeResult = useRotateJudgeResult((state) => state.setRotateJudgeResult);
  const resetRotateJudgeResult = useRotateJudgeResult((state) => state.resetRotateJudgeResult);

  const angleHistoryRef = useRef([]);
  const previousRadianRef = useRef(null);
  const accumulatedAngleRef = useRef(0);

  useEffect(() => {
    resetRotateJudgeResult();

    return resetRotateJudgeResult;
  }, [resetRotateJudgeResult]);

  useFrame(() => {
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR;
    const currentRadian = getUseMouse ? angleVR : mouseXR;
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;

    // 累積每一幀的最短角度差，避免穿越 0 / 360 度時被判成反方向。
    const fullTurn = Math.PI * 2;
    const normalizedRadian = ((currentRadian % fullTurn) + fullTurn) % fullTurn;
    const previousRadian = previousRadianRef.current;

    if (previousRadian !== null) {
      let deltaRadian = normalizedRadian - previousRadian;
      if (deltaRadian <= -Math.PI) {
        deltaRadian += fullTurn;
      } else if (deltaRadian > Math.PI) {
        deltaRadian -= fullTurn;
      }

      accumulatedAngleRef.current += deltaRadian * (180 / Math.PI);
    }
    previousRadianRef.current = normalizedRadian;

    const now = performance.now();
    const history = angleHistoryRef.current;
    history.push({ time: now, angle: accumulatedAngleRef.current });

    const interval = 100;
    const needAngle = 6;

    while (history.length > 0 && now - history[0].time > interval) {
      history.shift();
    }

    const oldest = history[0];
    const latest = history[history.length - 1];
    const diff = latest.angle - oldest.angle;

    if (diff >= needAngle) {
      setRotateJudgeResult(1, musicTimeMs);
    } else if (diff <= -needAngle) {
      setRotateJudgeResult(2, musicTimeMs);
    } else {
      setRotateJudgeResult(0);
    }
  });

  return 0;
}
