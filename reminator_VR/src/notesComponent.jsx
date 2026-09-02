import { PlayHitSound } from "./Js.js"
import {  perfectRange , 
          goodRange , 
          everyLandAngle,
          arcLong,
          halfArcLong
} from "./constants.js";

import { useRotateJudge } from './hooks/hooks.jsx';

import {  useVRStore , 
          useMouseStore , 
          useRotateJudgeResult,
          useMusicTimeStore ,
          usePerfectStore,
          useGoodStore,
          useMissStore,
         } from './store.js';

import { useEffect,useRef } from 'react';

import { useFrame } from '@react-three/fiber';




export const LogicOfNotes = ({ onlyNotes , setCommbo , setTotalCombo , setJudgeStatus , getUseMouse }) => {
  
  const meshRef = useRef([]);  // 改變3D物件的參考
  const notesRef = useRef([]);   // 儲存音符的狀態

  // const angleVR = useVRStore((state) => state.angleR);          // 訂閱 zustand  的 angleR
  // const mouseXR = useMouseStore((state) => state.mouseXR);      // 訂閱 zustand  的 mouseXR
  // const angle = getUseMouse ? angleVR : mouseXR;

  // 只有歌曲／譜面改變時，才建立遊戲中的可變資料
  useEffect(() => {
    notesRef.current = onlyNotes.map((note) => ({
      ...note,
    }));

    // meshRef.current = [];   // 清空 meshRef.current
    meshRef.current.length = onlyNotes.length; // 確保 meshRef.current 的長度與 onlyNotes 一致
  }, [onlyNotes]);

  useFrame(() => {
    if (!meshRef.current) return;

    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs; // 訂閱 zustand  的 musicTimeMs
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR; 
    const perfect = usePerfectStore.getState().setPerfect;        // 訂閱 zustand  的 setPerfect
    const good = useGoodStore.getState().setGood;                 // 訂閱 zustand  的 setGood
    const miss = useMissStore.getState().setMiss;                 // 訂閱 zustand  的 setMiss

    const angle = getUseMouse ? angleVR : mouseXR;

    for (let i = 0; i < notesRef.current.length; i++) {
     const noteState = notesRef.current[i];            // 取得當前音符的狀態
     const mesh = meshRef.current[i];                  // 取得當前音符位置

      if (!mesh || noteState.isJudged) continue;        // 如果 mesh 不存在或音符已經判定完畢，不執行以下


      // 計算時間與位置===========================================================================================================================
      // 時間------------------------------------------------------------------------------------------------------------------------------------
      const requiredMs = (notesRef.current[i].startPosition - notesRef.current[i].endPosition) / notesRef.current[i].noteSpeed * (1000 / 60);   // 從起始位置 ~ 結束位置，所需的毫秒數
      const elapsedMs = musicTimeMs - (notesRef.current[i].triggerTime - requiredMs);                             // 從起始位置 ~ 結束位置，已經經過的毫秒數

      if (elapsedMs < 0) { mesh.visible = false; continue; } // 如果還沒到起始時間，隱藏音符 + 不執行以下

      //位置-------------------------------------------------------------------------------------------------------------------------------------
      const currentRadius = notesRef.current[i].startPosition - notesRef.current[i].noteSpeed * (elapsedMs / (1000 / 60));     // 每毫秒音符移動距離
      const scale = currentRadius / notesRef.current[i].startPosition;
      mesh.scale.set(scale, scale, 1);
      mesh.visible = true;

    
      // 判定邏輯=================================================================================================================================
      let judgeStyle = 0;  // 0: 未判定, 1: Perfect, 2: Good, 3: Miss

      // Perfect / Good 
      if (currentRadius <= notesRef.current[i].endPosition) {
        const noteAngle = notesRef.current[i].noteLand * everyLandAngle;   
        const angleDiff = ((angle - noteAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
        const angleDiffDegree = Math.abs(angleDiff) * (180 / Math.PI);

        if (angleDiffDegree <= perfectRange) {
          judgeStyle = 1;
        } else if (angleDiffDegree <= goodRange) {
          judgeStyle = 2;
        } else {
          judgeStyle = 3; 
        }
      }

      if (judgeStyle === 0) continue;

      noteState.judgeStyle = judgeStyle;   // 記錄判定結果
      notesRef.current[i].isJudged = true;
      mesh.visible = false;

      if (judgeStyle === 1) {
        PlayHitSound?.();
        perfect((value) => value + 1);
        setCommbo((value) => value + 1);
        setTotalCombo((value) => value + 1);
        setJudgeStatus("P");
      } else if (judgeStyle === 2) {
        PlayHitSound?.();
        good((value) => value + 1);
        setCommbo((value) => value + 1);
        setTotalCombo((value) => value + 1);
        setJudgeStatus("G");
      } else {
        miss((value) => value + 1);
        setCommbo(0);
        setTotalCombo((value) => value + 1);
        setJudgeStatus("M");
      }
    }
  });
    return (
    <>
      {onlyNotes.map((note, index) => (
        <group  key={note.id ?? index} rotation={[0, 0, note.noteLand * everyLandAngle]} >
          <mesh ref={(mesh) => { meshRef.current[index] = mesh;}} visible={false}>
            <ringGeometry args={[note.startPosition - 0.05, note.startPosition,32,1,-halfArcLong,arcLong]}
            />
            <meshStandardMaterial emissive="rgb(205, 205, 209)" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
};

export const LogicOfDarg = ({ onlyDrag , setCommbo , setTotalCombo , setJudgeStatus , getUseMouse }) => {
  // meshRefs[dragIndex][segmentIndex]
  const meshRefs = useRef([]);
  const dragRef = useRef([]);

  useEffect(() => {
    dragRef.current = (onlyDrag ?? []).map((drag) => {
      const density = drag.density ?? 0;

      return {
        ...drag,
        isJudged: false,
        segmentStates: Array.from(
          { length: density + 1 },
          (_, segmentIndex) => ({
            ...(drag.segmentStates?.[segmentIndex] ?? {}),
            isActive: false,
            isJudged: false,
            judgeStyle: 0,
          }),
        ),
      };
    });

    // 不要寫 meshRefs.current = []
    // 否則會清掉 React 已掛載的 mesh refs。
  }, [onlyDrag]);

  useFrame(() => {
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR;
    const playerAngle = getUseMouse ? angleVR : mouseXR;

    const perfect = usePerfectStore.getState().setPerfect;
    const good = useGoodStore.getState().setGood;
    const miss = useMissStore.getState().setMiss;
;

    for (let dragIndex = 0; dragIndex < dragRef.current.length; dragIndex++) {
      const drag = dragRef.current[dragIndex];

      if (drag.isJudged) continue;

      const density = drag.density;
      const requiredMs = ((drag.startPosition - drag.endPosition) / drag.noteSpeed) * (1000 / 60);

      const averageMs =
        (drag.triggerTimeEnd - drag.triggerTimeStart) / density;

      // 順／逆時針的軌道差
      let landDifference = drag.noteLandEnd - drag.noteLandStart;

      if (drag.direction === 1 && landDifference < 0) {
        landDifference += 32;
      } else if (drag.direction === -1 && landDifference > 0) {
        landDifference -= 32;
      }

      const averageLand = landDifference / density;

      for (
        let segmentIndex = 0;
        segmentIndex <= density;
        segmentIndex++
      ) {
        const segment = drag.segmentStates[segmentIndex];
        const mesh = meshRefs.current[dragIndex]?.[segmentIndex];

        if (!mesh || segment.isJudged) continue;

        const triggerTime =
          drag.triggerTimeStart + averageMs * segmentIndex;

        const noteLand =
          drag.noteLandStart + averageLand * segmentIndex;

        const elapsedMs =
          musicTimeMs - (triggerTime - requiredMs);

        // 尚未出現
        if (elapsedMs < 0) {
          mesh.visible = false;
          continue;
        }

        const currentRadius = drag.startPosition -drag.noteSpeed * (elapsedMs / (1000 / 60));

        let judgeStyle = 0;


          const scale = currentRadius / drag.startPosition;
          mesh.scale.set(scale, scale, 1);
          mesh.visible = true;


          // 進入判定區才判斷角度
          if (currentRadius <= drag.endPosition) {
            const segmentAngle = noteLand * everyLandAngle;

            const angleDiff =
              ((playerAngle - segmentAngle + Math.PI) %
                (Math.PI * 2)) -
              Math.PI;

            const angleDiffDegree =
              Math.abs(angleDiff) * (180 / Math.PI);

            if (angleDiffDegree <= perfectRange) {
              judgeStyle = 1;
            } else if (angleDiffDegree <= goodRange) {
              judgeStyle = 2;
            } else {
              judgeStyle = 3;
          }
        }

        // 仍未判定，保留 mesh 到下一 frame
        if (judgeStyle === 0) continue;

        // 該細分音符只會結算一次
        segment.isJudged = true;
        segment.isActive = false;
        segment.judgeStyle = judgeStyle;
        mesh.visible = false;

        if (judgeStyle === 1) {
          PlayHitSound();
          perfect((value) => value + 1);
          setCommbo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound();
          good((value) => value + 1);
          setCommbo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("G");
        } else {
          miss((value) => value + 1);
          setCommbo(0);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("M");
        }
      }

      // 全部 segment 都結算後，整條 drag 不再進入 loop
      drag.isJudged = drag.segmentStates.every(
        (segment) => segment.isJudged,
      );
    }
  });

  return (
    <>
      {(onlyDrag ?? []).flatMap((drag, dragIndex) => {
        const density = drag.density ?? 0;

        let landDifference = drag.noteLandEnd - drag.noteLandStart;

        if (drag.direction === 1 && landDifference < 0) {
          landDifference += 32;
        } else if (drag.direction === 0 && landDifference > 0) {
          landDifference -= 32;
        }

        const averageLand = landDifference / density;

        return Array.from(
          { length: density + 1 },
          (_, segmentIndex) => {
            const noteLand =
              drag.noteLandStart + averageLand * segmentIndex;

            return (
              <group
                key={`${drag.id ?? dragIndex}-${segmentIndex}`}
                rotation={[0, 0, noteLand * everyLandAngle]}
              >
                <mesh
                  ref={(mesh) => {
                    if (!meshRefs.current[dragIndex]) {
                      meshRefs.current[dragIndex] = [];
                    }

                    meshRefs.current[dragIndex][segmentIndex] = mesh;
                  }}
                  visible={false}
                >
                  <ringGeometry
                    args={[
                      drag.startPosition - 0.05,
                      drag.startPosition,
                      32,
                      1,
                      -halfArcLong,
                      arcLong,
                    ]}
                  />
                  <meshStandardMaterial
                    side={2}
                    emissive="rgb(205, 205, 209)"
                    emissiveIntensity={0.5}
                  />
                </mesh>
              </group>
            );
          },
        );
      })}
    </>
  );
};

export const LogicOfRotate = ({ onlyRotate , setCommbo , setTotalCombo , setJudgeStatus , getUseMouse }) => {
  
  useRotateJudge(getUseMouse); // 呼叫自訂的 hook 來判定旋轉方向
  const meshRef = useRef([]);  // 改變3D物件的參考
  const rotatesRef = useRef([]);   // 儲存音符的狀態

  // 只有歌曲／譜面改變時，才建立遊戲中的可變資料
  useEffect(() => {
    rotatesRef.current = onlyRotate.map((note) => ({
      ...note,
    }));

    meshRef.current.length = onlyRotate.length; // 確保 meshRef.current 的長度與 onlyRotate 一致
  }, [onlyRotate]);

  useFrame(() => {
    if (!meshRef.current) return;

    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs; // 訂閱 zustand  的 musicTimeMs 
    const rotateJudgeAngle = useRotateJudgeResult.getState().rotateJudgeAngle; // 訂閱 zustand  的 rotateJudgeAngle
    const perfect = usePerfectStore.getState().setPerfect;        // 訂閱 zustand  的 setPerfect
    const good = useGoodStore.getState().setGood;                 // 訂閱 zustand  的 setGood
    const miss = useMissStore.getState().setMiss;                 // 訂閱 zustand  的 setMiss

    for (let i = 0; i < rotatesRef.current.length; i++) {
     const noteState = rotatesRef.current[i];            // 取得當前音符的狀態
     const mesh = meshRef.current[i];                  // 取得當前音符位置

      if (!mesh || noteState.isJudged) continue;        // 如果 mesh 不存在或音符已經判定完畢，不執行以下


      // 計算時間與位置===========================================================================================================================
      // 時間------------------------------------------------------------------------------------------------------------------------------------
      const requiredMs = (rotatesRef.current[i].startPosition - rotatesRef.current[i].endPosition) / rotatesRef.current[i].noteSpeed * (1000 / 60);   // 從起始位置 ~ 結束位置，所需的毫秒數
      const elapsedMs = musicTimeMs - (rotatesRef.current[i].triggerTime - requiredMs);                             // 從起始位置 ~ 結束位置，已經經過的毫秒數

      if (elapsedMs < 0) { mesh.visible = false; continue; } // 如果還沒到起始時間，隱藏音符 + 不執行以下

      //位置-------------------------------------------------------------------------------------------------------------------------------------
      const currentRadius = rotatesRef.current[i].startPosition - rotatesRef.current[i].noteSpeed * (elapsedMs / (1000 / 60));     // 每毫秒音符移動距離
      const scale = currentRadius / rotatesRef.current[i].startPosition;
      mesh.scale.set(scale, scale, 1);
      mesh.visible = true;

      // 判定邏輯=================================================================================================================================

      let judgeStyle = 0;

      // 進入判定區才判斷角度
      if (currentRadius <= noteState.endPosition) {
        const directionMatched =
          (rotateJudgeAngle === 1 && noteState.direction === 1) ||
          (rotateJudgeAngle === 2 && noteState.direction === 0);

        if (directionMatched) {
          const timingDifference = Math.abs( musicTimeMs - noteState.triggerTime);
            judgeStyle = timingDifference <= 25 ? 1 : 2;
          }else {
            judgeStyle = 3; // Miss
          }
        }
        // 仍未判定，保留 mesh 到下一 frame
        if (judgeStyle === 0) continue;

        noteState.isJudged = true;
        noteState.isActive = false;
        noteState.judgeStyle = judgeStyle;   // 記錄判定結果
        mesh.visible = false;

        if (judgeStyle === 1) {
          PlayHitSound();
          perfect((value) => value + 1);
          setCommbo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound();
          good((value) => value + 1);
          setCommbo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("G");
        } else {
          miss((value) => value + 1);
          setCommbo(0);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("M");
        }
      }
    });


   return (
    <>
      {(onlyRotate ?? []).map((note, index) => {
        const noteColor =
          note.direction === 1
            ? "rgb(0, 100, 255)" // 順時針
            : "rgb(255, 0, 0)";  // 逆時針

        return (
          <mesh
            key={note.id ?? index}
            ref={(mesh) => {
              meshRef.current[index] = mesh;
            }}
            visible={false}
          >
            <ringGeometry
              args={[
                note.startPosition - 0.1,
                note.startPosition,
                32,
                1,
                0,
              ]}
            />
            <meshStandardMaterial color={noteColor} />
          </mesh>
        );
      })}
    </>
  );
};