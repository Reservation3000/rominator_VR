//===============================================================================
export const PlayHitSound = () => {
  const audio = new Audio('https://mg.reservationfurry.art/assest/hit.mp3');

  audio.play().catch(e => {
    console.log('Audio play failed:', e);
  });
};


//===============================================================================
let mouseXR = 0;    

window.addEventListener("mousemove", (event) => {
  mouseXR = event.clientX;
});

export const MouseTrackerR = () => {
  const rad = (mouseXR / window.innerWidth) * Math.PI * 2;
  // console.log(mouseXR,rad);
  return rad;
};


//===============================================================================
let mouseXD = 0;    

window.addEventListener("mousemove", (event) => {
  mouseXD = event.clientX;
});

export const MouseTrackerD = () => {
  const degrees = (mouseXD / window.innerWidth) * 360;
  return degrees;
};


//==============================================================================
let angleHistory = { time: performance.now(), angle: 0 };
let rotateResult = 0;

// 每 100ms 自動檢查一次
setInterval(() => {
  const now = performance.now();
  const angle = MouseTrackerD();

  const oldAngle = angleHistory.angle;
  let diff = angle - oldAngle;

  if (diff >= 7) {
    rotateResult = 1;
  } else if (diff <= -7) {
    rotateResult = 2;
  } else {
    rotateResult = 0;
  }

  // 更新基準
  angleHistory = { time: now, angle: angle };
}, 100);


export const getRotateJudgeAngle = () => {
  return rotateResult;
};