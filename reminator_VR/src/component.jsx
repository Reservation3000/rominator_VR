import { Slider } from 'antd';
import { XR } from '@react-three/xr';
import { useRef, useEffect, useState, useMemo } from 'react';
import {  Button , Drawer , Avatar , Switch} from 'antd';
import  Papa  from  'papaparse' ;
import { Text , useTexture} from '@react-three/drei';
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
  audioProxyURL,
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
} from "./constants.js";

import { useVRStore } from './store.js';

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
        <meshBasicMaterial color="rgb(205, 205, 209)" side={2} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn, gameAreaRingRadiusIn + 0.03, 30, 1, Math.PI - outerLen / 2, outerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)" side={2} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn - 0.5, gameAreaRingRadiusIn - 0.47, 30, 1, -innerLen / 2, innerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)" side={2} />
      </mesh>
=
      <mesh>
        <ringGeometry args={[gameAreaRingRadiusIn - 0.5, gameAreaRingRadiusIn - 0.47, 30, 1, Math.PI - innerLen / 2, innerLen]} />
        <meshBasicMaterial color="rgb(205, 205, 209)" side={2} />
      </mesh>
    </group>
  )
}

// 曲目Card group 
const SongCard3D = ({ song, angle, isInRange, setTouch, setChose, setStatus, setStop, getChose, setNoteCSVData, setMusicTimeMs }) => {
  const texture = useTexture(song?.img ? `${imageProxyURL}?url=${encodeURIComponent(song.img)}` : undefined);
  const imageRadius = menuMgCardsSize * 0.88;

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
          <mesh>
            <ringGeometry args={[1, 1.01, 30, 1, 0, 1.5]} />
            <meshBasicMaterial color="rgb(255, 255, 255)" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <ringGeometry args={[1, 1.01, 30, 1, Math.PI, 1.5]}/>
            <meshBasicMaterial color="rgb(255, 255, 255)" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* 外圈圓 */}
        <mesh
          position={[0, 0, 0]}
          onPointerDown={() => {
            if (isInRange) {
              setStop(true);

              if (getChose?.id === song.id) {
                setNoteCSVData([]);
                setMusicTimeMs(0);
                setChose(null);
                setStatus(1);
                requestAnimationFrame(() => {
                  setChose(song);
                  setStatus(1);
                });
                return;
              }

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
            emissive={ isInRange && isPoint ? '#9b0000' : isInRange ? '#f5f200' : '#222222'}
            emissiveIntensity={isInRange ? (isPoint  ? 1.5 : 1.1) : 0.2}
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
export const MenuComponent = ({ getsongs, setTouch, setChose, getTouch, getChose, setStatus, getPage, getUseMouse, mouseXD, setStop, setNoteCSVData, setMusicTimeMs }) => {

  const pageLimit = 8;
  const pageStartIndex = getPage * pageLimit;
  const pageEndIndex = pageStartIndex + pageLimit;
  const pageNow = useMemo(() => 
    getsongs.slice(pageStartIndex, pageEndIndex),
    [getsongs, pageStartIndex, pageEndIndex],
  );

  const VRangle = useVRStore((state) => state.angleR);
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
    <group position={[0, 0, -1.5]}>
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
            getChose={getChose}
            setStatus={setStatus}
            setStop={setStop}
            setNoteCSVData={setNoteCSVData}
            setMusicTimeMs={setMusicTimeMs}
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
        position={[-5.0, 0, 0]}
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
        position={[5.0, 0, 0]}
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
    const localSrc = getTouch?.mp3 || '';

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
        const secondLineLand = rows[1];
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
            noteSpeed: 0.05,
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
        setGameStarPosition(secondLineLand); // 把第二行的資料存進 State
        
      }catch(error) {

        console.error("CSV load fails：", error);

      }
    }

    loadCsv();

  }, [getChose]); 
};

