// ===========================================
// COLOR FALL — Enhanced Engine
// ===========================================

const canvas = document.getElementById("c");
const ctx    = canvas.getContext("2d");

const NUM_LANES = 8;

// ── THEMES ──────────────────────────────────
const THEMES = {
  cyber: {
    bg:       "#050d10",
    grid:     "rgba(0,255,180,{a})",
    accent:   "#00ffcc",
    lane:     "rgba(0,255,180,{a})",
    blocks:   ["#00ffcc","#0088ff","#00bbff","#44ffaa","#00ff88"],
    heal:     "#ffe644",
    danger:   "#ff3344",
    vehicle:  "#ffc84d",
    gunBody:  "#1a4040",
    gunBarrel:"#00ffcc",
    boss:     "#ff00ff"
  },
  sunset: {
    bg:       "#0d0508",
    grid:     "rgba(255,100,60,{a})",
    accent:   "#ff6644",
    lane:     "rgba(255,100,60,{a})",
    blocks:   ["#ff6644","#ff3388","#ffaa00","#ff66aa","#ff8800"],
    heal:     "#aaff44",
    danger:   "#ff0044",
    vehicle:  "#ffbb22",
    gunBody:  "#3a1010",
    gunBarrel:"#ff6644",
    boss:     "#ff00aa"
  },
  arctic: {
    bg:       "#060d14",
    grid:     "rgba(120,210,255,{a})",
    accent:   "#88ddff",
    lane:     "rgba(120,210,255,{a})",
    blocks:   ["#88ddff","#aaeeff","#44bbff","#ccffff","#66ccff"],
    heal:     "#ffff88",
    danger:   "#ff4466",
    vehicle:  "#88ffff",
    gunBody:  "#102030",
    gunBarrel:"#88ddff",
    boss:     "#00ffff"
  },
  void: {
    bg:       "#080004",
    grid:     "rgba(200,0,50,{a})",
    accent:   "#cc0033",
    lane:     "rgba(200,0,50,{a})",
    blocks:   ["#cc0033","#ff0055","#880033","#ff3366","#aa0044"],
    heal:     "#ff9900",
    danger:   "#ff0000",
    vehicle:  "#ff5500",
    gunBody:  "#200008",
    gunBarrel:"#cc0033",
    boss:     "#ff0066"
  }
};

// ── DIFFICULTY ─────────────────────────────
const DIFFICULTY = {
  easy: {
    lives:          5,
    fallSpeedBase:  0.12,
    fallSpeedStep:  0.012,
    dangerChance:   0.08,
    aiSwitchChance: 0.10,   // chance per block to be a lane-switcher
    aiAggressionT:  3000,   // ms before AI decides to switch toward player
    maxFallers:     10,
    healFreq:       0.25,   // 1 in N blocks is heal
    bossEvery:      8
  },
  medium: {
    lives:          3,
    fallSpeedBase:  0.18,
    fallSpeedStep:  0.022,
    dangerChance:   0.15,
    aiSwitchChance: 0.22,
    aiAggressionT:  2000,
    maxFallers:     13,
    healFreq:       0.14,
    bossEvery:      5
  },
  hard: {
    lives:          2,
    fallSpeedBase:  0.26,
    fallSpeedStep:  0.034,
    dangerChance:   0.28,
    aiSwitchChance: 0.40,
    aiAggressionT:  1200,
    maxFallers:     16,
    healFreq:       0.08,
    bossEvery:      4
  }
};

// ── STATE ──────────────────────────────────
let currentTheme = "cyber";
let currentDiff  = "medium";
let T  = THEMES[currentTheme];
let D  = DIFFICULTY[currentDiff];

let alive       = false;
let gameStarted = false;
let score       = 0;
let lives       = 3;
let streak      = 0;
let roundNumber = 1;
let distance    = 0;   // endless counter
let bgPulse     = 0;
let gridOffset  = 0;   // scrolling grid illusion

let fallSpeed   = 0.18;

// ── BOSS ──────────────────────────────────
let boss        = null;
let bossActive  = false;
let bossHP      = 0;
let bossMaxHP   = 0;
let bossTimer   = 0;

// ── OBJECTS ───────────────────────────────
let fallers    = [];
let bullets    = [];
let particles  = [];
let floatTexts = [];

let hitCooldown = false;

// ── PLAYER / GUN ──────────────────────────
const gun = { x: 0, y: 0, lane: 3, vy: 0, targetY: 0 };
let recoil     = 0;
let gunBaseY   = 0;   // resting Y (bottom area)
let gunMinY    = 0;   // how far up they can go

// ── WEAPONS ───────────────────────────────
const weapons = {
  basic:  { name:"BASIC",  fireRate:260, speed:13, spread:0,    damage:1, range:90,  hitSize:6 },
  spread: { name:"SPREAD", fireRate:420, speed:11, spread:0.26, damage:1, range:78,  hitSize:8 },
  sniper: { name:"SNIPER", fireRate:720, speed:22, spread:0,    damage:4, range:170, hitSize:5 }
};
let currentWeapon = "basic";
let lastShot      = 0;
let currentSkin   = "classic";
let shieldActive  = false;

