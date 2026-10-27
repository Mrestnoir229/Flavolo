// ===== Réglages =====
const CONFIG = {
  questionTime: 15,  // secondes pour répondre
  revealTime: 2.2,   // secondes où la bonne réponse s'allume en vert
  explainTime: 11,   // secondes d'affichage du super-héros et de l'explication
  partTime: 5.5,     // secondes d'affichage de l'annonce d'une partie (goûts / saveurs)
};

// ===== Questions =====
// answer : index de la bonne proposition (0 = A, 1 = B, 2 = C)
// emoji (optionnel) : affiché en 3D à côté de la réponse
// Une page peut fournir ses propres questions via window.QUIZ_QUESTIONS (voir gouts.html)
const QUESTIONS = window.QUIZ_QUESTIONS || [
  {
    q: "Quand vous avez un gros rhume, pourquoi les aliments semblent-ils sans goût ?",
    options: ["La langue est engourdie", "On ne sent plus les odeurs", "La salive disparaît"],
    answer: 1,
    big: "B : LES ODEURS",
    explain: "Près de 80 % de ce qu’on appelle « le goût » vient en fait de notre nez, grâce aux odeurs qui remontent par l'arrière de la gorge !",
  },
  {
    q: "En plus du sucré, salé, acide et amer, quelle est la 5ᵉ saveur reconnue par la science ?",
    options: ["L'umami", "Le croustillant", "Le gras"],
    answer: 0,
    big: "A : L'UMAMI",
    explain: "Découvert au Japon, l'« umami » signifie délicieux. C’est le goût savoureux qu’on retrouve dans le parmesan, la sauce soja ou la tomate mûre.",
  },
  {
    q: "Sur quelle partie de la langue ressent-on le goût du sucre ?",
    options: ["Uniquement sur le bout", "Uniquement sur les côtés", "Partout sur la langue"],
    answer: 2,
    big: "C : PARTOUT",
    explain: "La carte de la langue apprise à l'école est une fausse idée ! Toutes nos papilles peuvent capter toutes les saveurs.",
  },
  {
    q: "Si on colore un sirop de fraise en jaune citron, quel goût la plupart des gens vont-ils penser ressentir ?",
    options: ["Le citron", "La fraise", "La menthe"],
    answer: 0,
    big: "A : LE CITRON",
    explain: "Nos yeux trompent notre cerveau : on s'attend à boire du citron à cause du jaune, et le cerveau invente le goût !",
  },
  {
    q: "Pourquoi le piment donne-t-il l’impression que la bouche est en feu ?",
    options: ["Il fait monter la température à 50 °C", "C'est un leurre qui trompe les capteurs de chaleur", "Il contient de l'acide qui attaque les gencives"],
    answer: 1,
    big: "B : UN LEURRE",
    explain: "Le piment contient de la capsaïcine : elle fait croire au cerveau que la langue brûle, alors que sa température ne change pas d'un degré.",
  },
  {
    q: "Si vous posez un bonbon sur une langue parfaitement sèche, que se passe-t-il ?",
    options: ["On ressent le goût instantanément", "On ne ressent aucun goût", "La langue colle comme sur un glaçon"],
    answer: 1,
    big: "B : AUCUN GOÛT",
    explain: "Pour que la langue capte les molécules d'un aliment, il faut impérativement qu’elles soient dissoutes dans la salive.",
  },
  {
    q: "Pourquoi certaines personnes trouvent-elles que la coriandre a un goût de savon ?",
    options: ["C'est un caprice d'enfant", "C'est inscrit dans leur ADN (génétique)", "Elle est souvent mal lavée"],
    answer: 1,
    big: "B : L'ADN",
    explain: "Certaines personnes ont un gène spécifique qui les rend très sensibles à une molécule aromatique présente à la fois dans la coriandre et dans les savons.",
  },
  {
    q: "Pourquoi une glace fondue semble-t-elle beaucoup plus sucrée qu'une glace bien glacée ?",
    options: ["Le sucre fond et se multiplie", "Nos papilles captent mieux le sucré quand c'est tiède", "C'est juste une impression liée à la texture"],
    answer: 1,
    big: "B : LA TEMPÉRATURE",
    explain: "Le froid anesthésie un peu nos papilles. Plus un aliment se réchauffe vers la température du corps, plus les capteurs de sucre s'activent fort !",
  },
  {
    q: "Si vous vous brûlez la langue avec une pizza ou un chocolat chaud, en combien de temps les papilles se renouvellent-elles ?",
    options: ["En 10 à 14 jours", "En 6 mois", "Jamais, c'est définitif"],
    answer: 0,
    big: "A : 10 À 14 JOURS",
    explain: "Les cellules du goût vivent très peu de temps : notre langue fabrique de nouvelles papilles en permanence, tous les 10 à 15 jours.",
  },
  {
    q: "Pourquoi beaucoup de gens aiment boire du jus de tomate en avion mais jamais chez eux ?",
    options: ["Le bruit des moteurs change notre façon de goûter", "La pression de l'air fait gonfler les papilles", "C'est gratuit, donc c'est meilleur"],
    answer: 0,
    big: "A : LE BRUIT",
    explain: "Le vacarme des moteurs atténue le sucré et le salé, mais pas l'umami : le jus de tomate, riche en umami, paraît alors bien plus savoureux en vol !",
  },
];

// Couleurs de fond (une par question, en boucle) : [base, rayons clairs]
const PALETTES = [
  ["#1e88ff", "#4fb3ff"],
  ["#2fbf2f", "#5fe04a"],
  ["#7b4dff", "#a07bff"],
  ["#ff8a1e", "#ffb14f"],
  ["#ff3d8b", "#ff78b0"],
  ["#11b5a4", "#3fd9c6"],
  ["#ef3b3b", "#ff6b6b"],
];

