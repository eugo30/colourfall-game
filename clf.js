// =====================
// 🌍 GLOBAL STATE
// =====================
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

let alive = true;
let score = 0;
let lives = 3;
let streak = 0;
let roundNumber = 1;
let coins = 0;

let bgColorStatic = "#071c1f";

// =====================
// 💰 ECONOMY / UPGRADES
// =====================
const upgrades = {
  damage: 1,
  fireRate: 1,
  speed: 1
};

// =====================
// 👑 BOSS SYSTEM
// =====================
let boss = null;
let bossActive = false;
let bossHP = 0;
let bossMaxHP = 0;
let bossTimer = 0;

// =====================
// 🎯 GAME OBJECTS
// =====================
let waveBatches = [];
let bullets = [];
let particles = [];

let waveSpeed = 0.2;
let lastHitTime = 0;




// =====================
// 💀 DAMAGE LOCK (ANTI SPAM)
// =====================
let damageLock = false;

// =====================
// 🔫 GUN + INPUT
// =====================
let gun = { x: 0, y: 0, angle: -Math.PI / 2 };
let cursor = { x: 0, y: 0 };
let recoil = 0;

// =====================
// 🧱 WEAPONS
// =====================
const weapons = {
  basic:  { name:"Basic",  fireRate:300, speed:10, spread:0,    damage:1, range:60 },
  spread: { name:"Spread", fireRate:500, speed:9,  spread:0.25, damage:1, range:50 },
  sniper: { name:"Sniper", fireRate:800, speed:16, spread:0,    damage:3, range:120 }
};

let currentWeapon = "basic";
let lastShot = 0;

// =====================
// 🖥 UI ELEMENTS
// =====================
const ui = document.getElementById("ui");
const leaderboard = document.getElementById("leaderboard");
const gameoverEl = document.getElementById("gameover");
const comboEl = document.getElementById("combo");
const restartBtn = document.getElementById("restart");

const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

// settings
const soundToggle = document.getElementById("soundToggle");
const volumeSlider = document.getElementById("volumeSlider");
const waveColorSelect = document.getElementById("waveColorSelect");
const bgModeSelect = document.getElementById("bgModeSelect");
const particleIntensity = document.getElementById("particleIntensity");
const comboGlow = document.getElementById("comboGlow");

// weapon buttons
const weaponButtons = document.querySelectorAll(".weapon");

// =====================
// 🎯 WEAPON SWITCH UI
// =====================
weaponButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    currentWeapon = btn.dataset.w;

    weaponButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    recoil = 6;
  });
});

// keyboard switch
let weaponKeys = Object.keys(weapons);
let weaponIndex = 0;

window.addEventListener("keydown", e=>{
  if(e.key === "q"){
    weaponIndex = (weaponIndex + 1) % weaponKeys.length;
    currentWeapon = weaponKeys[weaponIndex];
  }
});

//sound engineer
canvas.addEventListener("pointerdown", ()=>{
  if(audio.state === "suspended"){
    audio.resume();
  }
}, { once:true });



function shootSound(){
  if(!soundToggle.checked) return;

  const o = audio.createOscillator();
  const g = audio.createGain();

  o.type = "square"; // punchy

  o.frequency.value = 200 + Math.random()*50;

  g.gain.value = 0.1;

  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);

  o.connect(g);
  g.connect(audio.destination);

  o.start();
  o.stop(audio.currentTime + 0.08);
}


// =====================
// 🧠 STORAGE (SCORES)
// =====================
let highScore = parseInt(localStorage.getItem('waveHighScore')) || 0;
let lastScores = JSON.parse(localStorage.getItem('waveLastScores')) || [];

// =====================
// ⚙️ SETTINGS SAVE/LOAD
// =====================
function saveSettings(){ 
  localStorage.setItem('waveSettings', JSON.stringify({
    soundToggle: soundToggle.checked,
    volumeSlider: volumeSlider.value,
    waveColorSelect: waveColorSelect.value,
    bgModeSelect: bgModeSelect.value,
    particleIntensity: particleIntensity.value,
    comboGlow: comboGlow.checked
  }));
}

function loadSettings(){ 
  const s = JSON.parse(localStorage.getItem('waveSettings'));
  if(s){
    soundToggle.checked = s.soundToggle;
    volumeSlider.value = s.volumeSlider;
    waveColorSelect.value = s.waveColorSelect;
    bgModeSelect.value = s.bgModeSelect;
    particleIntensity.value = s.particleIntensity;
    comboGlow.checked = s.comboGlow;
  }
}