// ── UI ELEMENTS ───────────────────────────
const ui              = document.getElementById("ui");
const leaderboard     = document.getElementById("leaderboard");
const shieldIndicator = document.getElementById("shieldIndicator");
const dangerIndicator = document.getElementById("dangerIndicator");
const gameoverEl      = document.getElementById("gameover");
const goScore         = document.getElementById("goScore");
const comboEl         = document.getElementById("combo");
const settingsBtn     = document.getElementById("settingsBtn");
const settingsPanel   = document.getElementById("settingsPanel");
const soundToggle     = document.getElementById("soundToggle");
const volumeSlider    = document.getElementById("volumeSlider");
const bgModeSelect    = document.getElementById("bgModeSelect");
const particleIntensity = document.getElementById("particleIntensity");
const comboGlow       = document.getElementById("comboGlow");
const skinSelect      = document.getElementById("skinSelect");
const weaponButtons   = document.querySelectorAll(".weapon");
const modeScreen      = document.getElementById("modeScreen");
const startBtn        = document.getElementById("startBtn");
const restartBtn      = document.getElementById("restartBtn");
const menuBtn         = document.getElementById("menuBtn");
const bestDisplay     = document.getElementById("bestDisplay");

// ── STORAGE ───────────────────────────────
let highScores  = JSON.parse(localStorage.getItem('cfHighScores2')) || {};
let lastScores  = JSON.parse(localStorage.getItem('cfLastScores2')) || [];

function getHighScore() { return highScores[currentDiff + "_" + currentTheme] || 0; }
function setHighScore(v){ highScores[currentDiff + "_" + currentTheme] = v; localStorage.setItem('cfHighScores2', JSON.stringify(highScores)); }

// ── SETTINGS ──────────────────────────────
function saveSettings() {
  localStorage.setItem('cfSettings2', JSON.stringify({
    sound: soundToggle.checked,
    vol:   volumeSlider.value,
    particles: particleIntensity.value,
    combo: comboGlow.checked,
    bg:    bgModeSelect.value,
    skin:  skinSelect.value
  }));
}
function loadSettings() {
  const s = JSON.parse(localStorage.getItem('cfSettings2'));
  if (!s) return;
  soundToggle.checked     = s.sound;
  volumeSlider.value      = s.vol;
  particleIntensity.value = s.particles;
  comboGlow.checked       = s.combo;
  bgModeSelect.value      = s.bg;
  skinSelect.value        = s.skin || "classic";
}
loadSettings();

function applySkin() {
  currentSkin = skinSelect.value;
  shieldActive = currentSkin === "shield";
  shieldIndicator.classList.toggle("hidden", currentSkin !== "shield");
  dangerIndicator.classList.toggle("hidden", currentSkin !== "deadly");
  shieldIndicator.textContent = shieldActive ? "SHIELD READY" : "SHIELD DOWN";
  shieldIndicator.classList.toggle("active", shieldActive);
  dangerIndicator.textContent = currentSkin === "deadly" ? "DEADLY RED" : "DEADLY SKIN";
}

skinSelect.addEventListener("change", () => {
  applySkin();
  saveSettings();
  updateUI();
});

applySkin();

// ── THEME CSS VAR ─────────────────────────
function applyThemeCSS() {
  document.documentElement.style.setProperty('--accent', T.accent);
  document.body.style.background = T.bg;
}

function updateSkinUI() {
  if (currentSkin === "shield") {
    return `Skin:<b>SHIELD ${shieldActive?"ON":"OFF"}</b>`;
  }
  if (currentSkin === "deadly") {
    return `Skin:<b>DEADLY</b>`;
  }
  return `Skin:<b>CLASSIC</b>`;
}

// ── LANES ─────────────────────────────────
let laneWidth = 0;
let laneXs    = [];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  laneWidth = canvas.width / NUM_LANES;
  laneXs    = Array.from({length:NUM_LANES}, (_,i) => laneWidth*i + laneWidth/2);
  gunBaseY  = canvas.height - 70;
  gunMinY   = canvas.height * 0.45;
  gun.targetY = gunBaseY;
  gun.y     = gunBaseY;
  gun.x     = laneXs[gun.lane];
}
window.addEventListener("resize", resize);
resize();

function getLaneFromX(x) {
  return Math.max(0, Math.min(NUM_LANES-1, Math.floor(x / laneWidth)));
}

// ── MODE SELECT UI ────────────────────────
document.querySelectorAll(".modeBtn.diff").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modeBtn.diff").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDiff = btn.dataset.d;
    updateBestDisplay();
  });
});
document.querySelectorAll(".modeBtn.theme").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modeBtn.theme").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTheme = btn.dataset.t;
    T = THEMES[currentTheme];
    applyThemeCSS();
    updateBestDisplay();
  });
});

startBtn.addEventListener("click", () => {
  modeScreen.style.display = "none";
  initGame();
});

function updateBestDisplay() {
  const hs = getHighScore();
  bestDisplay.textContent = hs > 0 ? `Best on ${currentDiff}/${currentTheme}: ${hs}` : "No record yet";
}
updateBestDisplay();

// ── WEAPON SWITCH ────────────────────────
weaponButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentWeapon = btn.dataset.w;
    weaponButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    recoil = 5;
  });
});

let weaponKeys  = Object.keys(weapons);
let weaponIndex = 0;

window.addEventListener("keydown", e => {
  if (!alive) return;
  if (e.key === "q") {
    weaponIndex = (weaponIndex+1) % weaponKeys.length;
    currentWeapon = weaponKeys[weaponIndex];
  }
  if (e.key === "ArrowLeft")  moveLane(-1);
  if (e.key === "ArrowRight") moveLane(1);
  if (e.key === "ArrowUp")    moveUp();
  if (e.key === "ArrowDown")  moveDown();
  if (e.key === " ")          { e.preventDefault(); shoot(); }
});

// ── AUDIO ────────────────────────────────
const audio = new (window.AudioContext || window.webkitAudioContext)();
canvas.addEventListener("pointerdown", () => {
  if (audio.state === "suspended") audio.resume();
}, { once: true });

