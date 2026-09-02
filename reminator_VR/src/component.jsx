import { Slider } from 'antd';
import { useRef, useEffect, useState, useMemo } from 'react';
import {  Drawer , Switch } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import  Papa  from  'papaparse' ;
import { Text , useTexture , Torus} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { 
   useFadeOut 
}from './hooks.jsx'; 

import {
  SongCard3DRadius,
  startPosition,
  menuMgCardsSize,
  endPosition,
  seatRadius,            
  gameAreaRingRadiusIn,  
  gameAreaRingRadiusOut,  
  seatRingRadiusIn,  
  seatRingRadiusOut,   
  playerMarkIn,
  playerMarkOut,
  noteSpeed
} from "./constants.js";

import { useVRStore , 
         useMouseStore, 
         useMusicTimeStore , 
         usePerfectStore , 
         useGoodStore , 
         useMissStore,
         useComboStore,
         useTotalComboStore,
         useJudgeStatus
} from './store.js';


//==========================================================================================
// 讀取資料 ================================================================================
//==========================================================================================
  export const LoadData = ( {setSongs } ) => {
  // 讀取歌曲資料(本地)
  useEffect(() => {
    const loadSongs = async () => {
        try {
          const localRes = await fetch('/VRsongData.json');
          if (!localRes.ok) throw new Error(`HTTP ${localRes.status}`);
          const localData = await localRes.json();
          setSongs(Array.isArray(localData) ? localData : []);
        } catch (localErr) {
          console.error('localErr:', localErr);
          setSongs([]);
        }
    };

    loadSongs();
  }, []);  //只執行一次

  return null; // 不需要渲染任何內容
  }


//==========================================================================================
// 通用component ===========================================================================
//==========================================================================================

// 計算Menu中，角度是否在該曲目的範圍內========================================================
const isAngleInRange = (angle, rangeL, rangeR) => {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const normalizedRangeL = ((rangeL % 360) + 360) % 360;
  const normalizedRangeR = ((rangeR % 360) + 360) % 360;

  if (normalizedRangeL <= normalizedRangeR) {
    return normalizedAngle >= normalizedRangeL && normalizedAngle <= normalizedRangeR;
  }

  return normalizedAngle >= normalizedRangeL || normalizedAngle <= normalizedRangeR;
};

