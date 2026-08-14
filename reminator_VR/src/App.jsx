import { Canvas , useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef , useState , useEffect} from "react";
import { OrbitControls } from '@react-three/drei'; 
import "./App.css";

import {
  Box , 
  SliderComponent , 
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  MenuPageSwitchBottom,
  ProcessChoseCSVData,
  GameMusicComponent,
  LogicOfNotes,
  LogicOfRotate,
  LogicOfDarg,
  PlayerMark
} from "./component.jsx";

import { 
  MouseTrackerR,
  MouseTrackerD,
  getRotateJudgeAngle
} from "./Js.js"

import { 
  serverURL 
 } from "./constants.js";



//===============================
//  App 
//===============================

function App() {

  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2遊玩
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲，選中哪首歌(ID)
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  const [getNoteCSVData, setNoteCSVData] = useState([]); //存入處理好的歌曲資料
  const [getPuaseButtom, setPuaseButtom] = useState(false);  //遊玩的暫停鍵
  const [getMusicTimeMs, setMusicTimeMs] = useState(0);    //現在的樂曲進行時間

  const [getCommbo, setCommbo] = useState(0);
  const [getPrefect, setPrefect] = useState(0);
  const [getGood, setGood] = useState(0);
  const [getMiss, setMiss] = useState(0);


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
        </>
     )}

      {(getStatus === 1) && (
        <>
          <ShowChoseSong getChose={getChose} setStatus={setStatus} />
        </>
      )}

      {(getStatus === 2) && (
        <>
        
        {/*把getChose的樂曲資料，抓csv資料並做分類處裡，並丟進setNoteData */}
        <ProcessChoseCSVData  getChose={getChose} setNoteCSVData={setNoteCSVData}/>
        
         <main className = "canva">
            <Canvas gl={{ toneMappingExposure: 1 }}>
              <OrbitControls/>
              {/* <directionalLight position={[0, 0, 2]} /> */}
              <ambientLight intensity={2} />
              <LogicOfNotes getMusicTimeMs={getMusicTimeMs} 
                            onlyNotes={onlyNotes}
                            setPrefect={setPrefect} 
                            setGood={setGood} 
                            setMiss={setMiss} 
                            setCommbo={setCommbo}
                            getCommbo={getCommbo}
                            mouseXR={mouseXR}
              />
              <LogicOfRotate  getMusicTimeMs={getMusicTimeMs} 
                              onlyRotate={onlyRotate}
                              setPrefect ={setPrefect}
                              setGood={setGood}
                              setMiss={setMiss}
                              setCommbo={setCommbo}
              />
              <LogicOfDarg getMusicTimeMs={getMusicTimeMs} onlyDrag={onlyDrag}/>
              <PlayerMark mouseXR={mouseXR}/>
              <Box position={[0, 0, 0]} color="rgba(83, 83, 83, 0.21)"/>
            </Canvas>
          </main>
          < GameMusicComponent getChose={getChose} setMusicTimeMs={setMusicTimeMs}/>
        </>
      )}

    </>
  );
}



export default App;