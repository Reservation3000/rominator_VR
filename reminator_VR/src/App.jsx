import { Canvas , useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef , useState , useEffect} from "react";
import { OrbitControls } from '@react-three/drei'; 
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import "./App.css";

import {
  CameraControler,
  Box , 
  Roundabout,
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  MenuPageSwitchBottom,
  ProcessChoseCSVData,
  GameMusicComponent,
  PlayerMark,
  PuaseButtom,
  JudgeTextComponent,
  CommboTextComponent 
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

import { 
  serverURL 
 } from "./constants.js";



//===============================
//  App 
//===============================

function App() {

  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩、2.5暫停
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const [getMusicTimeMs, setMusicTimeMs] = useState(0);    //現在的樂曲進行時間

  const [getCommbo, setCommbo] = useState(0);
  const [getPrefect, setPrefect] = useState(0);
  const [getGood, setGood] = useState(0);
  const [getMiss, setMiss] = useState(0);
  const [getJudgeStatus, setJudgeStatus] = useState(null); //判定狀態


  const getOnTimeUpdate = (timeInSeconds) => {
    setMusicTimeMs(Math.floor(timeInSeconds * 1000));
  };

  const songTotal = getsongs.length;       // 有幾首歌
  const pageLimit = 8;                     // 單頁只能出現 8 首歌
  const pageTotal = Math.ceil(songTotal / pageLimit); // 共有幾頁
  const onlyNotes = getNoteCSVData.filter((note) => note.type === 'note'); //只有note類型音符
  const onlyRotate = getNoteCSVData.filter((note) => note.type === 'rotate');
  const onlyDrag = getNoteCSVData.filter((note) => note.type === 'drag');
  

  useEffect(() => {
    fetch(serverURL)
      .then(res => res.json())
      .then(data =>{
        console.log(data);
        setSongs(data);
        })
      .catch(err => console.log(err));
  },[])

  const mouseXR = MouseTrackerR();
  const mouseXD = MouseTrackerD();
  

  //===============================================================
  // return =======================================================
  //===============================================================
  return (
    <>

      {(getStatus === 0) && (
        <>
          <div className="MenuContainer">
            <MenuMusicComponent getTouch={getTouch} getChose={getChose} />  {/* 選歌表單中，觸碰撥放音樂的邏輯 */}
            <MenuComponent  getsongs={getsongs} 
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

      {(getStatus === 2 || getStatus === 2.5) && (
        <>
        
        {/*把getChose的樂曲資料，抓csv資料並做分類處裡，並丟進setNoteData */}
        <ProcessChoseCSVData  getChose={getChose} setNoteCSVData={setNoteCSVData}/>
        <PuaseButtom setStatus={setStatus}/>
        
         <main className = "canva">
            <Canvas gl={{ toneMappingExposure: 1 }}>
              {/* <directionalLight position={[0, 0, 2]} /> */}
              <CameraControler mouseXR={mouseXR}/>

              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['#ff3653', '#009b00', '#0070ff']} labelColor="white" />
              </GizmoHelper>
              < OrbitControls/>
              <ambientLight intensity={2} />

              <LogicOfNotes getMusicTimeMs={getMusicTimeMs} 
                            onlyNotes={onlyNotes}
                            setPrefect={setPrefect} 
                            setGood={setGood} 
                            setMiss={setMiss} 
                            setCommbo={setCommbo}
                            getCommbo={getCommbo}
                            setJudgeStatus={setJudgeStatus}
                            mouseXR={mouseXR}
              />
              <LogicOfRotate  getMusicTimeMs={getMusicTimeMs} 
                              onlyRotate={onlyRotate}
                              setPrefect ={setPrefect}
                              setGood={setGood}
                              setMiss={setMiss}
                              setCommbo={setCommbo}
                              setJudgeStatus={setJudgeStatus}
              />
              <LogicOfDarg  getMusicTimeMs={getMusicTimeMs} 
                            onlyDrag={onlyDrag}
                            mouseXR={mouseXR}
                            setPrefect={setPrefect}
                            setGood={setGood}
                            setMiss={setMiss}
                            setCommbo={setCommbo}
                            setJudgeStatus={setJudgeStatus}
              />
              <PlayerMark mouseXR={mouseXR}/>
              <Box position={[0, 0, 0]} getJudgeStatus={getJudgeStatus}/>
              <JudgeTextComponent getJudgeStatus={getJudgeStatus}/>
              <CommboTextComponent getCommbo={getCommbo}/>

              {/* react-three/postprocessing 特效處理 */}
              <EffectComposer>
                <Bloom 
                  intensity={1.5}          // 輝光的整體強度
                  luminanceThreshold={0.2} // 設定為 1 代表只有特別指定 toneMapped={false} 且數值超標的材質會發光
                  luminanceSmoothing={0.9} // 輝光邊緣的滑順度
                  radius={0.5}             // 輝光擴散的範圍大小
                />
              </EffectComposer>
            </Canvas>
          </main>
          < GameMusicComponent getChose={getChose} setMusicTimeMs={setMusicTimeMs} setStatus={setStatus}/>
        </>
      )}

    </>
  );
}



export default App;