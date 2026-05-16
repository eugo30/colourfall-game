@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

/* ── BASE ── */
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: #050d10;
  overflow: hidden;
  font-family: 'Share Tech Mono', monospace;
  touch-action: none;
}
canvas { display: block; position: fixed; inset: 0; }

/* ── HUD ── */
#ui {
  position: fixed;
  top: 10px; left: 10px;
  color: var(--accent, #00ffcc);
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 700;
  background: rgba(0,0,0,0.55);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(0,255,180,0.2);
  letter-spacing: 0.05em;
  z-index: 10;
  max-width: 70vw;
  line-height: 1.6;
}
#leaderboard {
  position: fixed;
  bottom: 56px; left: 10px;
  color: rgba(255,255,255,0.3);
  font-size: 10px;
  background: rgba(0,0,0,0.3);
  padding: 4px 10px;
  border-radius: 5px;
  z-index: 10;
}

#statusIndicators {
  position: fixed;
  top: 10px; right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 12;
}

.indicator {
  padding: 8px 12px;
  border-radius: 10px;
  min-width: 140px;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.55);
  box-shadow: 0 0 18px rgba(0,0,0,0.25);
}

.indicator.shield {
  color: #8de3ff;
  border-color: rgba(64,219,255,0.35);
  background: rgba(12,40,58,0.90);
}

.indicator.shield.active {
  background: rgba(16,70,110,0.98);
  box-shadow: 0 0 22px rgba(56,220,255,0.32);
}

.indicator.danger {
  color: #ff9f9f;
  border-color: rgba(255,90,90,0.4);
  background: rgba(80,12,16,0.94);
}

.indicator.hidden {
  display: none;
}

/* ── GAME OVER ── */
#gameover {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Orbitron', monospace;
  text-align: center;
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
  z-index: 20;
}
#goTitle {
  display: block;
  font-size: 42px; font-weight: 900;
  color: #ff3355;
  text-shadow: 0 0 30px #ff3355;
  letter-spacing: 0.1em;
}
#goScore {
  display: block;
  font-size: 20px;
  color: #fff;
  margin: 8px 0;
}
#goHint {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  animation: blink 1.2s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* ── COMBO ── */
#combo {
  position: fixed;
  font-family: 'Orbitron', monospace;
  font-size: 22px; font-weight: 900;
  color: #ffee44;
  opacity: 0;
  pointer-events: none;
  z-index: 15;
  text-shadow: 0 0 12px #ffee44;
  transition: opacity 0.15s;
}

