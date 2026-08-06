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
  CardComponent,
  CardMusicComponent 
} from "./components/component.jsx";



//===============================
//  App 
//===============================

function App() {

  const [getval, setVal] = useState(1); 
  const [getsongs, setSongs] = useState([]); // 存放整包歌曲資料
  const [getTouch, setTouch] = useState(0); 
  const [getChose, setChose] = useState(null); 


  useEffect(() => {
    fetch('http://localhost:8081/api/VRmgDB/data')
      .then(res => res.json())
      .then(data =>{
        console.log(data);
        setSongs(data);
        })
      .catch(err => console.log(err));
  },[])


  return (
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

    <CardMusicComponent getTouch={getTouch} getChose={getChose} />  {/* 選歌表單中，觸碰撥放音樂的邏輯 */}
    <CardComponent getsongs={getsongs} setTouch ={setTouch} setChose={setChose} /> {/* 選歌表單中，取得所有音樂、觸碰卡片、選擇卡片的邏輯 */}
    </>
  );
}



export default App;