loadSettings();

// =====================
// 🎨 ROUND COLORS
// =====================
const roundColors = [
  {green:"#00ff66", blue:"#3399ff"},
  {green:"#33ff99", blue:"#66ccff"},
  {green:"#66ffcc", blue:"#99ddff"},
  {green:"#99ffcc", blue:"#aaddff"},
  {green:"#ccff99", blue:"#bbddff"}
];

let currentColorSet = 0;

// =====================
// 📐 RESIZE + INPUT
// =====================
function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  gun.x = canvas.width / 2;
  gun.y = canvas.height - 70;
}
window.addEventListener("resize", resize);
resize();

// mouse
canvas.addEventListener("mousemove", e=>{
  const r = canvas.getBoundingClientRect();
  cursor.x = e.clientX - r.left;
  cursor.y = e.clientY - r.top;
});

// touch
canvas.addEventListener("touchmove", e=>{
  const r = canvas.getBoundingClientRect();
  cursor.x = e.touches[0].clientX - r.left;
  cursor.y = e.touches[0].clientY - r.top;
});

// drag gun
let isDragging = false;

canvas.addEventListener("pointerdown", ()=> isDragging = true);
canvas.addEventListener("pointerup", ()=> isDragging = false);

canvas.addEventListener("pointermove", e=>{
  if(isDragging){
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;

    gun.x = Math.max(40, Math.min(canvas.width - 40, x));
  }
});

// =====================
// 🔊 AUDIO
// =====================
const audio = new (window.AudioContext||window.webkitAudioContext)();

function ping(freq=440){
  if(!soundToggle.checked) return;

  const o = audio.createOscillator();
  const g = audio.createGain();

  o.frequency.value = freq * (1 + streak * 0.05);
  g.gain.value = parseFloat(volumeSlider.value) + streak * 0.02;

  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);

  o.connect(g);
  g.connect(audio.destination);

  o.start();
  o.stop(audio.currentTime + 0.1);
}

// =====================
// ✨ PARTICLES
// =====================
class Particle{
  constructor(x,y,color,type="normal"){
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;

    this.vx = (Math.random()-0.5)*2;
    this.vy = Math.random()*2 + 1;

    this.alpha = 1;
    this.radius = Math.random()*3+2;
    this.dead = false;
  }

  update(dt){
    this.vy += 0.05;

    this.x += this.vx * dt*0.1;
    this.y += this.vy * dt*0.1;

    if(this.y > canvas.height - 40){
      this.alpha -= 0.03;
    }

    if(this.alpha <= 0) this.dead = true;
  }
}




// Wave class
// =====================
// 🌊 WAVE CLASS (UPGRADED)
// =====================
class Wave{
  constructor(x,color,delay,dx=0,radius=25){
    this.x = x;
    this.y = -30;
    this.color = color;

    this.tapped = false;

    this.delay = delay;
    this.spawnTime = performance.now();

    this.dx = dx;
    this.baseRadius = radius;
    this.radius = radius;

    this.sway = Math.random()*0.6 - 0.3;
    this.rotation = Math.random()*0.1 - 0.05;

    this.bounce = 0;
    this.phase = Math.random() * Math.PI * 2; // NEW (natural movement offset)
  }

  update(dt){
    if(performance.now() - this.spawnTime < this.delay) return;

    let speedFactor = 1 + streak * 0.08;

    // smoother fall
    this.y += waveSpeed * dt * speedFactor;

    // organic horizontal motion
    this.x += (this.sway + Math.sin(this.y*0.01 + this.phase)*0.5) * dt * 0.05 * speedFactor;

    // rotation
    this.rotation += Math.sin(this.y*0.01) * 0.002;

    // bounce effect
    if(this.bounce > 0){
      this.radius = this.baseRadius + this.bounce;
      this.bounce -= dt * 0.015;
    } else {
      this.radius = this.baseRadius;
    }
  }
}




// Round pattern
const wavePattern = [
  {color:"green"}, {color:"green"}, {color:"blue"},
  {color:"green"}, {color:"blue"}, {color:"green"},
  {color:"green"}, {color:"blue"}
];

function spawnRound(){
  waveBatches = [];

  wavePattern.forEach((w,i)=>{
    let x = canvas.width * (0.1 + Math.random()*0.8);

    // smoother direction logic
    let dx = (Math.random() - 0.5) * 0.2;

    let radius = 22 + Math.random()*6;

    let color = w.color==="green"
      ? roundColors[currentColorSet].green
      : roundColors[currentColorSet].blue;

    let delay = i * (150 + Math.random()*100); // less robotic timing

    waveBatches.push(new Wave(x, color, delay, dx, radius));
  });
}




