import { PlayHitSound } from "../Js.js"
import {  perfectRange , 
          goodRange , 
          everyLandAngle,
          arcLong,
          halfArcLong
} from "../constants.js";

import { useRotateJudge } from '../hooks.jsx';

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
         } from '../store.js';

import { memo,useEffect,useMemo,useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const rotatePerfectWindowMs = 30;
const rotateJudgeWindowMs = 120;



export const LogicOfNotes = memo(({ onlyNotes , getUseMouse }) => {
  
  const meshRef = useRef([]);           // 改變3D物件的參考
  const sheetRef = useRef([]);          // 儲存 譜面 
  const nextIndexRef = useRef(0);       // 每幀掃描，儲存下一個要被渲染的音符的ID
  const activeIndicesRef = useRef([]);  // 儲存 正在被渲染的音符

  // 依 triggerTime 排序音符
  const notesList = useMemo(
    () => [...onlyNotes].sort((left, right) => left.triggerTime - right.triggerTime),
    [onlyNotes],
  );

  const setPerfect = usePerfectStore.getState().setPerfect;         // zustand 的 setPerfect
  const setGood = useGoodStore.getState().setGood;                  // zustand 的 setGood
  const setMiss = useMissStore.getState().setMiss;                  // zustand 的 setMiss
  const setCombo = useComboStore.getState().setCombo;               // zustand 的 setCombo
  const setTotalCombo = useTotalComboStore.getState().setTotalCombo // zustand 的 setTotalCombo 
  const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus   // zustand 的 setJudgeStatus 

  useEffect(() => {
    sheetRef.current = notesList.map((note) => ({ ...note })); // 複製一份 譜面 資料
    meshRef.current.length = notesList.length;                 // 設定 ref 長度
    nextIndexRef.current = 0;                                  // 重置 下一個要被渲染的音符ID
    activeIndicesRef.current = [];                             // 重置 正在被渲染的音符
  }, [notesList]);

  useFrame(() => {
    const sheet = sheetRef.current;
    if (!sheet.length) return;

    // 直接從 Zustand Store 取得最新數值，避免觸發 React 元件 Re-render
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const angle = getUseMouse ? useVRStore.getState().angleR : useMouseStore.getState().mouseXR;

    const activeNoteIndices = activeIndicesRef.current;
    let nextIndex = nextIndexRef.current;

    // 1. 生成佇列檢查：推入準備顯示的音符
    while (nextIndex < sheet.length) {
      const note = sheet[nextIndex];
      const requiredMs = ((note.startPosition - note.endPosition) / note.noteSpeed) * (1000 / 60);

      // 檢查當前時間是否已達到音符該開始移動的時間
      if (musicTimeMs >= note.triggerTime - requiredMs) {
        activeNoteIndices.push(nextIndex);
        nextIndex += 1;
      } else {
        // 因 notesList 已依時間排序，後續音符時間更晚，可直接跳出
        break;
      }
    }
    nextIndexRef.current = nextIndex; // 更新 Ref 紀錄

    // 2. 更新活躍音符位置與判定邏輯
    for (let activeIndex = activeNoteIndices.length - 1; activeIndex >= 0; activeIndex -= 1) {
      const noteIndex = activeNoteIndices[activeIndex];
      const noteState = sheet[noteIndex]; // 修正原程式碼未定義變數 notes 的問題
      const mesh = meshRef.current[noteIndex];

      if (!mesh || noteState.isJudged) {
        activeNoteIndices.splice(activeIndex, 1);
        continue;
      }

      const requiredMs = ((noteState.startPosition - noteState.endPosition) / noteState.noteSpeed) * (1000 / 60);
      const elapsedMs = musicTimeMs - (noteState.triggerTime - requiredMs);
      const currentRadius = noteState.startPosition - noteState.noteSpeed * (elapsedMs / (1000 / 60));

      // 命令式更新 3D Mesh (完全不經由 React 渲染機制)
      const scaleFactor = Math.max(0, currentRadius / noteState.startPosition);
      mesh.scale.set(scaleFactor, scaleFactor, 1);
      mesh.visible = true;

      // 音符進入判定區
      if (currentRadius <= noteState.endPosition) {
        const noteAngle = noteState.noteLand * everyLandAngle;
        const angleDiff = ((angle - noteAngle + Math.PI) % (Math.PI * 2) + (Math.PI * 2))%(Math.PI * 2) - Math.PI;
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
      {/* 此處改用已排序的 notesList 渲染，確保 Mesh Index 與 sheetRef 順序完全一致 */}
      {notesList.map((note, index) => (
        <group key={note.id ?? index} rotation={[0, 0, note.noteLand * everyLandAngle]}>
          <mesh
            ref={(mesh) => {
              meshRef.current[index] = mesh;
            }}
            visible={false}
          >
            <ringGeometry args={[note.startPosition - 0.05, note.startPosition, 32, 1, -halfArcLong, arcLong]} />
            <meshStandardMaterial emissive="rgb(205, 205, 209)" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
});

export const LogicOfDarg = memo(({ onlyDrag , getUseMouse }) => {
  // meshRefs[dragIndex][segmentIndex]
  const meshRefs = useRef([]);
  const dragRef = useRef([]);

  // 新增佇列 Ref，避免每幀掃描未出現或已結束的 Drag
  const nextDragIndexRef = useRef(0);
  const activeDragIndicesRef = useRef([]);

  // 1. 依 triggerTimeStart 將 Drag 進行時間排序
  const dragList = useMemo(() => {
    return [...(onlyDrag ?? [])].sort((left, right) => left.triggerTimeStart - right.triggerTimeStart);
  }, [onlyDrag]);

  // 2. 初始化並預先計算 static 資料（避免在 useFrame 中重複算）
  useEffect(() => {
    dragRef.current = dragList.map((drag) => {
      const density = drag.density ?? 0;
      const requiredMs = ((drag.startPosition - drag.endPosition) / drag.noteSpeed) * (1000 / 60);

      // 算好軌道差與平均值
      let landDifference = drag.noteLandEnd - drag.noteLandStart;
      if (drag.direction === 1 && landDifference < 0) {
        landDifference += 32;
      } else if (drag.direction === -1 && landDifference > 0) { // 修正原本 JSX 寫 0 的 bug
        landDifference -= 32;
      }

      const averageLand = density > 0 ? landDifference / density : 0;
      const averageMs = density > 0 ? (drag.triggerTimeEnd - drag.triggerTimeStart) / density : 0;

      // 預繪製所有 segment 的固定時間點與角度
      const segmentStates = Array.from({ length: density + 1 }, (_, segmentIndex) => {
        const triggerTime = drag.triggerTimeStart + averageMs * segmentIndex;
        const noteLand = drag.noteLandStart + averageLand * segmentIndex;

        return {
          ...(drag.segmentStates?.[segmentIndex] ?? {}),
          triggerTime,
          noteLand,
          isActive: false,
          isJudged: false,
          judgeStyle: 0,
        };
      });

      return {
        ...drag,
        density,
        requiredMs,
        isJudged: false,
        segmentStates,
      };
    });

    nextDragIndexRef.current = 0;
    activeDragIndicesRef.current = [];
  }, [dragList]);

  useFrame(() => {
    const dragDataList = dragRef.current;
    if (!dragDataList.length) return;

    // 直接從 Zustand 取得最新資料，防止 React Re-render
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const angleVR = useVRStore.getState().angleR;
    const mouseXR = useMouseStore.getState().mouseXR;
    const playerAngle = getUseMouse ? angleVR : mouseXR;

    const perfect = usePerfectStore.getState().setPerfect;
    const good = useGoodStore.getState().setGood;
    const miss = useMissStore.getState().setMiss;
    const setCombo = useComboStore.getState().setCombo;               // zustand 的 setCombo
    const setTotalCombo = useTotalComboStore.getState().setTotalCombo // zustand 的 setTotalCombo 
    const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus   // zustand 的 setJudgeStatus 

    const activeDragIndices = activeDragIndicesRef.current;
    let nextDragIndex = nextDragIndexRef.current;

    // A. 佇列推入：檢查是否有新的 Drag 音符準備出現 (以第一個 segment 的時間點為基準)
    while (nextDragIndex < dragDataList.length) {
      const drag = dragDataList[nextDragIndex];
      const firstSegmentTriggerTime = drag.segmentStates[0]?.triggerTime ?? drag.triggerTimeStart;

      if (musicTimeMs >= firstSegmentTriggerTime - drag.requiredMs) {
        activeDragIndices.push(nextDragIndex);
        nextDragIndex += 1;
      } else {
        break; // 時間未到，因為已排序，後續音符更晚，直接跳出
      }
    }
    nextDragIndexRef.current = nextDragIndex;

    // B. 更新「活躍中」的 Drag 音符與判定
    for (let activeIndex = activeDragIndices.length - 1; activeIndex >= 0; activeIndex -= 1) {
      const dragIndex = activeDragIndices[activeIndex];
      const drag = dragDataList[dragIndex];

      if (!drag || drag.isJudged) {
        activeDragIndices.splice(activeIndex, 1);
        continue;
      }

      let allSegmentsJudged = true;

      for (let segmentIndex = 0; segmentIndex <= drag.density; segmentIndex++) {
        const segment = drag.segmentStates[segmentIndex];
        const mesh = meshRefs.current[dragIndex]?.[segmentIndex];

        if (segment.isJudged) continue;

        allSegmentsJudged = false; // 還有未判定的 segment

        const elapsedMs = musicTimeMs - (segment.triggerTime - drag.requiredMs);

        // 該 Segment 尚未到出現時間
        if (elapsedMs < 0) {
          if (mesh) mesh.visible = false;
          continue;
        }

        const currentRadius = drag.startPosition - drag.noteSpeed * (elapsedMs / (1000 / 60));

        if (mesh) {
          const scale = Math.max(0, currentRadius / drag.startPosition);
          mesh.scale.set(scale, scale, 1);
          mesh.visible = true;
        }

        let judgeStyle = 0;

        // 進入判定區
        if (currentRadius <= drag.endPosition) {
          const segmentAngle = segment.noteLand * everyLandAngle;
          const angleDiff = ((playerAngle - segmentAngle + Math.PI) % (Math.PI * 2) + (Math.PI * 2))%(Math.PI * 2) - Math.PI;
          const angleDiffDegree = Math.abs(angleDiff) * (180 / Math.PI);

          if (angleDiffDegree <= perfectRange) {
            judgeStyle = 1;
          } else if (angleDiffDegree <= goodRange) {
            judgeStyle = 2;
          } else {
            judgeStyle = 3;
          }
        }

        // 仍未達到判定條件，繼續下一幀
        if (judgeStyle === 0) continue;

        // 進行判定結算
        segment.isJudged = true;
        segment.isActive = false;
        segment.judgeStyle = judgeStyle;
        if (mesh) mesh.visible = false;

        if (judgeStyle === 1) {
          PlayHitSound?.();
          perfect((value) => value + 1);
          setCombo((value) => value + 1);
          setTotalCombo((value) => value + 1);
          setJudgeStatus("P");
        } else if (judgeStyle === 2) {
          PlayHitSound?.();
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

      // 當該條 Drag 所有 segment 都已被判定，標記完成並從活躍陣列中剔除
      if (allSegmentsJudged) {
        drag.isJudged = true;
        activeDragIndices.splice(activeIndex, 1);
      }
    }
  });

  return (
    <>
      {dragList.flatMap((drag, dragIndex) => {
        const density = drag.density ?? 0;

        let landDifference = drag.noteLandEnd - drag.noteLandStart;
        if (drag.direction === 1 && landDifference < 0) {
          landDifference += 32;
        } else if (drag.direction === -1 && landDifference > 0) {
          landDifference -= 32;
        }

        const averageLand = density > 0 ? landDifference / density : 0;

        return Array.from({ length: density + 1 }, (_, segmentIndex) => {
          const noteLand = drag.noteLandStart + averageLand * segmentIndex;

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
        });
      })}
    </>
  );
});

export const LogicOfRotate = memo(({ onlyRotate, getUseMouse }) => {
  useRotateJudge(getUseMouse); // 呼叫自訂的 hook 來判定旋轉方向

  const meshRef = useRef([]);           // 改變3D物件的參考
  const rotatesRef = useRef([]);        // 儲存音符的狀態
  const nextIndexRef = useRef(0);       // 每幀掃描，儲存下一個要被渲染的音符索引
  const activeIndicesRef = useRef([]);  // 儲存正在被渲染的音符索引

  // 1. 依 triggerTime 排序音符，確保佇列處理與 JSX 渲染順序一致
  const rotateList = useMemo(
    () => [...(onlyRotate ?? [])].sort((left, right) => left.triggerTime - right.triggerTime),
    [onlyRotate]
  );

  // 2. 譜面改變時建立遊戲中的可變資料並重置佇列
  useEffect(() => {
    rotatesRef.current = rotateList.map((note) => ({
      ...note,
      isJudged: false,
    }));

    meshRef.current.length = rotateList.length;
    nextIndexRef.current = 0;
    activeIndicesRef.current = [];
  }, [rotateList]);

  useFrame(() => {
    const rotates = rotatesRef.current;
    if (!rotates.length) return;

    // 直接從 Zustand Store 取得最新數值，避免觸發 React 元件 Re-render
    const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
    const lastRotateEvent = useRotateJudgeResult.getState().lastRotateEvent;

    const perfect = usePerfectStore.getState().setPerfect;
    const good = useGoodStore.getState().setGood;
    const miss = useMissStore.getState().setMiss;
    const setCombo = useComboStore.getState().setCombo;
    const setTotalCombo = useTotalComboStore.getState().setTotalCombo;
    const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus;

    const activeNoteIndices = activeIndicesRef.current;
    let nextIndex = nextIndexRef.current;

    // A. 佇列推入：檢查是否有新的旋轉音符準備出現
    while (nextIndex < rotates.length) {
      const note = rotates[nextIndex];
      const requiredMs = ((note.startPosition - note.endPosition) / note.noteSpeed) * (1000 / 60);

      if (musicTimeMs >= note.triggerTime - requiredMs) {
        activeNoteIndices.push(nextIndex);
        nextIndex += 1;
      } else {
        break; // 時間未到，因已排序，後續音符更晚，直接跳出
      }
    }
    nextIndexRef.current = nextIndex;

    // B. 更新活躍中的旋轉音符與進行判定
    for (let activeIndex = activeNoteIndices.length - 1; activeIndex >= 0; activeIndex -= 1) {
      const noteIndex = activeNoteIndices[activeIndex];
      const noteState = rotates[noteIndex];
      const mesh = meshRef.current[noteIndex];

      if (!mesh || noteState.isJudged) {
        activeNoteIndices.splice(activeIndex, 1);
        continue;
      }

      const requiredMs = ((noteState.startPosition - noteState.endPosition) / noteState.noteSpeed) * (1000 / 60);
      const elapsedMs = musicTimeMs - (noteState.triggerTime - requiredMs);
      const currentRadius = noteState.startPosition - noteState.noteSpeed * (elapsedMs / (1000 / 60));

      // 命令式更新 3D Mesh
      const scale = Math.max(0, currentRadius / noteState.startPosition);
      mesh.scale.set(scale, scale, 1);
      mesh.visible = true;

      let judgeStyle = 0;

      // 進入判定區後保留短暫判定窗；有效旋轉事件可在窗內命中，
      // 而非只讀取抵達終點那一幀的瞬時旋轉狀態。
      if (currentRadius <= noteState.endPosition ) {
        const expectedDirection = noteState.direction === 1 ? 1 : 2;
        const timingDifference = lastRotateEvent
          ? Math.abs(lastRotateEvent.musicTimeMs - noteState.triggerTime)
          : Infinity;
        const directionMatched = lastRotateEvent?.direction === expectedDirection;

        if (directionMatched && timingDifference <= rotateJudgeWindowMs) {
          judgeStyle = timingDifference <= rotatePerfectWindowMs ? 1 : 2;
        } else if (musicTimeMs > noteState.triggerTime + rotateJudgeWindowMs) {
          judgeStyle = 3; // 判定窗結束仍未收到正確方向的旋轉
        }
      }

      // 仍未判定，保留 mesh 到下一影格
      if (judgeStyle === 0) continue;

      // 結算判定
      noteState.isJudged = true;
      noteState.isActive = false;
      noteState.judgeStyle = judgeStyle;
      mesh.visible = false;
      activeNoteIndices.splice(activeIndex, 1);

      if (judgeStyle === 1) {
        PlayHitSound?.();
        perfect((value) => value + 1);
        setCombo((value) => value + 1);
        setTotalCombo((value) => value + 1);
        setJudgeStatus("P");
      } else if (judgeStyle === 2) {
        PlayHitSound?.();
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
      {rotateList.map((note, index) => {
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
              ]}
            />
            <meshStandardMaterial color={noteColor} />
          </mesh>
        );
      })}
    </>
  );
});
