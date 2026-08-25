import { useRef, useEffect ,  useState } from 'react';


// 自訂顏色透明度減弱動畫的hook
export function useFadeOut(trigger) {
  const [transparency, setTransparency] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setTransparency((prev) => {
        if (prev <= 0.05) {
          clearInterval(timer);
          return 0;
        }
        return prev - 0.05; // 每次遞減 0.05
      });
    }, 15);

    return () => clearInterval(timer);
  }, [trigger]); 

  return transparency;
}