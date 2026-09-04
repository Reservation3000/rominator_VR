import { PlayHitSound } from "./Js.js"
import {  perfectRange , 
          goodRange , 
          prefectTime,
          lifeTime,
          everyLandAngle,
          arcLong,
          halfArcLong
} from "./constants.js";

import { useRotateJudge } from './hooks.jsx';

import {  useVRStore , 
          useMouseStore , 
          useRotateJudgeResult,
          useMusicTimeStore ,
          usePerfectStore,
          useGoodStore,
          useMissStore,
          useComboStore,
          useTotalComboStore,
          useJudgeStatus
         } from './store.js';

import { useEffect,useMemo,useRef } from 'react';

import { useFrame } from '@react-three/fiber';



export const LogicOfNotes = ({ onlyNotes , getUseMouse }) => {
  
  const meshRef = useRef([]);  // 改變3D物件的參考
  const notesRef = useRef([]);   // 儲存音符的狀態
  const activeNoteIndicesRef = useRef([]);
  const nextNoteIndexRef = useRef(0);
  const orderedNotes = useMemo(
    () => [...onlyNotes].sort((left, right) => left.triggerTime - right.triggerTime),
    [onlyNotes],
  );

  const setPerfect = usePerfectStore.getState().setPerfect;
  const setGood = useGoodStore.getState().setGood;
  const setMiss = useMissStore.getState().setMiss;
  const setCombo = useComboStore.getState().setCombo;
  const setTotalCombo = useTotalComboStore.getState().setTotalCombo;
  const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus;
  


  // 只有歌曲／譜面改變時，才建立遊戲中的可變資料
  useEffect(() => {
    notesRef.current = orderedNotes.map((note) => ({
      ...note,
    }));

    meshRef.current.length = orderedNotes.length;
    activeNoteIndicesRef.current = [];
    nextNoteIndexRef.current = 0;
  }, [orderedNotes]);

  useFrame(() => {
    if (!meshRef.current.length) return;

    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR;

    const angle = getUseMouse ? angleVR : mouseXR;
    const notes = notesRef.current;
    const activeNoteIndices = activeNoteIndicesRef.current;

    // 只把已到出場時間的音符加入動畫清單。
    while (
      nextNoteIndexRef.current < notes.length &&
      musicTimeMs >= notes[nextNoteIndexRef.current].triggerTime -
        (notes[nextNoteIndexRef.current].startPosition - notes[nextNoteIndexRef.current].endPosition) /
          notes[nextNoteIndexRef.current].noteSpeed *
          (1000 / 60)
    ) {
      activeNoteIndices.push(nextNoteIndexRef.current);
      nextNoteIndexRef.current += 1;
    }

    for (let activeIndex = activeNoteIndices.length - 1; activeIndex >= 0; activeIndex -= 1) {
      const noteIndex = activeNoteIndices[activeIndex];
      const noteState = notes[noteIndex];
      const mesh = meshRef.current[noteIndex];

      if (!mesh || noteState.isJudged) {
        activeNoteIndices.splice(activeIndex, 1);
        continue;
      }

      const requiredMs = (noteState.startPosition - noteState.endPosition) /
        noteState.noteSpeed * (1000 / 60);
      const elapsedMs = musicTimeMs - (noteState.triggerTime - requiredMs);
      const currentRadius = noteState.startPosition -
        noteState.noteSpeed * (elapsedMs / (1000 / 60));

      mesh.scale.set(currentRadius / noteState.startPosition, currentRadius / noteState.startPosition, 1);
      mesh.visible = true;

      // 音符進入判定區前只更新動畫；進入後才執行一次角度判定。
      if (currentRadius <= noteState.endPosition) {
        const noteAngle = noteState.noteLand * everyLandAngle;
        const angleDiff = ((angle - noteAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
        const angleDiffDegree = Math.abs(angleDiff) * (180 / Math.PI);

        const judgeStyle = angleDiffDegree <= perfectRange ? 1 :
          angleDiffDegree <= goodRange ? 2 : 3;

        noteState.judgeStyle = judgeStyle;
        noteState.isJudged = true;
        mesh.visible = false;
        activeNoteIndices.splice(activeIndex, 1);

        if (judgeStyle === 1) {
          PlayHitSound?.();
          setPerfect((value) => value + 1);
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound?.();
          setGood((value) => value + 1);
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("G");
        } else {
          setMiss((value) => value + 1);
          setCombo(0);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("M");
        }
      }
    }
  });
    return (
    <>
      {orderedNotes.map((note, index) => (
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

export const LogicOfDarg = ({ onlyDrag , getUseMouse }) => {
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

  const perfect = usePerfectStore.getState().setPerfect;
  const good = useGoodStore.getState().setGood;
  const miss = useMissStore.getState().setMiss;
  const setCombo = useComboStore.getState().setCombo;
  const setTotalCombo = useTotalComboStore.getState().setTotalCombo;
  const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus;

  useFrame(() => {
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR;
    const playerAngle = getUseMouse ? angleVR : mouseXR;


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

            const angleDiff = ((playerAngle - segmentAngle + Math.PI) % (Math.PI * 2) + (Math.PI * 2)) % (Math.PI * 2) -Math.PI;

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
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound();
          good((value) => value + 1);
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("G");
        } else {
          miss((value) => value + 1);
          setCombo(0);
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
        } else if (drag.direction === -1 && landDifference > 0) {
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

export const LogicOfRotate = ({ onlyRotate , getUseMouse }) => {
  
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

    const perfect = usePerfectStore.getState().setPerfect;        // 訂閱 zustand  的 setPerfect
    const good = useGoodStore.getState().setGood;                 // 訂閱 zustand  的 setGood
    const miss = useMissStore.getState().setMiss;                 // 訂閱 zustand  的 setMiss
    const setCombo = useComboStore.getState().setCombo;
    const setTotalCombo = useTotalComboStore.getState().setTotalCombo;
    const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus;

  useFrame(() => {
    if (!meshRef.current) return;

    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const lastRotateEvent = useRotateJudgeResult.getState().lastRotateEvent;

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

        // 只接受抵達終點（triggerTime）之後的旋轉：前 15 ms 是 Perfect，
        // 剩餘生命時間是 Good。
        // 使用最近一次有效旋轉事件，避免輸入在下一幀被重設為 0 而漏判。
        if (musicTimeMs >= noteState.triggerTime ) {
          const expectedDirection = noteState.direction === 1 ? 1 : 2;
          const timingDifference = lastRotateEvent
            ? lastRotateEvent.musicTimeMs - noteState.triggerTime
            : Infinity;
          const directionMatched =
            lastRotateEvent?.direction === expectedDirection;

          if (directionMatched && timingDifference >= 0 && timingDifference <= lifeTime) {
            judgeStyle = timingDifference <= prefectTime ? 1 : 2;
          } else if (musicTimeMs > noteState.triggerTime + lifeTime) {
            judgeStyle = 3; // 判定窗結束仍未收到正確方向的旋轉
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
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound();
          good((value) => value + 1);
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("G");
        } else {
          miss((value) => value + 1);
          setCombo(0);
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
