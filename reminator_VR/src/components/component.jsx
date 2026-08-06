import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef, useEffect } from 'react';


export const Box = ({position , color }) => {
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

export const Note = ({position , color ,getval}) => {
  return (
    <mesh position={position} >
      <ringGeometry args={[getval-0.05, getval, 32, 1, 0, Math.PI * 2 * 0.32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export const SliderComponent = ({setVal}) => {
  return (
    <div className="slider">
      <Slider defaultValue={1} min={0.35} max={1} step={0.01} onChange={(v) => setVal(v)}/>
    </div>
  );
}

export const CardComponent = ({getsongs , setTouch , setChose}) => {
  return (
    <div className="cards">
      <Row gutter={16}>
        {getsongs.map(ID => (
        <Col span={6} key={ID.id}>
          <Card className="mgCards" 
                title={ID.name} 
                variant="borderless"
                size="small"
                hoverable
                onMouseEnter={() => setTouch(ID)}
                onClick={() => setChose(ID)}
          >
          <img className="mgImg"
              src={ID.img}
              alt={ID.title}
            />
          </Card>
        </Col>
        ))}
      </Row>
    </div>
  );
}

export const CardMusicComponent = ({ getTouch , getChose}) => {
    const music = useRef(null);
    useEffect(() => {
        if (getChose && music.current) {
        music.current.pause(); 
        music.current.currentTime = 0; 
        }
    }, [getChose]);

  return (
    <>
      {/* src 帶入音檔路徑  autoPlay 載入就自動播放  controls顯示播放控制條*/}
      <audio src={getTouch.mp3} 
             ref={music}
             autoPlay 
             onLoadedMetadata={(e) => {
                // 當音訊資料載入完成後，將當前播放時間指向指定的秒數
                e.currentTarget.currentTime = 40; 
        }}
      />
    </>
  );
};