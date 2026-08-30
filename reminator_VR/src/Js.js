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


