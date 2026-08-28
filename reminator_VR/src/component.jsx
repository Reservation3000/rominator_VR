import { Slider } from 'antd';
import { useRef, useEffect ,  useState } from 'react';
import { Avatar } from 'antd';
import {  Button } from 'antd';
import  Papa  from  'papaparse' ;
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {  CaretRightFilled,
          CaretLeftFilled 
} from '@ant-design/icons';

import { 
   useFadeOut 
}from './hooks/hooks.jsx'; 

import {
  imageProxyURL,
  startPosition,
  menuMgCardsSize,
  menuCertenCircleSize,
  endPosition,
  seatRadius,            
  gameAreaRingRadiusIn,  
  gameAreaRingRadiusOut,  
  seatRingRadiusIn,  
  seatRingRadiusOut,   
  playerMarkIn,
  playerMarkOut,
} from "./constants.js";

//==========================================================================================
// Menu 0===================================================================================
//==========================================================================================
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

export const MenuComponent = ({ mouseXD , getsongs , setTouch , setChose , setStatus , getPage , songTotal , pageTotal}) => {

  const pageLimit = 8;
  const pageStartIndex = getPage * pageLimit; // 開始索引
  const pageEndIndex = pageStartIndex + pageLimit; // 結束索引
  const pageNow = getsongs.slice(pageStartIndex, pageEndIndex); // 當頁切出來的歌單
  console.log(mouseXD);
  // console.log({
  //   "共有幾首歌":songTotal,
  //   "共有幾頁":pageTotal,
  //   "現在在第幾頁":getPage,
  //   "這頁起始數字":pageStartIndex,
  //   "這頁結束數字":pageEndIndex,
  //   "當頁有幾首歌":pageNow.length, 
  //   "當頁的資料內容":pageNow                     
  // }
  // );

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
            className='mgCardsWrapper' // 旋轉定位
            // style={{ '--top': `calc(50% + ${y}px)`,  '--left': `calc(50% + ${x}px)`}}
            style={{'--angle':`${angle}deg`}}
          >
            {/* 歌曲卡片 */}
            <Avatar className="mgCards" 
                  size={menuMgCardsSize}
                  title={ID.name} 
                  variant="borderless"
                  src={ID.img}
                  onMouseEnter={() => setTouch(ID)}  //滑鼠摸到
                  onClick={() => {                   //滑鼠點擊
                    setChose(ID);
                    setStatus(2);
                  }}
            />
        
            {/* 中心圓圈 */}
            <Avatar className='certenCircle'
                  size={menuCertenCircleSize}
                  title={ID.name} 
                  variant="borderless"
            />

            <p className=' MenuMusicName'> {ID.name} </p>
            <p className=' MenuMusicLevel'> {ID.level} </p>

          </div>
          )})}
      </div>
  );
}

export const MenuPageSwitchBottom = ({ setPage , getPage , pageTotal }) => {

  const isFirstPage = getPage <= 0;
  const isLastPage = (getPage + 1) >= pageTotal;

  return (
    <>
      <div className="MenuPageSwitchBottomLeft">
          {/* 上一頁按鈕 */}
          {/* getPage 從第0開始，但頁數從1開始 */}
          <CaretLeftFilled 
            disabled={getPage  <= 0}
            onClick={() => {if (!isFirstPage) setPage(prev => prev - 1);}}
          />
      </div>

      <div className="MenuPageSwitchBottomRight">
          {/* 下一頁按鈕 */}
          <CaretRightFilled
            disabled={(getPage+1) == pageTotal}
            onClick={() => {if (!isLastPage) setPage(prev => prev + 1);}}
          />
      </div>
    </>
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
             loop
             autoPlay 
             onLoadedMetadata={(e) => {
                // 當音訊資料載入完成後，將當前播放時間指向指定的秒數
                e.currentTarget.currentTime = 40; 
        }}
      />
    </>
  );
};

export const MenuSongInstruction = ({ getChose }) => {
  // const angle = getChose

  // return (
  //    <CaretLeftFilled 
  //           disabled={getPage  <= 0}
  //           onClick={() => {if (!isFirstPage) setPage(prev => prev - 1);}}
  //         />
  // );
}

//==========================================================================================
//過場 1====================================================================================
//==========================================================================================

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
            startPosition: startPosition,
            endPosition: endPosition,
            lifePosition: endPosition - 0.1,
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
            startPosition: startPosition,
            endPosition: endPosition,
            lifePosition: endPosition - 0.1,
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

