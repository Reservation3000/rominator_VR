import { Canvas , useFrame } from "@react-three/fiber";
import { XR, createXRStore , XRButton} from '@react-three/xr';
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
  ShowChoseSongScoresBack,
  ShowGameSongText,
  ShowChoseSongScoresImg,
  StatusControl,
  VRTracker,
  SideBar
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

const xrStore = createXRStore();

//===============================
//  App 
//===============================

function App() {

  {/*fix*/}
  const [getUseMouse, setUseMouse] = useState(false); // 是否使用滑鼠控制旋轉


  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩、2.5暫停
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const [getMusicTimeMs, setMusicTimeMs] = useState(0);    //現在的樂曲進行時間
  const [getStop, setStop] = useState(true);       // 遊戲是否暫停

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
  

  // 讀取伺服器，抓歌曲資料，並存入 getsongs============================
  // useEffect(() => {
  //   fetch(serverURL)
  //     .then(res => res.json())
  //     .then(data =>{
  //       console.log(data);
  //       setSongs(data);
  //       })
  //     .catch(err => console.log(err));
  // },[])


  // 讀取本地歌曲資料，並存入歌曲狀態===================================
  useEffect(() => {
    fetch('/VRsongData.json')
      .then((res) => res.json())
      .then((data) => {
        setSongs(data);
      })
      .catch((err) => console.error('讀取 JSON 失敗:', err));
  }, []);

   
  const mouseXR = MouseTrackerR();
  const mouseXD = MouseTrackerD();

  const hitPresent = Math.round(((getPerfect + getGood) / getTotalCombo) * 100) ;
  

  //===============================================================
  // return =======================================================
  //===============================================================
  return (
    <>
    <XRButton store={xrStore} mode="immersive-vr" />

    <SideBar setUseMouse={setUseMouse}/>

    <Canvas  gl={{ toneMappingExposure: 1 }}>
      <XR store={xrStore}>
        <StatusControl setStatus={setStatus} />
        <VRTracker  setAngleD={setAngleD} setAngleR={setAngleR}/>

        <Html position={[0, -1, 0]} transform rotation={[-Math.PI / 2, 0, 0]}>
          {(getStatus === 0) && (
            <>
              <div className="MenuContainer">
                <MenuMusicComponent getTouch={getTouch} getChose={getChose} />  {/* 選歌表單中，觸碰撥放音樂的邏輯 */}
                <MenuComponent  mouseXD={mouseXD}
                                getsongs={getsongs} 
                                setTouch ={setTouch} 
                                setChose={setChose} 
                                setStatus={setStatus} 
                                setPage={setPage} 
                                getPage={getPage} 
                                pageTotal={pageTotal}/> 
                {/* 選歌表單中，取得所有音樂、觸碰卡片、選擇卡片的邏輯 */}
                <MenuPageSwitchBottom setPage={setPage} getPage={getPage} pageTotal={pageTotal}/>
                <Roundabout/>
              </div>
            </>
        )}

          {(getStatus === 1) && (
            <>
              <ShowChoseSong getChose={getChose} setStatus={setStatus} />
            </>
          )}

          {(getStatus === 3) && (
            <>
              {/*環*/}
              <Roundabout/>
              {/* 背景 */}
              <ShowChoseSongScoresBack getChose={getChose}/>

              <div className="ShowGameSongContainer">
                {/* 分數 */}
                <ShowGameSongText whichGet={getPerfect} offset={-0.7} r={30} a={0.14}/>
                <ShowGameSongText whichGet={getGood} offset={0.1} r={30} a={0.14}/>
                <ShowGameSongText whichGet={getMiss} offset={0.9} r={30} a={0.14}/>
                <ShowGameSongText whichGet={getCommbo} offset={2.4} r={30} a={0.14}/>
                <ShowGameSongText whichGet={hitPresent} offset={3.6} r={30} a={0.14}/>

                {/* 分數標題 */}
                <ShowGameSongText whichGet={"PREFECT"} offset={-0.7} r={35} a={0.1}/>
                <ShowGameSongText whichGet={"GOOD"} offset={0.1} r={35} a={0.1}/>
                <ShowGameSongText whichGet={"MISS"} offset={0.9} r={35} a={0.1}/>
                <ShowGameSongText whichGet={"MAXCOMMBO"} offset={2.4} r={35} a={0.1}/>
                <ShowGameSongText whichGet={"HIT%"} offset={3.6} r={35} a={0.1}/>

                {/* 曲名 */}
                <ShowGameSongText className={"ShowGameSongTextName"} whichGet={getChose.name} offset={0} r={24} a={0.1}/>
                <ShowGameSongText className={"ShowGameSongTextName"} whichGet={getChose.name} offset={Math.PI} r={24} a={0.1}/>
              
                {/* 圖片 */}
                <ShowChoseSongScoresImg getChose={getChose}/>
              </div>
            </>
          )}
        </Html>

        

          {(getStatus === 2 ) && (
            <>
            <ProcessChoseCSVData  getChose={getChose} setNoteCSVData={setNoteCSVData}/>
            
            <group className = "canva" position={[0,0,0]} rotation={[-Math.PI / 2, 0, 0]}> 
                  < OrbitControls/>
                  <ambientLight intensity={2} />

                  <BackImg radius={3.93} getChose={getChose}/>
                  <LogicOfNotes getMusicTimeMs={getMusicTimeMs} 
                                onlyNotes={onlyNotes}
                                setPerfect={setPerfect} 
                                setGood={setGood} 
                                setMiss={setMiss} 
                                setCommbo={setCommbo}
                                setTotalCombo={setTotalCombo}
                                getCommbo={getCommbo}
                                setJudgeStatus={setJudgeStatus}
                                getUseMouse={getUseMouse}
                  />
                  <LogicOfDarg  getMusicTimeMs={getMusicTimeMs} 
                                onlyDrag={onlyDrag}
                                setPerfect={setPerfect}
                                setGood={setGood}
                                setMiss={setMiss}
                                setCommbo={setCommbo}
                                setTotalCombo={setTotalCombo}
                                setJudgeStatus={setJudgeStatus}
                                getUseMouse={getUseMouse}
                  />
                  <LogicOfRotate  getMusicTimeMs={getMusicTimeMs} 
                                  onlyRotate={onlyRotate}
                                  setPerfect ={setPerfect}
                                  setGood={setGood}
                                  setMiss={setMiss}
                                  setCommbo={setCommbo}
                                  setTotalCombo={setTotalCombo}
                                  setJudgeStatus={setJudgeStatus}
                                  getUseMouse={getUseMouse}
                  />
                  <PlayerMark getUseMouse={getUseMouse} />
                  <Box key={`box-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo}/>
                  <JudgeTextComponent key={`judge-${getTotalCombo}`} getJudgeStatus={getJudgeStatus} getTotalCombo={getTotalCombo}/>
                  <CommboTextComponent key={`combo-${getTotalCombo}`} getCommbo={getCommbo} getTotalCombo={getTotalCombo}/>

                  {/* react-three/postprocessing 特效處理 */}
                  <EffectComposer>
                    <Bloom 
                      intensity={1.5}          // 輝光的整體強度
                      luminanceThreshold={0.2} // 設定為 1 代表只有特別指定 toneMapped={false} 且數值超標的材質會發光
                      luminanceSmoothing={0.9} // 輝光邊緣的滑順度
                      radius={0.1}             // 輝光擴散的範圍大小
                    />
                  </EffectComposer>
              </group>
              <Html>
                <GameMusicComponent getChose={getChose} setMusicTimeMs={setMusicTimeMs} setStatus={setStatus} getStop={getStop} setStop={setStop}/>
                <PuaseButtom getStop={getStop} setStop={setStop} />
              </Html>
            </>
          )}
        </XR>
      </Canvas>
    </>
  );
}



export default App;