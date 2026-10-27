// ===== Taste3D : un modèle 3D par goût et par saveur (Three.js) =====
// Goûts   : sucré = boules roses et caramel, salé = cubes blancs et cristaux, umami = hexagones de verre rouge,
//           acide = éclats de verre vert, amer = losanges de pierre brune.
// Saveurs : piquant = étoiles rouges et dorées, frais = étoile de glace, gras = bulles dorées,
//           fumé = rubans gris et volutes, astringent = fleur de prismes violets mats.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const LABELS = {
  // Goûts (partie 1)
  sweet: "Le sucré",
  salty: "Le salé",
  umami: "L'umami",
  sour: "L'acide",
  bitter: "L'amer",
  // Saveurs (partie 2)
  spicy: "Le piquant",
  fresh: "Le frais",
  fat: "Le gras",
  smoky: "Le fumé",
  astringent: "L'astringent",
};

// ===== Outils =====
const UP = new THREE.Vector3(0, 1, 0);

// Générateur pseudo-aléatoire : chaque modèle est toujours identique
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Directions réparties uniformément sur une sphère
function fibonacci(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    out.push(new THREE.Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r));
  }
  return out;
}

// Bruit simple et continu (pour les surfaces rocheuses)
function noise3(x, y, z) {
  return Math.sin(x * 1.7 + Math.sin(y * 2.3)) * Math.sin(y * 1.9 + Math.sin(z * 2.1)) * Math.sin(z * 2.2 + Math.sin(x * 1.3));
}

// Oriente un objet le long d'une direction, en partant du centre
function pointAlong(obj, dir, distance) {
  obj.quaternion.setFromUnitVectors(UP, dir);
  obj.position.copy(dir).multiplyScalar(distance);
  return obj;
}

// Texture de grain (papier, pierre) générée à la volée
let grainTexture = null;
function grain() {
  if (grainTexture) return grainTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(256, 256);
  const rand = rng(3);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + rand() * 165;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainTexture = new THREE.CanvasTexture(c);
  grainTexture.wrapS = grainTexture.wrapT = THREE.RepeatWrapping;
  grainTexture.repeat.set(3, 3);
  return grainTexture;
}

// Boules qui fusionnent comme un liquide (sucré, gras)
function metaballs({ balls, material, scale = 1.3, resolution = 56 }) {
  const mc = new MarchingCubes(resolution, material, false, true, 90000);
  mc.scale.setScalar(scale);
  mc.frustumCulled = false;
  mc.userData.update = (t) => {
    mc.reset();
    for (const b of balls) {
      const [x, y, z] = b.pos(t);
      mc.addBall(x, y, z, b.strength, 12, b.color);
    }
    mc.update();
  };
  return mc;
}

function glossy(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, ...extra });
}

// Cristal hexagonal avec pointe (salé, frais)
function crystal(r, h, material) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 6), material);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.6, 6), material);
  tip.position.y = h / 2 + r * 0.8;
  g.add(body, tip);
  return g;
}

