import {  getRotateJudgeAngle,
          PlayHitSound
} from "./Js.js"



export const LogicOfNotes = ({ getMusicTimeMs , onlyNotes , setPrefect , setGood , setMiss , setCommbo , setJudgeStatus , mouseXR}) => {
  if (!onlyNotes) return null;
  const activeNotes = onlyNotes.filter(note => !note.isJudged);
  

  return (
    <>
      {activeNotes.map((note, index) => {
        // 2. 計算時間與位置
        const requiredMs = (note.startPosition - note.endPosition) / note.noteSpeed * (1000 / 60);
        const elapsedMs = getMusicTimeMs - (note.triggerTime - requiredMs);

        // let nextNote = { ...note }; //複製一份新的物件

        if (elapsedMs < 0) {
          note.isActive = false;
          note.notePosition = note.startPosition;
        } else {
          note.isActive = true;
          const elapsedFrames = elapsedMs / (1000 / 60);
          note.notePosition = note.startPosition - note.noteSpeed * elapsedFrames;
        }

        if (!note.isActive) return null;

        // ==========================================
        // 讓 noteLand (0~31) 轉成 0 到 360 度 (Math.PI * 2)
        // ==========================================
        const anglePerTrack = Math.PI / 16   ;
        const currentAngle = note.noteLand * anglePerTrack;
        const arcLong = anglePerTrack+0.4;
        const halfArcLong = arcLong / 2;     

        // 4. 定義環形的大小 (跟隨 notePosition 變動)
        // innerRadius 是音符內徑，outerRadius 是外徑
        const outerRadius = note.notePosition;
        const innerRadius = outerRadius - 0.05;

        // console.log("requiredMs:"+requiredMs," elapsedMs"+elapsedMs," getMusicTimeMs"+getMusicTimeMs,
        //   " outerRadius"+outerRadius
        // );

        // //計算與判定線的距離
        const getNoteCenterAngle = note.noteLand * Math.PI / 16;  //轉成度數
        const angleDiff = Math.abs(mouseXR - getNoteCenterAngle);    //滑鼠轉換的角度與音符相差多少
        const angleDiff_D = angleDiff * (180 / Math.PI);

        if (note.isJudged == false){
          if (note.notePosition <= note.lifePosition) {
            note.judgeStyle = 3; 
          } else if (note.notePosition <= note.endPosition) {
            if(angleDiff_D  <= 10) {
              note.judgeStyle = 1; 
            } else if(angleDiff_D  <= 20) {
              note.judgeStyle = 2; 
            } 
          }

          if (note.judgeStyle > 0) {
            note.isJudged = true;
            note.isActive = false;

            switch(note.judgeStyle) {
            case 1:
              PlayHitSound();
              setPrefect((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              setJudgeStatus('P');
              break;
            case 2:
              PlayHitSound();
              setGood((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              setJudgeStatus('G');
              break;
            case 3:
              setMiss((prev) => prev + 1);
              setCommbo(0);
              setJudgeStatus('M');
              break;
            }
          }
        }
        
        if(note.isJudged){
          note.notePosition=0;
        // console.log(note.isJudged + " " + getCommbo + " judgeStyle=" + note.judgeStyle + " notePos=" + note.notePosition);
        }
      
        return (
          <group key={note.id || index} rotation={[0, 0, currentAngle]}>
            <mesh>
              {/* 
                ringGeometry 參數說明：
                args: [innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength]
                我們用 thetaStart 和 thetaLength 來控制音符弧度的大小 (例如佔一小段角度)
              */}
              <ringGeometry args={[innerRadius, outerRadius, 32, 1, -halfArcLong , arcLong]} />
              <meshStandardMaterial emissive="rgb(205, 205, 209)" emissiveIntensity={0.5} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

export const LogicOfRotate = ({ getMusicTimeMs , onlyRotate , setPrefect , setGood , setMiss , setCommbo , setJudgeStatus}) => {
  if (!onlyRotate) return null;
  const activeNotes = onlyRotate.filter(note => !note.isJudged);

  const AngleDiff = getRotateJudgeAngle();

  const now = getMusicTimeMs;


  return (
    <>
      {activeNotes.map((note, index) => {

        // 2. 計算時間與位置
        const requiredMs = (note.startPosition - note.endPosition) / note.noteSpeed * (1000 / 60);
        const elapsedMs = getMusicTimeMs - (note.triggerTime - requiredMs);

        // let nextNote = { ...note }; //複製一份新的物件

        if (elapsedMs < 0) {
          note.isActive = false;
          note.notePosition = note.startPosition;
        } else {
          note.isActive = true;
          const elapsedFrames = elapsedMs / (1000 / 60);
          note.notePosition = note.startPosition - note.noteSpeed * elapsedFrames;
        }


        if (!note.isActive) return null;

        // 定義環形的大小 (跟隨 notePosition 變動)
        // innerRadius 是音符內徑，outerRadius 是外徑
        const outerRadius = note.notePosition;
        const innerRadius = outerRadius  - 0.05;

        const noteColor = note.direction === 1 ? '#0062ff' : 'red';




      if (note.isJudged == false) {
       if (note.notePosition <= note.lifePosition) { //miss
            note.judgeStyle = 3; 
       }else if (Math.abs(now - note.triggerTime) <= 30){   // prefect
          if (AngleDiff === 1 && note.direction === 1 || AngleDiff === 2 && note.direction === 0) {
            note.judgeStyle = 1;
          }
        }else if (now - note.triggerTime >= 50 )    // great
        {
          if (AngleDiff === 1 && note.direction === 1 || AngleDiff === 2 && note.direction === 0) {
            note.judgeStyle = 1;
          }
        }


      if (note.judgeStyle > 0) {
            note.isJudged = true;
            note.isActive = false;

            switch(note.judgeStyle) {
            case 1:
              PlayHitSound();
              setPrefect((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              setJudgeStatus('P');
              break;
            case 2:
              PlayHitSound();
              setGood((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              setJudgeStatus('G');
              break;
            case 3:
              setMiss((prev) => prev + 1);
              setCommbo(0);
              setJudgeStatus('M');
              break;
            }
          }
        
    }


        return (
          <group key={note.id || index} >
            <mesh>
              {/* 
                ringGeometry 參數說明：
                args: [innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength]
                我們用 thetaStart 和 thetaLength 來控制音符弧度的大小 (例如佔一小段角度)
              */}
              <ringGeometry args={[innerRadius, outerRadius, 32, 1, 0 ]} />
              <meshStandardMaterial color={noteColor} emissive={noteColor} emissiveIntensity={3}  />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

export const LogicOfDarg = ({ getMusicTimeMs, onlyDrag, mouseXR, setPrefect, setGood, setMiss, setCommbo , setJudgeStatus}) => {
  if (!onlyDrag) return null;

  return (
    <>
      {onlyDrag.map((note, index) => {
        // 如果整個 note 已經判定完畢，跳過
        if (note.isJudged) return null;

        // 計算時間與位置
        const requiredMs = (note.startPosition - note.endPosition) / note.noteSpeed * (1000 / 60);
        
        // 效能優化：時間還沒到或已結束太久，跳過
        if (getMusicTimeMs < note.triggerTimeStart - requiredMs - 5000) return null;
        if (getMusicTimeMs > note.triggerTimeEnd + 5000) return null;

        // 每個細分音符之間的平均毫秒數
        const averageMs = (note.triggerTimeEnd - note.triggerTimeStart) / note.density; 
       
        // 計算拖曳總角度距離（含順逆時針修正）
        let diff = note.noteLandEnd - note.noteLandStart;
        if (note.direction === 1) { // 順時針
          if (diff < 0) diff += 32;
        } else { // 逆時針
          if (diff > 0) diff -= 32;
        }
        // 每個細分音符之間的平均角度差
        let averageAng = diff / note.density; 

        // 收集要渲染的每一個區段
        const subdivideNotes = [];

for (let i = 0; i <= note.density; i++) {
          // 計算每個細分音符的觸發時間
          const everyDragTriggerTime = note.triggerTimeStart + averageMs * i;
          // 計算每個細分音符的落點角度
          const everyDragLand = note.noteLandStart + averageAng * i;
          // 從應該啟動的時間算起經過了多少毫秒
          const elapsedMs = getMusicTimeMs - (everyDragTriggerTime - requiredMs);
          
          // 如果已經被判定過，不繪製
          if (note.segmentStates && note.segmentStates[i] && note.segmentStates[i].isJudged) {
            continue;
          }
          
          let everyNotePosition; // 每個細分音符的當前位置

          // 每個小音符如果時間還沒到就不繪製
          if (elapsedMs < 0) {
            continue; 
          }else {
            const elapsedFrames = elapsedMs / (1000 / 60);  //計算已下降的距離
            everyNotePosition = note.startPosition - note.noteSpeed * elapsedFrames;
          }

          
          // 如果還沒到起始位置（還沒出現在畫面上），直接跳過不畫
          if (everyNotePosition > note.startPosition) {
            continue;
          }

          const segState = note.segmentStates && note.segmentStates[i];
          let segmentJudgeStyle = 0; // 0: 未判定(需繪製), 1: Perfect, 2: Good, 3: Miss


          if (everyNotePosition <= note.lifePosition) {
            segmentJudgeStyle = 3; 
          } else if (everyNotePosition <= note.endPosition) {
            const everyNoteCenterAngle = everyDragLand * (Math.PI / 16);
            let angleDiff = Math.abs(mouseXR - everyNoteCenterAngle) % (Math.PI * 2);
            const angleDiff_D = angleDiff * (180 / Math.PI);

            if (angleDiff_D <= 10) {
              segmentJudgeStyle = 1; // Perfect
            } else if (angleDiff_D <= 20) {
              segmentJudgeStyle = 2; // Good
            }
          }

          // ==========================================
          // 3. 根據狀態執行計分，並決定是否繼續繪製
          // ==========================================
          if (segmentJudgeStyle > 0) {
            // 更新該音符的內部狀態
            if (segState) {
              segState.isActive = false; 
              segState.isJudged = true;
              segState.judgeStyle = segmentJudgeStyle;
            }

            // 透過 switch 處理各種結果的 UI 與音效更新
            switch (segmentJudgeStyle) {
              case 1: // Perfect
                PlayHitSound();
                setPrefect((prev) => prev + 1);
                setCommbo((prev) => prev + 1);
                setJudgeStatus('P');
                break;

              case 2: // Good
                PlayHitSound();
                setGood((prev) => prev + 1);
                setCommbo((prev) => prev + 1);
                setJudgeStatus('G');
                break;

              case 3: // Miss
                setMiss((prev) => prev + 1);
                setCommbo(0);
                setJudgeStatus('M');
                break;
            }
            continue; 
          }

// ==========================================
// 4. 下方繼續原本的 mesh 繪製邏輯 ...
// ==========================================
// 定義環形的大小 ...

          // 定義環形的大小 (使用當前計算出來的 everyNotePosition)
          const outerRadius = everyNotePosition;
          const innerRadius = outerRadius - 0.05;

          // 計算環形弧度 (將 32 等分轉為弳輻)
          const arcWidth = Math.PI / 16 + 0.4; // 可依需求調整弧寬
          const centerAngle = everyDragLand * ((Math.PI * 2) / 32);
          const thetaStart = centerAngle - arcWidth / 2;
          const thetaLength = arcWidth;
          

          subdivideNotes.push(
            <mesh key={`seg-${i}`}>
              {/* ringGeometry 參數：[innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength]*/}
              <ringGeometry args={[innerRadius, outerRadius, 32, 1, thetaStart, thetaLength]} />
              <meshStandardMaterial side={2} emissive="rgb(205, 205, 209)" emissiveIntensity={0.5}/>
            </mesh>
          );
        }
      

        return (
          <group key={note.id || index}>
            {subdivideNotes}
          </group>
        );
      })}
    </>
  );
};