function tone(freq, type="square", dur=0.09, vol=null) {
  if (!soundToggle.checked) return;
  const v = vol !== null ? vol : parseFloat(volumeSlider.value) * 0.65;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = v;
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  o.connect(g); g.connect(audio.destination);
  o.start(); o.stop(audio.currentTime + dur);
}
function shootSound()  { tone(160 + Math.random()*60, "square", 0.09); }
function ping(f=440)   { tone(f*(1+streak*0.04), "sine", 0.12); }
function healSound()   { [440,550,660].forEach((f,i) => setTimeout(()=>tone(f,"sine",0.2,parseFloat(volumeSlider.value)*0.4), i*80)); }
function warnSound()   { tone(220,"sawtooth",0.15); }
function indicatorBeep(){ tone(800, "sine", 0.06, 0.08); }

// ── PARTICLES ────────────────────────────
class Particle {
  constructor(x,y,color) {
    this.x=x; this.y=y; this.color=color;
    this.vx=(Math.random()-0.5)*4;
    this.vy=(Math.random()-0.5)*4-1.5;
    this.alpha=1;
    this.r=Math.random()*4+1.5;
    this.dead=false;
  }
  update(dt) {
    this.vy+=0.07;
    this.x+=this.vx*dt*0.09;
    this.y+=this.vy*dt*0.09;
    this.alpha-=0.024;
    if(this.alpha<=0) this.dead=true;
  }
}

// ── FLOAT TEXTS ──────────────────────────
class FloatText {
  constructor(x,y,text,color) {
    this.x=x; this.y=y; this.text=text; this.color=color;
    this.alpha=1; this.vy=-1.3; this.dead=false;
  }
  update(dt) {
    this.y+=this.vy*dt*0.08;
    this.alpha-=0.018;
    if(this.alpha<=0) this.dead=true;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.shadowColor=this.color; ctx.shadowBlur=8;
    ctx.font="bold 15px 'Orbitron',monospace";
    ctx.textAlign="center";
    ctx.fillText(this.text,this.x,this.y);
    ctx.restore();
  }
}

// ── FALLER CLASS ─────────────────────────
// AI states: "straight" → decides to switch → "signalling" → "switching" → "straight" (new lane)
class Faller {
  constructor(lane, color, delay, type="normal") {
    this.lane      = lane;
    this.targetLane= lane;
    this.x         = laneXs[lane];
    this.y         = -55;
    this.color     = color;
    this.type      = type;
    this.delay     = delay;
    this.spawnTime = performance.now();
    this.hit       = false;

    // size
    this.w = laneWidth * (type==="vehicle" ? 0.80 : 0.60);
    this.h = this.w * (type==="vehicle" ? 0.35 : 0.52);

    this.speedMult = type==="danger" ? 1.35
                  : type==="heal" ? 0.72
                  : type==="vehicle" ? 1.9
                  : 1.0;
    this.glowSize  = 0;
    this.glowDir   = 1;

    // AI lane-change brain
    this.aiState      = "straight";  // straight | signalling | switching
    this.aiTimer      = 0;
    this.signalSide   = 0;           // -1 left, +1 right
    this.signalBlink  = 0;
    this.isAI         = type==="vehicle" || Math.random() < D.aiSwitchChance;
    this.aggressionT  = D.aiAggressionT + Math.random()*1000;
    this.switchProgress = 0;

    // trail
    this.trail = [];
  }

  decideSwitch() {
    // Intelligent: has a bias toward hunting the player lane on hard
    const playerLane = gun.lane;
    let newLane;

    const aggressive = currentDiff==="hard" && Math.random()<0.55;
    if (aggressive) {
      // move 1 step toward player
      if (this.lane < playerLane)      newLane = this.lane + 1;
      else if (this.lane > playerLane) newLane = this.lane - 1;
      else                              newLane = this.lane + (Math.random()<0.5?-1:1);
    } else {
      // random adjacent lane
      const dir = Math.random()<0.5 ? -1 : 1;
      newLane = this.lane + dir;
    }

    newLane = Math.max(0, Math.min(NUM_LANES-1, newLane));
    if (newLane === this.lane) return;

    this.signalSide     = newLane > this.lane ? 1 : -1;
    this.targetLane     = newLane;
    this.aiState        = "signalling";
    this.signalBlink    = 0;
    this.switchProgress = 0;
    indicatorBeep();
  }

  update(dt) {
    if (performance.now()-this.spawnTime < this.delay) return;

    const speedFactor = (1 + streak*0.05) * this.speedMult;
    this.y += fallSpeed * dt * speedFactor;

    // Trail
    this.trail.push({x:this.x, y:this.y, a:0.35});
    if (this.trail.length>6) this.trail.shift();
    this.trail.forEach(t => t.a *= 0.82);

    // Glow pulse
    this.glowSize += this.glowDir * dt * 0.05;
    if (this.glowSize>10) this.glowDir=-1;
    if (this.glowSize<0)  this.glowDir=1;

    // AI brain
    if (this.isAI && this.aiState==="straight") {
      this.aiTimer += dt;
      if (this.aiTimer > this.aggressionT) {
        this.aiTimer = 0;
        this.aggressionT = D.aiAggressionT + Math.random()*800;
        this.decideSwitch();
      }
    }

    if (this.aiState==="signalling") {
      this.signalBlink += dt;
      // After ~600ms of signalling, start switching
      if (this.signalBlink > 600) {
        this.aiState = "switching";
      }
    }

    if (this.aiState==="switching") {
      this.switchProgress += dt * 0.004; // 0→1 over ~250ms
      const t = Math.min(1, this.switchProgress);
      const startX = laneXs[this.lane];
      const endX   = laneXs[this.targetLane];
      this.x = startX + (endX - startX) * easeInOut(t);
      if (t >= 1) {
        this.lane  = this.targetLane;
        this.x     = laneXs[this.lane];
        this.aiState = "straight";
        this.aiTimer = 0;
      }
    } else {
      // snap X to lane center when not switching
      this.x += (laneXs[this.lane]-this.x) * 0.18;
    }
  }
}