// ===== Les modèles =====
const BUILDERS = {
  // ===== GOÛTS (partie 1) =====

  // SUCRÉ : boules roses et crème brillantes, rubans de caramel qui coulent, grains de sucre
  sweet() {
    const group = new THREE.Group();
    const rand = rng(12);
    const PINK = 0xff8fb4, CREAM = 0xfff0d6;
    const pink = glossy(PINK, { roughness: 0.15 });
    const cream = glossy(CREAM, { roughness: 0.2 });
    const caramel = new THREE.MeshPhysicalMaterial({ color: 0xc46a14, roughness: 0.06, clearcoat: 1, transmission: 0.35, thickness: 0.5 });
    const sugar = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const sugarGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);

    // boule rayée rose / crème, comme un bonbon
    const stripedGeo = (r) => {
      const geo = new THREE.SphereGeometry(r, 48, 32);
      const p = geo.attributes.position;
      const colors = [];
      const a = new THREE.Color(PINK), b = new THREE.Color(CREAM);
      for (let i = 0; i < p.count; i++) {
        const stripe = Math.floor((Math.atan2(p.getZ(i), p.getX(i)) + Math.PI) / (Math.PI / 5)) % 2;
        const c = stripe ? a : b;
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      return geo;
    };

    const balls = [
      [0.0, -0.45, 0.35, 0.56, pink], [-0.35, 0.55, 0.1, 0.5, pink], [0.72, 0.2, 0.1, 0.47, pink],
      [0.6, -0.68, 0.3, 0.4, cream], [-0.85, -0.12, 0.05, 0.43, "striped"], [-0.8, 0.5, -0.25, 0.26, caramel],
      [0.2, 1.08, 0.0, 0.2, pink], [-0.7, -0.78, 0.2, 0.23, cream], [-0.22, -0.98, 0.5, 0.2, pink],
      [0.98, -0.2, -0.3, 0.3, cream], [0.85, 0.75, -0.2, 0.14, cream], [-0.3, -0.35, -0.55, 0.5, cream],
    ];
    for (const [x, y, z, r, mat] of balls) {
      const mesh = mat === "striped"
        ? new THREE.Mesh(stripedGeo(r), glossy(0xffffff, { vertexColors: true, roughness: 0.15 }))
        : new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
      mesh.position.set(x, y, z);
      if (mat === "striped") mesh.rotation.set(0.6, 0, 0.5);
      group.add(mesh);
      // grains de sucre saupoudrés sur le dessus
      for (let i = 0; i < Math.floor(r * 80); i++) {
        const a = rand() * Math.PI * 2;
        const up = 0.35 + rand() * 0.65;
        const s = Math.sqrt(1 - up * up);
        const g = new THREE.Mesh(sugarGeo, sugar);
        g.position.set(x + Math.cos(a) * s * r, y + up * r, z + Math.sin(a) * s * r);
        g.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        group.add(g);
      }
    }

    const ribbon = (points, radius, mat) => {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, radius, 16), mat));
      for (const end of [curve.getPoint(0), curve.getPoint(1)]) {
        const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), mat);
        cap.position.copy(end);
        group.add(cap);
      }
      return curve;
    };
    // caramel qui s'enroule autour des boules
    ribbon([[-1.05, -0.75, 0.45], [-0.45, -0.2, 0.88], [0.1, 0.3, 0.78], [-0.1, 0.85, 0.45], [0.35, 1.02, 0.05]], 0.13, caramel);
    const drip = ribbon([[0.2, 0.1, 0.82], [0.8, -0.15, 0.62], [1.15, -0.5, 0.25], [1.12, -1.0, 0.15]], 0.11, caramel);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), caramel); // la goutte au bout
    drop.position.copy(drip.getPoint(1));
    drop.scale.y = 1.5;
    group.add(drop);
    // crème fouettée
    ribbon([[0.55, 1.0, -0.25], [0.2, 0.62, 0.3], [0.32, 0.1, 0.62], [0.5, -0.3, 0.58]], 0.2, cream);

    group.userData.update = (t) => {
      const s = 0.025 * Math.sin(t * 2.2); // rebondit tout en douceur
      group.scale.set(1 + s, 1 - s, 1 + s);
      drop.scale.y = 1.5 + 0.35 * Math.sin(t * 1.6);
    };
    return group;
  },

  // SALÉ : gros cubes blancs granuleux, cristaux de verre pointus, petits grains éparpillés
  salty() {
    const group = new THREE.Group();
    const rand = rng(21);
    const saltMat = new THREE.MeshPhysicalMaterial({
      color: 0xb4c2cf, roughness: 0.85, envMapIntensity: 0.6, flatShading: true, bumpMap: grain(), bumpScale: 4,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x74bfae, roughness: 0.05, transmission: 0.6, thickness: 0.8, ior: 1.5, flatShading: true, clearcoat: 1,
    });

    // cube à la surface granuleuse, comme un gros grain de sel
    const roughCube = (s) => {
      const geo = new THREE.BoxGeometry(s, s, s, 14, 14, 14);
      const p = geo.attributes.position;
      const f = 20 / s;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = 1 + 0.06 * noise3(x * f, y * f, z * f) + 0.035 * noise3(x * f * 2.3, y * f * 2.3, z * f * 2.3);
        p.setXYZ(i, x * n, y * n, z * n);
      }
      geo.computeVertexNormals();
      return geo;
    };

    [
      [0.0, -0.55, 0.45, 0.78], [-0.78, -0.3, 0.1, 0.62], [0.1, 0.22, 0.2, 0.6],
      [-0.2, 0.85, -0.1, 0.58], [0.85, -0.7, 0.0, 0.55], [0.75, 0.0, -0.35, 0.42],
    ].forEach(([x, y, z, s], i) => {
      const cube = new THREE.Mesh(roughCube(s), saltMat);
      cube.position.set(x, y, z);
      cube.rotation.set(0.25 * Math.sin(i * 2.1), 0.5 * Math.cos(i * 1.3), 0.3 * Math.sin(i * 3.7));
      group.add(cube);
    });

    [
      [0.55, 0.78, -0.2, 0.2, 1.3, -0.35], [-0.88, 0.45, -0.2, 0.17, 0.9, 0.75], [1.0, 0.25, 0.0, 0.16, 0.9, -0.8],
      [0.45, -0.1, 0.4, 0.17, 1.0, -0.15], [-0.45, 0.95, -0.4, 0.14, 0.7, 0.35],
    ].forEach(([x, y, z, r, h, tilt]) => {
      const c = crystal(r, h, glass);
      c.position.set(x, y, z);
      c.rotation.z = tilt;
      group.add(c);
    });

    for (let i = 0; i < 34; i++) {
      const s = 0.05 + rand() * 0.07;
      const g = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), saltMat);
      const a = rand() * Math.PI * 2;
      const d = 0.5 + rand() * 0.9;
      g.position.set(Math.cos(a) * d, -0.98 + rand() * 0.06, Math.sin(a) * d * 0.8);
      g.rotation.y = rand() * 3;
      group.add(g);
    }
    group.userData.spin = 0.45;
    return group;
  },

  // UMAMI : plaques hexagonales de verre rouge et ambre, empilées, avec de petits prismes
  umami() {
    const group = new THREE.Group();
    const rand = rng(44);
    const glass = (color) => new THREE.MeshPhysicalMaterial({
      color, roughness: 0.08, transmission: 0.5, thickness: 1, clearcoat: 1, flatShading: true,
    });
    const red = glass(0xb0140d), deep = glass(0x6f0a08), amber = glass(0xff9a2e);
    const copper = new THREE.MeshStandardMaterial({ color: 0xb5563a, roughness: 0.75, flatShading: true, bumpMap: grain(), bumpScale: 2 });

    const hex = (r, h, mat) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 6), mat);
      m.rotation.x = Math.PI / 2; // la face hexagonale vers nous
      return m;
    };
    // plaques concentriques, de la plus grande à la plus petite, sur les deux faces
    [
      [1.15, 0.3, red, 0], [0.95, 0.16, deep, 0.2], [0.78, 0.14, amber, 0.33], [0.62, 0.14, red, 0.45], [0.47, 0.12, deep, 0.56],
      [0.95, 0.16, amber, -0.2], [0.72, 0.14, red, -0.33], [0.5, 0.12, deep, -0.44],
    ].forEach(([r, h, mat, z]) => {
      const plate = hex(r, h, mat);
      plate.position.z = z;
      group.add(plate);
    });
    // petits prismes hexagonaux accrochés tout autour
    const mats = [red, amber, copper, deep];
    for (let i = 0; i < 18; i++) {
      const a = rand() * Math.PI * 2;
      const d = 0.8 + rand() * 0.5;
      const prism = hex(0.13 + rand() * 0.16, 0.25 + rand() * 0.25, mats[i % mats.length]);
      prism.position.set(Math.cos(a) * d, Math.sin(a) * d, (rand() - 0.35) * 0.8);
      prism.rotation.z = rand() * 1;
      prism.rotation.y = (rand() - 0.5) * 0.6;
      group.add(prism);
    }
    group.rotation.z = 0.2;
    group.userData.swing = true;
    return group;
  },

  // ACIDE : explosion d'éclats de verre vert citron, avec des fragments qui volent autour
  sour() {
    const group = new THREE.Group();
    const rand = rng(5);
    const lime = glossy(0x8fdc00, { roughness: 0.35, flatShading: true });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x35b80c, roughness: 0.05, transmission: 0.55, thickness: 0.6, flatShading: true, clearcoat: 1 });
    const frosted = new THREE.MeshPhysicalMaterial({ color: 0x9fe07c, roughness: 0.55, transmission: 0.3, thickness: 0.5, flatShading: true });
    const mats = [lime, glass, lime, frosted];

    group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), glass));
    fibonacci(26).forEach((dir, i) => {
      dir.x += (rand() - 0.5) * 0.35;
      dir.y += (rand() - 0.5) * 0.35;
      dir.normalize();
      const len = 1.2 + rand() * 0.9;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.42 + rand() * 0.28, len, 3), mats[i % mats.length]);
      pointAlong(shard, dir, len / 2 - 0.1);
      shard.rotateY(rand() * 3);
      group.add(shard);
    });

    const fragments = [];
    fibonacci(28).forEach((dir, i) => {
      const f = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05 + rand() * 0.09), mats[i % 2]);
      f.userData.base = dir.clone().multiplyScalar(1.5 + rand() * 0.4);
      f.position.copy(f.userData.base);
      f.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      fragments.push(f);
      group.add(f);
    });

    group.scale.setScalar(0.8);
    group.userData.update = (t) => {
      const kick = Math.max(0, Math.sin(t * 5)) ** 8; // petites décharges
      group.scale.setScalar(0.8 * (1 + 0.06 * kick));
      fragments.forEach((f, i) => {
        f.position.copy(f.userData.base).multiplyScalar(1 + 0.08 * Math.sin(t * 2 + i));
        f.rotation.x += 0.02;
        f.rotation.y += 0.015;
      });
    };
    return group;
  },

  // AMER : grappe de losanges de pierre brune, de bronze et de cuivre
  bitter() {
    const group = new THREE.Group();
    const bronze = new THREE.MeshStandardMaterial({ color: 0x553a28, metalness: 0.55, roughness: 0.55, flatShading: true, bumpMap: grain(), bumpScale: 2 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x33281f, roughness: 0.95, flatShading: true, bumpMap: grain(), bumpScale: 4 });
    const copper = new THREE.MeshStandardMaterial({ color: 0x6e4429, metalness: 0.7, roughness: 0.45, flatShading: true, bumpMap: grain(), bumpScale: 1 });

    [
      [0.0, 0.0, 0.4, 0.55, 1.0, copper], [-0.75, 0.15, 0.05, 0.45, 0.85, bronze], [0.75, 0.2, 0.05, 0.45, 0.85, stone],
      [-0.4, 0.75, -0.05, 0.4, 0.7, stone], [0.38, 0.85, -0.1, 0.4, 0.75, bronze], [0.0, 1.05, -0.3, 0.3, 0.75, copper],
      [-0.55, -0.62, 0.15, 0.42, 0.7, bronze], [0.55, -0.62, 0.15, 0.45, 0.75, stone], [0.0, -0.9, 0.25, 0.35, 0.55, stone],
      [-1.12, -0.2, -0.2, 0.3, 0.6, copper], [1.12, -0.15, -0.2, 0.3, 0.6, bronze],
      [0.0, 0.1, -0.5, 0.6, 1.05, stone], [-0.6, 0.3, -0.55, 0.4, 0.8, bronze], [0.6, -0.3, -0.55, 0.4, 0.8, copper],
    ].forEach(([x, y, z, w, h, mat], i) => {
      const d = new THREE.Mesh(new THREE.OctahedronGeometry(1), mat);
      d.scale.set(w, h, w * 0.8);
      d.position.set(x, y, z);
      d.rotation.y = 0.5 * Math.sin(i * 2.7);
      d.rotation.z = 0.12 * Math.cos(i * 1.9);
      group.add(d);
    });
    group.userData.spin = 0.35; // lourd : tourne lentement
    return group;
  },

  // ===== SAVEURS (partie 2) =====

  // PIQUANT : grande étoile de pointes rouges brillantes et dorées, entourée de petites étoiles hérissées
  spicy() {
    const group = new THREE.Group();
    const rand = rng(8);
    const red = new THREE.MeshPhysicalMaterial({ color: 0xe0120c, metalness: 0.35, roughness: 0.12, clearcoat: 1, flatShading: true, emissive: 0x400000 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xf0c08a, metalness: 1, roughness: 0.22, flatShading: true });

    // une étoile = des pyramides à 4 faces qui partent du centre, certaines dorées, toutes à pointe dorée
    const star = (count, minLen, maxLen, width, seedOffset) => {
      const s = new THREE.Group();
      fibonacci(count).forEach((dir, i) => {
        const len = minLen + rand() * (maxLen - minLen);
        const r = width * (0.8 + rand() * 0.5);
        const spike = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(r, len, 4), (i + seedOffset) % 5 === 0 ? gold : red);
        body.position.y = len / 2;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.3, len * 0.26, 4), gold);
        tip.position.y = len * 0.88;
        spike.add(body, tip);
        spike.quaternion.setFromUnitVectors(UP, dir);
        spike.rotateY(rand() * 3);
        s.add(spike);
      });
      return s;
    };

    group.add(star(20, 1.1, 1.9, 0.3, 0));
    const minis = [];
    fibonacci(7).forEach((dir, i) => {
      const mini = star(14, 0.22, 0.4, 0.07, i);
      mini.position.copy(dir).multiplyScalar(1.15 + rand() * 0.35);
      minis.push(mini);
      group.add(mini);
    });

    group.userData.update = (t) => {
      red.emissiveIntensity = 1 + 1.5 * (0.5 + 0.5 * Math.sin(t * 6)); // ça chauffe
      group.position.x = 0.012 * Math.sin(t * 40);
      minis.forEach((m, i) => { m.rotation.y = t * (0.8 + i * 0.1); m.rotation.x = t * 0.5; });
    };
    return group;
  },

  // FRAIS : étoile de glace (deux pyramides croisées), cœur givré, petits cristaux en orbite
  fresh() {
    const group = new THREE.Group();
    const ice = new THREE.MeshPhysicalMaterial({
      color: 0x25ace2, roughness: 0.04, transmission: 0.45, thickness: 1, ior: 1.35, clearcoat: 1, flatShading: true,
      emissive: 0x0b5f86, emissiveIntensity: 0.4,
    });
    const frost = new THREE.MeshPhysicalMaterial({ color: 0xeaf8ff, roughness: 0.5, transmission: 0.4, thickness: 0.5, flatShading: true });
    const gem = new THREE.MeshPhysicalMaterial({ color: 0x9be8ff, roughness: 0.02, clearcoat: 1, flatShading: true, emissive: 0x39c0ee, emissiveIntensity: 0.6 });

    // étoile à 8 branches : deux tétraèdres imbriqués
    const merkaba = (size, mat) => {
      const s = new THREE.Group();
      const a = new THREE.Mesh(new THREE.TetrahedronGeometry(size), mat);
      const b = new THREE.Mesh(new THREE.TetrahedronGeometry(size), mat);
      b.rotation.z = Math.PI / 2;
      s.add(a, b);
      return s;
    };
    const big = new THREE.Group();
    big.add(merkaba(1.35, ice), merkaba(0.8, frost));
    const heart = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 6), gem);
    heart.quaternion.setFromUnitVectors(UP, new THREE.Vector3(1, 1, 1).normalize());
    big.add(heart);
    // vue de face, l'étoile dessine six branches
    big.quaternion.setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 0, 1));
    group.add(big);

    const orbit = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const small = i % 2
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 6), gem)
        : merkaba(0.2, ice);
      small.position.set(Math.cos(a) * 1.55, 0.5 * Math.sin(a * 2 + 1), Math.sin(a) * 1.55);
      small.rotation.set(a, a * 2, 0);
      orbit.add(small);
    }
    group.add(orbit);

    group.userData.update = (t) => {
      orbit.rotation.y = -t * 0.7;
      ice.emissiveIntensity = 0.3 + 0.3 * Math.sin(t * 2.2); // halo glacé qui pulse
    };
    group.userData.spin = 0.45;
    return group;
  },

  // GRAS : grosses bulles dorées et crème qui fusionnent, très brillantes, avec une goutte qui pend
  fat() {
    const group = new THREE.Group();
    const colors = [0xe88a00, 0xffab1a, 0xffd36b, 0xd97400, 0xffbd33, 0xffdc8a, 0xf09a10].map((c) => new THREE.Color(c));
    const balls = colors.map((color, i) => ({
      color,
      strength: i % 3 === 0 ? 1.7 : 1.15,
      pos: (t) => [
        0.5 + 0.17 * Math.sin(i * 2.1 + t * 0.35),
        0.5 + 0.15 * Math.cos(i * 1.7 + t * 0.3),
        0.5 + 0.13 * Math.sin(i * 0.9 + t * 0.25),
      ],
    }));
    const blob = metaballs({
      balls,
      material: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.15 }),
      scale: 1.45,
    });
    group.add(blob);

    const honey = new THREE.MeshPhysicalMaterial({ color: 0xf0a21c, roughness: 0.03, clearcoat: 1, transmission: 0.45, thickness: 0.6 });
    [[-1.0, 0.0, 0.5, 0.2], [0.55, -0.75, 0.75, 0.22], [-0.85, -0.45, 0.55, 0.12], [0.9, 0.6, 0.4, 0.15]].forEach(([x, y, z, r]) => {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32), honey);
      bead.position.set(x, y, z);
      group.add(bead);
    });
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), honey); // la goutte qui pend
    drop.position.set(0.85, -1.0, 0.2);
    group.add(drop);

    group.userData.update = (t) => {
      blob.userData.update(t);
      drop.scale.y = 1.6 + 0.4 * Math.sin(t * 1.4);
    };
    group.userData.spin = 0.3;
    return group;
  },

  // FUMÉ : larges rubans gris et noirs qui s'enroulent, avec des volutes de fumée
  smoky() {
    const group = new THREE.Group();

    // ruban : une bande qui suit une courbe, plus large au milieu, et qui vrille
    const ribbon = (curve, width, twist) => {
      const n = 120, m = 10;
      const frames = curve.computeFrenetFrames(n, false);
      const pos = [], uv = [], idx = [];
      const v = new THREE.Vector3();
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const p = curve.getPointAt(u);
        const w = width * (0.06 + Math.pow(Math.sin(Math.PI * u), 0.6));
        const a = twist * u;
        const side = frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
        const up = frames.binormals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.normals[i], -Math.sin(a));
        for (let j = 0; j <= m; j++) {
          const s = (j / m) * 2 - 1;
          v.copy(p).addScaledVector(side, s * w).addScaledVector(up, 0.25 * w * (1 - s * s)); // bande bombée
          pos.push(v.x, v.y, v.z);
          uv.push(u * 3, j / m);
        }
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const a = i * (m + 1) + j, b = a + 1, c = a + m + 1, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    };

    const swirl = (i, turns, lift) => {
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const t = k / 40;
        const angle = t * Math.PI * 2 * turns + i * 1.6;
        const radius = 0.4 + 0.65 * Math.sin(Math.PI * t);
        pts.push(new THREE.Vector3(Math.cos(angle) * radius, (t - 0.5) * lift + 0.25 * Math.sin(angle * 2), Math.sin(angle) * radius * 0.75));
      }
      return new THREE.CatmullRomCurve3(pts);
    };

    const shades = [0x2e2e31, 0x8d8d90, 0x454548, 0x6b6b6e];
    shades.forEach((c, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, side: THREE.DoubleSide, bumpMap: grain(), bumpScale: 3 });
      group.add(new THREE.Mesh(ribbon(swirl(i, 1.25, i % 2 ? 1.1 : -1.1), 0.42, 2.6 + i * 0.5), mat));
    });

    // volutes de fumée légères et transparentes
    const wisps = [];
    [[-0.9, 0.2], [0.7, 0.35], [0.1, 0.5]].forEach(([x, y], i) => {
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        pts.push(new THREE.Vector3(x + 0.25 * Math.sin(t * 6 + i * 2), y + t * 1.1, -0.2 + 0.25 * Math.cos(t * 5 + i)));
      }
      const wisp = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.055, 8),
        new THREE.MeshStandardMaterial({ color: 0x6f6f72, roughness: 1, transparent: true, opacity: 0.35, depthWrite: false })
      );
      wisps.push(wisp);
      group.add(wisp);
    });

    group.userData.update = (t) => {
      wisps.forEach((w, i) => {
        w.material.opacity = 0.22 + 0.18 * Math.sin(t * 1.2 + i * 2);
        w.position.y = 0.06 * Math.sin(t * 0.9 + i);
      });
    };
    group.userData.spin = 0.4;
    return group;
  },

  // ASTRINGENT : fleur de prismes hexagonaux violets, mats et rugueux
  astringent() {
    const group = new THREE.Group();
    const rand = rng(61);
    const mats = [0x452744, 0x3a2040, 0x52304f, 0x402540].map((c) => new THREE.MeshStandardMaterial({
      color: c, envMapIntensity: 0.5, roughness: 0.97, flatShading: true, bumpMap: grain(), bumpScale: 4,
    }));

    // anneaux de prismes : de gros blocs à l'extérieur, de plus en plus petits vers le cœur
    const ring = (count, tilt, radius, length, offset, back) => {
      for (let i = 0; i < count; i++) {
        const phi = (i / count) * Math.PI * 2 + offset;
        const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(phi), Math.sin(tilt) * Math.sin(phi), Math.cos(tilt) * (back ? -1 : 1));
        const r = radius * (0.85 + rand() * 0.3);
        const len = length * (0.85 + rand() * 0.3);
        const prism = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 6), mats[i % mats.length]);
        pointAlong(prism, dir, len / 2);
        prism.rotateY(rand() * 1);
        group.add(prism);
      }
    };
    ring(7, 1.35, 0.42, 1.25, 0.0);
    ring(8, 1.0, 0.27, 1.05, 0.4);
    ring(9, 0.65, 0.16, 0.85, 0.2);
    ring(7, 0.35, 0.09, 0.65, 0.6);
    ring(5, 0.15, 0.05, 0.5, 0.1);
    ring(6, 0.9, 0.35, 0.9, 0.3, true); // l'arrière, pour que la fleur soit belle de tous les côtés
    ring(5, 0.4, 0.2, 0.7, 0.9, true);

    group.userData.swing = true;
    return group;
  },
};

