/**
 * Pre-paint script: enables motion unless reduced motion is requested. If the engine
 * has not started 6 s after load (blocked or failed script), content is revealed.
 */
export const motionScript = `(function(){try{var d=document.documentElement;if(!matchMedia("(prefers-reduced-motion: no-preference)").matches)return;d.classList.add("motion");addEventListener("load",function(){setTimeout(function(){if(!d.classList.contains("motion-ready"))d.classList.remove("motion")},6000)})}catch(e){}})()`;