function easeInOut(t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }

// ── SPAWN ROUND ──────────────────────────
function spawnWave() {
  const colors = T.blocks;
  const count  = Math.min(4 + Math.floor(roundNumber*0.8), D.maxFallers);

  // Guarantee heal every N fallers based on difficulty
  const healEvery = Math.round(1 / D.healFreq);
  const lanePool  = shuffleArray(Array.from({length:NUM_LANES},(_,i)=>i));

  for (let i=0; i<count; i++) {
    const lane  = lanePool[i % NUM_LANES];
    const delay = i * (100 + Math.random()*90);

    let type = "normal";
    if (i % healEvery === 0 && i > 0) type = "heal";
    else if (Math.random() < Math.min(0.18, 0.05 + roundNumber*0.02)) type = "vehicle";
    else if (Math.random() < D.dangerChance + roundNumber*0.005) type = "danger";

    const color = type==="heal"     ? T.heal
                : type==="danger"   ? T.danger
                : type==="vehicle"  ? T.vehicle
                : colors[Math.floor(Math.random()*colors.length)];

    fallers.push(new Faller(lane, color, delay, type));
  }
}

function shuffleArray(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

// ── PLAYER MOVEMENT ─────────────────────
function moveLane(dir) {
  gun.lane = Math.max(0, Math.min(NUM_LANES-1, gun.lane+dir));
  recoil = 4;
}
function moveUp() {
  gun.targetY = Math.max(gunMinY, gun.targetY - canvas.height*0.08);
}
function moveDown() {
  gun.targetY = Math.min(gunBaseY, gun.targetY + canvas.height*0.08);
}

// ── SHOOT ────────────────────────────────
function shoot() {
  if (!alive) return;
  const now = performance.now();
  const w   = weapons[currentWeapon];
  if (now - lastShot < w.fireRate) return;
  lastShot = now;
  const shots = currentWeapon==="spread" ? 3 : 1;
  for (let i=0;i<shots;i++) {
    const spread = (i-(shots-1)/2)*w.spread;
    bullets.push({
      x:gun.x, y:gun.y-22,
      angle:-Math.PI/2+spread,
      life:0, speed:w.speed, damage:w.damage, range:w.range, hitSize:w.hitSize, dead:false
    });
  }
  shootSound();
  recoil = 10;
}

// ── PARTICLES ────────────────────────────
function spawnParticles(x,y,color,count=null) {
  const base = count || (particleIntensity.value==="low"?4:particleIntensity.value==="high"?12:7);
  for(let i=0;i<base;i++) particles.push(new Particle(x,y,color));
}

// ── HIT / HEAL ────────────────────────────
function hitPlayer() {
  if (hitCooldown) return;
  hitCooldown=true;
  lives--;
  streak=0;
  recoil=16;
  warnSound();
  spawnParticles(gun.x, gun.y, T.danger);
  floatTexts.push(new FloatText(gun.x, gun.y-35, "-LIFE", T.danger));
  if (lives<=0) endGame();
  updateUI();
  setTimeout(()=>hitCooldown=false, 240);
}

function healPlayer(x,y) {
  if (lives<7) {
    lives++;
    floatTexts.push(new FloatText(x,y-30,"+LIFE ♥",T.heal));
    healSound();
  } else {
    score+=8;
    floatTexts.push(new FloatText(x,y-30,"+8 BONUS",T.heal));
  }
  spawnParticles(x,y,T.heal,10);
  updateUI();
}

function endGame() {
  alive=false;
  const hs = getHighScore();
  if (score>hs) setHighScore(score);
  lastScores.push(score);
  if (lastScores.length>8) lastScores.shift();
  localStorage.setItem('cfLastScores2',JSON.stringify(lastScores));
  goScore.textContent = `Score: ${score}  |  Time: ${survivalTime.toFixed(1)}s  |  Best: ${Math.max(score,hs)}`;
  gameoverEl.style.opacity=1;
  gameoverEl.style.pointerEvents="all";
}

// ── BOSS ─────────────────────────────────
function spawnBoss() {
  bossActive=true;
  bossMaxHP=60+roundNumber*15;
  bossHP=bossMaxHP;
  bossTimer=0;
  boss={x:canvas.width/2, y:90, radius:65};
}

// ── UPDATE UI ────────────────────────────
function updateUI() {
  const maxH=Math.max(3,lives);
  const hearts = Array.from({length:maxH},(_,i)=>i<lives?"❤️":"🖤").join("");
  ui.innerHTML =
    `<span style="color:${T.accent}">${currentDiff.toUpperCase()} · R${roundNumber}</span>&nbsp;&nbsp;` +
    `Score:<b>${score}</b>&nbsp;&nbsp;Time:<b>${survivalTime.toFixed(1)}s</b>&nbsp;&nbsp;${hearts}&nbsp;&nbsp;` +
    `Best:<b>${getHighScore()}</b>&nbsp;&nbsp;` +
    `${updateSkinUI()}&nbsp;&nbsp;` +
    `<span style="opacity:0.6">${weapons[currentWeapon].name}</span>`;
  leaderboard.textContent = lastScores.length>0
    ? "Runs: " + lastScores.slice(-5).join("  ")
    : "";
}

// ── COMBO ────────────────────────────────
let comboTO=null;
function showCombo(s,x,y) {
  if(s<2||!comboGlow.checked) return;
  if(comboTO) clearTimeout(comboTO);
  comboEl.textContent=`×${s} COMBO`;
  comboEl.style.left=x+"px";
  comboEl.style.top=(y-24)+"px";
  comboEl.style.transform=`scale(${1+Math.min(s*0.07,0.7)})`;
  comboEl.style.opacity=1;
  comboTO=setTimeout(()=>comboEl.style.opacity=0, 550);
}

// ── INPUT HANDLING ───────────────────────
let isDragging=false;
let shootOnUp=false;

canvas.addEventListener("pointerdown", e=>{
  if (!gameStarted) return;
  if (!alive) { initGame(); return; }
  audio.state==="suspended" && audio.resume();
  isDragging=true;
  shootOnUp=true;
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;
  gun.lane=getLaneFromX(x);
  // Tap upper 55% = move up, lower 45% = stay/shoot
  if (y < canvas.height*0.45) moveUp();
  else if (y > canvas.height*0.75) moveDown();
});

canvas.addEventListener("pointermove", e=>{
  if (!isDragging||!alive) return;
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  gun.lane=getLaneFromX(x);
  shootOnUp=false; // drag = don't auto shoot
});

canvas.addEventListener("pointerup", e=>{
  isDragging=false;
  if (shootOnUp&&alive) shoot();
  shootOnUp=false;
});

// ── INIT GAME ────────────────────────────
function initGame() {
  T=THEMES[currentTheme];
  D=DIFFICULTY[currentDiff];
  applyThemeCSS();
  applySkin();

  alive=true;
  gameStarted=true;
  score=0;
  lives=D.lives;
  streak=0;
  roundNumber=1;
  distance=0;
  survivalTime=0;
  fallSpeed=D.fallSpeedBase;
  fallers=[]; bullets=[]; particles=[]; floatTexts=[];
  bossActive=false; boss=null; bossTimer=0;
  gridOffset=0;
  gun.lane=Math.floor(NUM_LANES/2);
  gun.targetY=gunBaseY;
  gun.y=gunBaseY;
  recoil=0;

  gameoverEl.style.opacity=0;
  gameoverEl.style.pointerEvents="none";

  spawnWave();
  updateUI();
}

restartBtn.addEventListener("click",()=>{
  settingsPanel.style.display="none";
  initGame();
});
menuBtn.addEventListener("click",()=>{
  settingsPanel.style.display="none";
  alive=false; gameStarted=false;
  gameoverEl.style.opacity=0;
  modeScreen.style.display="flex";
  updateBestDisplay();
});
settingsBtn.addEventListener("click",()=>{
  settingsPanel.style.display=settingsPanel.style.display==="none"?"block":"none";
  saveSettings();
});
document.addEventListener("pointerdown",e=>{
  if (settingsPanel.style.display==="block"&&!settingsPanel.contains(e.target)&&e.target!==settingsBtn){
    settingsPanel.style.display="none";
    saveSettings();
  }
});
window.addEventListener("touchmove",e=>{
  if(e.touches.length>1) e.preventDefault();
},{passive:false});

// ===========================================
// UPDATE LOOP
// ===========================================
function update(dt) {
  if (!alive||!gameStarted) return;

  bgPulse += dt*0.001;
  distance += dt * fallSpeed * 0.05;
  survivalTime += dt * 0.001;

  // Grid scroll illusion (speed varies with player Y)
  const speedRatio = 1 + (gunBaseY - gun.y) / (gunBaseY - gunMinY + 1) * 0.8;
  gridOffset = (gridOffset + fallSpeed * dt * speedRatio * 0.35) % 48;

  // Gun Y smooth
  gun.y += (gun.targetY - gun.y) * 0.12;
  gun.x += (laneXs[gun.lane] - gun.x) * 0.22;

  // ── FALLERS ──
  fallers.forEach(f=>f.update(dt));

  // ── BULLETS ──
  bullets.forEach(b=>{
    b.life++;
    b.x += Math.cos(b.angle)*b.speed;
    b.y += Math.sin(b.angle)*b.speed;
    if(b.life>b.range) b.dead=true;

    fallers.forEach(f=>{
      if(f.hit) return;
      if(performance.now()-f.spawnTime<f.delay) return;
      const hw=f.w/2, hh=f.h/2;
      const hitMargin = b.hitSize || 5;
      if(b.x>f.x-hw-hitMargin && b.x<f.x+hw+hitMargin && b.y>f.y-hh-hitMargin && b.y<f.y+hh+hitMargin){
        f.hit=true; b.dead=true;
        if(f.type==="heal") {
          healPlayer(f.x,f.y);
        } else {
          const pts=b.damage*(f.type==="danger"?3:1);
          score+=pts; streak++;
          showCombo(streak,f.x,f.y);
          floatTexts.push(new FloatText(f.x,f.y,`+${pts}`,f.color));
          spawnParticles(f.x,f.y,f.color);
          ping(f.type==="danger"?600:500);
        }
        updateUI();
      }
    });

    if(bossActive&&boss&&Math.hypot(b.x-boss.x,b.y-boss.y) < boss.radius + (b.hitSize || 5)){
      bossHP-=b.damage; b.dead=true;
      spawnParticles(boss.x,boss.y,T.boss,4);
    }
  });
  bullets=bullets.filter(b=>!b.dead);

  // ── FALLER vs GUN COLLISION ──
  fallers.forEach(f=>{
    if(f.hit) return;
    if(performance.now()-f.spawnTime<f.delay) return;
    if(f.y+f.h/2>=gun.y-22&&f.y-f.h/2<=gun.y+12){
      // check x overlap (not just lane — because AI can be mid-switch)
      if(Math.abs(f.x-gun.x)<f.w*0.7){
        f.hit=true;
        if(f.type==="heal") healPlayer(f.x,f.y);
        else {
          if (currentSkin === "shield" && shieldActive && f.type === "danger") {
            shieldActive = false;
            shieldIndicator.textContent = "SHIELD DOWN";
            shieldIndicator.classList.remove("active");
            floatTexts.push(new FloatText(f.x,f.y,"SHIELD BLOCKED",T.heal));
            warnSound();
            spawnParticles(f.x,f.y,"#8de3ff",12);
            updateUI();
          } else if (currentSkin === "deadly" && f.type === "danger") {
            floatTexts.push(new FloatText(f.x,f.y,"DEADLY HIT",T.danger));
            endGame();
          } else {
            hitPlayer();
            spawnParticles(f.x,f.y,T.danger);
          }
        }
      }
    }
  });

  // ── ESCAPED FALLERS ──
  fallers.forEach(f=>{
    if(!f.hit&&f.y>canvas.height+70){
      f.hit=true;
      if(f.type==="normal") hitPlayer();
      else if(f.type==="danger") streak=Math.max(0,streak-1);
    }
  });
  fallers=fallers.filter(f=>!f.hit);

  // ── BOSS ──
  if(bossActive&&boss){
    bossTimer+=dt;
    boss.x=canvas.width/2+Math.sin(bossTimer*0.0012)*(canvas.width*0.38);
    // Boss fires danger fallers
    if(Math.floor(bossTimer/1600)>Math.floor((bossTimer-dt)/1600)){
      const l=Math.floor(Math.random()*NUM_LANES);
      fallers.push(new Faller(l,T.boss,0,"danger"));
    }
    if(bossHP<=0){
      bossActive=false; boss=null;
      score+=150; spawnWave(); updateUI();
    }
  }

  // ── WAVE COMPLETE ──
  if(fallers.length===0&&!bossActive&&alive){
    roundNumber++;
    fallSpeed=Math.min(D.fallSpeedBase + roundNumber*D.fallSpeedStep, 0.85);
    if(roundNumber%D.bossEvery===0) spawnBoss();
    else spawnWave();
    updateUI();
  }

  // ── PARTICLES + TEXTS ──
  particles.forEach(p=>p.update(dt));
  particles=particles.filter(p=>!p.dead);
  floatTexts.forEach(t=>t.update(dt));
  floatTexts=floatTexts.filter(t=>!t.dead);
}

// ===========================================
// DRAW LOOP
// ===========================================
function draw() {
  ctx.fillStyle = T.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if (!gameStarted) { drawMenuBg(); return; }

  drawGrid();
  drawLaneDividers();
  drawActiveLane();
  drawFallerTrails();
  fallers.forEach(f=>{ if(performance.now()-f.spawnTime>=f.delay) drawFaller(f); });
  bullets.forEach(b=>drawBullet(b));
  drawGun();
  particles.forEach(p=>drawParticle(p));
  floatTexts.forEach(t=>t.draw());
  if(bossActive&&boss) drawBoss();
  drawProgressBar();
  drawSpeedLines();
}

// ── MENU BACKGROUND ──────────────────────
function drawMenuBg() {
  const g = bgModeSelect.value!=="off";
  if(!g) return;
  const a = 0.04+Math.abs(Math.sin(bgPulse))*0.03;
  drawGridAt(0, a);
}

// ── GRID ─────────────────────────────────
function drawGrid() {
  if(bgModeSelect.value==="off") return;
  const isPulse  = bgModeSelect.value==="pulse";
  const isScroll = bgModeSelect.value==="scroll";
  const baseA = isPulse ? 0.028+Math.abs(Math.sin(bgPulse*0.9))*0.045 : 0.032;
  const off   = isScroll ? gridOffset : 0;
  drawGridAt(off, baseA);
}

function drawGridAt(offset, alpha) {
  const sz=48;
  const cols=Math.ceil(canvas.width/sz)+1;
  const rows=Math.ceil(canvas.height/sz)+2;
  const col=T.grid.replace("{a}",alpha.toFixed(3));

  ctx.save();
  ctx.strokeStyle=col;
  ctx.lineWidth=0.6;
  for(let c=0;c<=cols;c++){
    ctx.beginPath();
    ctx.moveTo(c*sz,0);
    ctx.lineTo(c*sz,canvas.height);
    ctx.stroke();
  }
  for(let r=-1;r<=rows;r++){
    const y=(r*sz+offset)%canvas.height;
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }
  ctx.restore();

  // Lane dash markers (like road markings)
  ctx.save();
  ctx.setLineDash([12,20]);
  ctx.strokeStyle=T.grid.replace("{a}",(alpha*0.6).toFixed(3));
  ctx.lineWidth=1.5;
  for(let i=1;i<NUM_LANES;i++){
    const lx=i*laneWidth;
    for(let r=0;r<Math.ceil(canvas.height/32)+1;r++){
      const y=(r*32+offset*1.4)%canvas.height;
      ctx.beginPath();
      ctx.moveTo(lx,y);
      ctx.lineTo(lx,y+16);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawLaneDividers() {
  ctx.save();
  for(let i=1;i<NUM_LANES;i++){
    const lx=i*laneWidth;
    ctx.beginPath();
    ctx.moveTo(lx,0); ctx.lineTo(lx,canvas.height);
    ctx.strokeStyle=T.grid.replace("{a}","0.08");
    ctx.lineWidth=1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawActiveLane() {
  ctx.save();
  const lx=gun.lane*laneWidth;
  const grd=ctx.createLinearGradient(lx,0,lx,canvas.height);
  grd.addColorStop(0,"rgba(0,0,0,0)");
  grd.addColorStop(0.6,T.lane.replace("{a}","0.04"));
  grd.addColorStop(1,T.lane.replace("{a}","0.13"));
  ctx.fillStyle=grd;
  ctx.fillRect(lx,0,laneWidth,canvas.height);
  ctx.restore();
}

// ── SPEED LINES ──────────────────────────
function drawSpeedLines() {
  const depth=(gun.targetY-gun.y)/(gunBaseY-gunMinY+1);
  if(depth<0.05) return;
  ctx.save();
  ctx.globalAlpha=depth*0.12;
  ctx.strokeStyle=T.accent;
  ctx.lineWidth=1;
  for(let i=0;i<20;i++){
    const x=Math.random()*canvas.width;
    const len=20+Math.random()*60;
    const y=Math.random()*canvas.height*0.7;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x,y+len);
    ctx.stroke();
  }
  ctx.restore();
}

// ── FALLER TRAILS ────────────────────────
function drawFallerTrails() {
  fallers.forEach(f=>{
    f.trail.forEach(t=>{
      ctx.save();
      ctx.globalAlpha=t.a*0.5;
      ctx.fillStyle=f.color;
      ctx.shadowColor=f.color; ctx.shadowBlur=4;
      const tw=f.w*0.4, th=f.h*0.4;
      roundRect(ctx,t.x-tw/2,t.y-th/2,tw,th,3);
      ctx.fill();
      ctx.restore();
    });
  });
}

// ── DRAW FALLER ──────────────────────────
function drawFaller(f) {
  const {x,y,w,h,color,type,aiState,signalSide,signalBlink} = f;

  ctx.save();

  // Glow
  ctx.shadowColor=color;
  ctx.shadowBlur=16+f.glowSize;

  // Body gradient
  const bg=ctx.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);
  if(type==="heal"){
    bg.addColorStop(0,"#fffacc"); bg.addColorStop(0.5,color); bg.addColorStop(1,"#886600");
  } else if(type==="danger"){
    bg.addColorStop(0,"#ffaaaa"); bg.addColorStop(0.5,color); bg.addColorStop(1,"#440000");
  } else if(type==="vehicle"){
    bg.addColorStop(0,"#fff1b8"); bg.addColorStop(0.45,color); bg.addColorStop(1,"#a25d00");
  } else {
    bg.addColorStop(0,lighten(color,55)); bg.addColorStop(0.5,color); bg.addColorStop(1,darken(color,55));
  }
  ctx.fillStyle=bg;
  roundRect(ctx,x-w/2,y-h/2,w,h,7);
  ctx.fill();

  // Shine
  ctx.shadowBlur=0;
  const shine=ctx.createLinearGradient(x-w/2,y-h/2,x-w/2,y);
  shine.addColorStop(0,"rgba(255,255,255,0.3)"); shine.addColorStop(1,"rgba(255,255,255,0)");
  ctx.fillStyle=shine;
  roundRect(ctx,x-w/2+2,y-h/2+2,w-4,h/2-2,5);
  ctx.fill();

  // Icon
  ctx.shadowBlur=8;
  if(type==="heal") {
    ctx.fillStyle="#fff"; ctx.shadowColor="#ffe644";
    ctx.font=`bold ${h*0.7}px sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("♥",x,y+1);
  } else if(type==="danger") {
    ctx.fillStyle="#fff"; ctx.shadowColor=color;
    ctx.font=`bold ${h*0.75}px 'Orbitron',monospace`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("!",x,y+1);
  } else if(type==="vehicle") {
    ctx.shadowBlur=8;
    const carW = w * 0.9;
    const carH = h * 0.5;
    ctx.fillStyle="#ffffff";
    ctx.fillRect(x-carW/2, y-carH/2, carW, carH);
    ctx.fillStyle="rgba(255,255,255,0.85)";
    ctx.fillRect(x-carW*0.28, y-carH*0.38, carW*0.2, carH*0.23);
    ctx.fillRect(x+carW*0.08, y-carH*0.38, carW*0.2, carH*0.23);
    ctx.fillStyle="#222";
    ctx.beginPath(); ctx.arc(x-carW*0.32, y+carH*0.45, carH*0.18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+carW*0.32, y+carH*0.45, carH*0.18, 0, Math.PI*2); ctx.fill();
  }
  ctx.shadowBlur=0;

  // ── TURN INDICATORS ──
  if(aiState==="signalling"||aiState==="switching") {
    // Which side
    const blinkOn = Math.floor(signalBlink/180)%2===0;
    const alpha   = aiState==="switching" ? 0.9 : (blinkOn?0.95:0.1);

    ctx.globalAlpha=alpha;
    ctx.fillStyle  = "#ffbb00";
    ctx.shadowColor= "#ffbb00";
    ctx.shadowBlur = blinkOn ? 14 : 4;

    const indW=6, indH=8;
    const indY=y;

    if(signalSide===1) {
      // Right indicator — little triangle on right side
      ctx.beginPath();
      ctx.moveTo(x+w/2+2,       indY-indH/2);
      ctx.lineTo(x+w/2+2+indW,  indY);
      ctx.lineTo(x+w/2+2,       indY+indH/2);
      ctx.closePath();
      ctx.fill();
      // left indicator dim
      ctx.globalAlpha=0.15;
      ctx.beginPath();
      ctx.moveTo(x-w/2-2,       indY-indH/2);
      ctx.lineTo(x-w/2-2-indW,  indY);
      ctx.lineTo(x-w/2-2,       indY+indH/2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Left indicator
      ctx.beginPath();
      ctx.moveTo(x-w/2-2,       indY-indH/2);
      ctx.lineTo(x-w/2-2-indW,  indY);
      ctx.lineTo(x-w/2-2,       indY+indH/2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha=0.15;
      ctx.beginPath();
      ctx.moveTo(x+w/2+2,       indY-indH/2);
      ctx.lineTo(x+w/2+2+indW,  indY);
      ctx.lineTo(x+w/2+2,       indY+indH/2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur=0;
    ctx.globalAlpha=1;
  }

  ctx.restore();
}

// ── DRAW GUN ─────────────────────────────
function drawGun() {
  ctx.save();
  const gx=gun.x, gy=gun.y;
  const r=Math.max(0,recoil);
  recoil*=0.76;

  // Base
  ctx.fillStyle=T.gunBody;
  ctx.strokeStyle=T.gunBarrel+"88";
  ctx.lineWidth=1.5;
  roundRect(ctx,gx-laneWidth*0.26,gy-10,laneWidth*0.52,28,7);
  ctx.fill(); ctx.stroke();

  // Barrel
  ctx.fillStyle=T.gunBarrel;
  ctx.shadowColor=T.gunBarrel; ctx.shadowBlur=14;
  ctx.fillRect(gx-3,gy-30+r,6,24);

  // Muzzle flash
  if(r>4){
    ctx.fillStyle="#fff";
    ctx.shadowBlur=22;
    ctx.beginPath();
    ctx.arc(gx,gy-30+r,5,0,Math.PI*2);
    ctx.fill();
  }

  // Body
  ctx.shadowBlur=9;
  ctx.fillStyle=T.gunBody;
  ctx.beginPath();
  ctx.arc(gx,gy,14,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle=T.gunBarrel;
  ctx.lineWidth=2;
  ctx.stroke();

  // Crosshair dot
  ctx.fillStyle=T.gunBarrel;
  ctx.shadowBlur=6;
  ctx.beginPath();
  ctx.arc(gx,gy,4,0,Math.PI*2);
  ctx.fill();

  ctx.shadowBlur=0;
  ctx.restore();
}

// ── DRAW BULLET ──────────────────────────
function drawBullet(b) {
  ctx.save();
  if(currentWeapon==="sniper"){
    ctx.fillStyle="#ff2244"; ctx.shadowColor="#ff0022"; ctx.shadowBlur=14;
    ctx.fillRect(b.x-1.5,b.y-14,3,24);
  } else if(currentWeapon==="spread"){
    ctx.fillStyle="#00ffff"; ctx.shadowColor="#00ffff"; ctx.shadowBlur=10;
    ctx.fillRect(b.x-2.5,b.y-7,5,16);
  } else {
    ctx.fillStyle="#fff"; ctx.shadowColor=T.accent; ctx.shadowBlur=8;
    ctx.fillRect(b.x-2,b.y-9,4,18);
  }
  ctx.shadowBlur=0;
  ctx.restore();
}

// ── DRAW PARTICLE ────────────────────────
function drawParticle(p) {
  ctx.save();
  ctx.globalAlpha=p.alpha;
  ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6;
  ctx.beginPath();
  ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.restore();
}

// ── DRAW BOSS ────────────────────────────
function drawBoss() {
  ctx.save();
  ctx.shadowColor=T.boss; ctx.shadowBlur=28;

  // Outer ring
  ctx.beginPath();
  ctx.arc(boss.x,boss.y,boss.radius,0,Math.PI*2);
  ctx.strokeStyle=T.boss; ctx.lineWidth=6; ctx.stroke();

  // Core
  const cg=ctx.createRadialGradient(boss.x,boss.y,8,boss.x,boss.y,boss.radius-8);
  cg.addColorStop(0,lighten(T.boss,50)); cg.addColorStop(1,darken(T.boss,80));
  ctx.fillStyle=cg;
  ctx.beginPath();
  ctx.arc(boss.x,boss.y,boss.radius-8,0,Math.PI*2);
  ctx.fill();
  ctx.shadowBlur=0;

  // HP bar
  const bw=200;
  ctx.fillStyle="#111";
  ctx.fillRect(boss.x-bw/2,boss.y-boss.radius-22,bw,10);
  const hg=ctx.createLinearGradient(boss.x-bw/2,0,boss.x+bw/2,0);
  hg.addColorStop(0,T.boss); hg.addColorStop(1,T.accent);
  ctx.fillStyle=hg;
  ctx.fillRect(boss.x-bw/2,boss.y-boss.radius-22,bw*(bossHP/bossMaxHP),10);
  ctx.fillStyle="#fff";
  ctx.font="bold 11px 'Orbitron',monospace";
  ctx.textAlign="center";
  ctx.fillText("⚡ BOSS",boss.x,boss.y-boss.radius-27);
  ctx.restore();
}

// ── PROGRESS BAR ─────────────────────────
function drawProgressBar() {
  const total=Math.min(4+Math.floor(roundNumber*0.8),D.maxFallers);
  const prog=Math.max(0,1-fallers.length/total);
  ctx.save();
  ctx.fillStyle="rgba(255,255,255,0.05)";
  ctx.fillRect(0,0,canvas.width,5);
  ctx.fillStyle=T.accent;
  ctx.shadowColor=T.accent; ctx.shadowBlur=8;
  ctx.fillRect(0,0,canvas.width*prog,5);
  ctx.shadowBlur=0;
  ctx.restore();
}

// ── UTILS ────────────────────────────────
function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function adjustColor(hex,amt) {
  if(!hex||hex[0]!=="#") return hex;
  let r=parseInt(hex.slice(1,3),16)||0;
  let g=parseInt(hex.slice(3,5),16)||0;
  let b=parseInt(hex.slice(5,7),16)||0;
  return `rgb(${clamp(r+amt)},${clamp(g+amt)},${clamp(b+amt)})`;
}
function clamp(v){return Math.min(255,Math.max(0,Math.round(v)));}
function lighten(h,a){return adjustColor(h,a);}
function darken(h,a){return adjustColor(h,-a);}

// ── GAME LOOP ────────────────────────────
let last=performance.now();
function loop(t) {
  const dt=Math.min(t-last,50); // cap dt to avoid spiral of death
  last=t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* PWA */
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;});
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
