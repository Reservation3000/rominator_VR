import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef, useEffect ,  useState } from 'react';
import { Avatar } from 'antd';
import {  Space , Button } from 'antd';
import { useMouse } from "@reactuses/core";
import  Papa  from  'papaparse' ;

import { getRotateJudgeAngle } from "./Js.js"


export const Box = ({position , color }) => {
  // const ref = useRef();
  // useFrame((state, delta) => {
  //   ref.current.rotation.x += delta;
  //   ref.current.rotation.y += delta;
  // });

  return (
    <mesh position={position} >
      <ringGeometry args={[1, 3.8, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export const GameMusicComponent = ({ getChose, setMusicTimeMs }) => {
  const musicChose = useRef(null);

  useEffect(() => {
    if (!musicChose.current) return;

    let rafId;

    const tick = () => {
      if (musicChose.current) {
        const now = musicChose.current.currentTime * 1000;
        setMusicTimeMs(now);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [getChose, setMusicTimeMs]);

  if (!getChose.mp3) return null;

  return (
    <audio style={{ top: '50px', position: 'relative' }}
      ref={musicChose}
      src={getChose.mp3}
      autoPlay
      controls
    />
  );
}

export const SliderComponent = ({setVal}) => {
  return (
    <div className="slider">
      <Slider defaultValue={1} min={0.35} max={1} step={0.01} onChange={(v) => setVal(v)}/>
    </div>
  );
}

export const MenuComponent = ({getsongs , setTouch , setChose , setStatus , getPage , songTotal , pageTotal}) => {

  const pageLimit = 8;
  const pageStartIndex = getPage * pageLimit; // 開始索引
  const pageEndIndex = pageStartIndex + pageLimit; // 結束索引
  const pageNow = getsongs.slice(pageStartIndex, pageEndIndex); // 當頁切出來的歌單
  
  console.log({
    "共有幾首歌":songTotal,
    "共有幾頁":pageTotal,
    "現在在第幾頁":getPage,
    "這頁起始數字":pageStartIndex,
    "這頁結束數字":pageEndIndex,
    "當頁有幾首歌":pageNow.length, 
    "當頁的資料內容":pageNow                     
  }
  );

  return (
    <div className="Menu">
        {pageNow.map((ID , index) => {

          //極座標轉換
          // const angle = (index / total) * 2 * Math.PI;
          // const radius = 200; 

          // const x = radius * Math.cos(angle);
          // const y = radius * Math.sin(angle);
          const totalInThisPage = pageNow.length; //這頁有幾首歌
          const angle = (index / totalInThisPage)*360;  // 這頁的x首歌平分角度
            
          return(
        <div 
          key={ID.id}
          className="mgCardsWrapper" // 旋轉定位
          // style={{ '--top': `calc(50% + ${y}px)`,  '--left': `calc(50% + ${x}px)`}}
          style={{'--angle':`${angle}deg`}}
        >
          <Avatar className="mgCards" 
                size={160}
                title={ID.name} 
                variant="borderless"
                hoverable
                src={ID.img}
                onMouseEnter={() => setTouch(ID)}  //滑鼠摸到
                onClick={() => {                   //滑鼠點擊
                  setChose(ID);
                  setStatus(1);
                }}
          />

          <Avatar className='certenCircle'
                size={30}
                title={ID.name} 
                variant="borderless"
                hoverable
          />

        </div>
        )})}
    </div>
  );
}

export const MenuPageSwitchBottom = ({ setPage , getPage , pageTotal }) => {
  return (
    <div className="MenuPageSwitchBottom">=
        {/* 上一頁按鈕 */}
        {/* getPage 從第0開始，但頁數從1開始 */}
        <Button 
          disabled={getPage  <= 0}
          onClick={() => setPage(prev => prev - 1)}
        >
          Last Page
        </Button>

        {/* 下一頁按鈕 */}
        <Button 
          disabled={(getPage+1) == pageTotal}
          onClick={() => setPage(prev => prev + 1)}
        >
          Next Page
        </Button>
    </div>
  );
}

export const MenuMusicComponent = ({ getTouch , getChose}) => {
    const musicTouched = useRef(null);
    useEffect(() => {
        if (getChose && musicTouched.current) {
        musicTouched.current.pause(); 
        musicTouched.current.currentTime = 0; 
        }
    }, [getChose]);

  return (
    <>
      {/* src 帶入音檔路徑  autoPlay 載入就自動播放  controls顯示播放控制條*/}
      <audio 
            style={{ position: 'absolute' }}
            src={getTouch.mp3} 
             ref={musicTouched}
             autoPlay 
             onLoadedMetadata={(e) => {
                // 當音訊資料載入完成後，將當前播放時間指向指定的秒數
                e.currentTarget.currentTime = 40; 
        }}
      />
    </>
  );
};

export const ShowChoseSong = ({ getChose , setStatus}) => {
  const [getTime, setTime] = useState(2);  // 3秒

  useEffect(() => {
    let interval = null;   //interval=間隔
    
    if (getTime > 0) {
      interval = setInterval(() => {
        setTime((millisSeconds) => millisSeconds - 1);
      }, 1000);
    } else if (getTime === 0) {
      setStatus(2);
    }

    // 清除計時器
    return () => clearInterval(interval);
  }, [getTime]);

  return (
    <div className="showChoseSong">
      <Avatar size={500} src={getChose.img} />
    </div>
  );
};

/* 把getChose的樂曲資料，抓csv資料並做分類處裡，並丟進setNoteCSVData */
export const ProcessChoseCSVData = ({ getChose , setNoteCSVData }) => {
  useEffect(() =>{
    const loadCsv = async () => {
      if(!getChose)return[];

      try {
        const response = await fetch(getChose.csv);
        const csvText = await response.text();

        const result = Papa.parse(csvText, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        const rows = result.data; // 取得二維陣列資料
        let data = [];      //存入

        if (rows.length === 0) return data;

        // csv是二維陣列資料[x][y] 
        // 讀取第一行的整數數字 
        const firstLineInt = rows[0][0];
        console.log("First line integer:", firstLineInt);

        // 從第二行開始讀取資料 (i = 1)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const type = row[0]; // 第一欄：類型

          if (type === 'note') {
            let triggerTime = (row[1] || 0) + firstLineInt;
            let noteLand = row[2];
            data.push({ type, triggerTime, noteLand });
          } 
          else if (type === 'drag') {
            let triggerTimeStart = (row[1] || 0) + firstLineInt;
            let triggerTimeEnd = (row[2] || 0) + firstLineInt;
            let noteLandStart = row[3];
            let noteLandEnd = row[4];
            let direction = row[5];
            data.push({ type, triggerTimeStart, triggerTimeEnd, noteLandStart, noteLandEnd, direction });
          } 
          else if (type === 'rotate') {
            let triggerTime = (row[1] || 0) + firstLineInt;
            let direction = row[2];
            data.push({ type, triggerTime, direction });
          }
        }

        const processedNotes = data.map((item) => {
        if (item.type === 'drag') {
          const density = 10; // 或者是 item.density
          return {
            ...item,
            density: density,
            noteSpeed: 0.05,
            startPosition: 3.8,
            endPosition: 1.5,
            lifePosition: 1,
            notePosition: 5,
            segmentStates: Array.from({ length: density + 1 }, () => ({
              isJudged: false,
              isActive: false,
              judgeStyle: 0,
            })),
          };
        } else {
          return {
            ...item,
            noteSpeed: 0.05,
            startPosition: 3.8,
            endPosition: 1.5,
            lifePosition: 1,
            isActive: false,
            isJudged: false,
            judgeStyle: 0,
            notePosition: 5,
          };
        }
      });

        setNoteCSVData(processedNotes); // 把處理好的資料存進 State
        console.log(processedNotes);
        
      }catch(error) {

        console.error("CSV load fails：", error);

      }
    }

    loadCsv();

  }, [getChose]); // 當 getChose 改變時重新執行
};

export const LogicOfNotes = ({ getMusicTimeMs , onlyNotes , setPrefect , setGood , setMiss , setCommbo ,getCommbo , mouseXR}) => {
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
        const innerRadius = outerRadius - 0.1;

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
            if(angleDiff_D  <= 7) {
              note.judgeStyle = 1; 
            } else if(angleDiff_D  <= 15) {
              note.judgeStyle = 2; 
            } 
          }

          if (note.judgeStyle > 0) {
            switch(note.judgeStyle) {
            case 1:
              note.isJudged = true;
              note.isActive = false;
              PlayHitSound();
              setPrefect((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              break;
            case 2:
              note.isJudged = true;
              note.isActive = false;
              PlayHitSound();
              setGood((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              break;
            case 3:
              note.isJudged = true;
              note.isActive = false;
              setMiss((prev) => prev + 1);
              setCommbo(0);
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
              <meshStandardMaterial color='rgb(205, 205, 209)' side={2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};


export const LogicOfRotate = ({ getMusicTimeMs , onlyRotate , setPrefect , setGood , setMiss , setCommbo}) => {
  if (!onlyRotate) return null;
  const activeNotes = onlyRotate.filter(note => !note.isJudged);

  const AngleDiff = getRotateJudgeAngle();

  const now = getMusicTimeMs;


  return (
    <>
      {activeNotes.map((note, index) => {
        if (note.isJudged ) return null;

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

        if (note.notePosition <= note.lifePosition) {
          note.isActive = false;
          note.isJudged = true;
          note.judgeStyle = 3;
        }

        if (!note.isActive) return null;

        // 定義環形的大小 (跟隨 notePosition 變動)
        // innerRadius 是音符內徑，outerRadius 是外徑
        const outerRadius = note.notePosition;
        const innerRadius = outerRadius  - 0.05;

        const noteColor = note.direction === 1 ? 'red' : 'blue';




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

        console.log(now - note.triggerTime);
      if (note.judgeStyle > 0) {
            switch(note.judgeStyle) {
            case 1:
              note.isJudged = true;
              note.isActive = false;
              PlayHitSound();
              setPrefect((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              break;
            case 2:
              note.isJudged = true;
              note.isActive = false;
              PlayHitSound();
              setGood((prev) => prev + 1);
              setCommbo((prev) => prev + 1);
              break;
            case 3:
              note.isJudged = true;
              note.isActive = false;
              setMiss((prev) => prev + 1);
              setCommbo(0);
              break;
            }
          }
        
    }

    if(note.isJudged){
      note.notePosition=0;
    }
      
        // if (AngleDiff === 1) {
        //     console.log("順時針");
        //   }

        //   if (AngleDiff === 2) {
        //     console.log("逆時針");
        //   }

        return (
          <group key={note.id || index} >
            <mesh>
              {/* 
                ringGeometry 參數說明：
                args: [innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength]
                我們用 thetaStart 和 thetaLength 來控制音符弧度的大小 (例如佔一小段角度)
              */}
              <ringGeometry args={[innerRadius, outerRadius, 32, 1, 0 ]} />
              <meshStandardMaterial color={noteColor} side={2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};


export const LogicOfDarg = ({ getMusicTimeMs, onlyDrag }) => {
  if (!onlyDrag) return null;

  return (
    <>
      {onlyDrag.map((note, index) => {
        // 如果整個 note 已經判定完畢，跳過
        if (note.isJudged) return null;

        // 計算時間與位置
        const requiredMs = (note.startPosition - note.endPosition) / note.noteSpeed * (1000 / 60);
        
        // 效能優化：時間還沒到或已結束太久，跳過
        if (getMusicTimeMs < note.triggerTimeStart - requiredMs - 2000) return null;
        if (getMusicTimeMs > note.triggerTimeEnd + 2000) return null;

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
        const segmentsToRender = [];

        for (let i = 0; i <= note.density; i++) {
          // 計算每個細分音符的觸發時間
          const everyDragTriggerTime = note.triggerTimeStart + averageMs * i;
          // 計算每個細分音符的落點角度
          const everyDragLand = note.noteLandStart + averageAng * i;
          // 從應該啟動的時間算起經過了多少毫秒
          const elapsedMs = getMusicTimeMs - (everyDragTriggerTime - requiredMs);
          // 每個小音符如果時間還沒到就不繪製
          if (elapsedMs < 0) {
            continue; 
          }

          let everyNotePosition;
          if (elapsedMs < 0) {
            // 還沒啟動，停在初始位置
            everyNotePosition = note.startPosition;
          } else {
            // 已啟動，計算已下降的距離
            const elapsedFrames = elapsedMs / (1000 / 60);
            everyNotePosition = note.startPosition - note.noteSpeed * elapsedFrames;
          }

          // 生命線檢查（若超出範圍則不畫這個區段）
          if (everyNotePosition <= note.lifePosition) {
            continue; 
          }

          // 如果還沒到起始位置或已經過期，不畫
          if (everyNotePosition > note.startPosition) {
            continue;
          }

          // 定義環形的大小 (使用當前計算出來的 everyNotePosition)
          const outerRadius = everyNotePosition;
          const innerRadius = outerRadius - 0.05;

          // 計算環形弧度 (將 32 等分轉為弳輻)
          const arcWidth = Math.PI / 16 + 0.4; // 可依需求調整弧寬
          const centerAngle = everyDragLand * ((Math.PI * 2) / 32);
          const thetaStart = centerAngle - arcWidth / 2;
          const thetaLength = arcWidth;

          segmentsToRender.push(
            <mesh key={`seg-${i}`}>
              {/* 
                ringGeometry 參數：
                [innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength]
              */}
              <ringGeometry args={[innerRadius, outerRadius, 32, 1, thetaStart, thetaLength]} />
              <meshStandardMaterial side={2} emissive="rgb(205, 205, 209)" emissiveIntensity={10}/>
            </mesh>
          );
        }

        return (
          <group key={note.id || index}>
            {segmentsToRender}
          </group>
        );
      })}
    </>
  );
};

export const PlayerMark = ({ mouseXR }) => {
  const arcLong = (Math.PI / 16) + 0.4
  const halfArcLong = arcLong/2
  return (
    <mesh rotation={[0, 0, mouseXR]}>
      <ringGeometry args={[1, 1.1, 32, 1, -halfArcLong, arcLong ]} />
      <meshStandardMaterial color="rgb(255, 236, 33)" side={2} />
    </mesh>
  );
};


const PlayHitSound = () => {
  const audio = new Audio('https://mg.reservationfurry.art/assest/hit.mp3');

  audio.play().catch(e => {
    console.log('Audio play failed:', e);
  });
};