// =====================
// 🔫 SHOOT SYSTEM
// =====================
function shoot(){
  let now = performance.now();
  let w = weapons[currentWeapon];

  let fireDelay = w.fireRate / upgrades.fireRate;

  if(now - lastShot < fireDelay) return;
  lastShot = now;

  let shots = currentWeapon === "spread" ? 3 : 1;

  for(let i=0;i<shots;i++){
    let angleOffset = (i - (shots-1)/2) * w.spread;

    bullets.push({
      x: gun.x,
      y: gun.y,
      angle: gun.angle + angleOffset,
      life: 0,
      speed: w.speed * upgrades.speed,
      damage: w.damage * upgrades.damage,
      range: w.range
      
    });
  }
  shootSound();
  recoil = 10;
}


// Input
// Input
canvas.addEventListener("pointerdown", e=>{
  if(!alive){ reset(); return; }

  const x = e.clientX;
  const y = e.clientY;

  let hit = false;

  for(let w of waveBatches){
    if(!w.tapped && Math.hypot(x-w.x, y-w.y) < w.radius){
  
      w.tapped = true;
  
      // =====================
      // 🎯 SCORE
      // =====================
      score += 2;
  
      // =====================
      // 🔥 COMBO
      // =====================
      streak++;
  
      // =====================
      // 💰 COIN MULTIPLIER
      // =====================
      let comboMultiplier = 1 + Math.floor(streak / 5); 
      let earnedCoins = comboMultiplier;
  
      coins += earnedCoins;
  
      // =====================
      // 💥 FEEDBACK
      // =====================
      recoil = 6;
      w.bounce = 10;
  
      ping(500);
      spawnParticles(w.x, w.y, w.color);
  
      // 🔥 COMBO VISUAL
      showCombo(streak, w.x, w.y);
  
      updateUI();
  
      return;
    }
  }

  if(!hit){
    shoot();

    streak = 0;
     
  }
});



// Combo popup
// =====================
// 🔥 COMBO POPUP (UPGRADED)
// =====================
let comboTimeout = null;

function showCombo(streak, x, y){
  if(streak < 2 || !comboGlow.checked) return;

  // clear previous animation (prevents flicker spam)
  if(comboTimeout) clearTimeout(comboTimeout);

  comboEl.textContent = `Combo x${streak}!`;

  // position
  comboEl.style.left = x + "px";
  comboEl.style.top = (y - 20) + "px";

  // scale effect (stronger combo = bigger text)
  let scale = 1 + Math.min(streak * 0.1, 1);
  comboEl.style.transform = `scale(${scale})`;

  // glow intensity
  comboEl.style.textShadow = `0 0 ${10 + streak*2}px rgba(0,255,150,0.8)`;

  // show
  comboEl.style.opacity = 1;

  // slight upward motion (smooth feel)
  let startY = y - 20;
  let float = 0;

  function animate(){
    float += 1.5;
    comboEl.style.top = (startY - float) + "px";

    if(float < 20){
      requestAnimationFrame(animate);
    }
  }
  animate();

  // fade out
  comboTimeout = setTimeout(()=>{
    comboEl.style.opacity = 0;
  }, 400);
}








// Spawn particles
function spawnParticles(x,y,color){
  let base = particleIntensity.value==="low"?3:
             particleIntensity.value==="medium"?6:10;

  for(let i=0;i<base;i++){
    let isDanger = Math.random() < 0.2;

    particles.push(new Particle(
      x,
      y,
      isDanger ? "#ff3333" : color,
      isDanger ? "danger" : "normal"
    ));
  }
}

//boss
function spawnBoss(){
  bossActive = true;

  bossMaxHP = 50 + roundNumber * 12;
  bossHP = bossMaxHP;

  boss = {
    x: canvas.width/2,
    y: 120,
    radius: 80,
    phase: 0,
    attackCooldown: 0
  };
}










 

 





// Update UI
function updateUI(){
  ui.textContent = `Round: ${roundNumber} | Score: ${score} | Lives: ${lives} | High Score: ${highScore}| Coins: ${coins}| Gun: ${weapons[currentWeapon].name}`;
  leaderboard.textContent = `Last Scores: ${lastScores.length>0?lastScores.join(', '):'-'}`;
}

// Game loop
let last = performance.now();
function loop(t){
  const dt = t-last;
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);


let hitCooldown = false;

