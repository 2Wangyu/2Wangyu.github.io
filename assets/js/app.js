import { PROFILE } from "./data.js";
import { mountAmbient } from "./ambient.js";

const intro = document.querySelector("#intro");
const enterButton = document.querySelector("#enter-site");
const siteShell = document.querySelector("#site-shell");
const mainContent = document.querySelector("#main-content");
const profileIntro = document.querySelector("#profile-intro");
const canvas = document.querySelector("#ambient-canvas");

profileIntro.textContent = `${PROFILE.name} · ${PROFILE.role}。${PROFILE.intro}`;
const stopAmbient = mountAmbient(canvas);

function enterSite() {
  document.body.classList.add("is-entered");
  siteShell.setAttribute("aria-hidden", "false");
  intro.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    mainContent.focus({ preventScroll: true });
    stopAmbient();
  }, document.documentElement.classList.contains("reduce-motion") ? 0 : 900);
}

enterButton.addEventListener("click", enterSite);

if (location.hash) {
  enterSite();
}
