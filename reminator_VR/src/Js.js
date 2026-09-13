//===============================================================================
import hitSoundUrl from './assets/hit.wav'; // 本地引入

// 1. 全域單例 AudioContext 與音效快取
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let hitBuffer = null;

// 2. 專案初始化時立即發送請求並預先「解碼」至記憶體中
fetch(hitSoundUrl)
  .then((res) => res.arrayBuffer())
  .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer))
  .then((decodedBuffer) => {
    hitBuffer = decodedBuffer;
  })
  .catch((e) => console.error('Hit sound preload failed:', e));

export const PlayHitSound = () => {
  if (!hitBuffer) return;

  // 避免瀏覽器限制音效自動播放，若處於靜音狀態則喚醒
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // 3. 每次打擊時建立輕量級的 BufferSource (開銷幾乎為 0)
  const source = audioCtx.createBufferSource();
  source.buffer = hitBuffer;
  source.connect(audioCtx.destination);
  source.start(0); // 0 延遲立即播放
};


//===============================================================================
export function isUseMouseEnabled(getUseMouse , mouseXR , angleR) {
  let angle;

  if (getUseMouse) {
    angle = mouseXR;
  } else if (!getUseMouse) {
    angle = angleR;
  } else {
    console.log("angleR is undefined");
    angle = 0; // 預設值
  }

  return angle;
}