// ===== Ombre de contact : un dégradé doux posé sous l'objet (rapide, sans calcul d'ombres) =====
let shadowTexture = null;
function softShadow() {
  if (!shadowTexture) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(35,12,70,0.6)");
    g.addColorStop(0.45, "rgba(35,12,70,0.25)");
    g.addColorStop(1, "rgba(35,12,70,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    shadowTexture = new THREE.CanvasTexture(c);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;
  return mesh;
}

// ===== Super-héros : chaque goût a sa couleur de cape =====
const HERO_COLORS = {
  sweet: 0xff4f9a, salty: 0x2f8fff, umami: 0xd62828, sour: 0x6cc400, bitter: 0x6b4226,
  spicy: 0xff3b1f, fresh: 0x16b8e8, fat: 0xffa600, smoky: 0x3c3c48, astringent: 0x8a4dff,
};

// Point le plus en avant de l'objet, pour y poser les yeux
function frontZ(object, x, y, radius) {
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y, radius * 4), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(object, true)[0];
  return hit ? hit.point.z : null;
}

// Yeux cartoon + masque de super-héros + cape satinée qui flotte au vent
function dressHero(object, radius, color) {
  object.updateMatrixWorld(true);
  const rig = new THREE.Group();
  const e = radius * 0.17; // rayon d'un œil
  const eyeY = radius * 0.12;
  const hits = [frontZ(object, -e * 1.25, eyeY, radius), frontZ(object, e * 1.25, eyeY, radius)].filter((z) => z !== null);
  const z = Math.min(hits.length ? Math.max(...hits) : radius * 0.7, radius * 0.95) + e * 0.35;

  // masque « loup » noir derrière les yeux
  const s = new THREE.Shape();
  s.moveTo(0, 0.55);
  s.bezierCurveTo(0.6, 1.3, 2.1, 1.5, 2.65, 0.95);
  s.bezierCurveTo(3.05, 0.5, 2.75, -0.95, 2.0, -1.12);
  s.bezierCurveTo(1.3, -1.28, 0.6, -0.65, 0, -0.38);
  s.bezierCurveTo(-0.6, -0.65, -1.3, -1.28, -2.0, -1.12);
  s.bezierCurveTo(-2.75, -0.95, -3.05, 0.5, -2.65, 0.95);
  s.bezierCurveTo(-2.1, 1.5, -0.6, 1.3, 0, 0.55);
  const maskGeo = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 24 });
  const mask = new THREE.Mesh(maskGeo, new THREE.MeshPhysicalMaterial({ color: 0x17121f, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }));
  mask.scale.setScalar(e);
  mask.position.set(0, eyeY, z - e * 0.55);
  rig.add(mask);

  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0c0a12, roughness: 0.08, clearcoat: 1 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // Les yeux et le masque sont toujours dessinés par-dessus, même si des pointes passent devant
  const onTop = (mesh, order) => {
    mesh.material.depthTest = false;
    mesh.renderOrder = order;
    return mesh;
  };
  onTop(mask, 10);
  const eyes = [-1, 1].map((side) => {
    const eye = new THREE.Group();
    eye.position.set(side * e * 1.25, eyeY, z);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(e, 32, 24), white);
    ball.scale.z = 0.55;
    const pupil = new THREE.Group();
    const iris = new THREE.Mesh(new THREE.SphereGeometry(e * 0.52, 24, 16), black);
    iris.scale.z = 0.4;
    const glint = new THREE.Mesh(new THREE.SphereGeometry(e * 0.15, 12, 8), shine);
    glint.position.set(-e * 0.17, e * 0.2, e * 0.2);
    onTop(ball, 11);
    onTop(iris, 12);
    onTop(glint, 13);
    pupil.add(iris, glint);
    pupil.position.z = e * 0.4;
    eye.add(ball, pupil);
    eye.userData.pupil = pupil;
    rig.add(eye);
    return eye;
  });

  // cape : un tissu accroché derrière, qui s'évase et ondule
  const capeGeo = new THREE.PlaneGeometry(1, 1, 16, 20);
  const base = capeGeo.attributes.position.array.slice();
  const cape = new THREE.Mesh(capeGeo, new THREE.MeshPhysicalMaterial({
    color, roughness: 0.5, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.35, side: THREE.DoubleSide,
  }));
  rig.add(cape);
  const top = radius * 0.45, len = radius * 1.2, zTop = -radius * 0.4;

  rig.userData.update = (t) => {
    const p = capeGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = base[i * 3], d = 0.5 - base[i * 3 + 1]; // d : 0 en haut, 1 en bas
      const width = radius * (0.95 + 0.9 * d);
      const wave = radius * d * (0.2 * Math.sin(t * 3.2 - d * 5 + u * 2.5) + 0.07 * Math.sin(t * 5.3 + u * 7));
      p.setXYZ(i, u * width, top - d * len, zTop - d * d * radius * 0.9 - wave);
    }
    p.needsUpdate = true;
    capeGeo.computeVertexNormals();

    // les yeux regardent autour et clignent
    const lookX = 0.32 * Math.sin(t * 0.8) + 0.12 * Math.sin(t * 2.3);
    const lookY = 0.15 * Math.sin(t * 0.6 + 1);
    const blink = (t % 3.4) < 0.14 ? 0.12 : 1;
    eyes.forEach((eye) => {
      eye.userData.pupil.position.x = lookX * e;
      eye.userData.pupil.position.y = lookY * e;
      eye.scale.y = blink;
    });
  };
  return rig;
}

