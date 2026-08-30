import { Canvas , useFrame } from "@react-three/fiber";
import { XR, createXRStore } from '@react-three/xr';
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef , useState , useEffect} from "react";
import { OrbitControls } from '@react-three/drei'; 
import { Html } from '@react-three/drei';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import "./App.css";

import {
  Box , 
  Roundabout,
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  BackImg,
  MenuPageSwitchBottom,
  ProcessChoseCSVData,
  GameMusicComponent,
  PlayerMark,
  PuaseButtom,
  JudgeTextComponent,
  CommboTextComponent,
  ShowGameSongText,
  ShowChoseSongScoresImg,
  StatusControl,
  VRTracker,
  SideBar,
  GameStar 
} from "./component.jsx";

import { 
  MouseTrackerR,
  MouseTrackerD,
} from "./Js.js"


import { 
  LogicOfNotes,
  LogicOfRotate,
  LogicOfDarg
} from "./notesComponent"

// import { 
//   serverURL 
//  } from "./constants.js";

const xrStore = createXRStore({
  originReferenceSpace: 'local-floor', // 讓系統以地面為基準計算高度
  handTracking: true, // 確保啟用手部追蹤
  hand: true,        // 啟用手部模型與捏合手勢射線
  controller: true,  // 啟用控制器
});

//===============================
//  App 
//===============================

