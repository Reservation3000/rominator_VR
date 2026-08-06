// App.jsx
import { Canvas , useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { useRef , useState} from "react";
import "./App.css";


function App() {

  const [getval, setVal] = useState(1); 


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
    </>
  );
}

const Box = ({position , color }) => {
  // const ref = useRef();
  // useFrame((state, delta) => {
  //   ref.current.rotation.x += delta;
  //   ref.current.rotation.y += delta;
  // });

  return (
    <mesh position={position} >
      <ringGeometry args={[0.3, 1, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

const Note = ({position , color ,getval}) => {
  return (
    <mesh position={position} >
      <ringGeometry args={[getval-0.05, getval, 32, 1, 0, Math.PI * 2 * 0.32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

const SliderComponent = ({setVal}) => {
  return (
    <div className="slider">
      <Slider defaultValue={1} min={0.35} max={1} step={0.01} onChange={(v) => setVal(v)}/>
    </div>
  );
}

export default App;