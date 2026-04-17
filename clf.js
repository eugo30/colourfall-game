
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const ui = document.getElementById("ui");
const leaderboard = document.getElementById("leaderboard");
const gameoverEl = document.getElementById("gameover");
const comboEl = document.getElementById("combo");
const restartBtn = document.getElementById("restart");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

// Settings Elements
const soundToggle = document.getElementById("soundToggle");
const volumeSlider = document.getElementById("volumeSlider");
const waveColorSelect = document.getElementById("waveColorSelect");
const bgModeSelect = document.getElementById("bgModeSelect");
const particleIntensity = document.getElementById("particleIntensity");
const comboGlow = document.getElementById("comboGlow");

let alive = true, score = 0, lives = 3, roundNumber = 1, streak=0;
let waveBatches = [], waveSpeed = 0.2, particles=[];
let bgColorStatic = "#071c1f";

// Gun system
let gun = { x: 0, y: 0, angle: -Math.PI/2 };
let bullets = [];
let recoil = 0;

// ===== CURSOR =====
let cursor = { x:0, y:0 };

// High score & history
let highScore = parseInt(localStorage.getItem('waveHighScore')) || 0;
let lastScores = JSON.parse(localStorage.getItem('waveLastScores')) || [];

// Save/load settings
function saveSettings(){ 
  localStorage.setItem('waveSettings',JSON.stringify({
    soundToggle:soundToggle.checked,
    volumeSlider:volumeSlider.value,
    waveColorSelect:waveColorSelect.value,
    bgModeSelect:bgModeSelect.value,
    particleIntensity:particleIntensity.value,
    comboGlow:comboGlow.checked
  }));
}
function loadSettings(){ 
  const s = JSON.parse(localStorage.getItem('waveSettings'));
  if(s){
    soundToggle.checked=s.soundToggle;
    volumeSlider.value=s.volumeSlider;
    waveColorSelect.value=s.waveColorSelect;
    bgModeSelect.value=s.bgModeSelect;
    particleIntensity.value=s.particleIntensity;
    comboGlow.checked=s.comboGlow;
  }
}
loadSettings();

// Round color sets
const roundColors = [
  {green:"#00ff66", blue:"#3399ff"},
  {green:"#33ff99", blue:"#66ccff"},
  {green:"#66ffcc", blue:"#99ddff"},
  {green:"#99ffcc", blue:"#aaddff"},
  {green:"#ccff99", blue:"#bbddff"}
];
let currentColorSet = 0;



// Resize
function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gun.x = canvas.width/2;
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
  
  // touch (for phone)
  canvas.addEventListener("touchmove", e=>{
    const r = canvas.getBoundingClientRect();
    cursor.x = e.touches[0].clientX - r.left;
    cursor.y = e.touches[0].clientY - r.top;
  });


// Audio
const audio = new (window.AudioContext||window.webkitAudioContext)();
function ping(freq=440){
  if(!soundToggle.checked) return;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.frequency.value=freq*(1+streak*0.05); 
  g.gain.value=parseFloat(volumeSlider.value) + streak*0.02;
  g.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+0.1);
  o.connect(g); g.connect(audio.destination);
  o.start(); o.stop(audio.currentTime+0.1);
}

// Particle
class Particle{
  constructor(x,y,color){
    this.x=x; this.y=y;
    this.vx=(Math.random()-0.5)*2;
    this.vy=-Math.random()*2;
    this.alpha=1;
    this.radius=Math.random()*3+2;
    this.color=color;
  }
  update(dt){
    this.x+=this.vx*dt*0.1;
    this.y+=this.vy*dt*0.1;
    this.alpha-=dt*0.001;
  }
}
// Wave class
class Wave{
  constructor(x,color,delay,dx=0,radius=25){
    this.x=x; this.y=-30; this.color=color; this.tapped=false;
    this.delay=delay; this.spawnTime=performance.now(); this.dx=dx; this.radius=radius;
    this.sway=Math.random()*0.6-0.3; this.bounce=0; this.rotation=Math.random()*0.1-0.05;
  }
  update(dt){
    if(performance.now()-this.spawnTime>=this.delay){
      let speedFactor = 1 + streak*0.1;
      this.y += waveSpeed*dt*speedFactor;
      this.x += (this.sway+Math.sin(this.y*0.01)*0.5)*dt*0.05*speedFactor;
      this.rotation += Math.sin(this.y*0.01)*0.002*speedFactor;
      if(this.bounce>0) this.radius = 25 + this.bounce;
      else this.radius = 25;
      if(this.bounce>0) this.bounce -= dt*0.01;
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
    let x = canvas.width*0.1 + Math.random()*canvas.width*0.8;
    let dx = 0; if(i%3===0) dx=-0.1; if(i%3===2) dx=0.1;
    let radius = 22 + Math.random()*6;
    let color = w.color==="green"?roundColors[currentColorSet].green:roundColors[currentColorSet].blue;
    waveBatches.push(new Wave(x,color,i*200,dx,radius));
  });
}