// ===== Montage / rendu =====
const active = new Set();

// Centre l'objet et renvoie son rayon réel (distance du point le plus éloigné) et son point le plus bas
function fitObject(object) {
  object.updateMatrixWorld(true);
  const points = [];
  const v = new THREE.Vector3();
  object.traverse((o) => {
    if (!o.isMesh || o instanceof MarchingCubes) return; // les boules fusionnées restent au centre
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 2000));
    for (let i = 0; i < pos.count; i += step) points.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).clone());
  });
  if (!points.length) return { radius: 1.4, minY: -1.1 };
  const box = new THREE.Box3().setFromPoints(points);
  const center = box.getCenter(new THREE.Vector3());
  let radius = 0;
  for (const p of points) radius = Math.max(radius, p.distanceTo(center));
  object.position.sub(center);
  radius = Math.max(radius, 1.1); // les boules fusionnées font environ 1.1 de rayon
  return { radius, minY: Math.min(box.min.y - center.y, -radius * 0.75) };
}

// Rebond élastique (entrée « pop » des objets)
function elastic(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

// Options :
//  - fit        : marge autour de l'objet (1.12 par défaut ; plus petit = objet plus grand dans son cadre)
//  - background : couleur de fond (transparent par défaut ; noir pour les vidéos d'hologramme)
//  - pixelRatio : 1 pour une image à la taille exacte du cadre (export vidéo)
//  - manual     : l'objet n'est pas animé tout seul, on le dessine image par image avec renderAt()
//  - exposure   : luminosité (1.05 par défaut)
//  - solid      : matières moins transparentes, pour rester lumineuses sur fond noir
//  - hero       : le modèle devient un super-héros (yeux, masque, cape)
//  - shadow     : ombre douce au sol (par défaut, sauf sur fond de couleur)
//  - pop        : entrée avec un rebond élastique (par défaut, sauf en mode manuel)
function mount(container, key, opts = {}) {
  const w = container.clientWidth;
  const h = container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(opts.pixelRatio || Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure || 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opts.background !== undefined) scene.background = new THREE.Color(opts.background);
  // Éclairage « studio » : reflets réalistes sur le verre, le métal et le brillant
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  // Comme chez un photographe : lumière principale, contre-jour, contre-jour coloré et ciel doux
  const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.5);
  keyLight.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xffe2f4, 0.8);
  rim.position.set(3, 2, -4);
  const kicker = new THREE.DirectionalLight(HERO_COLORS[key] ?? 0x8a4dff, 1.6);
  kicker.position.set(-4, -1, -3);
  const sky = new THREE.HemisphereLight(0xffffff, 0x5b2fd6, 0.35);
  scene.add(keyLight, rim, kicker, sky);

  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);

  const object = (BUILDERS[key] || BUILDERS.sweet)();
  const holder = new THREE.Group();
  holder.add(object);
  scene.add(holder);

  // Cadrage automatique : l'objet remplit tout son cadre, quelle que soit sa taille
  if (object.userData.update) object.userData.update(0);
  const { radius, minY } = fitObject(object);
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const dist = (radius * (opts.fit || 1.12)) / Math.sin(halfFov); // petite marge pour le flottement
  camera.position.set(0, dist * 0.1, dist);
  camera.lookAt(0, 0, 0);

  if (opts.solid) {
    object.traverse((o) => {
      if (o.material && o.material.transmission) o.material.transmission *= opts.solid;
    });
  }

  let rig = null;
  if (opts.hero) {
    rig = dressHero(object, radius, HERO_COLORS[key] ?? 0x8a4dff);
    holder.add(rig);
  }

  let shadow = null;
  if (opts.shadow ?? opts.background === undefined) {
    shadow = softShadow();
    shadow.position.y = minY - radius * 0.06;
    shadow.userData.size = radius * 1.9;
    scene.add(shadow);
  }

  const handle = {
    renderer, scene, camera, object, holder, rig, shadow, radius,
    start: performance.now(), last: null, phase: 0, boost: false, boostLevel: 0,
    manual: !!opts.manual, pop: opts.pop ?? !opts.manual,
  };
  active.add(handle);
  return handle;
}