// 躺著的文字，圍繞圓心 ( 是否啟用旋轉 , 顯示的文字 , 的弧度偏移 , 距離圓心的半徑 , 間隔弧度 , 旋轉角度偏移 , 文字大小 , 顏色 , 是否中心對齊 )
export const ShowGameSongText = ({ shouldRotate, whichGet, offset , r, step, offset2 , textSize , color , isCenter}) => {

  const groupRef = useRef(null);

  const characters = Array.from(String(whichGet ?? ''));
  const isChinese = /[\u4e00-\u9fa5]/.test(whichGet);
  const safeStep = Number.isFinite(step) ? step : 0.3;
  const spacingScale = Math.max(0.5, Math.min(1.6, 18 / Math.max(characters.length, 1)));
  const angleStep = isChinese ? safeStep * spacingScale : safeStep;


  useFrame((state, delta) => {
    if (shouldRotate && groupRef.current) {
      groupRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, offset2 || 0]}>
      {characters.map((char, i) => {
        // 使用傳入的靜態 offset 排列文字弧度
        const baseAngle_center = (i - (characters.length - 1) / 2) * angleStep * -1;
        const baseAngle_left = Math.PI - (i * angleStep)
        const baseAngle = isCenter ? baseAngle_center : baseAngle_left;
        const angle = baseAngle + offset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        return (
          <Text
            key={`${char}-${i}`}
            position={[x, y, 0.01]}
            rotation={[0, 0, angle - Math.PI / 2]}
            fontSize={textSize}
            color={color || "white"}
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

// 站著的文字，圍繞圓心
export const ShowGameSongTextStand = ({ shouldRotate, whichGet, offset , r, step , offset2 , textSize}) => {

  const groupRef = useRef(null);

  const characters = Array.from(String(whichGet ?? ''));
  const isChinese = /[\u4e00-\u9fa5]/.test(whichGet);
  const safeStep = Number.isFinite(step) ? step : 0.3;
  const spacingScale = Math.max(0.5, Math.min(1.6, 18 / Math.max(characters.length, 1)));
  const angleStep = isChinese ? safeStep * spacingScale : safeStep;


  useFrame((state, delta) => {
    if (shouldRotate && groupRef.current) {
      groupRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 1.5]} rotation={[0, 0, offset2 || 0]}>
      {characters.map((char, i) => {
        const baseAngle = (i - (characters.length - 1) / 2) * angleStep * -1;
        const angle = baseAngle + offset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        return (
          <group key={`${char}-${i}`} position={[x, y, 0.01]} rotation={[0, 0, angle - Math.PI / 2]}>
            <Text
              rotation={[Math.PI/2, 0, 0]}
              fontSize={textSize}
              color="white"
              anchorX="center"
              anchorY="middle"
              transparent
              fillOpacity={0.2}
            >
              {char}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

// 彈出動畫效果
function PopAnimation(trigger , enterX, enterY, enterz , targetXY , lambda ){
  const value = useRef(null);

  useEffect(() => {
    if (!value.current) return;
    value.current.scale.set(enterX, enterY, enterz);
    value.current.position.z = -5;
  }, [trigger]);

  useFrame((state, delta) => {
    if (!value.current) return;
    value.current.scale.x = THREE.MathUtils.damp(value.current.scale.x, targetXY, lambda, delta);
    value.current.scale.y = THREE.MathUtils.damp(value.current.scale.y, targetXY, lambda, delta);
    value.current.position.z = THREE.MathUtils.damp(value.current.position.z, 0, lambda, delta);
  });

  return value;
}
//==========================================================================================
// Menu 0===================================================================================
//==========================================================================================

// 旋轉圓環 
export const Roundabout = ( ) => {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.5
    }
  })

  const outerLen = Math.PI / 3 // 外圈弧長 60 度
  const innerLen = Math.PI / 4 // 內圈弧長 45 度

  return (
    <group ref={groupRef} position={[0, 0, 0]}>=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusIn + 0.03, 30, 1, -outerLen / 2, outerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)"  side={THREE.DoubleSide} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusIn + 0.03, 30, 1, Math.PI - outerLen / 2, outerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)"  side={THREE.DoubleSide} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn - 0.5, gameAreaRingRadiusIn - 0.47, 30, 1, -innerLen / 2, innerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)"  side={THREE.DoubleSide} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn - 0.5, gameAreaRingRadiusIn - 0.47, 30, 1, Math.PI - innerLen / 2, innerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)"  side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// 曲目Card group 
const SongCard3D = ({ song, angle, isInRange, setTouch, setChose, setStatus,setStop, setNoteCSVData }) => {
  const texture = useTexture(song?.img ? `${song.img}?url=${encodeURIComponent(song.img)}` : undefined);
  const imageRadius = menuMgCardsSize * 0.88;

  const setMusicTimeMs =  useMusicTimeStore.getState().setMusicTimeMs;
 

  const cardGroupRef = useRef();  // 選中的歌曲放大
  const ringRef = useRef();       // 選中的歌曲圓環

  const [isPoint, setIsPoint] = useState(false);  //是否指到歌曲

  // 選中的歌曲放大
  useFrame((state, delta) => {
    if (!cardGroupRef.current) return;
    const targetScale = isInRange ? 1.3 : 1.0;
    cardGroupRef.current.scale.x = THREE.MathUtils.damp(cardGroupRef.current.scale.x, targetScale, 20, delta);
    cardGroupRef.current.scale.y = THREE.MathUtils.damp(cardGroupRef.current.scale.y, targetScale, 20, delta);
  });

  // 選中的歌曲圓環：旋轉 + 縮放特效
  useFrame((state, delta) => {
    if (!ringRef.current) return;

    //  圓環自轉
    ringRef.current.rotation.z += delta * 0.5;

    //  圓環縮放
    const targetScale = isInRange ? 1.5 : 0.0;
    ringRef.current.scale.x = THREE.MathUtils.damp(ringRef.current.scale.x, targetScale, 20, delta);
    ringRef.current.scale.y = THREE.MathUtils.damp(ringRef.current.scale.y, targetScale, 20, delta);
  });

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(angle)]}>
      <group
        ref={cardGroupRef}
        position={[SongCard3DRadius, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        {/* 圓環旋轉與縮放 */}
      <group ref={ringRef} position={[0, 0, 0.5]}>
        {/* args: [圓環半徑, 管身厚度, 徑向分段, 圓周分段, 弧長角度] */}
        <Torus args={[1, 0.02, 16, 32, 1.5]} rotation={[0, 0, 0]}><meshBasicMaterial color="white" /></Torus>
        <Torus args={[1, 0.02, 16, 32, 1.5]} rotation={[0, 0, Math.PI]}><meshBasicMaterial color="white" /></Torus>
      </group>

        {/* 外圈圓 */}
        <mesh
          position={[0, 0, 0]}
          onPointerDown={() => {
            if (isInRange) {
              setStop(true);

              setNoteCSVData([]);
              setMusicTimeMs(0);
              setChose(song);
              setStatus(1);
            }
          }}
          onPointerEnter={() => {
              setTouch(song) 

              if (isInRange) {
                setIsPoint(true);
              }
            }
          }
          onPointerLeave={() => setIsPoint(false)} 
        >
          <circleGeometry args={[menuMgCardsSize, 40]} />
          <meshStandardMaterial color={isInRange && isPoint ? '#9b0000' : isInRange  ? '#f5f200'  : '#111111'}
            metalness={0.1}
            roughness={0.5}
          />
        </mesh>
        {/* 灰色邊框 */}
        <mesh position={[0, 0, 0.04]}>
          <ringGeometry args={[imageRadius * 0.96, imageRadius * 1.06, 30]} />
          <meshBasicMaterial color={'#a0a0a0'} transparent opacity={isInRange ? 1 : 0.28} side={THREE.DoubleSide} />
        </mesh>

        {/* 圖片 */}
        <mesh position={[0, 0, 0.02]}>
          <circleGeometry args={[imageRadius, 40]} />
          <meshBasicMaterial
            map={texture || null}
            color={texture ? '#ffffff' : '#0c0c0c'}
            transparent
            alphaTest={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        <Text
          position={[0, -1.5, 0.01]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.5}
          textAlign="center"
        >
          {song.name}
        </Text>

        <Text
          position={[0, 1.5, 0.01]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {song.level}
        </Text>
      </group>
    </group>
  );
};

// 選歌機制 + SongCard3D 渲染
export const MenuComponent = ({ getsongs, setTouch, setChose, getTouch, setStatus, getStatus, getPage, getUseMouse,setStop, setNoteCSVData }) => {

  const scale = PopAnimation(getStatus , 0.8, 0.8, 1, 1, 30);

  const pageLimit = 8;
  const pageStartIndex = getPage * pageLimit;
  const pageEndIndex = pageStartIndex + pageLimit;
  const pageNow = useMemo(() => 
    getsongs.slice(pageStartIndex, pageEndIndex),
    [getsongs, pageStartIndex, pageEndIndex],
  );

  const VRangle = useVRStore((state) => state.angleR);
  const mouseXD = useMouseStore((state) => state.mouseXR) * (360 / window.innerWidth); // 將 mouseXR 轉換為角度
  const [mouseAngle, setMouseAngle] = useState(mouseXD);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouseAngle((event.clientX / window.innerWidth) * 360);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const vrMenuAngle = ((VRangle * (180 / Math.PI)) + 360) % 360;
  const whichAngleUse = getUseMouse ? vrMenuAngle : mouseAngle;


  useEffect(() => {
    const matchedSong = pageNow.find((song, index) => {
      const angle = (index / pageNow.length) * 360;
      return isAngleInRange(whichAngleUse, angle - 360 / 16, angle + 360 / 16);
    });

    if (matchedSong) {
      setTouch((currentSong) => currentSong?.id === matchedSong.id ? currentSong : matchedSong);
    }
  }, [pageNow, whichAngleUse, setTouch]);

  return (
    <group ref={scale} position={[0, 0, -1.5]}>
      {pageNow.map((ID, index) => {
        const totalInThisPage = pageNow.length;
        const angle = (index / totalInThisPage) * 360;
        const rangeR = angle + 360 / 16;
        const rangeL = angle - 360 / 16;
        const isInRange = isAngleInRange(whichAngleUse, rangeL, rangeR);
        
        return (
          <SongCard3D
            key={ID.id}
            song={ID}
            angle={angle}
            isInRange={isInRange}
            setTouch={setTouch}
            getTouch={getTouch}
            setChose={setChose}
            setStatus={setStatus}
            setStop={setStop}
            setNoteCSVData={setNoteCSVData}
          />
        );
      })}
    </group>
  );
};

// 換頁按鈕
export const MenuPageSwitchBottom = ({ setPage , getPage , pageTotal }) => {

  const [isTouchL , setIsTouchL] = useState(false);
  const [isTouchR , setIsTouchR] = useState(false);

  const isFirstPage = getPage <= 0;
  const isLastPage = (getPage + 1) >= pageTotal;

  const colorL = isTouchL ? 'white' : 'rgb(150,150,150)' ;
  const colorR = isTouchR ? 'white' : 'rgb(150,150,150)' ;

  return (
    <group position={[0, 0, 0]}>
      <Text
        position={[-1.2, 0, 0]}
        fontSize={0.55}
        color={isFirstPage ? 'rgb(150, 0, 0)' : colorL}
        anchorX="center"
        anchorY="middle"
        onPointerEnter={() => setIsTouchL(true)}
        onPointerLeave={() => setIsTouchL(false)} 
        onPointerDown={() => { if (!isFirstPage) setPage(prev => prev - 1); }}
      >
        ◀
      </Text>

      <Text
        position={[1.2, 0, 0]}
        fontSize={0.55}
        color={isLastPage ? 'rgb(150, 0, 0)' : colorR}
        anchorX="center"
        anchorY="middle"
        onPointerEnter={() => setIsTouchR(true)}
        onPointerLeave={() => setIsTouchR(false)} 
        onPointerDown={() => { if (!isLastPage) setPage(prev => prev + 1); }}
      >
        ▶
      </Text>
    </group>
  );
}

// 音樂撥放機制
export const MenuMusicComponent = ({ getTouch , getStatus}) => {
  
    const musicTouched = useRef(null);
    const localSrc = getTouch?.mp3 || null;

    useEffect(() => {
      if (!musicTouched.current) return;

      if (getStatus !== 0 || !getTouch?.mp3) {
        musicTouched.current.pause();
        musicTouched.current.currentTime = 0;
        return;
      }

      musicTouched.current.currentTime = 0;
      musicTouched.current.play().catch(() => {});
    }, [getTouch?.mp3, getStatus]);

    if (!localSrc) return null;

    return (
    <>
      {/* src 帶入音檔路徑  autoPlay 載入就自動播放  controls顯示播放控制條*/}
      <audio
            style={{ position: 'absolute' }}
            src={localSrc}
             ref={musicTouched}
             loop
             autoPlay 
             onLoadedMetadata={(e) => {
                // 當音訊資料載入完成後，將當前播放時間指向 specified 的秒數
                e.currentTarget.currentTime = 40; 
        }}
      />
    </>
  );
};



//==========================================================================================
//過場 1====================================================================================
//==========================================================================================

/* 把getChose的樂曲資料，抓csv資料並做分類處裡，並丟進setNoteCSVData */
export const ProcessChoseCSVData = ({ getChose , setNoteCSVData , setGameStarPosition }) => {
  useEffect(() =>{
    const loadCsv = async () => {
      if(!getChose) return [];

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
        //第二行讀取第一個音符的land
        const secondLineLand = Number(rows[1]?.[0]);
        console.log("Second line land:", secondLineLand);

        // 從第三行開始讀取資料 (i = 2)
        for (let i = 2; i < rows.length; i++) {
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
            noteSpeed: noteSpeed,
            startPosition: startPosition,
            endPosition: endPosition,
            lifePosition: endPosition - 0.2,
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
            noteSpeed: noteSpeed,
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
        setGameStarPosition(Number.isFinite(secondLineLand) ? secondLineLand : 0); // 把第二行的資料存進 State
        
      }catch(error) {

        console.error("CSV load fails：", error);

      }
    }

    loadCsv();

  }, [getChose]); 
};

export const ShowChoseSong = ({ getChose, setStatus }) => {
  const [getTime, setTime] = useState(5); 
  const albumTexture = useTexture(getChose?.img ? `${getChose.img}?url=${encodeURIComponent(getChose.img)}` : undefined);

  const scale = PopAnimation(getChose , 0.8, 0.8, 1, 1, 30);

  useEffect(() => {
    ResetSongJudgeData();
  }, []);

  useEffect(() => {
    let interval = null;
    
    if (getTime > 0) {
      interval = setInterval(() => {
        setTime((prev) => prev - 1);
      }, 1000);
    } else if (getTime === 0) {
      setStatus(2);
    }

    return () => clearInterval(interval);
  }, [getTime, setStatus]);

  return (
    <group ref={scale} position={[0, 0, 0]}>
  
      <mesh position={[0, 0, -0.2]}>
        <circleGeometry args={[3.1, 64]} />
        <meshStandardMaterial color="#47484a"/>
      </mesh>

      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>

      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[2, 64]} />
        <meshBasicMaterial map={albumTexture || null} color={albumTexture ? '#ffffff' : '#262626'} />
      </mesh>

      {/* 環形 遊戲範圍 */}
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusOut, 64]} /> 
        <meshStandardMaterial color="white" transparent={true} opacity={0.5}/>
      </mesh>

      {/* 環形 裝飾 */}
      <group position={[0, 0, 0.01]}>
        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusIn+0.2, 64]} /> 
          <meshStandardMaterial color="white" transparent={true} opacity={0.5}/>
        </mesh>
        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusOut, 64]} /> 
          <meshStandardMaterial color="white" transparent={true} opacity={0.5}/>
        </mesh>
        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusOut, 64]} /> 
          <meshStandardMaterial color="white" transparent={true} opacity={0.5}/>
        </mesh>

        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn-0.7, gameAreaRingRadiusIn-0.7+0.02, 30, 1, 0, Math.PI /5]} />
          <meshBasicMaterial color="rgb(135, 135, 135)"  side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn-0.3, gameAreaRingRadiusIn-0.3+0.02, 30, 1, 180, Math.PI /3]} />
          <meshBasicMaterial color="rgb(135, 135, 135)"  side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn-0.3, gameAreaRingRadiusIn-0.3+0.02, 30, 1, -180, -Math.PI /8]} />
          <meshBasicMaterial color="rgb(135, 135, 135)"  side={THREE.DoubleSide} />
        </mesh>
      </group>

    </group>
  );
};

