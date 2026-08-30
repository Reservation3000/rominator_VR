import { useRef, useEffect ,  useState } from 'react';
import { useFrame} from '@react-three/fiber';
import { useRotateJudgeResult, useVRStore } from '../store.js';

// 自訂顏色透明度減弱動畫的hook ==================================================
export function useFadeOut(trigger) {
  const [transparency, setTransparency] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransparency((prev) => {
        if (prev <= 0.05) {
          clearInterval(timer);
          return 0;
        }
        return prev - 0.05; // 每次遞減 0.05
      });
    }, 15);

    return () => clearInterval(timer);
  }, [trigger]); 

  return transparency;
}

// 自訂Rotate旋轉判定的hook ==================================================
export function useRotateJudge(getUseMouse , mouseXR) {
  const setRotateJudgeResult = useRotateJudgeResult((state) => state.setRotateJudgeResult);

  const angleHistoryRef = useRef([]);

  useFrame(() => {
    // 取得當前 store 裡的弧度並轉成角度
    const currentRadianVR = useVRStore.getState().angleR;  // 從 store 取得當前的弧度
    const currentRadian = getUseMouse ? currentRadianVR : mouseXR;  // 根據 getUseMouse 決定使用哪個角度值
    const currentAngle = currentRadian * (180 / Math.PI);

    const now = performance.now();
    const history = angleHistoryRef.current;  // 取得當前的歷史紀錄

    history.push({ time: now, angle: currentAngle }); // 將當下時間與角度存入歷史紀錄

    const interval = 100; // 100ms 窗口
    const needAngle = 6;  // 門檻角度

    // 移除超過 100ms 以前的紀錄
    while (history.length > 0 && now - history[0].time > interval) {
      history.shift();
    }

    // 計算時間窗口內的轉動量
    if (history.length > 0) {
      let oldest = history[0];
      let latest = history[history.length - 1];
      let diff = latest.angle - oldest.angle;

      // 順時針轉
      if (diff >= needAngle) {
        setRotateJudgeResult(1);
      } 
      // 逆時針轉
      else if (diff <= -needAngle) {
        setRotateJudgeResult(2);
      }else {
        setRotateJudgeResult(0);
      }
    }
  });

  return 0;
}