// ===== Éléments =====
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const els = {
  badge: $("badge"),
  counter: $("counter"),
  qText: $("qText"),
  options: $("options"),
  answerBig: $("answerBig"),
  answerEmoji: $("answerEmoji"),
  answer3d: $("answer3d"),
  hero3d: $("hero3d"),
  explainText: $("explainText"),
  timerFill: $("timerFill"),
  splash: $("splash"),
  scoreText: $("scoreText"),
};

$("introSub").textContent = `${QUESTIONS.length} QUESTIONS · ${CONFIG.questionTime} SECONDES`;

// ===== Mise à l'échelle de la scène 1920x1080 =====
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.setProperty("--scale", s);
}
addEventListener("resize", fit);
fit();

// Centre d'un élément, en coordonnées de la scène 1920x1080 (pour y faire exploser des confettis)
function stagePoint(el) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const k = s.width / 1920;
  return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
}

// ===== Sons (Web Audio, aucun fichier nécessaire : tout est synthétisé) =====
const Sound = (() => {
  let ctx = null, master, sfx, music, noiseBuf, musicTimer = null;
  let muted = false;

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); // les explosions ne saturent pas
    master.connect(comp).connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.connect(master);
    music = ctx.createGain();
    music.gain.value = 0.3;
    music.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // Une note : fréquence, départ (s), durée (s), options
  function tone(freq, at, dur, { type = "sine", vol = 0.2, to = null, bus = sfx, vibrato = 0, when = null } = {}) {
    const t0 = (when ?? ctx.currentTime) + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 7;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(bus);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  // Un souffle filtré (explosions, whoosh, charleston)
  function noise(at, dur, { vol = 0.3, type = "lowpass", freq = 1000, to = null, q = 1, bus = sfx, when = null } = {}) {
    const t0 = (when ?? ctx.currentTime) + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t0, Math.random());
    src.stop(t0 + dur);
  }

  const play = {
    click: () => tone(500, 0, 0.12, { type: "triangle", vol: 0.3, to: 1100 }),
    tick: () => { tone(1400, 0, 0.06, { type: "square", vol: 0.07 }); noise(0, 0.05, { type: "highpass", freq: 4000, vol: 0.12 }); },
    heartbeat: () => { tone(70, 0, 0.18, { vol: 0.5, to: 45 }); tone(70, 0.2, 0.2, { vol: 0.35, to: 45 }); },
    whoosh: () => noise(0, 0.5, { type: "bandpass", freq: 300, to: 3500, q: 1.2, vol: 0.4 }),
    boom: () => { tone(150, 0, 0.7, { vol: 0.8, to: 32 }); noise(0, 0.9, { freq: 2200, to: 60, vol: 0.7 }); },
    // bonne réponse : « power-up » de jeu vidéo + paillettes
    correct: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.06, 0.22, { type: "square", vol: 0.07 }));
      [2093, 2637, 3136, 2637, 3136].forEach((f, i) => tone(f, 0.32 + i * 0.06, 0.35, { vol: 0.06 }));
      noise(0.3, 0.6, { type: "highpass", freq: 6000, vol: 0.06 });
    },
    // mauvaise réponse : trombone triste « wah wah wah waaah »
    wrong: () => {
      [311, 294, 277].forEach((f, i) => tone(f, i * 0.3, 0.28, { type: "sawtooth", vol: 0.09 }));
      tone(262, 0.9, 1.0, { type: "sawtooth", vol: 0.09, vibrato: 9, to: 240 });
    },
    timeout: () => { tone(160, 0, 0.6, { type: "square", vol: 0.12 }); tone(164, 0, 0.6, { type: "square", vol: 0.12 }); },
    reveal: () => { tone(660, 0, 0.15, { type: "triangle", vol: 0.2 }); tone(990, 0.13, 0.35, { type: "triangle", vol: 0.2 }); },
    // arrivée du héros : montée + accord de cuivres « ta-daaa » + boum
    hero: () => {
      noise(0, 0.5, { type: "bandpass", freq: 400, to: 5000, q: 2, vol: 0.25 });
      play.boom();
      [[392, 494, 587], [523, 659, 784]].forEach((chord, k) =>
        chord.forEach((f) => tone(f, 0.12 + k * 0.2, k ? 0.9 : 0.16, { type: "sawtooth", vol: 0.05 })));
    },
    fanfare: () => {
      [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.12, i === 3 ? 0.7 : 0.14, { type: "square", vol: 0.08 }));
      [523, 659, 784].forEach((f) => tone(f * 2, 0.48, 0.7, { type: "triangle", vol: 0.06 }));
    },
    coin: () => { tone(988, 0, 0.08, { type: "square", vol: 0.08 }); tone(1319, 0.08, 0.35, { type: "square", vol: 0.08 }); },
    star: () => { tone(880, 0, 0.5, { type: "triangle", vol: 0.15, to: 1760 }); play.boom(); },
    // choc pendant le vol : « boïng » de dessin animé
    bonk: () => { tone(420, 0, 0.35, { type: "square", vol: 0.12, to: 90 }); tone(180, 0.05, 0.4, { vol: 0.4, to: 60 }); noise(0, 0.2, { freq: 1200, vol: 0.3 }); },
  };

  // Musique de fond : petite boucle « chiptune » joyeuse (Do - La mineur - Fa - Sol)
  const BPM = 120, STEP = 60 / BPM / 2;
  const BASS = [48, 45, 41, 43]; // une note de basse par mesure
  const MELODY = [
    72, null, 76, 79, 76, null, 72, 74,
    76, null, 72, 69, 72, null, 76, null,
    77, null, 76, 72, 69, null, 72, 77,
    79, null, 77, 74, 71, 74, 79, null,
  ];
  const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
  let step = 0, nextTime = 0;

  function scheduleMusic() {
    while (nextTime < ctx.currentTime + 0.15) {
      const bar = Math.floor(step / 8) % 4, s = step % 8;
      const when = nextTime;
      if ([0, 3, 4, 6].includes(s)) tone(mtof(BASS[bar]), 0, STEP * 0.9, { type: "triangle", vol: 0.35, bus: music, when });
      const m = MELODY[step % 32];
      if (m) tone(mtof(m), 0, STEP * 0.8, { type: "square", vol: 0.05, bus: music, when });
      if (s % 2) noise(0, 0.04, { type: "highpass", freq: 7000, vol: 0.08, bus: music, when });
      if (s === 0 || s === 4) tone(120, 0, 0.15, { vol: 0.45, to: 45, bus: music, when });
      step++;
      nextTime += STEP;
    }
  }

  return {
    init,
    play: (name) => { if (ctx && !muted) play[name](); },
    startMusic() {
      if (!ctx || musicTimer) return;
      step = 0;
      nextTime = ctx.currentTime + 0.1;
      musicTimer = setInterval(scheduleMusic, 40);
    },
    stopMusic() { clearInterval(musicTimer); musicTimer = null; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 1;
      stage.classList.toggle("muted", muted);
    },
    pause(on) { if (ctx) on ? ctx.suspend() : ctx.resume(); },
  };
})();