/* ── WEAPON BAR ── */
#weaponBar {
  position: fixed;
  bottom: 14px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 8px;
  z-index: 10;
}
.weapon {
  padding: 7px 13px;
  border: 1px solid rgba(0,255,180,0.2);
  border-radius: 7px;
  background: rgba(8,20,24,0.9);
  color: rgba(0,255,180,0.55);
  font-family: 'Orbitron', monospace;
  font-size: 9px; font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.07em;
  transition: 0.15s;
}
.weapon.active {
  background: var(--accent, #00ffcc);
  color: #000;
  border-color: var(--accent, #00ffcc);
  box-shadow: 0 0 14px var(--accent, #00ffcc);
  transform: translateY(-2px);
}

/* ── SETTINGS ── */
#settingsBtn {
  position: fixed;
  top: 10px; right: 10px;
  width: 36px; height: 36px;
  background: rgba(8,20,24,0.9);
  color: var(--accent, #00ffcc);
  border: 1px solid rgba(0,255,180,0.3);
  font-size: 16px; cursor: pointer;
  border-radius: 6px; z-index: 10;
  transition: 0.15s;
}
#settingsBtn:hover { background: var(--accent, #00ffcc); color: #000; }

#settingsPanel {
  position: fixed;
  top: 52px; right: 10px;
  background: rgba(4,12,16,0.97);
  padding: 14px; border-radius: 8px;
  color: #aee; display: none;
  width: 200px; font-size: 12px;
  border: 1px solid rgba(0,255,180,0.2);
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  z-index: 50;
}
.sp-title {
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 700;
  color: var(--accent, #00ffcc);
  letter-spacing: 0.1em; margin-bottom: 10px;
}
#settingsPanel label {
  display: block; margin: 7px 0 2px;
  color: rgba(0,255,180,0.7);
  font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
}
#settingsPanel select,
#settingsPanel input[type=range],
#settingsPanel input[type=checkbox] {
  width: 100%; margin-bottom: 4px;
  accent-color: var(--accent, #00ffcc);
  background: #0a1a1e; color: #aee;
  border: 1px solid rgba(0,255,180,0.15);
  border-radius: 4px;
}
#restartBtn, #menuBtn {
  width: 100%; margin-top: 8px;
  padding: 7px;
  background: transparent;
  color: var(--accent, #00ffcc);
  border: 1px solid rgba(0,255,180,0.3);
  border-radius: 5px;
  font-family: 'Orbitron', monospace;
  font-size: 10px; letter-spacing: 0.08em;
  cursor: pointer; transition: 0.15s;
}
#restartBtn:hover, #menuBtn:hover {
  background: var(--accent, #00ffcc); color: #000;
}

/* ── MODE SELECT SCREEN ── */
#modeScreen {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(3, 8, 12, 0.96);
  z-index: 100;
}
#modeBox {
  text-align: center;
  padding: 30px 24px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(0,255,180,0.2);
  border-radius: 14px;
  width: min(380px, 92vw);
  box-shadow: 0 0 40px rgba(0,255,180,0.08);
}
#modeTitle {
  font-family: 'Orbitron', monospace;
  font-size: 32px; font-weight: 900;
  color: #00ffcc;
  letter-spacing: 0.12em;
  text-shadow: 0 0 20px #00ffcc;
  margin-bottom: 4px;
}
#modeSubtitle {
  font-size: 12px; color: rgba(255,255,255,0.3);
  letter-spacing: 0.2em; margin-bottom: 24px;
  text-transform: uppercase;
}
.mode-section-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px; font-weight: 700;
  color: rgba(0,255,180,0.5);
  letter-spacing: 0.15em;
  margin: 14px 0 8px;
  text-align: left;
}
#diffBtns, #themeBtns {
  display: flex; gap: 8px; flex-wrap: wrap;
  justify-content: center; margin-bottom: 4px;
}
.modeBtn {
  padding: 8px 16px;
  background: rgba(10,25,30,0.8);
  color: rgba(0,255,180,0.5);
  border: 1px solid rgba(0,255,180,0.2);
  border-radius: 7px;
  font-family: 'Orbitron', monospace;
  font-size: 10px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.06em;
  transition: 0.15s;
}
.modeBtn.active {
  background: #00ffcc; color: #000;
  border-color: #00ffcc;
  box-shadow: 0 0 12px rgba(0,255,180,0.5);
}
/* theme-specific active colors */
.modeBtn.theme[data-t="sunset"].active  { background: #ff6644; border-color: #ff6644; box-shadow: 0 0 12px rgba(255,100,60,0.5); }
.modeBtn.theme[data-t="arctic"].active  { background: #88ddff; border-color: #88ddff; box-shadow: 0 0 12px rgba(120,210,255,0.5); color:#000; }
.modeBtn.theme[data-t="void"].active    { background: #cc0033; border-color: #cc0033; box-shadow: 0 0 12px rgba(200,0,50,0.5); }
.modeBtn.diff[data-d="easy"].active     { background: #44ff88; border-color: #44ff88; box-shadow: 0 0 12px rgba(60,255,130,0.5); color:#000; }
.modeBtn.diff[data-d="hard"].active     { background: #ff3355; border-color: #ff3355; box-shadow: 0 0 12px rgba(255,50,80,0.5); }

#startBtn {
  margin-top: 20px;
  padding: 12px 40px;
  background: #00ffcc;
  color: #000;
  border: none; border-radius: 8px;
  font-family: 'Orbitron', monospace;
  font-size: 14px; font-weight: 900;
  cursor: pointer; letter-spacing: 0.12em;
  box-shadow: 0 0 20px rgba(0,255,180,0.5);
  transition: 0.15s;
}
#startBtn:hover { transform: scale(1.04); box-shadow: 0 0 30px rgba(0,255,180,0.7); }
#bestDisplay {
  margin-top: 14px;
  font-size: 11px; color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
}