// Pose de l'objet à l'instant t : tourne, flotte, rebondit à l'arrivée, s'agite au survol
function animate(h, t, dt) {
  const o = h.object;
  if (o.userData.update) o.userData.update(t);
  if (h.rig) h.rig.userData.update(t);

  h.boostLevel += ((h.boost ? 1 : 0) - h.boostLevel) * Math.min(1, dt * 6);
  h.phase += dt * (1 + 3 * h.boostLevel);
  const enter = h.pop ? Math.min(1, t / 1.1) : 1;
  const pop = h.pop ? elastic(enter) : 1;
  const whirl = (1 - enter) ** 2 * Math.PI * 2; // un tour rapide en arrivant

  // Les objets plats (et les héros, pour qu'on voie leurs yeux) se balancent face à nous
  if (o.userData.swing || h.rig) h.holder.rotation.y = (h.rig ? 0.42 : 0.75) * Math.sin(h.phase * 0.9) + whirl;
  else h.holder.rotation.y = h.phase * (o.userData.spin ?? 0.6) + whirl;
  h.holder.rotation.x = 0.18 * Math.sin(t * 0.6) * (h.rig ? 0.4 : 1);
  const bob = Math.sin(t * 1.5);
  h.holder.position.y = 0.07 * bob + 0.04 * h.boostLevel;
  h.holder.scale.setScalar(Math.max(0.001, pop * (1 + 0.07 * h.boostLevel)));

  if (h.shadow) {
    const s = h.shadow.userData.size * (1 - 0.08 * bob) * Math.max(0.001, pop);
    h.shadow.scale.set(s, s * 0.55, 1);
    h.shadow.material.opacity = 0.85 - 0.15 * bob;
  }
}

