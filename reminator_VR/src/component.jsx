import { Slider } from 'antd';
import { Card, Col, Row } from 'antd';
import { useRef, useEffect ,  useState } from 'react';
import { Avatar } from 'antd';
import {  Space , Button } from 'antd';
import  Papa  from  'papaparse' ;


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
    <>
        <mesh position={position} >
          <ringGeometry args={[getval-0.05, getval, 32, 1, 0, Math.PI * 2 * 0.32]} />
          <meshStandardMaterial color={color} />
        </mesh>
    </>
  );
}

export const GameMusicComponent = ({ getChose , onTimeUpdate }) => {
  
  const musicChose = useRef(null);

    return (
      <>
       {/* src 帶入音檔路徑  autoPlay 載入就自動播放  controls顯示播放控制條*/}
        <audio src={getChose.mp3} 
              ref={musicChose}
              autoPlay 
              onTimeUpdate={(e) => {
              if (onTimeUpdate) {
                onTimeUpdate(e.currentTarget.currentTime); // 傳回當前秒數
              }
            }}
        />
       </>
    );
}

export const SliderComponent = ({setVal}) => {
  return (
    <div className="slider">
      <Slider defaultValue={1} min={0.35} max={1} step={0.01} onChange={(v) => setVal(v)}/>
    </div>
  );
}

export const MenuComponent = ({getsongs , setTouch , setChose , setStatus , getPage , songTotal , pageTotal}) => {

  const pageLimit = 8;
  const pageStartIndex = getPage * pageLimit; // 開始索引
  const pageEndIndex = pageStartIndex + pageLimit; // 結束索引
  const pageNow = getsongs.slice(pageStartIndex, pageEndIndex); // 當頁切出來的歌單
  
  console.log({
    "共有幾首歌":songTotal,
    "共有幾頁":pageTotal,
    "現在在第幾頁":getPage,
    "這頁起始數字":pageStartIndex,
    "這頁結束數字":pageEndIndex,
    "當頁有幾首歌":pageNow.length, 
    "當頁的資料內容":pageNow                     
  }
  );

  return (
    <div className="Menu">
        {pageNow.map((ID , index) => {

          //極座標轉換
          // const angle = (index / total) * 2 * Math.PI;
          // const radius = 200; 

          // const x = radius * Math.cos(angle);
          // const y = radius * Math.sin(angle);
          const totalInThisPage = pageNow.length; //這頁有幾首歌
          const angle = (index / totalInThisPage)*360;  // 這頁的x首歌平分角度
            
          return(
        <div 
          key={ID.id}
          className="mgCardsWrapper" // 旋轉定位
          // style={{ '--top': `calc(50% + ${y}px)`,  '--left': `calc(50% + ${x}px)`}}
          style={{'--angle':`${angle}deg`}}
        >
          <Avatar className="mgCards" 
                size={160}
                title={ID.name} 
                variant="borderless"
                hoverable
                src={ID.img}
                onMouseEnter={() => setTouch(ID)}  //滑鼠摸到
                onClick={() => {                   //滑鼠點擊
                  setChose(ID);
                  setStatus(1);
                }}
          />

          <Avatar className='certenCircle'
                size={30}
                title={ID.name} 
                variant="borderless"
                hoverable
          />

        </div>
        )})}
    </div>
  );
}

export const MenuPageSwitchBottom = ({ setPage , getPage , pageTotal }) => {
  return (
    <div className="MenuPageSwitchBottom">=
        {/* 上一頁按鈕 */}
        {/* getPage 從第0開始，但頁數從1開始 */}
        <Button 
          disabled={getPage  <= 0}
          onClick={() => setPage(prev => prev - 1)}
        >
          Last Page
        </Button>

        {/* 下一頁按鈕 */}
        <Button 
          disabled={(getPage+1) == pageTotal}
          onClick={() => setPage(prev => prev + 1)}
        >
          Next Page
        </Button>
    </div>
  );
}

export const MenuMusicComponent = ({ getTouch , getChose}) => {
    const musicTouched = useRef(null);
    useEffect(() => {
        if (getChose && musicTouched.current) {
        musicTouched.current.pause(); 
        musicTouched.current.currentTime = 0; 
        }
    }, [getChose]);

  return (
    <>
      {/* src 帶入音檔路徑  autoPlay 載入就自動播放  controls顯示播放控制條*/}
      <audio src={getTouch.mp3} 
             ref={musicTouched}
             autoPlay 
             onLoadedMetadata={(e) => {
                // 當音訊資料載入完成後，將當前播放時間指向指定的秒數
                e.currentTarget.currentTime = 40; 
        }}
      />
    </>
  );
};

export const ShowChoseSong = ({ getChose , setStatus}) => {
  const [getTime, setTime] = useState(3);  // 3秒

  useEffect(() => {
    let interval = null;   //interval=間隔
    
    if (getTime > 0) {
      interval = setInterval(() => {
        setTime((millisSeconds) => millisSeconds - 1);
      }, 1000);
    } else if (getTime === 0) {
      setStatus(2);
    }

    // 清除計時器
    return () => clearInterval(interval);
  }, [getTime]);

  return (
    <div className="showChoseSong">
      <Avatar size={500} src={getChose.img} />
    </div>
  );
};

/* 把getChose的樂曲資料，抓csv資料並做分類處裡，並丟進setNoteData */
export const ProcessChoseCSVData = ({ getChose , setNoteData }) => {
  useEffect(() =>{
    const loadCsv = async () => {
      if(!getChose)return[];

      try {
        const response = await fetch(getChose.csv);
        const csvText = await response.text();

        const result = Papa.parse(csvText, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        const rows = result.data; // 取得二維陣列資料
        let data = [];      //存入

        if (rows.length === 0) return data;

        // csv是二維陣列資料[x][y] 
        // 讀取第一行的整數數字 
        const firstLineInt = rows[0][0];
        console.log("First line integer:", firstLineInt);

        // 從第二行開始讀取資料 (i = 1)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const type = row[0]; // 第一欄：類型

          if (type === 'note') {
            let triggerTime = (row[1] || 0) + firstLineInt;
            let noteLand = row[2];
            data.push({ type, triggerTime, noteLand });
          } 
          else if (type === 'drag') {
            let triggerTimeStart = (row[1] || 0) + firstLineInt;
            let triggerTimeEnd = (row[2] || 0) + firstLineInt;
            let noteLandStart = row[3];
            let noteLandEnd = row[4];
            let direction = row[5];
            data.push({ type, triggerTimeStart, triggerTimeEnd, noteLandStart, noteLandEnd, direction });
          } 
          else if (type === 'rotate') {
            let triggerTime = (row[1] || 0) + firstLineInt;
            let direction = row[2];
            data.push({ type, triggerTime, direction });
          }
        }

        setNoteData(data); // 把處理好的資料存進 State
        
      }catch(error) {

        console.error("CSV load fails：", error);

      }
    }

    loadCsv();

  }, [getChose]); // 當 getChose 改變時重新執行
};