// ===== Effets spéciaux : confettis, étincelles, ondes de choc, feux d'artifice =====
const FX = (() => {
  const canvas = $("fx");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  const COLORS = ["#ffc400", "#8a4dff", "#2f8fff", "#ff4d5e", "#22c55e", "#ff7eb6", "#ffffff"];
  const rand = (a, b) => a + Math.random() * (b - a);
  let parts = [];
  let running = false;

  function add(p) {
    parts.push({ age: 0, rot: rand(0, 6), vr: rand(-0.25, 0.25), ...p });
    if (!running) { running = true; requestAnimationFrame(step); }
  }

  // confettis de papier qui virevoltent
  function confetti(x, y, n = 120, { power = 22, up = false, colors = COLORS } = {}) {
    for (let i = 0; i < n; i++) {
      const a = up ? -Math.PI / 2 + rand(-0.9, 0.9) : rand(0, Math.PI * 2);
      const v = rand(power * 0.3, power);
      add({ kind: "paper", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.42, drag: 0.955,
        w: rand(12, 22), h: rand(7, 12), color: colors[i % colors.length], life: rand(100, 170), flip: rand(0, 6) });
    }
  }

  // étincelles qui jaillissent d'un point
  function sparks(x, y, color, n = 50, power = 18) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(power * 0.25, power);
      add({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.12, drag: 0.93,
        size: rand(4, 11), color: i % 3 ? color : "#ffffff", life: rand(35, 65) });
    }
  }

  // onde de choc (cercle qui s'agrandit)
  function ring(x, y, color, size = 320) {
    add({ kind: "ring", x, y, vx: 0, vy: 0, g: 0, drag: 1, size, color, life: 32 });
  }

  // étoiles dorées
  function stars(x, y, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(6, 16);
      add({ kind: "star", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, g: 0.3, drag: 0.97,
        size: rand(14, 26), color: "#ffc400", life: rand(70, 110) });
    }
  }

  function explode(x, y, color) {
    ring(x, y, color);
    ring(x, y, "#ffffff", 200);
    sparks(x, y, color, 60);
    confetti(x, y, 90);
    stars(x, y, 10);
  }

  function drawStar(r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function step() {
    ctx.clearRect(0, 0, 1920, 1080);
    parts = parts.filter((p) => p.age < p.life);
    for (const p of parts) {
      p.age++;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const k = p.age / p.life;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = Math.min(1, (1 - k) * 2.5);
      if (p.kind === "paper") {
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip + p.age * 0.18));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.kind === "spark") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - k * 0.7), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 26 * (1 - k);
        ctx.beginPath();
        ctx.arc(0, 0, p.size * Math.sqrt(k), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "star") {
        ctx.rotate(p.rot);
        drawStar(p.size);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1c1c1c";
        ctx.stroke();
      }
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(step);
    else { running = false; ctx.clearRect(0, 0, 1920, 1080); }
  }

  // feu d'artifice : plusieurs explosions en hauteur, l'une après l'autre
  let showTimer = null;
  function fireworks(seconds = 6) {
    clearInterval(showTimer);
    const end = performance.now() + seconds * 1000;
    showTimer = setInterval(() => {
      if (performance.now() > end) return clearInterval(showTimer);
      const x = rand(300, 1620), y = rand(90, 300), c = COLORS[Math.floor(rand(0, COLORS.length - 1))];
      sparks(x, y, c, 70, 16);
      ring(x, y, c, 220);
      Sound.play("boom");
    }, 650);
  }

  function clear() {
    clearInterval(showTimer);
    parts = [];
  }

  return { confetti, sparks, ring, stars, explode, fireworks, clear };
})();

