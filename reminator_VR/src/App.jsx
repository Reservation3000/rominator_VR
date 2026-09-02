import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from '@react-three/xr';
import { useState , useRef , useMemo } from "react";
import { OrbitControls , Environment } from '@react-three/drei'; 
import "./App.css";

import {
  LoadData,
  Box , 
  Roundabout,
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  BackImg,
  MenuPageSwitchBottom,
  ProcessChoseCSVData,
  GameMusicLogic,
  GameMusicPlay,
  PlayerMark,
  PuaseButtom,
  JudgeTextComponent,
  CommboTextComponent,
  ShowChoseSongData,
  ShoeGameSongText,
  ShowChoseSongScoresImg,
  StatusControl,
  VRTracker,
  MouseRXTracker,
  SideBar,
  GameStar ,
  ShoeGameSongBox
} from "./component.jsx";


import { LogicOfNotes , LogicOfRotate , LogicOfDarg } from "./notesComponent"

import { useMusicTimeStore } from "./store.js";

import { 
  HDRIProxyURL,
 } from "./constants.js";

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
  const gameAudioRef = useRef(null);


  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩、2.5暫停
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const musicTimeMs = useMusicTimeStore.getState().musicTimeMs;
  const [getStop, setStop] = useState(true);       // 遊戲暫停按鈕(false撥放)
  const [getGameStarPosition, setGameStarPosition] = useState(0); // 遊戲開始位置

  const [getCommbo, setCommbo] = useState(0);
  const [getJudgeStatus, setJudgeStatus] = useState(null); //判定狀態
  const [getTotalCombo, setTotalCombo] = useState(0); //總共連擊數



  const songTotal = getsongs.length;       // 有幾首歌
  const pageLimit = 8;                     // 單頁只能出現 8 首歌
  const pageTotal = Math.ceil(songTotal / pageLimit); // 共有幾頁
  const onlyNotes = useMemo(() => getNoteCSVData.filter((note) => note.type === 'note'), [getNoteCSVData]);
  const onlyRotate = useMemo(() => getNoteCSVData.filter((note) => note.type === 'rotate'), [getNoteCSVData]);
  const onlyDrag = useMemo(() => getNoteCSVData.filter((note) => note.type === 'drag'), [getNoteCSVData]);

  const rotateCanvaX = getRotateCanva ? -Math.PI / 2 : 0;
  //===============================================================
  // return =======================================================
  //===============================================================
  return (
    <>
      <LoadData setSongs={setSongs} />

      <Canvas gl={{ toneMappingExposure: 1 }} 
              camera={{ fov: 50, near: 0.1, far: 20, position: [0, 0, 0]}}>

        <XR store={xrStore}>

          <OrbitControls />
          <StatusControl setStatus={setStatus} />
          <VRTracker  />
          <MouseRXTracker  />
          <Environment files={HDRIProxyURL} background />
          <ambientLight intensity={3} color="white" />

          <group className="canva" position={[0, 0, 0]} rotation={[rotateCanvaX, 0, 0]}>
            {(getStatus === 0) && (
              <group>
                <Roundabout />
                <MenuComponent
                  getUseMouse={getUseMouse}
                  getsongs={getsongs}
                  setTouch={setTouch}
                  getTouch={getTouch}
                  setChose={setChose}
                  setStatus={setStatus}
                  getStatus={getStatus}
                  setStop={setStop}
                  setPage={setPage}
                  getPage={getPage}
                  pageTotal={pageTotal}
                  setNoteCSVData={setNoteCSVData}
                />
                <MenuPageSwitchBottom setPage={setPage} getPage={getPage} pageTotal={pageTotal} />
              </group>
            )}

            {(getStatus === 1) && (
              <group>
                <ProcessChoseCSVData getChose={getChose} setNoteCSVData={setNoteCSVData} setGameStarPosition={setGameStarPosition} />
                <ShowChoseSong getChose={getChose} setStatus={setStatus} />
                <ShowChoseSongData getChose={getChose} />
              </group>
            )}

            {(getStatus === 2 || getStatus === 3) && (
            <PlayerMark getUseMouse={getUseMouse} />
          )}

            {(getStatus === 2) && (
              <group>
                  <BackImg radius={3.93} getChose={getChose} />
                  <Box getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                  <GameStar getGameStarPosition={getGameStarPosition} getUseMouse={getUseMouse} setStop={setStop} setStatus={setStatus}/>
            </group>
            )}

            {(getStatus === 3) && (
              <group>
                  <ambientLight intensity={2} />
                  <BackImg radius={3.93} getChose={getChose} />
                  <LogicOfNotes musicTimeMs={musicTimeMs}
                                onlyNotes={onlyNotes}
                                setCommbo={setCommbo} setTotalCombo={setTotalCombo}
                                setJudgeStatus={setJudgeStatus}
                                getUseMouse={getUseMouse}
                  />
                  <LogicOfDarg  musicTimeMs={musicTimeMs}
                                onlyDrag={onlyDrag}
                                setCommbo={setCommbo} setTotalCombo={setTotalCombo}
                                setJudgeStatus={setJudgeStatus}
                                getUseMouse={getUseMouse}
                  />
                  <LogicOfRotate  musicTimeMs={musicTimeMs}
                                  onlyRotate={onlyRotate}
                                  setCommbo={setCommbo} setTotalCombo={setTotalCombo}
                                  setJudgeStatus={setJudgeStatus}
                                  getUseMouse={getUseMouse}
                  />
                  <PlayerMark getUseMouse={getUseMouse} />
                  <Box  getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                  <JudgeTextComponent key={`judge-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                  <CommboTextComponent key={`combo-${getTotalCombo}`} getCommbo={getCommbo} getTotalCombo={getTotalCombo} />
                  <PuaseButtom getStop={getStop} setStop={setStop} />
                  <GameMusicLogic gameAudioRef={gameAudioRef} getChose={getChose} getStop={getStop} getStatus={getStatus} />
            </group>
          )}

            {(getStatus === 4) && (
              <>
                <Roundabout />
                <ShoeGameSongBox getStatus={getStatus} />
                <Box key={`box-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo} />
                <ShoeGameSongText getCommbo={getCommbo} getChose={getChose} />
                <ShowChoseSongScoresImg setStatus={setStatus} getChose={getChose} />
              </>
            )}
          </group> 
          
        </XR>
      </Canvas>

      {/* 音樂撥放(HTML 元件) */}
      <MenuMusicComponent getTouch={getTouch} getStatus={getStatus} />
      <GameMusicPlay audioRef={gameAudioRef} audioSrc={getChose?.mp3} getStop={getStop} setStatus={setStatus} getStatus={getStatus} setStop={setStop} />


      { /* fix ===================================================================================================================================================*/}
      <div className="sideBarLayer">
        <SideBar setUseMouse={setUseMouse} setRotateCanva={setRotateCanva}/>
      </div>

    </>
  );
}





export default App;