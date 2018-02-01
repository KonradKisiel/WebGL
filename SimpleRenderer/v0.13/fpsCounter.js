const fpsElem = document.querySelector("#fps");
const lowFpsElem = document.querySelector("#lowFps");
let lowFps = 999;
let count = 0;
let then = 0;
function render(now) {
  now *= 0.001;                          // convert to seconds
  const deltaTime = now - then;          // compute time since last frame
  then = now;                            // remember time for next frame
  const fps = 1 / deltaTime;             // compute frames per second
  count++;
  fpsElem.textContent = fps.toFixed(1);  // update fps display
  if(count>100 && lowFps>fps){
    lowFps=fps;
  }
  lowFpsElem.textContent = lowFps.toFixed(1);  // update lowest fps display
  requestAnimationFrame(render);
}
requestAnimationFrame(render);