export const ShowChoseSong = ({ getChose , setStatus}) => {
  const [getTime, setTime] = useState(5); 

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
      <div className='showChoseSongEdge'>
        <div className='showChoseSongNameTop'>{getChose.name}</div>
        <div className='showChoseSongNameBottom'>{getChose.name}</div>
        <div className="showChoseSong">
          <div className="showChoseSongBack_Circle_0"></div>
          <div className="showChoseSongBack_Circle_1"></div>
          <Avatar size={500} src={getChose.img} />
        </div>
      </div>
    </div>
  );
};


//==========================================================================================
//遊玩 2====================================================================================
//==========================================================================================
export const Box = ({ position, getJudgeStatus , getTotalCombo}) => {
  const color = getJudgeStatus === 'M' ? 'red' : 'white';
  const colorBloomValue = getJudgeStatus === 'M' ? 3 : 0.5;
  const transparency = useFadeOut(getTotalCombo);

  return (
    <group position={position}>

      {/* 環形 座位 */}
      <mesh>
        <ringGeometry args={[seatRingRadiusIn, seatRingRadiusOut, 64]} /> 
        <meshStandardMaterial color="rgb(113, 115, 119)" transparent={true} />
      </mesh>

      {/* 圓形 座位 */}
      <mesh>
        <circleGeometry args={[seatRadius, 64]} /> 
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={colorBloomValue-0.2} transparent={true} opacity={transparency}/>
      </mesh>

      {/* 環形 遊戲範圍 */}
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusOut, 64]} /> 
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={colorBloomValue} transparent={true} opacity={transparency}/>
      </mesh>

    </group>
  );
};

export const GameMusicComponent = ({ getChose, setMusicTimeMs, setStatus , getStop , setStop}) => {
  const musicChose = useRef(null);
  

  // 根據 getplay 的改變來控制播放與暫停
useEffect(() => {
    if (!musicChose.current) return;

    if (getStop) {
      musicChose.current.play();
    } else {
      musicChose.current.pause();
    }
  }, [getStop]);

  // 處理時間同步
  useEffect(() => {
    if (!musicChose.current) return;

    let rafId;

    const tick = () => {
      // 只有在播放狀態（且音樂不是暫停中）才更新時間，優化效能
      if (musicChose.current && !musicChose.current.paused) {
        const now = musicChose.current.currentTime * 1000;
        setMusicTimeMs(now);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [setMusicTimeMs]); 

  if (!getChose.mp3) return null;

  return (
    <>
      <audio 
        style={{ top: '50px', position: 'relative' }}
        ref={musicChose}
        src={getChose.mp3}
        autoPlay
        onPlay={() => setStop(true)}   // 確保 DOM 實際播放時，state 是 true
        onPause={() => setStop(false)} // 確保 DOM 實際暫停時，state 是 false
        onEnded={() => setStatus(3)}   // 回到選歌介面
      />
    </>
  );
}

export const PlayerMark = ({ mouseXR }) => {
  const arcLong = (Math.PI / 16) + 0.5
  const halfArcLong = arcLong/2
  return (
    <mesh rotation={[0, 0, mouseXR]}>
      <ringGeometry args={[playerMarkIn, playerMarkOut, 32, 1, -halfArcLong, arcLong ]} />
      <meshStandardMaterial color={"rgb(255, 236, 33)"} emissive={"rgb(255, 236, 33)"} emissiveIntensity={3} side={2} />
    </mesh>
  );
};

export const PuaseButtom = ({ getStop, setStop }) => {
  return (
    <div className="puaseButtom">
      <Button
        type="text"
        onClick={() => setStop(prev => !prev)}
      >
        {getStop ? 'Pause' : 'Play'} {/* 讓按鈕文字隨狀態動態改變，方便辨識 */}
      </Button>
    </div>
  );
};

export const JudgeTextComponent = ({ radius = 4.2, getJudgeStatus , getTotalCombo}) => {
  const judgeText = 
    getJudgeStatus === 'P' ? 'PERFECT' : 
    getJudgeStatus === 'G' ? 'GOOD' : 
    getJudgeStatus === 'M' ? 'MISS' : null;

  const color = getJudgeStatus === 'M' ? 'red' : 'white';
  const transparency = useFadeOut(getTotalCombo);

  if (!judgeText) return null;

  const chars = judgeText.split(""); // 將字串拆分為單個字元的陣列
  
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
            key={`${char}-${i}`}
            position={[x, y, 0]}
            rotation={[0, 0, angle - Math.PI / 2]}
            fontSize={0.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            fillOpacity={transparency}
          >
            {char}
          </Text>
        );
      })}
    </group>
  );
};