// Dessine une image précise de l'animation (export vidéo).
// loop = durée de la boucle en secondes : l'objet fait exactement un tour, la vidéo se répète sans saut.
function renderAt(h, t, loop) {
  const o = h.object;
  const turn = (Math.PI * 2 * t) / loop;
  if (o.userData.update) o.userData.update(t);
  h.holder.rotation.y = o.userData.swing ? 0.75 * Math.sin(turn) : turn;
  h.holder.rotation.x = 0.18 * Math.sin(turn);
  h.holder.position.y = 0.07 * Math.sin(turn * 2);
  h.renderer.render(h.scene, h.camera);
}

// Construit un modèle (et son costume de héros) sans moteur de rendu, pour l'ajouter à une autre scène (vol.js).
// Le modèle est ramené à un rayon de 1 ; group.userData.update(t) l'anime.
function create(key, opts = {}) {
  const object = (BUILDERS[key] || BUILDERS.sweet)();
  if (object.userData.update) object.userData.update(0);
  const { radius } = fitObject(object);
  const inner = new THREE.Group();
  inner.add(object);
  let rig = null;
  if (opts.hero) {
    rig = dressHero(object, radius, HERO_COLORS[key] ?? 0x8a4dff);
    inner.add(rig);
  }
  inner.scale.setScalar(1 / radius);
  const group = new THREE.Group();
  group.add(inner);
  group.userData.update = (t) => {
    if (object.userData.update) object.userData.update(t);
    if (rig) rig.userData.update(t);
  };
  return group;
}