export const ShowChoseSong = ({ getChose , setStatus}) => {
  const [getTime, setTime] = useState(5); 
  const albumTexture = useTexture(getChose?.img ? `${imageProxyURL}?url=${encodeURIComponent(getChose.img)}` : undefined);

  

  useEffect(() => {
    let interval = null;
    
    if (getTime > 0) {
      interval = setInterval(() => {
        setTime((millisSeconds) => millisSeconds - 1);
      }, 1000);
    } else if (getTime === 0) {
      setStatus(2);
    }

    return () => clearInterval(interval);
  }, [getTime, setStatus]);

  return (
    <group position={[0, 0, -2]}>
  
      <mesh position={[0, 0, -0.2]}>
        <circleGeometry args={[2.9, 64]} />
        <meshStandardMaterial color="#47484a" emissive="#47484a" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[2.4, 64]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>

      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[1.55, 64]} />
        <meshBasicMaterial map={albumTexture || null} color={albumTexture ? '#ffffff' : '#262626'} />
      </mesh>

      <ShowGameSongText shouldRotate={false} whichGet={257} offset={0} r={-3.2} a={0.1} offset2={Math.PI} textSize={0.6}/>

    </group>
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
        <meshStandardMaterial color="rgb(255, 255, 255)" transparent={true} />
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

export const GameMusicComponent = ({ getChose, setMusicTimeMs, onTimeUpdate, setStatus , getStop , setStop , getStatus}) => {
  const musicChose = useRef(null);
  console.log(getStatus);
  useEffect(() => {
    if (!musicChose.current || !getChose?.mp3 ) return;
    if (getStatus == 2 || getStatus == 2.5) return;

    musicChose.current.pause();
    musicChose.current.currentTime = 0;
  }, [getChose?.mp3, getStatus]);

  useEffect(() => {
    if (!musicChose.current || !getChose?.mp3) return;

      musicChose.current.pause();

    if (getStop) {
      musicChose.current.pause();
    } else  {
      musicChose.current.play().catch(() => {
        console.warn('Audio autoplay blocked; user interaction is required to start playback.');
      });
    }
  }, [getChose?.mp3, getStop, getStatus]);

  useEffect(() => {
    if (!musicChose.current) return;

    let rafId;

    const tick = () => {
      if (musicChose.current && !musicChose.current.paused) {
        const nowSeconds = musicChose.current.currentTime;
        const nowMs = Math.floor(nowSeconds * 1000);

        if (typeof onTimeUpdate === 'function') {
          onTimeUpdate(nowSeconds);
        } else {
          setMusicTimeMs(nowMs);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [onTimeUpdate, setMusicTimeMs]);


  if (!getChose?.mp3) return null;

  const localSrc = getChose?.mp3 || undefined;

  return (
    <>
      <audio 
        style={{ top: '50px', position: 'relative' }}
        ref={musicChose}
        src={localSrc}
        autoPlay
        onCanPlay={() => {
          if (!getStop) {
            musicChose.current?.play().catch(() => {});
          }
        }}
        onPlay={() => setStop(false)}
        onPause={() => setStop(true)}
        onEnded={() => setStatus(3)}
      />
    </>
  );
}

export const GameStar = ({ getGameStarPosition }) => {

  const land = getGameStarPosition.land;

  console.log(getGameStarPosition);

  const groupRef = useRef(null);
  const angle = land * (Math.PI / 8) + Math.PI / 16;
  const radius = gameAreaRingRadiusIn + 0.1;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 計時變數
    groupRef.current.userData.anima = (groupRef.current.userData.anima || 0) + delta * 1;
    if (groupRef.current.userData.anima > 1) groupRef.current.userData.anima = 0;

    const progress = groupRef.current.userData.anima; // 0 ~ 1

    const s = 1 + progress * 0.5;
    groupRef.current.translateZ(s);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, angle]}>
      <mesh>
        <ringGeometry args={[radius, radius+0.2, 32]} />
        <meshStandardMaterial
          color="rgb(255, 236, 33)"
          emissive="rgb(255, 236, 33)"
          emissiveIntensity={3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export const PlayerMark = ({ getUseMouse , mouseXR}) => {
  const arcLong = (Math.PI / 16) + 0.5
  const halfArcLong = arcLong/2

  const angleVR = useVRStore((state) => state.angleR);
  const angle = getUseMouse ? angleVR : mouseXR; // 如果 getUseMouse 為 true，使用 VR 的角度，否則使用 0
  return (
    <mesh rotation={[0, 0, angle]} position={[0, 0, 0]}>
      <ringGeometry args={[playerMarkIn, playerMarkOut, 32, 1, -halfArcLong, arcLong ]} />
      <meshStandardMaterial color={"rgb(255, 236, 33)"} emissive={"rgb(255, 236, 33)"} emissiveIntensity={3} side={2} />
    </mesh>
  );
};

export const PuaseButtom = ({ getStop, setStop }) => {
  return (
    <group position={[0, 0, 0.01]}>
      <Text
        position={[0, 0, 0]}
        fontSize={0.32}
        color="white"
        anchorX="center"
        anchorY="middle"
        onPointerDown={() => setStop(prev => !prev)}
      >
        {getStop ? 'Resume' : 'Pause'}
      </Text>
    </group>
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

  const chars = judgeText.split("");
  const angleStep = 0.1; 

  return (
    <group>
      {chars.map((char, i) => {
        const reversedIndex = chars.length - 1 - i;
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
  const angleStep = 0.1; 

  return (
    <group rotation={[0, 0, Math.PI]}>
      {chars.map((char, i) => {
        const reversedIndex = chars.length - 1 - i;
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
  
export const BackImg = ({ getChose }) => {
  const proxyImageUrl = useTexture(getChose?.img ? `${imageProxyURL}?url=${encodeURIComponent(getChose.img)}` : undefined);
  
  // 旋轉
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.5; 
    }
  });


  return (
      <mesh ref={meshRef} position={[0, 0, -0.1]}> 
        <circleGeometry args={[gameAreaRingRadiusOut, 32]} /> 
        <meshBasicMaterial
          map={proxyImageUrl || null}
          color={proxyImageUrl ? '#272727' : '#111111'} 
        />
      </mesh>
    );
}


//==========================================================================================
//分數結算3 =================================================================================
//==========================================================================================


export const ShowChoseSongScoresImg = ({ getChose }) => {
  const texture = useTexture(getChose?.img ? `${imageProxyURL}?url=${encodeURIComponent(getChose.img)}` : undefined);

  return (
    <group position={[0, 1.8, 0.1]}>
      <mesh>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial map={texture || null} color={texture ? '#ffffff' : '#262626'} />
      </mesh>
    </group>
  );
}


export const ShowGameSongText = ({ shouldRotate, whichGet, offset , r, a , offset2 , textSize}) => {

  const groupRef = useRef(null);

  const characters = Array.from(String(whichGet ?? ''));
  const isChinese = /[\u4e00-\u9fa5]/.test(whichGet);
  const angleStep = isChinese ? a + 0.1 : a;


  useFrame((state, delta) => {
    if (shouldRotate && groupRef.current) {
      groupRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    // 3. 綁定 groupRef 到 DOM/Three 節點
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, offset2 || 0]}>
      {characters.map((char, i) => {
        // 使用傳入的靜態 offset 排列文字弧度
        const baseAngle = (i - (characters.length - 1) / 2) * angleStep;
        const angle = baseAngle + offset;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        return (
          <Text
            key={`${char}-${i}`}
            position={[x, y, 0.01]}
            rotation={[0, 0, angle + Math.PI / 2]}
            fontSize={textSize}
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


//==========================================================================================
// VR角度取得================================================================================
//==========================================================================================
export const VRTracker = () => {
  const setAngles = useVRStore((state) => state.setAngles);
  
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();

  useFrame((state) => {
    state.camera.getWorldQuaternion(quaternion);
    rotation.setFromQuaternion(quaternion);

    const angleZR = rotation.z;
    const angleZLimR = ((angleZR + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    // 直接更新 Zustand store
    setAngles(angleZLimR);
  });

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
    if (event.key === 'a') {
      setStatus(0);
    } else if (event.key === 's') {
      setStatus(1);
    } else if (event.key === 'd') {
      setStatus(2);
    } else if (event.key === 'f') {
      setStatus(3);
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
      <Button type="primary" onClick={showDrawer}>
        Fix Pabe
      </Button>
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









