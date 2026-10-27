// ===== Vol du héros : mini-jeu avant le quiz =====
// Le joueur guide un super-héros avec les flèches du clavier (ou la souris / le doigt) :
// il esquive les météorites et les nuages d'orage, attrape des étoiles,
// et le quiz commence quand il franchit la LIGNE DU QUIZ. Pas de « game over » : un choc fait juste rebondir.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const LENGTH = 300;                 // distance jusqu'à la ligne du quiz (environ 25 secondes)
const SPEED = 12;                   // vitesse normale (→ accélère, ← freine)
const MOVE = 10;                    // vitesse de déplacement du héros
const BOUNDS = { x: [-12, 8], y: [-6.3, 6.3] };
const HERO_SIZE = 1.8;
const HERO_KEYS = ["sweet", "spicy", "fresh", "fat", "umami", "sour", "salty"];
const CAM_Z = 24;
const HALF_H = CAM_Z * Math.tan(THREE.MathUtils.degToRad(20)); // demi-hauteur visible au plan du héros
const HALF_W = HALF_H * (16 / 9);

// Générateur pseudo-aléatoire
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function noise3(x, y, z) {
  return Math.sin(x * 1.7 + Math.sin(y * 2.3)) * Math.sin(y * 1.9 + Math.sin(z * 2.1)) * Math.sin(z * 2.2 + Math.sin(x * 1.3));
}

// ===== Décor et obstacles =====

// Nuage moelleux : quelques boules blanches serrées
function cloud(rand, color = 0xffffff, opacity = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const n = 5 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const r = 0.7 + rand() * 0.8;
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
    s.position.set((i - n / 2) * 0.9 + rand() * 0.4, Math.sin((i / (n - 1)) * Math.PI) * 0.7 + rand() * 0.3, rand() * 0.6);
    s.scale.y = 0.85;
    g.add(s);
  }
  return g;
}

// Météorite : rocher cabossé et traînée de feu
function meteor(rand, r) {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // le relief dépend seulement de la position : les faces restent collées
    v.multiplyScalar(1 + 0.22 * noise3(v.x * 2.6, v.y * 2.6, v.z * 2.6) + 0.08 * noise3(v.x * 6, v.y * 6, v.z * 6));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x6b4a36, roughness: 0.9, flatShading: true, emissive: 0xff4a00, emissiveIntensity: 0.18,
  }));
  rock.scale.setScalar(r);
  g.add(rock);
  // traînée de feu derrière (vers la droite, car la météorite file vers la gauche)
  [[0xffd000, 1.0, 0.9], [0xff6a00, 1.6, 0.6], [0xff2a00, 2.3, 0.35]].forEach(([c, len, op]) => {
    const fire = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.85, r * len * 2, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    fire.rotation.z = -Math.PI / 2; // la pointe de la flamme file vers l'arrière
    fire.position.x = r * len;
    g.add(fire);
  });
  g.userData.update = (t) => {
    rock.rotation.x = t * 1.3;
    rock.rotation.y = t * 0.9;
    g.children.slice(1).forEach((f, i) => { f.scale.y = 1 + 0.18 * Math.sin(t * 18 + i * 2); });
  };
  return g;
}

// Nuage d'orage : nuage sombre et éclair jaune qui clignote
function storm(rand, r) {
  const g = cloud(rand, 0x55556e);
  g.scale.setScalar(r * 0.75);
  const s = new THREE.Shape();
  s.moveTo(-0.1, 1.3); s.lineTo(0.55, 1.3); s.lineTo(0.2, 0.35); s.lineTo(0.62, 0.35);
  s.lineTo(-0.32, -1.35); s.lineTo(0.0, -0.1); s.lineTo(-0.42, -0.1); s.closePath();
  const bolt = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }),
    new THREE.MeshBasicMaterial({ color: 0xffd400, toneMapped: false })
  );
  bolt.position.set(0.2, -1.7, 0.6);
  bolt.scale.setScalar(0.9);
  g.add(bolt);
  g.userData.update = (t) => {
    bolt.visible = Math.sin(t * 9) > -0.3 || Math.sin(t * 23) > 0.6;
    g.rotation.z = 0.08 * Math.sin(t * 2);
  };
  return g;
}

// Étoile dorée à attraper
const STAR_GEO = (() => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 + Math.PI / 2, rr = i % 2 ? 0.45 : 1;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1, bevelSegments: 3 });
  geo.center();
  return geo;
})();