// =====================
// 🎮 UPDATE LOOP
// =====================

function update(dt){
  if(!alive) return;

  // =====================
  // 🎯 AUTO AIM
  // =====================
  let dx = cursor.x - gun.x;
  let dy = cursor.y - gun.y;
  let target = Math.atan2(dy, dx);
  gun.angle += (target - gun.angle) * 0.15;

  // =====================
  // 🌊 UPDATE WAVES
  // =====================
  waveBatches.forEach(w => w.update(dt));

  // =====================
  // 🔫 BULLETS
  // =====================
  bullets.forEach(b=>{
    b.life++;

    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;

    // swing motion
    b.x += Math.sin(b.life * 0.15) * 1.5;

    // range limit
    if(b.life > b.range){
      b.dead = true;
    }

    // 🎯 HIT WAVES
    waveBatches.forEach(w=>{
      if(!w.tapped && Math.hypot(b.x-w.x, b.y-w.y) < w.radius){
        w.tapped = true;

        score += b.damage;
        streak++;

        spawnParticles(w.x, w.y, w.color);
        b.dead = true;
      }
    });

    // 👑 HIT BOSS (FIXED HERE)
    if(bossActive && boss){
      let dist = Math.hypot(b.x - boss.x, b.y - boss.y);

      if(dist < boss.radius){
        bossHP -= b.damage;
        b.dead = true;

        spawnParticles(boss.x, boss.y, "#ff00ff");
      }
    }
  });

  bullets = bullets.filter(b => !b.dead);

  // =====================
  // 💀 DAMAGE HANDLER
  // =====================
  function hitPlayer(){
    if(hitCooldown) return;
    hitCooldown = true;

    lives--;
    streak = 0;
    recoil = 12;

    spawnParticles(gun.x, gun.y, "#ff4444");

    if(lives <= 0){
      alive = false;
      gameoverEl.style.opacity = 1;

      lastScores.push(score);
      if(lastScores.length > 5) lastScores.shift();
      localStorage.setItem('waveLastScores', JSON.stringify(lastScores));

      if(score > highScore){
        highScore = score;
        localStorage.setItem('waveHighScore', highScore);
      }
    }

    updateUI();

    setTimeout(()=> hitCooldown = false, 200); // 👈 anti-spam damage
  }

  // =====================
  // 💥 WAVE → GUN COLLISION
  // =====================
  waveBatches.forEach(w=>{
    if(!w.tapped){
      let dist = Math.hypot(w.x - gun.x, w.y - gun.y);

      if(dist < w.radius + 20){
        w.tapped = true;
        hitPlayer();
      }
    }
  });

  // =====================
  // ☠️ PARTICLE → GUN COLLISION
  // =====================
  particles.forEach(p=>{
    if(!p.dead && p.type === "danger"){
      let dist = Math.hypot(p.x - gun.x, p.y - gun.y);

      if(dist < 20){
        p.dead = true;
        hitPlayer();
      }
    }
  });

  // =====================
  // 🧹 CLEAN WAVES
  // =====================
  waveBatches.forEach(w=>{
    if(!w.tapped && w.y > canvas.height + 50){
      w.tapped = true;
      hitPlayer();
    }
  });

  waveBatches = waveBatches.filter(w => !w.tapped);

  // =====================
  // 👑 BOSS UPDATE
  // =====================
  if(bossActive && boss){
    bossTimer += dt;

    // movement
    boss.x += Math.sin(bossTimer * 0.002) * 2;

    // death
    if(bossHP <= 0){
      bossActive = false;
      boss = null;

      score += 100;
      spawnRound();
    }
  }

  // =====================
  // 🔁 ROUND FLOW
  // =====================
  if(waveBatches.length === 0 && alive){
    roundNumber++;

    if(roundNumber % 5 === 0){
      spawnBoss();
    } else {
      waveSpeed += 0.03;
      currentColorSet = (currentColorSet+1)%roundColors.length;
      spawnRound();
    }

    updateUI();
  }

  // =====================
  // ✨ PARTICLES
  // =====================
  particles.forEach(p => p.update(dt));
  particles = particles.filter(p => !p.dead);

  // =====================
  // 🌌 BACKGROUND
  // =====================
  if(bgModeSelect.value === "subtle"){
    let r = 10 + Math.random()*10;
    let g = 12 + Math.random()*10;
    let b = 31 + Math.random()*10;
    bgColorStatic = `rgb(${r},${g},${b})`;
  }
}


// DRAW
 
