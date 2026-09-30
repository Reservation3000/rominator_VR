import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from '@react-three/xr';
import { useState , useRef , useMemo } from "react";
import { OrbitControls , Environment } from '@react-three/drei'; 
import "./App.css";

import * as Notes from './notes.jsx';

import {
  LoadData,
  Box , 
  Roundabout,
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  RotatingStars,
  BackImg,
  MenuPageSwitchBottom,
  ProcessChoseCSVData,
  GameMusicLogic,
  PlayerMark,
  PuaseButtom,
  ShowStop,
  JudgeTextComponent,
  CommboTextComponent,
  ShowChoseSongData,
  ShoeGameSongText,
  ShowChoseSongScoresImg,
  StatusControl,
  VRTracker,
  SideBar,
  GameStar ,
  ShoeGameSongBox
} from "./component.jsx";


import HDRI from "./assets/baseHDR.exr?url";  //背景

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
  const [getRotateCanva , setRotateCanva] = useState(true); //是否將畫布貼到地面
  const gameAudioRef = useRef(null);


  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩、2.5暫停
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const [getStop, setStop] = useState(true);       // 遊戲暫停按鈕(false撥放)
  const [getGameStarPosition, setGameStarPosition] = useState(0); // 遊戲開始位置

  const [getOffset, setOffset] = useState(0);       // 滑桿 => 譜面偏移量
  const [getSpeed, setSpeed] = useState(0.05);      // 滑桿 => 譜面速度_每經過 1Frame，音符應該移動多少距離（單位_距離 / 影格）



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
              camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 12], rotation: [45, 0, 0]}}>

        <XR store={xrStore}>

          <OrbitControls enableDamping={true} dampingFactor={0.1} />
          <StatusControl setStatus={setStatus} />
          <VRTracker  />
          <Environment files={HDRI} background />
          <RotatingStars />
          <ambientLight intensity={3} color="white" />
          <GameMusicLogic gameAudioRef={gameAudioRef} getChose={getChose} setStop={setStop} getStop={getStop} getStatus={getStatus} setStatus={setStatus} />
          <group className="canva" position={[0, -1.3, 0]} rotation={[rotateCanvaX, 0, 0]}>
            <PlayerMark />
            {(getStatus === 0) && (
              <group>
                <Roundabout />
                <MenuComponent
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
                <ProcessChoseCSVData getChose={getChose} setNoteCSVData={setNoteCSVData} setGameStarPosition={setGameStarPosition} getOffset={getOffset} getSpeed={getSpeed} />
                <ShowChoseSong getChose={getChose} setStatus={setStatus} />
                <ShowChoseSongData getChose={getChose} />
              </group>
            )}


            {(getStatus === 2) && (
              <group key="game-start-scene">
                  <BackImg radius={3.93} getChose={getChose} />
                  <Box/>
                  <GameStar getGameStarPosition={getGameStarPosition} setStop={setStop} setStatus={setStatus}/>
            </group>
            )}

            {(getStop == true && getStatus === 3) && (
              <ShowStop setStatus={setStatus} setStop={setStop}  getChose={getChose} getStatus={getStatus}/>
            )}

            {(getStatus === 3) && (
              <group key="gameplay-scene">
                  <ambientLight intensity={2} />
                  <BackImg radius={3.93} getChose={getChose} />
                  
                  <Notes.LogicOfNotes  onlyNotes={onlyNotes}   />
                  <Notes.LogicOfDarg  onlyDrag={onlyDrag}  />
                  <Notes.LogicOfRotate   onlyRotate={onlyRotate}  />

                  <Box  />
                  <JudgeTextComponent />
                  <CommboTextComponent />
                  <PuaseButtom getStop={getStop} setStop={setStop} />
            </group>
          )}

            {(getStatus === 4) && (
              <group key="result-scene">
                <Roundabout />
                <ShoeGameSongBox getStatus={getStatus} />
                <Box />
                <ShoeGameSongText getChose={getChose} />
                <ShowChoseSongScoresImg setStatus={setStatus} getChose={getChose} />
              </group>
            )}
          </group> 
          
        </XR>
      </Canvas>

      {/* 音樂撥放(HTML 元件) */}
      <MenuMusicComponent getTouch={getTouch} getStatus={getStatus} />


      { /* fix ===================================================================================================================================================*/}
      <div className="sideBarLayer">
        <SideBar setRotateCanva={setRotateCanva} setOffset={setOffset} getOffset={getOffset} getSpeed={getSpeed} setSpeed={setSpeed} />
      </div>

    </>
  );
}





export default App;