// ===== Bulle de BD « POW ! » + tremblement de l'écran =====
const pow = $("pow");
let powTimer = null;
function comic(text, color = "#ffc400", x = 960, y = 470, ms = 1300) {
  pow.querySelector("span").textContent = text;
  pow.style.setProperty("--pow", color);
  pow.style.left = x + "px";
  pow.style.top = y + "px";
  pow.style.setProperty("--tilt", (Math.random() * 16 - 8).toFixed(1) + "deg");
  pow.classList.remove("show");
  void pow.offsetWidth;
  pow.classList.add("show");
  clearTimeout(powTimer);
  powTimer = setTimeout(() => pow.classList.remove("show"), ms);
}

// Contour en étoile de la bulle (16 pointes irrégulières)
(() => {
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2, r = i % 2 ? 31 + ((i * 7) % 5) : 50;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r * 0.78).toFixed(1)}`);
  }
  pow.querySelectorAll("polygon").forEach((p) => p.setAttribute("points", pts.join(" ")));
})();

function shake(strong = false) {
  stage.classList.remove("shake", "shake-strong");
  void stage.offsetWidth;
  stage.classList.add(strong ? "shake-strong" : "shake");
}

// ===== Score, combo et héros débloqués =====
const COMBO_WORDS = ["", "", "DOUBLE !", "TRIPLE !", "MÉGA COMBO !", "ULTRA COMBO !"];
let score = 0, shownScore = 0, streak = 0;
const collected = new Set();

function addPoints(points, from) {
  score += points;
  // « +150 » qui s'envole vers le compteur
  const f = document.createElement("div");
  f.className = "float-points";
  f.textContent = "+" + points;
  f.style.left = from.x + "px";
  f.style.top = from.y + "px";
  stage.appendChild(f);
  setTimeout(() => f.remove(), 1400);
  setTimeout(() => Sound.play("coin"), 500);
}

function updateCombo() {
  const el = $("combo");
  el.classList.toggle("on", streak >= 2);
  if (streak >= 2) {
    el.textContent = `x${streak} ${COMBO_WORDS[Math.min(streak, COMBO_WORDS.length - 1)]}`;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
}

// ===== État du jeu =====
let index = 0;
let phase = "intro";        // intro | flight | part | question | reveal | explain | end
let elapsed = 0;
let paused = false;
let busy = false;           // transition en cours
let lastTick = -1;
let picks = [];             // réponse cliquée pour chaque question (ou null)
let answeredIn = 0;         // temps restant au moment du clic (bonus de vitesse)

// ===== Objets 3D (seulement si taste3d.js est chargé) =====
let handles3d = [];

function mount3d(container, key, opts) {
  if (!window.Taste3D || !container) return null;
  const h = Taste3D.mount(container, key, opts);
  handles3d.push(h);
  return h;
}

function clear3d() {
  handles3d.forEach((h) => Taste3D.dispose(h));
  handles3d = [];
}

// Clé du modèle 3D à montrer en grand pendant la réponse
function answerKey(q) {
  if (q.type === "shape") return q.options[q.answer];
  return q.show || null; // "guess" et "riddle"
}

const HEROES = window.QUIZ_HEROES || {};

// ===== Parties du quiz (optionnel, voir window.QUIZ_PARTS) =====
// Chaque partie commence par un écran d'annonce animé avec le logo.
const PARTS = window.QUIZ_PARTS || [];
const partStartingAt = (i) => PARTS.find((p) => p.from === i);

// Mélange l'ordre des questions à chaque nouvelle partie de quiz, sans sortir de leur partie
// (les goûts restent dans la partie 1, les saveurs dans la partie 2).
function shuffleQuestions() {
  const starts = PARTS.length ? PARTS.map((p) => p.from) : [0];
  starts.forEach((from, k) => {
    const to = k + 1 < starts.length ? starts[k + 1] : QUESTIONS.length;
    for (let i = to - 1; i > from; i--) {
      const j = from + Math.floor(Math.random() * (i - from + 1));
      [QUESTIONS[i], QUESTIONS[j]] = [QUESTIONS[j], QUESTIONS[i]];
    }
  });
}

// Étincelles autour du logo et confettis : réparties en cercle, couleurs du logo
const LOGO_COLORS = ["#ffc400", "#8a4dff", "#2f8fff", "#ff4d5e", "#ffffff"];
document.querySelectorAll(".sparks i, .confetti i").forEach((el, i, all) => {
  el.style.setProperty("--a", (i / all.length) * 720 + 15 + "deg");
  el.style.setProperty("--d", 300 + ((i * 97) % 260) + "px");
  el.style.setProperty("--c", LOGO_COLORS[i % LOGO_COLORS.length]);
  el.style.animationDelay = (i % 6) * 0.12 + "s";
});

function showPart(part) {
  clear3d();
  $("partTag").textContent = part.tag;
  $("partTitle").textContent = part.title;
  $("partSub").textContent = part.subtitle || "";
  setPhase("part");
  Sound.play("fanfare");
  // le titre claque à l'écran : boum + explosion de confettis
  setTimeout(() => {
    if (phase !== "part") return;
    Sound.play("boom");
    shake(true);
    FX.explode(960, 820, "#8a4dff");
    comic("C'EST PARTI !", "#ffc400", 1480, 330, 1800);
  }, 850);
}

function setPhase(p) {
  phase = p;
  elapsed = 0;
  if (p !== "flight") stopFlight();
  stage.classList.remove("phase-intro", "phase-flight", "phase-part", "phase-question", "phase-reveal", "phase-explain", "phase-end");
  stage.classList.add("phase-" + p);

  if (p === "explain") {
    const key = answerKey(QUESTIONS[index]);
    if (key) {
      clear3d(); // les objets des propositions sont masqués : on libère la carte graphique
      mount3d(els.answer3d, key, { fit: 1.28, hero: true }); // le modèle devient un super-héros
      showHero(key);
    }
  }
}

// Fiche du super-héros : nom, pouvoir et 3 jauges qui montrent à quoi « ressemble » le goût
function showHero(key) {
  const hero = HEROES[key];
  stage.classList.toggle("has-hero", !!hero);
  if (!hero) return;
  const won = picks[index] === QUESTIONS[index].answer;
  stage.style.setProperty("--hero", hero.color);
  $("heroRibbon").textContent = won ? "HÉROS DÉBLOQUÉ !" : "VOICI LE HÉROS";
  $("heroRibbon").classList.toggle("won", won);
  $("heroName").textContent = hero.name;
  $("heroPower").textContent = hero.power;
  $("heroSays").textContent = QUESTIONS[index].explain;
  const gauge = (left, right, value) =>
    `<div class="gauge"><span>${left}</span><div class="pips">${
      [0, 1, 2, 3, 4].map((i) => `<i class="${i < value ? "on" : ""}" style="animation-delay:${0.6 + i * 0.09}s"></i>`).join("")
    }</div><span>${right}</span></div>`;
  $("heroGauges").innerHTML =
    gauge("pointu", "rond", hero.round) + gauge("froid", "chaud", hero.warm) + gauge("mat", "brillant", hero.shiny);

  Sound.play("hero");
  shake(true);
  const center = stagePoint(els.answer3d);
  FX.ring(center.x, center.y, hero.color, 520);
  FX.sparks(center.x, center.y, hero.color, 80, 24);
  if (won) FX.confetti(center.x, center.y - 100, 140, { power: 26 });
  setTimeout(() => { if (phase === "explain") comic(hero.shout, hero.color, center.x + 330, center.y - 250, 1700); }, 250);
}

function renderQuestion(i) {
  const q = QUESTIONS[i];
  const [base, light] = PALETTES[i % PALETTES.length];
  stage.style.setProperty("--base", base);
  stage.style.setProperty("--light", light);

  els.badge.textContent = i + 1;
  els.counter.textContent = `QUESTION ${i + 1} / ${QUESTIONS.length}`;
  // Espace insécable avant « ? ! : ; » et pas de coupure après un trait d'union (« ressemblerait-il »)
  els.qText.textContent = q.q.replace(/ ([?!:;])/g, " $1").replace(/-(?=\S)/g, "-⁠");
  els.answerBig.textContent = q.big;
  if (els.answerEmoji) els.answerEmoji.textContent = q.emoji || "";
  els.explainText.textContent = q.explain;

  els.timerFill.style.width = "100%";
  els.timerFill.className = "timer-fill";
  lastTick = -1;
  picks[i] = undefined; // si on revient sur une question, l'ancienne réponse ne compte plus

  // La mise en page doit être visible avant de monter les objets 3D (ils lisent leur taille)
  clear3d();
  stage.classList.remove("has-hero");
  stage.classList.toggle("layout-shape", q.type === "shape");
  stage.classList.toggle("layout-guess", q.type === "guess");
  els.options.classList.toggle("cards", q.type === "shape");
  setPhase("question");

  els.options.innerHTML = "";
  q.options.forEach((text, k) => {
    const div = document.createElement("div");
    div.addEventListener("click", () => pick(k));
    els.options.appendChild(div);

    if (q.type === "shape") {
      // Proposition = objet 3D ; son nom n'apparaît qu'à la révélation
      div.className = "option card3d";
      div.innerHTML = `<span class="letter">${"ABC"[k]}</span><div class="obj"></div><div class="name"></div>`;
      div.querySelector(".name").textContent = Taste3D.label(text);
      const h = mount3d(div.querySelector(".obj"), text);
      div.handle3d = h;
      // au survol, l'objet s'emballe et tourne plus vite
      div.addEventListener("mouseenter", () => { Taste3D.boost(h, true); if (phase === "question") Sound.play("tick"); });
      div.addEventListener("mouseleave", () => Taste3D.boost(h, false));
    } else {
      div.className = "option";
      div.innerHTML = `<span class="letter">${"ABC"[k]}</span><span></span>`;
      div.lastChild.textContent = text;
    }
  });

  if (q.type === "guess") mount3d(els.hero3d, q.show);
}

function pick(k) {
  if (phase !== "question" || busy) return;
  picks[index] = k;
  answeredIn = Math.max(0, CONFIG.questionTime - elapsed);
  els.options.children[k].classList.add("picked");
  Sound.play("click");
  reveal();
}

function reveal() {
  const q = QUESTIONS[index];
  const good = els.options.children[q.answer];
  good.classList.add("correct");
  const picked = picks[index];
  const at = stagePoint(good);

  if (picked === q.answer) {
    // Bonne réponse : explosion, bulle de BD, points (bonus de vitesse et de combo)
    streak++;
    if (answerKey(q)) collected.add(answerKey(q)); // le héros rejoint l'album
    const points = 100 + Math.round((100 * answeredIn) / CONFIG.questionTime) + 50 * Math.max(0, streak - 1);
    Sound.play("correct");
    Sound.play("boom");
    FX.explode(at.x, at.y, "#22c55e");
    shake();
    comic(["BRAVO !", "SUPER !", "WOUAH !", "GÉNIAL !", "YES !"][Math.floor(Math.random() * 5)], "#ffc400", at.x, at.y - 190);
    addPoints(points, { x: at.x, y: at.y - 60 });
  } else if (picked !== undefined && picked !== null) {
    // Mauvaise réponse : trombone triste, la carte tremble, et la bonne s'allume quand même
    streak = 0;
    Sound.play("wrong");
    const bad = els.options.children[picked];
    bad.classList.add("nope");
    const b = stagePoint(bad);
    comic("OUPS !", "#ff5a5a", b.x, b.y - 190);
    FX.sparks(at.x, at.y, "#22c55e", 30, 12);
  } else {
    // Temps écoulé
    streak = 0;
    Sound.play("timeout");
    comic("TEMPS ÉCOULÉ !", "#ff9f1c", 960, 520);
    setTimeout(() => { Sound.play("reveal"); FX.sparks(at.x, at.y, "#22c55e", 40, 14); }, 500);
  }
  updateCombo();
  setPhase("reveal");
}

// ===== Fin : étoiles, score et album des héros débloqués =====
function showEnd() {
  clear3d();
  FX.clear();
  const answered = picks.filter((p) => p !== null && p !== undefined).length;
  const good = picks.filter((p, i) => p === QUESTIONS[i].answer).length;
  // Personne n'a cliqué (quiz projeté et joué à voix haute) : tous les héros sont débloqués
  const keys = window.Taste3D ? Taste3D.keys : [];
  if (!answered) keys.forEach((k) => collected.add(k));

  const ratio = good / QUESTIONS.length;
  const starCount = !answered ? 3 : ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : good ? 1 : 0;
  $("endTitle").textContent = !answered ? "BRAVO À TOUS !"
    : ["LES HÉROS T'ATTENDENT !", "HÉROS EN HERBE !", "APPRENTI HÉROS !", "SUPER-HÉROS DU GOÛT !"][starCount];
  els.scoreText.textContent = answered ? `${good} / ${QUESTIONS.length} BONNES RÉPONSES` : "TOUS LES HÉROS SONT DÉBLOQUÉS !";
  $("endScore").textContent = answered ? "0" : "";
  document.querySelectorAll("#endStars i").forEach((s) => s.classList.remove("on"));
  setPhase("end");
  stage.classList.remove("has-hero");
  Sound.play("fanfare");

  // les étoiles tombent une par une, avec un boum
  for (let i = 0; i < starCount; i++) {
    setTimeout(() => {
      if (phase !== "end") return;
      const s = document.querySelectorAll("#endStars i")[i];
      s.classList.add("on");
      Sound.play("star");
      const p = stagePoint(s);
      FX.stars(p.x, p.y, 12);
      shake();
    }, 700 + i * 550);
  }

  // le score compte jusqu'au total
  if (answered) {
    const t0 = performance.now();
    const count = (now) => {
      if (phase !== "end") return;
      const k = Math.min(1, (now - t0) / 1600);
      $("endScore").textContent = Math.round(score * (1 - (1 - k) ** 3)) + " PTS";
      if (k < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  }

  setTimeout(() => { if (phase === "end") FX.fireworks(5); }, 700 + starCount * 550);
  buildAlbum(keys);
}

// Album : une carte brillante par héros ; ceux qu'on n'a pas trouvés restent en silhouette
async function buildAlbum(keys) {
  const album = $("album");
  album.innerHTML = "";
  const cards = keys.map((key) => {
    const hero = HEROES[key] || { name: Taste3D.label(key), color: "#8a4dff" };
    const card = document.createElement("div");
    card.className = "hero-card" + (collected.has(key) ? " got" : "");
    card.style.setProperty("--hero", hero.color);
    card.innerHTML = `<div class="art"></div><b></b><small></small>`;
    card.querySelector("b").textContent = collected.has(key) ? hero.name : "???";
    card.querySelector("small").textContent = Taste3D.label(key);
    album.appendChild(card);
    return { key, card };
  });
  $("albumCount").textContent = `${keys.filter((k) => collected.has(k)).length} / ${keys.length} HÉROS`;

  // Une photo 3D par carte, l'une après l'autre pour ne pas bloquer l'animation
  for (const [i, { key, card }] of cards.entries()) {
    await new Promise((r) => setTimeout(r, i ? 140 : 400));
    if (phase !== "end") return;
    const img = new Image();
    img.src = Taste3D.snapshot(key, 300, { hero: true, fit: 1.3 });
    card.querySelector(".art").appendChild(img);
    card.classList.add("in");
    if (collected.has(key)) Sound.play("coin");
  }
}

// ===== Vol du héros (vol.js) : le joueur guide un super-héros jusqu'à la ligne du quiz =====
let flight = null;

function startFlight(warp = 0) {
  clear3d();
  FX.clear();
  setPhase("flight");
  flight = HeroFlight.start($("flight"), {
    warp,
    onEvent(type, at) {
      if (type === "count") Sound.play("tick");
      else if (type === "go") { Sound.play("boom"); Sound.play("whoosh"); }
      else if (type === "star") { Sound.play("coin"); FX.sparks(at.x, at.y, "#ffc400", 24, 10); }
      else if (type === "hit") { Sound.play("bonk"); shake(); comic("BONK !", "#ff5a5a", at.x, at.y - 170, 700); }
      else if (type === "finish") {
        Sound.play("fanfare");
        Sound.play("boom");
        shake(true);
        FX.explode(at.x, at.y, "#8a4dff");
        FX.confetti(960, 1080, 160, { up: true, power: 34 });
        comic("BIENVENUE AU QUIZ !", "#ffc400", 960, 430, 1800);
      }
    },
    // ligne franchie : les étoiles attrapées donnent des points bonus, puis le quiz commence
    onDone(stars) {
      if (phase !== "flight") return;
      if (stars) addPoints(stars * 10, { x: 960, y: 640 });
      setTimeout(() => { if (phase === "flight") goTo(0); }, stars ? 1100 : 300);
    },
  });
}

function stopFlight() {
  if (!flight) return;
  flight.stop();
  flight = null;
}

// Transition peinture : on change le contenu quand la vague couvre l'écran
function transition(swap) {
  busy = true;
  Sound.play("whoosh");
  els.splash.classList.remove("sweep");
  void els.splash.offsetWidth; // relance l'animation
  els.splash.classList.add("sweep");
  setTimeout(swap, 500);
  setTimeout(() => { busy = false; }, 1000);
}

function goTo(i) {
  if (busy) return;
  if (i < 0) i = 0;
  transition(() => {
    if (i >= QUESTIONS.length) return showEnd();
    index = i;
    const part = partStartingAt(i);
    if (part) showPart(part); // annonce de la partie, puis la question
    else renderQuestion(i);
  });
}

// Passe de l'écran d'annonce à la première question de la partie
function leavePart() {
  if (busy) return;
  transition(() => renderQuestion(index));
}

function start() {
  Sound.init();
  Sound.startMusic();
  picks = [];
  score = 0;
  shownScore = 0;
  streak = 0;
  collected.clear();
  $("scoreVal").textContent = "0";
  updateCombo();
  FX.clear();
  shuffleQuestions();
  paused = false;
  stage.classList.remove("paused");
  stopFlight();
  // D'abord le vol du héros jusqu'à la ligne du quiz (si vol.js est chargé), sinon directement le quiz
  if (window.HeroFlight && window.Taste3D) transition(startFlight);
  else goTo(0);
}

// ===== Boucle principale =====
let prev = performance.now();

function loop(now) {
  // limité à 0,1 s : si l'onglet passe en arrière-plan, le quiz ne saute pas de questions
  const dt = Math.min(0.1, (now - prev) / 1000);
  prev = now;

  if (!paused && !busy) {
    elapsed += dt;

    if (phase === "question") {
      const left = Math.max(0, CONFIG.questionTime - elapsed);
      const ratio = left / CONFIG.questionTime;
      els.timerFill.style.width = ratio * 100 + "%";
      els.timerFill.classList.toggle("warn", left <= CONFIG.questionTime / 2 && left > 3);
      els.timerFill.classList.toggle("danger", left <= 3);

      const sec = Math.ceil(left);
      if (sec <= 5 && sec > 0 && sec !== lastTick) {
        lastTick = sec;
        Sound.play(sec <= 3 ? "heartbeat" : "tick");
      }
      if (left <= 0) reveal();
    } else if (phase === "reveal" && elapsed >= CONFIG.revealTime) {
      setPhase("explain");
    } else if (phase === "explain" && elapsed >= CONFIG.explainTime) {
      goTo(index + 1);
    } else if (phase === "part" && elapsed >= CONFIG.partTime) {
      leavePart();
    }
  }

  pollPad();

  // le compteur de points défile jusqu'au score
  if (shownScore < score) {
    shownScore = Math.min(score, shownScore + Math.max(1, Math.ceil((score - shownScore) * 0.08)));
    $("scoreVal").textContent = shownScore;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ===== Manette (API Gamepad : Xbox, PlayStation, Switch Pro…) =====
// A : jouer / valider · stick ou croix : choisir une réponse (et piloter le héros, voir vol.js)
// Start : pause · View/Back : passer le vol · LB / RB : question précédente / suivante
// Le navigateur ne « voit » la manette qu'après un premier appui sur un de ses boutons.
const PAD = { A: 0, B: 1, LB: 4, RB: 5, BACK: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
let padPrev = [];       // boutons appuyés à l'image précédente (pour ne réagir qu'au moment de l'appui)
let padStick = 0;       // dernière direction du stick (-1, 0, 1) pour déplacer la sélection d'un cran
let padFocus = 0;       // réponse sélectionnée à la manette

// Lit TOUTES les manettes branchées et les fusionne : sur certains PC, un faux périphérique
// (pilote virtuel, volant, logiciel de LED…) apparaît en premier et la vraie manette plus loin.
// Gère aussi les manettes « génériques » dont la croix est un axe « chapeau » (axe 9) au lieu de boutons.
// Renvoie { id, buttons: [true/false…], axes: [x, y] } ou null.
function readPad() {
  let pads = [];
  try { pads = navigator.getGamepads ? [...navigator.getGamepads()].filter((p) => p && p.connected !== false) : []; } catch (e) { pads = []; }
  if (!pads.length) return null;
  const buttons = Array(17).fill(false), axes = [0, 0];
  let id = "";
  for (const p of pads) {
    p.buttons.forEach((b, i) => { if (b && (b.pressed || b.value > 0.5)) buttons[i] = true; });
    const x = p.axes[0] || 0, y = p.axes[1] || 0;
    if (Math.abs(x) > Math.abs(axes[0])) axes[0] = x;
    if (Math.abs(y) > Math.abs(axes[1])) axes[1] = y;
    if (p.mapping !== "standard" && p.axes.length > 9) {
      const v = p.axes[9]; // chapeau : -1 = haut, puis sens horaire ; au repos la valeur sort de [-1, 1]
      if (v >= -1.05 && v <= 1.05) {
        const dir = Math.round((v + 1) / (2 / 7)) % 8;
        if ([7, 0, 1].includes(dir)) buttons[PAD.UP] = true;
        if ([1, 2, 3].includes(dir)) buttons[PAD.RIGHT] = true;
        if ([3, 4, 5].includes(dir)) buttons[PAD.DOWN] = true;
        if ([5, 6, 7].includes(dir)) buttons[PAD.LEFT] = true;
      }
    }
    if (!id) id = p.id;
  }
  return { id, buttons, axes };
}
window.FlavoloPad = { read: readPad }; // utilisé aussi par vol.js pour piloter le héros

// Met en avant la réponse choisie à la manette ; sur une carte 3D, l'objet s'emballe
function focusOption(k) {
  const opts = [...els.options.children];
  if (!opts.length) return;
  padFocus = (k + opts.length) % opts.length;
  opts.forEach((o, i) => {
    o.classList.toggle("pad-focus", i === padFocus);
    if (o.handle3d) Taste3D.boost(o.handle3d, i === padFocus);
  });
}

function pollPad() {
  const pad = readPad();
  if (!pad) return;
  if (!stage.classList.contains("pad-on")) padDetected(pad.id);
  const down = pad.buttons;
  const before = padPrev;
  const hit = (i) => down[i] && !before[i];
  padPrev = down;

  // direction : croix, ou stick poussé franchement (il doit revenir au centre avant le cran suivant)
  const [ax, ay] = pad.axes;
  const stick = Math.abs(ax) > 0.6 ? Math.sign(ax) : Math.abs(ay) > 0.6 ? Math.sign(ay) : 0;
  const step = hit(PAD.RIGHT) || hit(PAD.DOWN) || (stick === 1 && padStick !== 1) ? 1
    : hit(PAD.LEFT) || hit(PAD.UP) || (stick === -1 && padStick !== -1) ? -1 : 0;
  padStick = stick;

  if (down.some(Boolean)) Sound.init(); // un appui réveille le son

  const ok = [0, 1, 2, 3].some(hit); // A, B, X ou Y : sur une manette générique, l'ordre des boutons change

  if (hit(PAD.START)) {
    if (phase === "intro" || phase === "end") return start();
    return togglePause();
  }
  if (paused) return;

  if (phase === "intro" || phase === "end") {
    if (ok) start();
  } else if (phase === "flight") {
    if (hit(PAD.BACK) && flight) flight.skip();
  } else if (phase === "part") {
    if (ok) leavePart();
  } else if (phase === "question") {
    if (step) focusOption(stage.querySelector(".pad-focus") ? padFocus + step : 0);
    if (ok) {
      if (stage.querySelector(".pad-focus")) pick(padFocus);
      else focusOption(0); // premier appui : on montre d'abord la sélection
    }
  }
  if (phase !== "intro" && phase !== "end" && phase !== "flight" && phase !== "part") {
    if (hit(PAD.RB)) goTo(index + 1);
    if (hit(PAD.LB)) goTo(index - 1);
  }
}

function padDetected(id) {
  if (stage.classList.contains("pad-on")) return;
  stage.classList.add("pad-on");
  comic("MANETTE PRÊTE !", "#22c55e", 960, 540, 1500);
  console.log("Manette détectée : " + id);
}
addEventListener("gamepadconnected", (e) => padDetected(e.gamepad.id));
addEventListener("gamepaddisconnected", () => {
  if (!readPad()) stage.classList.remove("pad-on");
});

// ===== Contrôles =====
$("startBtn").addEventListener("click", start);
$("restartBtn").addEventListener("click", start);
$("soundBtn").addEventListener("click", () => { Sound.init(); Sound.toggleMute(); });

function togglePause() {
  paused = !paused;
  stage.classList.toggle("paused", paused);
  Sound.pause(paused);
  if (flight) flight.pause(paused);
}

document.addEventListener("keydown", (e) => {
  // Pendant le vol, les flèches pilotent le héros (vol.js) : seules pause, Entrée (passer), F et M restent actives
  if (phase === "flight" && !["f", "F", "m", "M"].includes(e.key)) {
    if (e.code === "Space") { e.preventDefault(); togglePause(); }
    else if (e.key === "Enter") flight && flight.skip();
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    if (phase === "intro" || phase === "end") return start();
    togglePause();
  } else if (e.key === "ArrowRight" && phase === "part") {
    leavePart();
  } else if (e.key === "ArrowRight" && phase !== "intro" && phase !== "end") {
    goTo(index + 1);
  } else if (e.key === "ArrowLeft" && phase !== "intro" && phase !== "end") {
    goTo(index - 1);
  } else if (e.key === "f" || e.key === "F") {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  } else if (e.key === "m" || e.key === "M") {
    Sound.init();
    Sound.toggleMute();
  } else if (["a", "b", "c"].includes(e.key.toLowerCase())) {
    pick("abc".indexOf(e.key.toLowerCase()));
  }
});

// ===== Écran d'accueil : trois héros 3D accueillent les joueurs =====
// (taste3d.js est un module : il est prêt au moment de DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
  if (!window.Taste3D) return;

  // Aperçu direct d'un écran, pour préparer la présentation : gouts.html#q=3&p=explain (ou p=end, p=flight)
  const preview = new URLSearchParams(location.hash.slice(1));
  if (preview.has("p")) {
    const p = preview.get("p");
    index = Math.min(QUESTIONS.length - 1, +preview.get("q") || 0);
    if (p === "end") {
      picks = QUESTIONS.map((q, i) => (i % 3 ? q.answer : -1));
      score = 1730;
      QUESTIONS.forEach((q, i) => { if (i % 3) collected.add(answerKey(q)); });
      return showEnd();
    }
    if (p === "part") return showPart(PARTS[0]);
    if (p === "flight") return startFlight(+preview.get("t") || 0);
    renderQuestion(index);
    if (p !== "question") {
      picks[index] = QUESTIONS[index].answer;
      reveal();
      if (p === "explain") setPhase("explain");
    }
    return;
  }

  document.querySelectorAll(".intro .intro-hero").forEach((box) => mount3d(box, box.dataset.key, { hero: true, fit: 1.3 }));
});