function App() {

  {/*fix*/}
  const [getUseMouse, setUseMouse] = useState(false); // 是否使用滑鼠控制旋轉
  const [getRotateCanva , setRotateCanva] = useState(false); //是否將畫布貼到地面


  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩、2.5暫停
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const [getMusicTimeMs, setMusicTimeMs] = useState(0);    //現在的樂曲進行時間
  const [getStop, setStop] = useState(true);       // 遊戲是否暫停
  const [getGameStarPosition, setGameStarPosition] = useState(0); // 遊戲開始位置

  const [getCommbo, setCommbo] = useState(0);
  const [getPerfect, setPerfect] = useState(0);
  const [getGood, setGood] = useState(0);
  const [getMiss, setMiss] = useState(0);
  const [getJudgeStatus, setJudgeStatus] = useState(null); //判定狀態
  const [getTotalCombo, setTotalCombo] = useState(0); //總共連擊數

  const [angleD, setAngleD] = useState(0); //旋轉角度
  const [angleR, setAngleR] = useState(0); //旋轉弧度


  const getOnTimeUpdate = (timeInSeconds) => {
    setMusicTimeMs(Math.floor(timeInSeconds * 1000));
  };

  const songTotal = getsongs.length;       // 有幾首歌
  const pageLimit = 8;                     // 單頁只能出現 8 首歌
  const pageTotal = Math.ceil(songTotal / pageLimit); // 共有幾頁
  const onlyNotes = getNoteCSVData.filter((note) => note.type === 'note'); //只有note類型音符
  const onlyRotate = getNoteCSVData.filter((note) => note.type === 'rotate');
  const onlyDrag = getNoteCSVData.filter((note) => note.type === 'drag');
  

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
  }, []);

   
  const mouseXR = MouseTrackerR();
  const mouseXD = MouseTrackerD();

  const hitPresent = Math.round(((getPerfect + getGood) / getTotalCombo) * 100) ;
  
  const rotateCanvaX = getRotateCanva ? -Math.PI / 2 : 0;
  //===============================================================
  // return =======================================================
  //===============================================================
  return (
    <>
      <MenuMusicComponent getTouch={getTouch} getChose={getChose} getStatus={getStatus} />
      <GameMusicComponent
        getChose={getChose}
        setMusicTimeMs={setMusicTimeMs}
        onTimeUpdate={getOnTimeUpdate}
        setStatus={setStatus}
        getStop={getStop}
        setStop={setStop}
        getStatus={getStatus}
      />

      <Canvas gl={{ toneMappingExposure: 1 }}>
        <XR store={xrStore}>
          <OrbitControls />
          <StatusControl setStatus={setStatus} />
          <VRTracker setAngleD={setAngleD} setAngleR={setAngleR} />
          <group className="canva" position={[0, 0, 0]} rotation={[rotateCanvaX, 0, 0]}>
            {(getStatus === 0) && (
              <>
                <Roundabout />
                <MenuComponent
                  mouseXD={mouseXD}
                  getUseMouse={getUseMouse}
                  getsongs={getsongs}
                  setTouch={setTouch}
                  getTouch={getTouch}
                  getChose={getChose}
                  setChose={setChose}
                  setStatus={setStatus}
                  setStop={setStop}
                  setPage={setPage}
                  getPage={getPage}
                  pageTotal={pageTotal}
                  setNoteCSVData={setNoteCSVData}
                  setMusicTimeMs={setMusicTimeMs}
                />
                <MenuPageSwitchBottom setPage={setPage} getPage={getPage} pageTotal={pageTotal} />
              </>
            )}

            {(getStatus === 1) && (
              <ShowChoseSong getChose={getChose} setStatus={setStatus} />
            )}

            {(getStatus === 3) && (
              <>
                <Roundabout />
                <Box key={`box-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />

                <ShowGameSongText shouldRotate={false} whichGet={getPerfect} offset={-0.7} r={2.6} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={getGood} offset={0.1} r={2.6} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={getMiss} offset={0.9} r={2.6} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={getCommbo} offset={3.7} r={2.6} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={hitPresent} offset={2.6} r={2.6} a={0.1} offset2={0} textSize={0.32}/>

                <ShowGameSongText shouldRotate={false} whichGet={'PREFECT'} offset={-0.7} r={3.2} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={'GOOD'} offset={0.1} r={3.2} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={'MISS'} offset={0.9} r={3.2} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={'MAXCOMMBO'} offset={3.7} r={3.2} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={false} whichGet={'HIT%'} offset={2.6} r={3.2} a={0.1} offset2={0} textSize={0.32}/>

                <ShowGameSongText shouldRotate={true} whichGet={getChose.name} offset={0} r={1.6} a={0.1} offset2={0} textSize={0.32}/>
                <ShowGameSongText shouldRotate={true} whichGet={getChose.name} offset={0} r={1.6} a={0.1} offset2={Math.PI} textSize={0.32}/>

                <ShowChoseSongScoresImg getChose={getChose} />
              </>
            )}

            {(getStatus === 2) && (
              <group>
                <ProcessChoseCSVData getChose={getChose} setNoteCSVData={setNoteCSVData} setGameStarPosition={setGameStarPosition} />
                  <ambientLight intensity={2} />
                  <BackImg radius={3.93} getChose={getChose} />
                  <LogicOfNotes
                    getMusicTimeMs={getMusicTimeMs}
                    onlyNotes={onlyNotes}
                    setPerfect={setPerfect}
                    setGood={setGood}
                    setMiss={setMiss}
                    setCommbo={setCommbo}
                    setTotalCombo={setTotalCombo}
                    getCommbo={getCommbo}
                    setJudgeStatus={setJudgeStatus}
                    getUseMouse={getUseMouse}
                    mouseXR={mouseXR}
                  />
                  <LogicOfDarg
                    getMusicTimeMs={getMusicTimeMs}
                    onlyDrag={onlyDrag}
                    setPerfect={setPerfect}
                    setGood={setGood}
                    setMiss={setMiss}
                    setCommbo={setCommbo}
                    setTotalCombo={setTotalCombo}
                    setJudgeStatus={setJudgeStatus}
                    getUseMouse={getUseMouse}
                    mouseXR={mouseXR}
                  />
                  <LogicOfRotate
                    getMusicTimeMs={getMusicTimeMs}
                    onlyRotate={onlyRotate}
                    setPerfect={setPerfect}
                    setGood={setGood}
                    setMiss={setMiss}
                    setCommbo={setCommbo}
                    setTotalCombo={setTotalCombo}
                    setJudgeStatus={setJudgeStatus}
                    getUseMouse={getUseMouse}
                    mouseXR={mouseXR}
                  />
                  <PlayerMark getUseMouse={getUseMouse} mouseXR={mouseXR} />
                  <Box key={`box-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                  <JudgeTextComponent key={`judge-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                  <CommboTextComponent key={`combo-${getTotalCombo}`} getCommbo={getCommbo} getTotalCombo={getTotalCombo} />
                  <GameStar getGameStarPosition={getGameStarPosition} />
                  {/* <EffectComposer>
                    <Bloom
                      intensity={1.5}
                      luminanceThreshold={0.2}
                      luminanceSmoothing={0.9}
                      radius={0.1}
                    />
                  </EffectComposer> */}
                  <PuaseButtom getStop={getStop} setStop={setStop} />
            </group>
          )}
          </group> 
        </XR>
      </Canvas>

      <div className="sideBarLayer">
        <SideBar setUseMouse={setUseMouse} setRotateCanva={setRotateCanva}/>
      </div>
    </>
  );
}



export default App;