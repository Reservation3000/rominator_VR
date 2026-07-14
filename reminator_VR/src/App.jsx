// App.jsx
import { Canvas , useFrame } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Slider } from 'antd';
import { useRef } from "react";
import "./App.css";


function App() {


  return (
    <>
    <Slider defaultValue={30} />

    <main className = "canva">
       <Canvas >
        <Stats />
        <directionalLight position={[0, 0, 2]} />
        <ambientLight intensity={0.3} />
        <Box position={[0, 0, 3.5]} color="rgb(83, 83, 83)" delta={0.01} />
        <Note position={[0, 0, 3]} color="rgb(255, 255, 255)" />
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
      <ringGeometry args={[0.35, 1, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

const Note = ({position , color }) => {
  return (
    <mesh position={position} >
      <ringGeometry args={[0.35, 0.33, 32, 1, 0, 0.196]} />
      <meshStandardMaterial color={color} side={2} /> {/* side={2} 等同于 THREE.DoubleSide */}
    </mesh>
  );
}

export default App;