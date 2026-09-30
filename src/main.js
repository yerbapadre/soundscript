import { initVisuals } from "./visuals.js";
import { initUI } from "./ui.js";
import { initInput } from "./input.js";
import { warmUp } from "./audio.js";

initVisuals();
initUI();
initInput();

for (const ev of ["pointerdown", "keydown"]) {
  window.addEventListener(ev, warmUp, { once: true, capture: true });
}