// Photo d'un modèle (pour l'album des héros) : renvoie une image PNG
function snapshot(key, size = 320, opts = {}) {
  const box = document.createElement("div");
  box.style.cssText = `position:fixed;left:-9999px;top:0;width:${size}px;height:${size}px`;
  document.body.appendChild(box);
  const h = mount(box, key, { pixelRatio: 1, ...opts, manual: true, pop: false });
  animate(h, 1.3, 0);
  h.holder.rotation.y = 0.3;
  h.renderer.render(h.scene, h.camera);
  const url = h.renderer.domElement.toDataURL("image/png");
  dispose(h);
  box.remove();
  return url;
}

function dispose(handle) {
  if (!handle || !active.has(handle)) return;
  active.delete(handle);
  handle.scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  if (handle.scene.environment) handle.scene.environment.dispose();
  handle.renderer.dispose();
  handle.renderer.forceContextLoss();
  handle.renderer.domElement.remove();
}

function frame(now) {
  for (const h of active) {
    if (h.manual) continue;
    const t = (now - h.start) / 1000;
    const dt = h.last === null ? 0 : Math.min(0.05, (now - h.last) / 1000);
    h.last = now;
    animate(h, t, dt);
    h.renderer.render(h.scene, h.camera);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.Taste3D = {
  mount,
  dispose,
  renderAt,
  snapshot,
  create,
  boost: (handle, on) => { if (handle) handle.boost = on; }, // accélère l'objet au survol
  label: (key) => LABELS[key] || key,
  keys: Object.keys(BUILDERS),
};
