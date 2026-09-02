//===============================================================================
export const PlayHitSound = () => {
  const audio = new Audio('https://mg.reservationfurry.art/assest/hit.mp3');

  audio.play().catch(e => {
    console.log('Audio play failed:', e);
  });
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