// Textures dessinées à la volée : damier de la ligne, et bannière « LIGNE DU QUIZ »
function checkerTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 1024;
  const ctx = c.getContext("2d");
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 2; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#ffffff" : "#8a4dff";
      ctx.fillRect(x * 64, y * 64, 64, 64);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function bannerTexture(text) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    ctx.clearRect(0, 0, 1024, 256);
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.roundRect(14, 22, 1000, 224, 40);
    ctx.fill();
    ctx.fillStyle = "#ffc400";
    ctx.beginPath();
    ctx.roundRect(4, 8, 1000, 224, 40);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#1c1c1c";
    ctx.stroke();
    ctx.font = '150px "Bangers", "Arial Black", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 18;
    ctx.strokeStyle = "#1c1c1c";
    ctx.strokeText(text, 504, 128);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 504, 128);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts.load('150px "Bangers"').then(draw).catch(() => {});
  return tex;
}

// Manette : stick gauche (analogique, avec zone morte) ou croix directionnelle → [x, y] entre -1 et 1
// (la lecture des manettes, toutes fusionnées, est faite par script.js : window.FlavoloPad)
function gamepadInput() {
  const pad = window.FlavoloPad && window.FlavoloPad.read();
  if (!pad) return [0, 0];
  const dead = (v) => (Math.abs(v) < 0.2 ? 0 : (v - Math.sign(v) * 0.2) / 0.8);
  const btn = (i) => (pad.buttons[i] ? 1 : 0);
  const x = dead(pad.axes[0]) || btn(15) - btn(14);
  const y = -dead(pad.axes[1]) || btn(12) - btn(13);
  return [x, y];
}

