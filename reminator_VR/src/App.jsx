import { Canvas , useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef , useState , useEffect} from "react";
import "./App.css";

import {
  Box , 
  Note , 
  SliderComponent , 
  MenuComponent,
  MenuMusicComponent,
  ShowChoseSong,
  MenuPageSwitchBottom
} from "./component.jsx";

import { 
  serverURL 
 } from "./constants.js";



//===============================
//  App 
//===============================

function App() {

  const [getStatus, setStatus] = useState(0);     // 0歌曲選單、1選了歌曲、2加載歌曲資料、3遊玩
  const [getval, setVal] = useState(1); 
  const [getsongs, setSongs] = useState([]);      // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0);       // 有沒有摸到歌曲
  const [getChose, setChose] = useState(null);    // 有沒有選中歌曲
  const [getPage, setPage] = useState(0);         // 現在是第幾頁
  
  const songTotal = getsongs.length;       // 有幾首歌
  const pageLimit = 8;                     // 單頁只能出現 8 首歌
  const pageTotal = Math.ceil(songTotal / pageLimit); // 共有幾頁


  useEffect(() => {
    fetch(serverURL)
      .then(res => res.json())
      .then(data =>{
        console.log(data);
        setSongs(data);
        })
      .catch(err => console.log(err));
  },[])


  return (
    <>

      {(getStatus === 0) && (
        <>
          <div className="slider" >
            <SliderComponent setVal={setVal}/>
          </div>


          <main className = "canva">
            <Canvas >
              <Stats />
              <directionalLight position={[0, 0, 2]} />
              <ambientLight intensity={1} />
              <Box position={[0, 0, 3]} color="rgb(83, 83, 83)"/>
              <Note position={[0, 0, 3.1]} color="rgb(255, 255, 255)" getval={getval} />
            </Canvas>
          </main>

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
          <ShowChoseSong getChose={getChose} songTotal={songTotal} getStatus={getStatus} />
        </>
      )}

    </>
  );
}



export default App;