export const ShowChoseSongData = ({ getChose }) => {
  console.log("getChose:", getChose);  // 在這裡打印 getChose 的值

  const song_name = getChose?.name || "Unknown Song";
  const song_artist = getChose?.song_artist || "Unknown Artist";
  const song_sheet = getChose?.sheet_artist || "Unknown Sheet Artist";
  const song_level = getChose?.level || "Unknown Level";
  const song_bpm = getChose?.bpm || "Unknown BPM";

  const angle = useRef(null);

  useFrame((state, delta) => {
    if (!angle.current) return;
    angle.current.rotation.z += delta * 0.5; // 調整旋轉速度
  });

  return (
    <group>

      <group ref={angle} position={[0, 0, 0]}>
        <ShowGameSongTextStand shouldRotate={false} whichGet={song_name} offset={0} r={3.8} step={0.22} offset2={0} textSize={1.3}/>
         <ShowGameSongTextStand shouldRotate={false} whichGet={song_name} offset={0} r={3.8} step={0.22} offset2={Math.PI} textSize={1.3}/>
      </group>

      <group position={[0, 0, 0]}>
        <ShowGameSongText shouldRotate={false} whichGet={"artist"} offset={0} r={3.5} step={0.03} offset2={Math.PI} textSize={0.2} color={"rgb(100, 100, 100)"} isCenter={false}/>
        <ShowGameSongText shouldRotate={false} whichGet={"sheet"} offset={0} r={3.5} step={0.03} offset2={Math.PI/1.35} textSize={0.2} color={"rgb(100, 100, 100)"} isCenter={false}/>
        <ShowGameSongText shouldRotate={false} whichGet={"level"} offset={0} r={3.5} step={0.03} offset2={Math.PI*2/1.75} textSize={0.2} color={"rgb(100, 100, 100)"} isCenter={false}/>
        <ShowGameSongText shouldRotate={false} whichGet={"bpm"} offset={0} r={3.5} step={0.03} offset2={Math.PI*2/1.6} textSize={0.2} color={"rgb(100, 100, 100)"} isCenter={false}/>


        <ShowGameSongText shouldRotate={false} whichGet={song_artist} offset={0} r={3.2} step={0.07} offset2={Math.PI} textSize={0.3} color={"white"} isCenter={false}/>
        <ShowGameSongText shouldRotate={false} whichGet={song_sheet} offset={0} r={3.2} step={0.07} offset2={Math.PI/1.35} textSize={0.3} color={"white"} isCenter={false}/>
        <ShowGameSongText shouldRotate={false} whichGet={song_level} offset={0} r={3.2} step={0.07} offset2={0.39} textSize={0.3} color={"white"} isCenter={true}/>
        <ShowGameSongText shouldRotate={false} whichGet={song_bpm} offset={0} r={3.2} step={0.07} offset2={0.75} textSize={0.3} color={"white"} isCenter={true}/>

        <ShowGameSongText shouldRotate={false} whichGet={"In the name of  -Rotater- "} offset={0} r={3.2} step={0.05} offset2={0} textSize={0.2} color={"white"} isCenter={false}/>

      </group>

    </group>
  );
}