// ===== Le jeu =====
// opts : { onEvent(type, data), onDone(stars), warp } — warp : secondes de vol simulées d'avance (aperçu)
// Événements : count (n), go, star (pos), hit (pos), finish (pos) — pos en coordonnées de la scène 1920x1080
function start(container, opts = {}) {
  const emit = (type, data) => opts.onEvent && opts.onEvent(type, data);
  const rand = rng(1 + Math.floor(Math.random() * 100000));
  const heroKey = HERO_KEYS[Math.floor(Math.random() * HERO_KEYS.length)];
  const heroName = (window.QUIZ_HEROES && window.QUIZ_HEROES[heroKey] && window.QUIZ_HEROES[heroKey].name) || "LE HÉROS";

  // ----- Interface par-dessus la 3D -----
  container.innerHTML = `
    <div class="fl-top">
      <div class="fl-track"><div class="fl-fill"></div><div class="fl-me"></div><div class="fl-goal">QUIZ</div></div>
      <div class="fl-stars"><svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg><b>0</b></div>
    </div>
    <div class="fl-help">
      <div class="fl-title"></div>
      <div class="fl-keys">
        <div class="fl-pad"><i></i><kbd>↑</kbd><i></i><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div>
        <ul>
          <li><b>↑ ↓</b> monter, descendre</li>
          <li><b>→</b> foncer · <b>←</b> freiner</li>
          <li>Attrape les <b class="gold">étoiles</b>, évite les <b class="red">météorites</b> et les <b class="grey">orages</b> !</li>
        </ul>
      </div>
    </div>
    <div class="fl-count"></div>
    <button class="fl-skip">PASSER »</button>`;
  const ui = {
    fill: container.querySelector(".fl-fill"),
    me: container.querySelector(".fl-me"),
    stars: container.querySelector(".fl-stars b"),
    help: container.querySelector(".fl-help"),
    count: container.querySelector(".fl-count"),
  };
  container.querySelector(".fl-title").textContent = `Guide ${heroName} jusqu'à la LIGNE DU QUIZ !`;

  // ----- Moteur 3D -----
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1920, 1080);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.8);
  sun.position.set(-6, 10, 12);
  scene.add(sun, new THREE.HemisphereLight(0xcfe6ff, 0x8a4dff, 0.6));

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 400);
  camera.position.set(0, 0, CAM_Z);
  camera.lookAt(0, 0, 0);

  // Le héros, tourné vers la droite (vers la ligne) mais en montrant ses yeux
  const hero = new THREE.Group();
  const heroModel = window.Taste3D.create(heroKey, { hero: true });
  heroModel.scale.setScalar(HERO_SIZE);
  heroModel.rotation.y = 0.55;
  hero.add(heroModel);
  scene.add(hero);
  const pos = new THREE.Vector2(-20, 0);  // position du héros (x, y)
  const vel = new THREE.Vector2(0, 0);

  // Traînée arc-en-ciel derrière le héros
  const trail = [];
  const trailGeo = new THREE.SphereGeometry(0.32, 12, 8);
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    m.visible = false;
    m.userData.age = 1;
    scene.add(m);
    trail.push(m);
  }
  let trailNext = 0, trailClock = 0;

  // Nuages (au loin, ils défilent plus lentement grâce à la perspective) et traits de vitesse
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const near = i >= 23; // trois petits nuages transparents au premier plan
    const z = near ? 6 + rand() * 3 : -75 + rand() * 50;
    const c = cloud(rand, 0xffffff, near ? 0.4 : 1);
    const half = (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(20)) * (16 / 9) + 8;
    c.position.set(-half + rand() * half * 2, (rand() - 0.5) * (CAM_Z - z) * 0.7, z);
    c.scale.setScalar(near ? 0.7 + rand() * 0.5 : 1.2 + rand() * 1.8);
    c.userData.half = half;
    scene.add(c);
    clouds.push(c);
  }
  const lines = [];
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 26; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(2 + rand() * 3, 0.06, 0.06), lineMat);
    l.position.set((rand() - 0.5) * 2 * HALF_W * 1.4, (rand() - 0.5) * 2 * HALF_H, -8 + rand() * 10);
    scene.add(l);
    lines.push(l);
  }

  // Obstacles et étoiles, placés le long du parcours (plus serrés vers la fin)
  const obstacles = [];
  const stars = [];
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffc400, metalness: 0.6, roughness: 0.25, emissive: 0x7a4a00, emissiveIntensity: 0.6 });
  const addObstacle = (wx, y, amp) => {
    const isMeteor = rand() < 0.6;
    const r = isMeteor ? 1.1 + rand() * 0.7 : 1.6 + rand() * 0.6;
    const mesh = isMeteor ? meteor(rand, r) : storm(rand, r);
    scene.add(mesh);
    obstacles.push({ mesh, wx, y, amp, phase: rand() * 6, hit: isMeteor ? r * 0.85 : r * 0.95 });
  };
  const addStars = (wx, y) => {
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(STAR_GEO, starMat);
      mesh.scale.setScalar(0.6);
      scene.add(mesh);
      stars.push({ mesh, wx: wx + i * 1.7, y: y + Math.sin((i / 4) * Math.PI) * 1.6, taken: false });
    }
  };
  for (let wx = 45; wx < LENGTH - 25;) {
    const k = wx / LENGTH; // difficulté qui monte doucement
    if (k > 0.25 && rand() < 0.35) {
      const mid = (rand() - 0.5) * 5; // deux obstacles, un passage au milieu
      addObstacle(wx, mid + 4.4, 0);
      addObstacle(wx + 1, mid - 4.4, 0);
    } else {
      addObstacle(wx, (rand() - 0.5) * 10, k > 0.4 && rand() < 0.5 ? 1.6 : 0);
    }
    const gap = 15 - 5 * k + rand() * 4;
    addStars(wx + gap / 2 - 3.4, (rand() - 0.5) * 8);
    wx += gap;
  }

  // La LIGNE DU QUIZ : bande de damier + bannière
  const finish = new THREE.Group();
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2 * HALF_H + 4), new THREE.MeshBasicMaterial({ map: checkerTexture() }));
  stripe.position.z = -1.5;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshBasicMaterial({ map: bannerTexture("LIGNE DU QUIZ"), transparent: true }));
  banner.position.set(0, HALF_H - 1.9, 1);
  finish.add(stripe, banner);
  [-1, 1].forEach((side) => { // deux poteaux dorés
    const post = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 16), starMat);
    post.position.set(0, side * (HALF_H - 0.4), -1);
    finish.add(post);
  });
  scene.add(finish);

  // ----- Commandes : flèches (ou ZQSD/WASD), souris ou doigt -----
  const keys = new Set();
  const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", z: "up", w: "up", s: "down", q: "left", a: "left", d: "right" };
  const onKey = (e) => {
    const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase()];
    if (!k) return;
    e.preventDefault();
    if (e.type === "keydown") keys.add(k);
    else keys.delete(k);
  };
  let pointer = null;
  const toWorld = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width - 0.5) * 2 * HALF_W, -((e.clientY - r.top) / r.height - 0.5) * 2 * HALF_H);
  };
  const onDown = (e) => { if (!e.target.closest(".fl-skip")) pointer = toWorld(e); };
  const onMove = (e) => { if (pointer) pointer = toWorld(e); };
  const onUp = () => { pointer = null; };
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKey);
  container.addEventListener("pointerdown", onDown);
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", onUp);

  let state = "intro"; // intro (compte à rebours) | play | finish | done
  let t = 0, stateTime = 0, d = 0, speed = SPEED, invincible = 0, caught = 0, paused = false, lastCount = 4;
  let raf = 0, prev = performance.now();
  const project = new THREE.Vector3();
  const toStage = (x, y) => {
    project.set(x, y, 0).project(camera);
    return { x: (project.x + 1) * 960, y: (1 - project.y) * 540 };
  };

  function setState(s) {
    state = s;
    stateTime = 0;
  }

  function showCount(text) {
    ui.count.textContent = text;
    ui.count.classList.remove("pop");
    void ui.count.offsetWidth;
    ui.count.classList.add("pop");
  }

  function finishNow() {
    if (state === "finish" || state === "done") return;
    setState("finish");
    emit("finish", toStage(pos.x, pos.y));
  }

  function update(dt) {
    t += dt;
    stateTime += dt;
    heroModel.userData.update(t);

    // ----- le héros -----
    let ix = 0, iy = 0;
    if (state === "play") {
      if (pointer) { // il suit la souris / le doigt
        ix = THREE.MathUtils.clamp((pointer.x - pos.x) / 2, -1, 1);
        iy = THREE.MathUtils.clamp((pointer.y - pos.y) / 2, -1, 1);
      } else {
        ix = (keys.has("right") ? 1 : 0) - (keys.has("left") ? 1 : 0);
        iy = (keys.has("up") ? 1 : 0) - (keys.has("down") ? 1 : 0);
        if (!ix && !iy) [ix, iy] = gamepadInput();
      }
      speed = THREE.MathUtils.lerp(speed, SPEED + 7 * Math.max(0, ix) + 4 * Math.min(0, ix), Math.min(1, dt * 3));
      // sans flèche gauche/droite, le héros revient doucement à sa place (après un choc, il ne reste pas coincé au bord)
      const home = ix === 0 && !pointer ? (-7 - pos.x) * 0.8 : 0;
      vel.x = THREE.MathUtils.lerp(vel.x, ix * MOVE + home, Math.min(1, dt * 6));
      vel.y = THREE.MathUtils.lerp(vel.y, iy * MOVE, Math.min(1, dt * 7));
      pos.addScaledVector(vel, dt);
      pos.x = THREE.MathUtils.clamp(pos.x, BOUNDS.x[0], BOUNDS.x[1]);
      pos.y = THREE.MathUtils.clamp(pos.y, BOUNDS.y[0], BOUNDS.y[1]);
    } else if (state === "intro") {
      // le héros arrive en volant pendant le compte à rebours
      pos.x = THREE.MathUtils.lerp(-20, -7, 1 - (1 - Math.min(1, stateTime / 2)) ** 3);
      pos.y = 0.5 * Math.sin(t * 2);
      speed = SPEED * 0.6;
      const n = 3 - Math.floor(stateTime / 0.9);
      if (stateTime > 0.6 && n !== lastCount && n >= 0) {
        lastCount = n;
        if (n > 0) { showCount(String(n)); emit("count", n); }
        else { showCount("GO !"); emit("go"); setState("play"); }
      }
    } else if (state === "finish") {
      // ligne franchie : le héros file tout droit vers la droite
      pos.x += (12 + stateTime * 30) * dt;
      pos.y = THREE.MathUtils.lerp(pos.y, 0, dt * 3);
      speed = THREE.MathUtils.lerp(speed, 4, dt * 2);
      if (stateTime > 1.6 && state !== "done") {
        setState("done");
        opts.onDone && opts.onDone(caught);
      }
    }
    if (state !== "done") d += speed * dt;

    hero.position.set(pos.x, pos.y + 0.15 * Math.sin(t * 3), 0);
    hero.rotation.z = THREE.MathUtils.lerp(hero.rotation.z, vel.y * 0.035 - Math.max(0, vel.x) * 0.012, Math.min(1, dt * 8));
    hero.rotation.x = 0.1 * Math.sin(t * 2.2);
    invincible = Math.max(0, invincible - dt);
    hero.visible = invincible === 0 || Math.floor(invincible * 12) % 2 === 0;

    // traînée arc-en-ciel
    trailClock += dt;
    if (trailClock > 0.03 && state !== "done") {
      trailClock = 0;
      const m = trail[trailNext++ % trail.length];
      m.visible = true;
      m.userData.age = 0;
      m.position.set(pos.x - 1.6, pos.y + (Math.random() - 0.5) * 0.4, -0.4);
      m.material.color.setHSL((t * 0.6) % 1, 0.9, 0.62);
    }
    for (const m of trail) {
      if (!m.visible) continue;
      m.userData.age += dt;
      m.position.x -= speed * dt;
      const k = 1 - m.userData.age / 0.9;
      if (k <= 0) { m.visible = false; continue; }
      m.scale.setScalar(k);
      m.material.opacity = k * 0.85;
    }

    // ----- décor -----
    for (const c of clouds) {
      c.position.x -= speed * dt * 0.5;
      if (c.position.x < -c.userData.half) c.position.x += c.userData.half * 2;
    }
    for (const l of lines) {
      l.position.x -= speed * dt * 2.2;
      if (l.position.x < -HALF_W * 1.5) {
        l.position.x = HALF_W * 1.5;
        l.position.y = (Math.random() - 0.5) * 2 * HALF_H;
      }
    }
    lineMat.opacity = 0.25 + 0.04 * (speed - SPEED * 0.6);

    // ----- obstacles : chocs -----
    for (const o of obstacles) {
      const x = o.wx - d;
      o.mesh.visible = x > -HALF_W - 6 && x < HALF_W + 6;
      if (!o.mesh.visible) continue;
      const y = o.y + o.amp * Math.sin(t * 1.4 + o.phase);
      o.mesh.position.set(x, y, 0);
      o.mesh.userData.update(t + o.phase);
      if (state === "play" && invincible === 0 && Math.hypot(x - pos.x, y - pos.y) < o.hit + 1.1) {
        invincible = 1.4;
        vel.set(-14, Math.sign(pos.y - y || 1) * 8); // le héros rebondit en arrière
        speed = SPEED * 0.5;
        emit("hit", toStage(pos.x, pos.y));
      }
    }

    // ----- étoiles -----
    for (const s of stars) {
      if (s.taken) continue;
      const x = s.wx - d;
      s.mesh.visible = x > -HALF_W - 2 && x < HALF_W + 2;
      if (!s.mesh.visible) continue;
      s.mesh.position.set(x, s.y + 0.2 * Math.sin(t * 3 + s.wx), 0);
      s.mesh.rotation.y = t * 3 + s.wx;
      if (state === "play" && Math.hypot(x - pos.x, s.mesh.position.y - pos.y) < 1.9) {
        s.taken = true;
        s.mesh.visible = false;
        caught++;
        ui.stars.textContent = caught;
        emit("star", toStage(x, s.mesh.position.y));
      }
    }

    // ----- ligne du quiz -----
    const lineX = LENGTH - d;
    finish.position.x = lineX;
    finish.visible = lineX < HALF_W + 8;
    banner.rotation.z = 0.04 * Math.sin(t * 3);
    if (state === "play" && lineX <= pos.x) finishNow();

    // ----- barre de progression -----
    const progress = Math.min(1, d / (LENGTH + 7));
    ui.fill.style.width = progress * 100 + "%";
    ui.me.style.left = progress * 100 + "%";
    ui.help.classList.toggle("hide", state !== "intro" && !(state === "play" && stateTime < 2.5));
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!paused) update(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  for (let i = 0; i < (opts.warp || 0) * 30; i++) update(1 / 30);
  raf = requestAnimationFrame(frame);

  // Passer le vol (bouton « PASSER » ou touche Entrée)
  const skip = () => { if (state === "intro" || state === "play") finishNow(); };
  container.querySelector(".fl-skip").addEventListener("click", skip);

  return {
    skip,
    pause(on) { paused = on; },
    stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKey);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      container.removeEventListener("pointerdown", onDown);
      scene.traverse((o) => {
        if (o.geometry && o.geometry !== STAR_GEO) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      scene.environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      container.innerHTML = "";
    },
  };
}

window.HeroFlight = { start };