export const CommboTextComponent = ({ radius = 4.2, getCommbo , getTotalCombo}) => {

  const chars = String(getCommbo).split("");
  const transparency = useFadeOut(getTotalCombo);
  
  // 設定每個相鄰字元之間的固定角度間距（可依需求微調）
  const angleStep = 0.1; 

  return (
    <group rotation={[0, 0, Math.PI]}>
      {chars.map((char, i) => {
        // group 有額外旋轉 Math.PI，因此這裡用反轉索引避免位數左右顛倒
        const reversedIndex = chars.length - 1 - i;
        // 以整串文字的中心點為基準向兩側展開，個位數時會維持置中
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
            fillOpacity={transparency}
          >
            {char}
          </Text>
        );
      })}
    </group>
  );
};
  
export const BackImg = ({ radius, getChose }) => {
  const [texture, setTexture] = useState(null);
  const proxyImageUrl = getChose?.img
    ? `${imageProxyURL}?url=${encodeURIComponent(getChose.img)}`
    : null;

    // 1. 建立一個指向 mesh 的 ref
  const meshRef = useRef();

  // 2. 使用 useFrame 讓它每一幀都在旋轉
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.5; // 數值越大轉越快
    }
  });

  useEffect(() => {
    if (!proxyImageUrl) return;

    let isCancelled = false;
    const loader = new THREE.TextureLoader();

    loader.load( proxyImageUrl,(loadedTexture) => {
        if (isCancelled) return;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },undefined,(error) => {
        if (isCancelled) return;
        console.warn('BackImg texture load failed:', proxyImageUrl, error);
        setTexture(null);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [proxyImageUrl]);

  return (
      <mesh ref={meshRef} position={[0, 0, -0.1]}> 
        <circleGeometry args={[radius, 32]} /> 
        <meshBasicMaterial
          map={texture || null}
          color={texture ? '#272727' : '#111111'} 
        />
      </mesh>
    );
}


//==========================================================================================
//分數結算3 =================================================================================
//==========================================================================================
export const ShowChoseSongScoresBack = () => {
    return (
     <div className="showChoseSongScoresBack">
      <div className="bigCircle"></div>
      <div className="seatCircle"></div>
    </div>
  );
}

export const ShowChoseSongScoresImg = ({ getChose }) => {
  return (
    <div className="showChoseSongScoresImgLayer">
      <div className='showChoseSongScoresImg'>
        <Avatar src={getChose.img} />
      </div>
    </div>
  );
}

export const ShowGameSongText = ({ className, whichGet, offset, r, a }) => {

  // 將數字轉為字串，再拆分為單個字元的陣列
  const whichGetCharCount = String(whichGet).split('');
  const isChinese = /[\u4e00-\u9fa5]/.test(whichGetCharCount.join('')); // 檢查是否包含中文
  const angleStep = isChinese ? a+0.1 : a; // 中文字元間距較大，英文或數字間距較小
  const radius = r;

  return (
    <div className={className}>
      {whichGetCharCount.map((char, i) => {

        const baseAngle =
          (i - (whichGetCharCount.length - 1) / 2) * angleStep;

        const angle = baseAngle + offset;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const rotateAngle =
          angle - Math.PI / 2 + Math.PI;

        return (
          <div key={`${char}-${i}`} className="scoreChars"
            style={{'--x': `${x*9}px`, '--y': `${y*9}px`, '--rotate': `${rotateAngle}rad`}}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
};

//==========================================================================================
//fix component=============================================================================
//==========================================================================================

export const SliderComponent = ({setVal}) => {
  return (
    <div className="slider">
      <Slider defaultValue={1} min={0.35} max={1} step={0.01} onChange={(v) => setVal(v)}/>
    </div>
  );
}

export const StatusControl = ({ setStatus }) => {
  const handleKeyDown = (event) => {
    if (event.key === '0') {
      setStatus(0);
    } else if (event.key === '1') {
      setStatus(1);
    } else if (event.key === '2') {
      setStatus(2);
    } else if (event.key === '3') {
      setStatus(3);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};