function ResetSongJudgeData(){
  const setPerfect = usePerfectStore.getState().setPerfect;
  const setGood = useGoodStore.getState().setGood;
  const setMiss = useMissStore.getState().setMiss;
  const setCombo = useComboStore.getState().setCombo;
  const setTotalCombo = useTotalComboStore.getState().setTotalCombo;
  const setJudgeStatus = useJudgeStatus.getState().setJudgeStatus;

  setPerfect(0);
  setGood(0);
  setMiss(0);
  setCombo(0);
  setTotalCombo(0);
  setJudgeStatus(null);
};

//==========================================================================================
//遊玩 2 => 3===============================================================================
//==========================================================================================
export const Box = ({ position }) => {

  const judgeStatus = useJudgeStatus((state) => state.judgeStatus);
  const totalCombo = useTotalComboStore((state) => state.totalCombo);

  const color = judgeStatus === 'M' ? 'red' : 'white';
  const transparency = useFadeOut(totalCombo , 0 , 1);

  return (
    <group position={position}>

      {/* 環形 座位 */}
      <mesh>
        <ringGeometry args={[seatRingRadiusIn, seatRingRadiusOut, 64]} /> 
        <meshStandardMaterial color="rgb(255, 255, 255)" transparent={true} />
      </mesh>

      {/* 圓形 座位 */}
      <mesh>
        <circleGeometry args={[seatRadius, 64]} /> 
        <meshStandardMaterial color={color} transparent={true} opacity={transparency}/>
      </mesh>

      {/* 環形 遊戲範圍 */}
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusOut, 64]} /> 
        <meshStandardMaterial color={color} transparent={true} opacity={transparency}/>
      </mesh>

    </group>
  );
};

