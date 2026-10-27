// ===== Export des modèles 3D en vidéos MP4 pour ventilateur holographique =====
// Chaque image est dessinée puis encodée une par une (pas d'enregistrement en temps réel) :
// la vidéo est fluide même sur un ordinateur lent.
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

const SIZE = 1080;   // vidéo carrée, en pixels
const FPS = 30;
const LOOP = 10;     // secondes par modèle (un tour complet)
const FIT = 1.2;     // marge : le modèle reste dans le cercle du ventilateur
const SAVE_URL = "http://localhost:5501/save/"; // petit serveur d'enregistrement (facultatif)

// clé du modèle -> nom du fichier
const FILES = {
  sweet: "01-sucre", salty: "02-sale", umami: "03-umami", sour: "04-acide", bitter: "05-amer",
  spicy: "06-piquant", fresh: "07-frais", fat: "08-gras", smoky: "09-fume", astringent: "10-astringent",
};
// exposure : image plus lumineuse, car les teintes sombres se voient peu sur un hologramme
const RENDER = { background: 0x000000, fit: FIT, solid: 0.4, exposure: 1.35 };

const $ = (id) => document.getElementById(id);
const status = (text) => { $("status").textContent = text; };
window.__holo = { state: "idle", saved: [] };

// Rend la main au navigateur sans passer par un minuteur (les minuteurs ralentissent en arrière-plan)
const breathe = () => new Promise((resolve) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = () => resolve();
  channel.port2.postMessage(0);
});

// ===== Aperçu =====
let preview = null;
function show(key) {
  if (preview) Taste3D.dispose(preview);
  preview = Taste3D.mount($("preview"), key, RENDER);
  document.querySelectorAll("#models button").forEach((b) => b.classList.toggle("on", b.dataset.key === key));
}

Object.keys(FILES).forEach((key) => {
  const b = document.createElement("button");
  b.dataset.key = key;
  b.textContent = Taste3D.label(key);
  b.addEventListener("click", () => show(key));
  $("models").appendChild(b);
});
show("sweet");

// ===== Encodage =====
// Un seul encodeur pour toutes les images : chaque image n'est encodée qu'une fois.
// Les vidéos (une par modèle + une qui les enchaîne) sont ensuite assemblées à partir des mêmes données.
function recorder() {
  const chunks = [];
  let config = null;
  let failure = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      if (meta && meta.decoderConfig) config = meta;
      chunks.push({ data, type: chunk.type, timestamp: chunk.timestamp, duration: chunk.duration });
    },
    error: (e) => { failure = e; },
  });
  encoder.configure({ codec: "avc1.640028", width: SIZE, height: SIZE, bitrate: 14_000_000, framerate: FPS });
  let count = 0;
  return {
    async add(canvas) {
      if (failure) throw failure;
      const frame = new VideoFrame(canvas, { timestamp: (count * 1e6) / FPS, duration: 1e6 / FPS, alpha: "discard" });
      encoder.encode(frame, { keyFrame: count % FPS === 0 }); // une image clé par seconde : on peut couper à chaque modèle
      frame.close();
      count++;
      while (encoder.encodeQueueSize > 4) await breathe();
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      chunks.sort((x, y) => x.timestamp - y.timestamp);
    },
    // Fabrique un fichier MP4 avec les images de « from » à « to »
    mp4(from, to) {
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: "avc", width: SIZE, height: SIZE },
        fastStart: "in-memory",
      });
      const start = chunks[from].timestamp;
      for (let i = from; i < to; i++) {
        const c = chunks[i];
        muxer.addVideoChunkRaw(c.data, c.type, c.timestamp - start, c.duration, i === from ? config : undefined);
      }
      muxer.finalize();
      return new Blob([muxer.target.buffer], { type: "video/mp4" });
    },
  };
}

// Enregistre dans le dossier videos/ si le serveur d'enregistrement tourne, sinon télécharge le fichier
async function save(blob, name) {
  try {
    const res = await fetch(SAVE_URL + name, { method: "POST", body: blob });
    if (!res.ok) throw new Error("HTTP " + res.status);
  } catch {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }
  window.__holo.saved.push(name);
}

async function exportAll() {
  $("export").disabled = true;
  window.__holo = { state: "running", saved: [] };
  if (preview) { Taste3D.dispose(preview); preview = null; }
  try {
    const rec = recorder();
    const keys = Object.keys(FILES);
    const frames = LOOP * FPS;
    for (const [n, key] of keys.entries()) {
      const handle = Taste3D.mount($("stage"), key, { ...RENDER, pixelRatio: 1, manual: true });
      const canvas = handle.renderer.domElement;
      for (let f = 0; f < frames; f++) {
        Taste3D.renderAt(handle, f / FPS, LOOP);
        await rec.add(canvas);
        if (f % 15 === 0) {
          status(`${Taste3D.label(key)} (${n + 1}/${keys.length}) : ${Math.round((f / frames) * 100)} %`);
          window.__holo.progress = `${key} ${f}/${frames}`;
          await breathe();
        }
      }
      Taste3D.dispose(handle);
    }
    await rec.finish();
    status("Enregistrement des fichiers…");
    for (const [n, key] of keys.entries()) await save(rec.mp4(n * frames, (n + 1) * frames), `${FILES[key]}.mp4`);
    await save(rec.mp4(0, keys.length * frames), "00-tous-les-modeles.mp4");
    status("Terminé : " + window.__holo.saved.length + " vidéos enregistrées.");
    window.__holo.state = "done";
  } catch (e) {
    status("Erreur : " + e.message);
    window.__holo.state = "error: " + e.message;
  }
  $("export").disabled = false;
  show("sweet");
}

$("export").addEventListener("click", exportAll);
window.exportHolograms = exportAll;
