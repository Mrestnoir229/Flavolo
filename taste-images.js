// ===== Taste3D : une image 3D animée par goût =====
// Les images sont dans le dossier images/ (nom = clé du goût).
// Chaque goût a sa propre animation CSS (voir « Images de goûts » dans style.css).
(function () {
  const LABELS = {
    sweet: "Le sucré",
    sour: "L'acide",
    bitter: "L'amer",
    salty: "Le salé",
    umami: "L'umami",
    spicy: "Le piquant",
    fresh: "Le frais",
    fat: "Le gras",
    astringent: "L'astringent",
    sparkling: "Le pétillant",
  };

  // Petites particules décoratives ajoutées par-dessus certaines images
  const PARTICLES = {
    sparkling: { count: 16, className: "bubble" },
    salty: { count: 7, className: "glint" },
    fresh: { count: 6, className: "glint" },
    spicy: { count: 10, className: "ember" },
  };

  // Précharge toutes les images pour qu'elles apparaissent sans délai
  Object.keys(LABELS).forEach((key) => { new Image().src = `images/${key}.jpg`; });

  function mount(container, key) {
    const el = document.createElement("div");
    el.className = `taste t-${key}`;
    el.innerHTML = `
      <div class="taste-float">
        <div class="taste-tilt">
          <img src="images/${key}.jpg" alt="${LABELS[key] || key}">
          <div class="taste-shine"></div>
        </div>
      </div>
      <div class="taste-fx"></div>`;

    const fx = PARTICLES[key];
    if (fx) {
      const layer = el.querySelector(".taste-fx");
      for (let i = 0; i < fx.count; i++) {
        const p = document.createElement("span");
        p.className = fx.className;
        p.style.left = 8 + Math.random() * 84 + "%";
        p.style.top = 8 + Math.random() * 84 + "%";
        p.style.setProperty("--s", 0.5 + Math.random());
        p.style.animationDelay = -Math.random() * 4 + "s";
        p.style.animationDuration = 2 + Math.random() * 2.5 + "s";
        layer.appendChild(p);
      }
    }

    container.appendChild(el);
    return el;
  }

  function dispose(el) {
    if (el) el.remove();
  }

  window.Taste3D = {
    mount,
    dispose,
    label: (key) => LABELS[key] || key,
    keys: Object.keys(LABELS),
  };
})();