export const GameMusicLogic = ({ gameAudioRef , getChose, getStop, getStatus }) => {
  const audioRef = gameAudioRef;
  const audioSrc = getChose?.mp3;

  const setMusicTimeMs = useMusicTimeStore.getState().setMusicTimeMs;

  // 更新音樂時間=======================================
  useFrame(() => {
    if (audioRef.current && !getStop) {
      setMusicTimeMs(Math.floor(audioRef.current.currentTime * 1000));
    }
  });

  // 如果狀態不是 3 或 3.5，暫停並重置音樂===============
  useEffect(() => {
    if (!audioRef.current) return;

    if (getStatus !== 3 && getStatus !== 3.5) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [getStatus]);

  // 處理音樂的 播放/暫停 ==========================
  useEffect(() => {
    if (!audioRef.current) return;

    if (getStop) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [getStop, audioSrc]);

  return null; // 只處理音樂邏輯
};

export const GameMusicPlay = ({ audioRef, audioSrc, getStop , setStatus, getStatus , setStop }) => {
  const resolvedAudioSrc = typeof audioSrc === 'string' ? audioSrc : audioSrc?.mp3;

  if (!resolvedAudioSrc || (getStatus !== 3 && getStatus !== 3.5)) return null;

  return (
    <audio
      key={resolvedAudioSrc}
      ref={audioRef}
      src={resolvedAudioSrc}
      autoPlay={!getStop}
      onPlay={() => setStop(false)}
      onPause={() => setStop(true)}
      onEnded={() => setStatus(4)}
      style={{ display: 'none' }}
    />
  );
};

// ref
export const GameStar = ({ getGameStarPosition , getUseMouse , setStop , setStatus}) => {


  const [isInStarRange, setIsInStarRange] = useState(false);
  const starRangeRef = useRef(false);

  const land = Number.isFinite(getGameStarPosition) ? getGameStarPosition : 0;

  const groupRef = useRef(null);
  const ringAngle = land * (Math.PI / 16) - Math.PI / 32; //取該軌道的中間值
  const radius = gameAreaRingRadiusIn + 0.1;      // 距離玩家多遠(圓半徑)
  const ringArcLength = Math.PI / 7;              // 裝飾圓弧長度
  const textAngle = ringAngle + ringArcLength / 2; // 文字角度
  const color = isInStarRange ? 'rgb(255, 255, 255)' : 'rgb(114, 64, 64)';
  const positionOffest = isInStarRange ? 0 : 0.5;


  const [textX, textY] = [
    Math.cos(textAngle) * (radius + 0.1),
    Math.sin(textAngle) * (radius + 0.1),
  ];

  const [getTime, setTime] = useState(3); 
  

  useEffect(() => {
    if (!isInStarRange) return;

    const interval = setInterval(() => {
      setTime((prev) => { if (prev <= 1) { 
                              clearInterval(interval); 
                              setStatus(3);
                              setStop(false);
                          }
        return prev - 1;
      }
    );}, 1000); 
    
    return () => {
      clearInterval(interval);
      setTime(3);
    };
  }, [isInStarRange]); 


    useFrame((state, delta) => {
      const angleVR = useVRStore.getState().angleR;
      const mouseXR = useMouseStore.getState().mouseXR;
      const playerAngle = getUseMouse ? angleVR : mouseXR;

      const diff = Math.atan2(Math.sin(playerAngle - ringAngle),Math.cos(playerAngle - ringAngle),);

      const starRange = diff >= 0 && diff <= ringArcLength;


      if (starRange !== starRangeRef.current) {
        starRangeRef.current = starRange;
        setIsInStarRange(starRange);
      }

      groupRef.current.userData.anima = (groupRef.current.userData.anima || 0) + delta;

      if (groupRef.current.userData.anima > 1) { groupRef.current.userData.anima = 0; }

      groupRef.current.position.z = groupRef.current.userData.anima * 0.2;
    });


  return (
    <group ref={groupRef}>
      <group position={[0, 0, 0.5 + positionOffest]}>
        <group position={[0, 0, 0]} rotation={[0, 0, ringAngle]}>
          <mesh>
            <ringGeometry args={[radius, radius + 0.05, 32, 1, 0, ringArcLength]} />
            <meshStandardMaterial
              color={color}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        <group position={[textX, textY, 0.7]} rotation={[0, 0, textAngle - Math.PI / 2]}>
          <Text 
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={1}
            color={color}
          >
            STAR
          </Text>
        </group>

        <group position={[textX, textY, 1.3]} rotation={[0, 0, textAngle - Math.PI / 2]}>
          <Text 
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={0.25}
            color={color}
          >
            Click me to get STAR
          </Text>
        </group>

        <group position={[textX, textY, 2.5]} rotation={[0, 0, textAngle - Math.PI / 2]}>
          <Text 
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={2}
            color={color}
          >
            {getTime}
          </Text>
        </group>

        <group position={[-textX, -textY, 0]} rotation={[0, 0, textAngle + Math.PI / 2]}>
          {/* 內層 Text：只負責自己沿 X 軸向前立起來 */}
          <Text 
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={0.25}
            color={'rgb(183, 183, 183)'}
          >
            Look your back, and click the STAR.
          </Text>
        </group>

      </group>
    </group>
  );
};

export const PlayerMark = ({ getUseMouse }) => {
  const arcLong = (Math.PI / 16) + 0.5
  const halfArcLong = arcLong/2

  const angleRef = useRef(null);  // 旋轉角度的參考


  useFrame(() => {
    if (!angleRef.current) return;

    const angleVR = useVRStore.getState().angleR;         // 訂閱VR角度
    const mouseXR = useMouseStore.getState().mouseXR;     //訂閱mouse角度
    const angle = getUseMouse ? angleVR : mouseXR;        // 如果 getUseMouse 為 true，使用 VR 的角度，否則使用 0

    if (!Number.isFinite(angle)) return;

    if(angleRef.current.rotation.z <= 0){
      angleRef.current.rotation.z -= Math.PI*2
    }else if(angleRef.current.rotation.z >= 360){
      angleRef.current.rotation.z =+ Math.PI*2
    }

    const unLimAngle = angle % (Math.PI * 2);
    angleRef.current.rotation.z = unLimAngle;

  });
  
  
  return (
    <mesh ref={angleRef} position={[0, 0, 0]}>
      <ringGeometry args={[playerMarkIn, playerMarkOut, 32, 1, -halfArcLong, arcLong ]} />
      <meshStandardMaterial color={"rgb(255, 236, 22)"} />
    </mesh>
  );
};

export const PuaseButtom = ({ getStop, setStop }) => {
  const [hovered, setHovered] = useState(false);

  const activeColor = getStop ? 'rgba(255, 255, 255)' : 'rgba(150, 150, 150)';
  const circleBgColor = hovered ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)';

  return (
    <group
      position={[0, 0, 0.05]}
      onPointerDown={() => setStop((prev) => !prev)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 外層圓形邊框  */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.5, 0.52, 32]} />
        <meshBasicMaterial color={activeColor}  side={THREE.DoubleSide} opacity={0.6} />
      </mesh>

      {/*  圓形背景  */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.52, 32]} />
        <meshBasicMaterial color={circleBgColor}  side={1} transparent opacity={0.6} />
      </mesh>

      {/* 中心圖示文字 */}
      <Text
        position={[0, 0, 0.01]} // 播號箭頭視覺偏右，微調 0.05 水平居中
        fontSize={0.6}
        color={activeColor}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
      >
        {getStop ? '▶' : '⏸'}
      </Text>
    </group>
  );
};