// Input
// Input
canvas.addEventListener("pointerdown", e=>{
    if(!alive){ reset(); return;}
  
    const x=e.clientX, y=e.clientY;
    
    let hit=false;
  
    for(let w of waveBatches){
      if(!w.tapped){
        if(Math.hypot(x-w.x,y-w.y)<w.radius){
          w.tapped=true;
          score+=2;
          streak++;
          recoil=6;
          ping(500);
          spawnParticles(w.x,w.y,w.color);
          updateUI();
          hit=true;
          return;
        }
      }
    }
  
    if(!hit){
      bullets.push({x:gun.x,y:gun.y,angle:gun.angle,life:0});
      recoil=8;
      streak=0;
    }
  });




// Combo popup
function showCombo(streak,x,y){
  if(streak<2 || !comboGlow.checked) return;
  comboEl.textContent = `Combo x${streak}!`;
  comboEl.style.left = x + "px";
  comboEl.style.top = y-30 + "px";
  comboEl.style.opacity=1;
  setTimeout(()=>{ comboEl.style.opacity=0; },300);
}



// Spawn particles
function spawnParticles(x,y,color){
  let count = particleIntensity.value==="low"?3: particleIntensity.value==="medium"?5:8;
  for(let i=0;i<count;i++) particles.push(new Particle(x,y,color));
}

// Update UI
function updateUI(){
  ui.textContent = `Round: ${roundNumber} | Score: ${score} | Lives: ${lives} | High Score: ${highScore}`;
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



function update(dt){
  if(!alive) return;

 // auto aim
 let dx = cursor.x - gun.x;
 let dy = cursor.y - gun.y;
 let target = Math.atan2(dy,dx);
 gun.angle += (target - gun.angle) * 0.2;

  waveBatches.forEach(w=>w.update(dt));

 // bullets
 bullets.forEach(b=>{
    b.life++;
    b.x+=Math.cos(b.angle)*10;
    b.y+=Math.sin(b.angle)*10;
    b.x+=Math.sin(b.life*0.2)*2;

    waveBatches.forEach(w=>{
      if(!w.tapped && Math.hypot(b.x-w.x,b.y-w.y)<w.radius){
        w.tapped=true;
        score++;
        streak++;
        spawnParticles(w.x,w.y,w.color);
        b.life=999;
      }
    });
  });

  bullets=bullets.filter(b=>b.life<60);


  // remove tapped or missed waves
  waveBatches.forEach(w=>{
    if(!w.tapped && w.y>canvas.height+30){
      w.tapped=true;
      lives--;
      streak=0;
      if(lives<=0){
        alive=false;
        gameoverEl.style.opacity=1;
        lastScores.push(score);
        if(lastScores.length>5) lastScores.shift();
        localStorage.setItem('waveLastScores',JSON.stringify(lastScores));
        if(score>highScore){ highScore = score; localStorage.setItem('waveHighScore',highScore); }
        updateUI();
      }
    }
  });
  waveBatches = waveBatches.filter(w=>!w.tapped);

  // Round complete
  if(waveBatches.length===0 && alive){
    roundNumber++;
    waveSpeed += 0.03;
    currentColorSet = (currentColorSet+1)%roundColors.length; // shift colors per round
    spawnRound();
    updateUI();
  }

  // Update particles
  particles.forEach(p=>p.update(dt));
  particles = particles.filter(p=>p.alpha>0);

  // Optional subtle background color
  if(bgModeSelect.value==="subtle"){
    let r = 10 + Math.random()*10, g=12+Math.random()*10, b=31+Math.random()*10;
    bgColorStatic = `rgb(${r},${g},${b})`;
  }
}



// DRAW
 
function draw(){
  // Background
  ctx.fillStyle = bgModeSelect.value==="off"?"#071c1f":bgColorStatic;
  ctx.fillRect(0,0,canvas.width,canvas.height);



 // gun
 ctx.save();
 let r=recoil; recoil*=0.8;
 ctx.translate(gun.x,gun.y);
 ctx.rotate(gun.angle);
 ctx.fillStyle="#ccc";
 ctx.fillRect(-r,-4,30,8);
 ctx.beginPath();
 ctx.arc(0,0,12,0,Math.PI*2);
 ctx.fillStyle="#555";
 ctx.fill();
 ctx.restore();



  // Draw wave progress circle
  let radius = Math.min(canvas.width,canvas.height)/2-40;
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

  // Draw waves
  for(let w of waveBatches){
    let gradient = ctx.createRadialGradient(w.x,w.y,w.radius*0.3,w.x,w.y,w.radius);
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

  // bullets
  bullets.forEach(b=>{
    ctx.fillStyle="#0ff";
    ctx.fillRect(b.x,b.y,3,10);
  });



  // Draw particles
  particles.forEach(p=>{
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
  });
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