function draw(){

  // =====================
  // 🎨 BACKGROUND
  // =====================
  ctx.fillStyle = bgModeSelect.value==="off" ? "#071c1f" : bgColorStatic;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // =====================
  // 🔫 GUN
  // =====================
  ctx.save();
  let r = recoil;
  recoil *= 0.8;

  ctx.translate(gun.x, gun.y);
  ctx.rotate(gun.angle);

  ctx.fillStyle = "#ccc";
  ctx.fillRect(-r, -4, 30, 8);

  ctx.beginPath();
  ctx.arc(0,0,12,0,Math.PI*2);
  ctx.fillStyle = "#555";
  ctx.fill();

  ctx.restore();

  // =====================
  // ⭕ ROUND PROGRESS
  // =====================
  let radius = Math.min(canvas.width,canvas.height)/2 - 40;

  ctx.beginPath();
  ctx.strokeStyle="rgba(255,255,255,0.15)";
  ctx.lineWidth=6;
  ctx.arc(canvas.width/2,canvas.height/2,radius,0,Math.PI*2);
  ctx.stroke();

  let progress = (8-waveBatches.length)/8;

  ctx.beginPath();
  ctx.strokeStyle=roundColors[currentColorSet].green;
  ctx.lineWidth=6;
  ctx.arc(canvas.width/2,canvas.height/2,radius,-Math.PI/2, -Math.PI/2 + progress*Math.PI*2);
  ctx.stroke();

  // =====================
  // 🌊 WAVES
  // =====================
  for(let w of waveBatches){

    let gradient = ctx.createRadialGradient(
      w.x,w.y,w.radius*0.3,
      w.x,w.y,w.radius
    );

    gradient.addColorStop(0,"#fff");
    gradient.addColorStop(0.3,w.color);
    gradient.addColorStop(1,"#000");

    ctx.fillStyle = gradient;
    ctx.shadowColor = w.color;
    ctx.shadowBlur = 12 + streak*2;

    ctx.save();
    ctx.translate(w.x,w.y);
    ctx.rotate(w.rotation);

    ctx.beginPath();
    ctx.arc(0,0,w.radius,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  // =====================
  // 💥 BULLETS
  // =====================
  bullets.forEach(b=>{

    if(currentWeapon === "sniper"){
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(b.x, b.y, 2, 16);
    }
    else if(currentWeapon === "spread"){
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(b.x, b.y, 4, 8);
    }
    else{
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x, b.y, 3, 10);
    }

  });

  // =====================
  // ✨ PARTICLES
  // =====================
  particles.forEach(p=>{
    ctx.globalAlpha = p.alpha;

    if(p.type==="danger"){
      ctx.fillStyle = "#ff3333";
      ctx.shadowColor = "red";
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });

  // =====================
  // 👑 BOSS (FIXED POSITION)
  // =====================
  if(bossActive && boss){

    ctx.save();

    // glow ring
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI*2);
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 8;
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 20;
    ctx.stroke();

    // core
    ctx.fillStyle = "#330033";
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius-10, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();

    // HP BAR
    ctx.fillStyle = "#222";
    ctx.fillRect(boss.x - 100, boss.y - 120, 200, 10);

    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(
      boss.x - 100,
      boss.y - 120,
      (bossHP / bossMaxHP) * 200,
      10
    );
  }
}




// Restart
function reset(){
  alive=true; score=0; lives=3; roundNumber=1; waveSpeed=0.2; streak=0; currentColorSet=0; bgColorStatic="#071c1f";
  gameoverEl.style.opacity=0;
  spawnRound();
  updateUI();
}
restartBtn.addEventListener("click", reset);

// Settings toggle
settingsBtn.addEventListener("click", ()=>{ settingsPanel.style.display = settingsPanel.style.display==="none"?"block":"none"; saveSettings(); });

// Start first round
spawnRound();
updateUI();




  // Prevent pinch/zoom entirely
window.addEventListener('touchmove', function(e) {
  if(e.touches.length > 1){
    e.preventDefault();
  }
}, { passive: false });
  
// settings close when touch outside
  document.addEventListener("pointerdown", (e) => {
  if (
    settingsPanel.style.display === "block" &&
    !settingsPanel.contains(e.target) &&
    e.target !== settingsBtn
  ) {
    settingsPanel.style.display = "none";
    saveSettings();
  }
});

/* ------------------ PWA INSTALL ------------------ */
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});

installBtn.onclick = ()=>{
  deferredPrompt.prompt();
  installBtn.style.display = "none";
};

/* ------------------ SERVICE WORKER ------------------ */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