export const JudgeTextComponent = ( ) => {

  const judgeStatus = useJudgeStatus((state) => state.judgeStatus);
  const totalCombo = useTotalComboStore((state) => state.totalCombo);

  const judgeText =
    judgeStatus === "P" ? "PERFECT" :
    judgeStatus === "G" ? "GOOD" :
    judgeStatus === "M" ? "MISS" :
    null;

  const color = judgeStatus === "M" ? "red" : "white";
  const transparency = useFadeOut(totalCombo , 0 , 1);
  const radius = gameAreaRingRadiusIn;
  const angleStep = 0.2;

  if (!judgeText) return null;

  const chars = judgeText.split("");

  return (
    <group>
      {chars.map((char, index) => {
        const reversedIndex = chars.length - 1 - index;
        const angle =
          (reversedIndex - (chars.length - 1) / 2) * angleStep;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <group
            key={`${char}-${index}`}
            position={[x, y, 1.2]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <Text
              rotation={[Math.PI / 2, 0, 0]}
              fontSize={1}
              color={color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={transparency}
            >
              {char}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export const CommboTextComponent = ( ) => {

  const combo = useComboStore((state) => state.combo);
  const totalCombo = useTotalComboStore((state) => state.totalCombo);
  const judgeStatus = useJudgeStatus((state) => state.judgeStatus);

  const chars = String(combo).split("");
  const transparency = useFadeOut(totalCombo , 0, 1);
  const angleStep = 0.1; 
  const radius = gameAreaRingRadiusIn ;

  const color = judgeStatus === "M" ? "red" : "white";

  return (
    <group rotation={[0, 0, Math.PI]}>
      {chars.map((char, i) => {
        const reversedIndex = chars.length - 1 - i;
        const angle = (reversedIndex - (chars.length - 1) / 2) * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <group key={i} position={[x, y, 1.2]} rotation={[0, 0, angle - Math.PI / 2]}>
            <Text
              key={i}
              rotation={[Math.PI/2, 0, 0]}
              fontSize={1}
              color={color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={transparency}
            >
              {char}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export const BackImg = ({ getChose ,}) => {
  const proxyImageUrl = useTexture(getChose?.img ? `${getChose.img}?url=${encodeURIComponent(getChose.img)}` : undefined);
  
  const meshRef = useRef();


  const totalCombo = useTotalComboStore((state) => state.totalCombo);
  const judgeStatus = useJudgeStatus((state) => state.judgeStatus);

  const color = judgeStatus === "M" ? "rgb(92, 29, 29)" : "#444444";
  const transparency = useFadeOut(totalCombo , 0.6 , 1);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.5; 
    }
  });


  return (
     <group>
        <mesh ref={meshRef} position={[0, 0, -0.1]}> 
          <circleGeometry args={[gameAreaRingRadiusOut, 32]} /> 
          <meshBasicMaterial
            map={proxyImageUrl || null}
            color={proxyImageUrl ? color : '#ff03fb'} 
            transparent={true}
            opacity={transparency}
          />
        </mesh>

        <mesh>
          <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusIn+0.005, 64]} />
          <meshBasicMaterial color={'#ffffff'} />
        </mesh>
      </group>
    );
}


//==========================================================================================
//分數結算4 =================================================================================
//==========================================================================================
export const ShowChoseSongScoresImg = ({ getChose , setStatus}) => {
  const texture = useTexture(getChose?.img ? `${getChose.img}?url=${encodeURIComponent(getChose.img)}` : undefined);

  const scale = PopAnimation(getChose , 0.8, 0.8, 1, 1, 30);

  const[isTouch , setIsTouch] = useState(false);
  const angleImg = useRef(0);
  const angleRing = useRef(0);  

  const color = isTouch ? 'rgb(255, 224, 21)' : 'rgb(91, 91, 91)';

  
  useFrame((state, delta) => {
    if (!angleImg.current) return;

    if (isTouch && angleImg.current) {
      angleImg.current.rotation.z += delta * 0.5;
    }
  });

  useFrame((state, delta) => {
    if (!angleRing.current) return;

    angleRing.current.rotation.z += delta * 0.5;
    
    const targetScale = isTouch ? 1.5 : 0.0;
    angleRing.current.scale.x = THREE.MathUtils.damp(angleRing.current.scale.x, targetScale, 20, delta);
    angleRing.current.scale.y = THREE.MathUtils.damp(angleRing.current.scale.y, targetScale, 20, delta);
  });

  return (
    <group ref={scale}>
      <group>
        <group ref={angleImg} position={[0, 2.5, 0.1]}>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[1.3, 32]} />
            <meshBasicMaterial color= {color}/>
          </mesh>

          <mesh position={[0, 0, 0.02]}
            onPointerEnter={() => setIsTouch(true)}
            onPointerLeave={() => setIsTouch(false)}
            onPointerDown={() => setStatus(0)}
          >
            <circleGeometry args={[1.2, 32]} />
            <meshBasicMaterial
              map={texture || null}
              color={texture ? '#ffffff' : '#262626'}
              transparent
              alphaTest={0.05}
            />
          </mesh>
        </group>

        <group ref={angleRing} position={[0, 2.5, 0.5]}>
          <mesh>
            <torusGeometry args={[1, 0.02, 16, 32, 1.5]} />
            <meshBasicMaterial color='rgb(255, 255, 255)' transparent/>
          </mesh>

          <mesh rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[1, 0.02, 16, 32, 1.5]} />
            <meshBasicMaterial color="rgb(255, 255, 255)" transparent />
          </mesh>
        </group>

        <ShowGameSongOverButtom  isTouch={isTouch} texts={"Turn to menu"} offset={Math.PI}/>
        <ShowGameSongOverButtom  isTouch={isTouch} texts={"Turn to menu"} offset={0}/>
      </group>
    </group>
  );
}

const ShowGameSongOverButtom = ({ isTouch , texts , offset }) => {

  const characters = Array.from(String(texts ?? ''));
  const angleStep = 0.2;
  const r = 1;

  const angle = useRef(0);

  useFrame((state, delta) => {
    if (!angle.current) return;

    if(isTouch){
      angle.current.rotation.z += delta * 0.5;
    }

    const targetScale = isTouch ? 1.5 : 0.0;
    angle.current.scale.x = THREE.MathUtils.damp(angle.current.scale.x, targetScale, 20, delta);
    angle.current.scale.y = THREE.MathUtils.damp(angle.current.scale.y, targetScale, 20, delta);
  });


  return (
    <group ref={angle} position={[0, 2.5, 1.0]} rotation={[0, 0, offset || 0]}>
      {characters.map((char, i) => {
        const baseAngle = (i - (characters.length - 1) / 2) * angleStep * -1;
        const angle = baseAngle ;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        return (
          <group key={`${texts}-${offset}-${i}`} position={[x, y, 0.01]} rotation={[0, 0, angle - Math.PI / 2]}>
            <Text
              rotation={[Math.PI/2, 0, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {char}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export const ShoeGameSongBox = ( getStatus ) => {
  const scale = PopAnimation(getStatus , 0.8, 0.8, 1, 1, 30);
  return (
    <group ref={scale}>
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[gameAreaRingRadiusIn - 0.5, gameAreaRingRadiusIn - 2, 64]} />
        <meshStandardMaterial color={'#353535'} side={THREE.DoubleSide} transparent={true} opacity={0.5} />
      </mesh>
    </group>
  );
}

export const ShoeGameSongText = ({ getChose }) => {
    const perfect = usePerfectStore((state) => state.perfect);  // 訂閱 zustand  的 setPerfect
    const good = useGoodStore((state) => state.good);           // 訂閱 zustand  的 setGood
    const miss = useMissStore((state) => state.miss);           // 訂閱 zustand  的 setMiss
    const combo = useComboStore((state) => state.combo);

    const hitPresent = Math.round(((perfect + good) / (perfect + good + miss)) * 100) ;


  return (
    <group>
      <ShowGameSongText shouldRotate={false} whichGet={perfect} offset={-0.9} r={2.5} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={good} offset={-0.1} r={2.6} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={miss} offset={0.6} r={2.6} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={combo} offset={3.7} r={2.6} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={hitPresent} offset={2.6} r={2.6} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      
      <ShowGameSongText shouldRotate={false} whichGet={'PREFECT'} offset={-0.9} r={3.3} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={'GOOD'} offset={-0.1} r={3.2} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={'MISS'} offset={0.6} r={3.2} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={'MAXCOMMBO'} offset={3.7} r={3.2} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      <ShowGameSongText shouldRotate={false} whichGet={'HIT%'} offset={2.6} r={3.2} step={0.1} offset2={0} textSize={0.42} color={"white"} isCenter={true}/>
      
      <ShowGameSongTextStand shouldRotate={true} whichGet={getChose.name} offset={0} r={gameAreaRingRadiusOut-0.2} step={0.2} offset2={0} textSize={2}/>
      <ShowGameSongTextStand shouldRotate={true} whichGet={getChose.name} offset={0} r={gameAreaRingRadiusOut-0.2} step={0.2} offset2={Math.PI} textSize={2}/>
    </group>
  );
}

//==========================================================================================
// 持續資料取得================================================================================
//==========================================================================================
 // VR =====================================================================================
export const VRTracker = () => {
  const setAngles = useVRStore((state) => state.setAngles);
  
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();

  useFrame((state) => {
    state.camera.getWorldQuaternion(quaternion);
    rotation.setFromQuaternion(quaternion);

    const angleZR = rotation.z;
    const angleZLimR = ((angleZR + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    setAngles(angleZLimR);  // 直接更新 Zustand store
  });

  return null;
};

 // mouse =====================================================================================
export const MouseRXTracker = () => {
  const setMouseXR = useMouseStore.getState().setMouseXR;

  useEffect(() => {
    const handleMouseMove = (event) => {
      const width = window.innerWidth;
      if (width === 0) return;
      const nextAngle = (event.clientX / width) * Math.PI * 6 + Math.PI;
      setMouseXR(nextAngle);  // 角度寫入 Zustand
    };

    // window.addEventListener(...)：告訴瀏覽器【監聽全域視窗的某個動作】
    // pointermove'：監聽的事件名稱，同時支援滑鼠移動、觸控螢幕滑動（Touch）與觸控筆（Stylus）
    // handleMouseMove：事件發生時要執行的函式（Callback）
    window.addEventListener('pointermove', handleMouseMove);
    // return () => { ... }：這是在 React useEffect 中特有的清理語法。當元件卸載（Unmount，例如使用者換頁）或元件重新渲染前，React 會自動執行這個 return 後面的函式。
    return () => window.removeEventListener('pointermove', handleMouseMove);
  }, [setMouseXR]);

  return null;
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
    if (event.key === 'z') {
      setStatus(0);
    } else if (event.key === 'x') {
      setStatus(1);
    } else if (event.key === 'c') {
      setStatus(2);
    } else if (event.key === 'v') {
      setStatus(3);
    } else if (event.key === 'b') {
      setStatus(4);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

export const SideBar = ({ setUseMouse , setRotateCanva}) => {

  // 是否開啟維修介面================================
  const [open, setOpen] = useState(false);

   const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  //================================================
    const onChangeUseMouse = checked => {
      if (setUseMouse) { setUseMouse(checked); 
        console.log(`Use Mouse : ${checked}`);
      }
    };

    const onChangeUseRotateCanva = checked => {
      if (setRotateCanva) { setRotateCanva(checked); 
        console.log(`Use Rotate Canva : ${checked}`);
      }
    };

    return (
    <>
      < UnorderedListOutlined className="FixButtom"  onClick={showDrawer}>
        Fix Pabe
      </ UnorderedListOutlined>
      <Drawer
        title="Fix"
        closable={{ 'aria-label': 'Close Button' }}
        onClose={onClose}
        open={open}
      >
        <div>
          <Switch defaultChecked={false} onChange={onChangeUseMouse} />  Use VR to control  rotation
        </div>
        
        <div>
          <Switch defaultChecked={false} onChange={onChangeUseRotateCanva} />  Use Canva to ground 
        </div>
        
      </Drawer>
    </>
  );
};









