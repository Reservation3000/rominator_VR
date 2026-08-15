import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef, useEffect ,  useState } from 'react';
import { Avatar } from 'antd';
import {  Space , Button } from 'antd';
import { useMouse } from "@reactuses/core";
import  Papa  from  'papaparse' ;
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';


export const CameraControler = ({ mouseXR }) => {
  const cameraRef = useRef();

};

export const Box = ({ position, getJudgeStatus }) => {
  const color = getJudgeStatus === 'M' ? 'red' : 'white';
  const colorBloomValue = getJudgeStatus === 'M' ? 3 : 0.5;

  return (
    <group position={position}>
      {/* 圓形 Mesh */}
      <mesh>
        <circleGeometry args={[0.95, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={colorBloomValue-0.2} />
      </mesh>

      {/* 環形 Mesh */}
      <mesh>
        <ringGeometry args={[3.9, 3.93, 60, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={colorBloomValue} />
      </mesh>
    </group>
  );
};

export const Roundabout =() =>{
  return(
    <div className="roundabout-container">
      <svg className="roundabout" viewBox="0 0 100 100">
        <path d="M 50 5 A 45 45 0 0 1 81.82 18.18" fill="none" stroke="white" strokeWidth="0.1" />
        {/* 長弧相反側 */}
        <path d="M 50 5 A 45 45 0 0 1 81.82 18.18" fill="none" stroke="white" strokeWidth="0.1" transform="rotate(180 50 50)" />
        {/* 短弧，半徑較小 */}
        <path d="M 53.75 7.16 A 43 43 0 0 1 77.64 17.06" fill="none" stroke="white" strokeWidth="0.1" />
         {/* 短弧相反側 */}
        <path d="M 53.75 7.16 A 43 43 0 0 1 77.64 17.06" fill="none" stroke="white" strokeWidth="0.1" transform="rotate(180 50 50)"/>
      </svg>
    </div>
  );
}

export const GameMusicComponent = ({ getChose, setMusicTimeMs , setStatus}) => {
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
      onEnded={() => setStatus(0)} //回到選歌介面
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
  const [getTime, setTime] = useState(1);  // 3秒

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
    <div className="showChoseSongBack">
      <div className="showChoseSong">
        <div class="showChoseSongBack_Circle_0"></div>
        <div class="showChoseSongBack_Circle_1"></div>
        <Avatar size={500} src={getChose.img} />
      </div>
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
            endPosition: 1.2,
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
            endPosition: 1.2,
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

  }, [getChose]); 
};

export const PlayerMark = ({ mouseXR }) => {
  const arcLong = (Math.PI / 16) + 0.5
  const halfArcLong = arcLong/2
  return (
    <mesh rotation={[0, 0, mouseXR]}>
      <ringGeometry args={[1, 1.05, 32, 1, -halfArcLong, arcLong ]} />
      <meshStandardMaterial color="rgb(255, 236, 33)" side={2} />
    </mesh>
  );
};

export const PuaseButtom = ({ setStatus }) => {
  return (
    <div className="PuaseButtom">
      <Button
        type="text"
        onClick={() => setStatus(2.5)}
      >
        Pause
      </Button>
    </div>
  );
};

export const JudgeTextComponent = ({ radius = 4.2, getJudgeStatus }) => {
  const judgeText = 
    getJudgeStatus === 'P' ? 'PERFECT' : 
    getJudgeStatus === 'G' ? 'GOOD' : 
    getJudgeStatus === 'M' ? 'MISS' : null;

  if (!judgeText) return null;

  const chars = judgeText.split("");
  
  // 設定每個相鄰字元之間的固定角度間距（可依字體大小微調此數值）
  const angleStep = 0.1; 

  return (
    <group>
      {chars.map((char, i) => {
        // 使用反轉後的索引來計算角度與旋轉
        const reversedIndex = chars.length - 1 - i;
        // 以整串文字的中心點為基準向兩側展開
        // (i - (chars.length - 1) / 2) 可以讓奇數或偶數長度的字串都完美置中於 0 度
        const angle = (reversedIndex - (chars.length - 1) / 2) * angleStep;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <Text
            key={i}
            position={[x, y, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {char}
          </Text>
        );
      })}
    </group>
  );
};

export const CommboTextComponent = ({ radius = 4.2, getCommbo }) => {


  const chars = String(getCommbo).split("");
  
  // 設定每個相鄰字元之間的固定角度間距（可依需求微調）
  const angleStep = 0.1; 

  return (
    <group rotation={[0, 0, Math.PI]}>
      {chars.map((char, i) => {
        // 以整串文字的中心點為基準向兩側展開，個位數時 (0 - 0) * angleStep = 0，完美置中
        const angle = (i - (chars.length - 1) / 2) * angleStep;
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <Text
            key={i}
            position={[x, y, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
            fontSize={0.4}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {char}
          </Text>
        );
      })}
    </group>
  );
};




