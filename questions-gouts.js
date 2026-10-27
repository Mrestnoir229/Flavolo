// ===== Flavolo Quizz : 5 questions sur les GOÛTS, puis 5 questions sur les SAVEURS =====
// Trois types de questions, qui aboutissent toujours à un modèle 3D animé (voir taste3d.js) :
//  - type "shape"  : les 3 propositions sont des modèles 3D (options = clés de modèle)
//  - type "guess"  : on montre un modèle 3D (show), les 3 propositions sont des noms
//  - type "riddle" : devinette en texte, le modèle 3D (show) n'apparaît qu'à la réponse
// Goûts   : sweet (sucré), salty (salé), umami, sour (acide), bitter (amer)
// Saveurs : spicy (piquant), fresh (frais), fat (gras), smoky (fumé), astringent
// answer : index de la bonne proposition (0 = A, 1 = B, 2 = C)

// Écrans d'annonce animés (logo + titre) affichés avant la question n° « from »
window.QUIZ_PARTS = [
  { from: 0, tag: "PARTIE 1", title: "LES GOÛTS", subtitle: "Sucré · Salé · Umami · Acide · Amer" },
  { from: 5, tag: "PARTIE 2", title: "LES SAVEURS", subtitle: "Piquant · Frais · Gras · Fumé · Astringent" },
];

window.QUIZ_QUESTIONS = [
  // ---------- PARTIE 1 : LES GOÛTS ----------
  {
    type: "shape",
    q: "Si le SUCRÉ avait une forme, à quoi ressemblerait-il ?",
    options: ["bitter", "sweet", "sour"],
    answer: 1,
    big: "B : LE SUCRÉ",
    explain: "Partout dans le monde, les gens associent le sucré aux formes rondes et douces et aux couleurs pastel.",
  },
  {
    type: "guess",
    q: "Ces cubes blancs et ces cristaux représentent quel goût ?",
    show: "salty",
    options: ["Le salé", "L'amer", "Le sucré"],
    answer: 0,
    big: "A : LE SALÉ",
    explain: "Au microscope, un grain de sel est un minuscule cristal en forme de cube !",
  },
  {
    type: "shape",
    q: "À quoi ressemblerait l'UMAMI, le goût savoureux du parmesan ?",
    options: ["sour", "sweet", "umami"],
    answer: 2,
    big: "C : L'UMAMI",
    explain: "L'umami est un goût profond qui enveloppe toute la bouche : on l'imagine rouge ambré, chaud et dense.",
  },
  {
    type: "guess",
    q: "Regarde bien cet objet : quel goût représente-t-il ?",
    show: "sour",
    options: ["Le sucré", "L'acide", "L'umami"],
    answer: 1,
    big: "B : L'ACIDE",
    explain: "L'acide pique la langue comme de petites épines : on l'imagine pointu, vif et électrique.",
  },
  {
    type: "shape",
    q: "Si l'AMER était un objet, lequel serait-ce ?",
    options: ["bitter", "salty", "sweet"],
    answer: 0,
    big: "A : L'AMER",
    explain: "L'amer est associé aux formes anguleuses et aux couleurs sombres, comme le café noir.",
  },

  // ---------- PARTIE 2 : LES SAVEURS ----------
  {
    type: "shape",
    q: "Si le PIQUANT du piment avait une forme, laquelle serait-ce ?",
    options: ["fat", "spicy", "fresh"],
    answer: 1,
    big: "B : LE PIQUANT",
    explain: "Le piquant, c'est la bouche en feu : on l'imagine rouge, brûlant et plein de pointes.",
  },
  {
    type: "guess",
    q: "Cette étoile de glace représente quelle saveur ?",
    show: "fresh",
    options: ["Le frais", "Le piquant", "Le fumé"],
    answer: 0,
    big: "A : LE FRAIS",
    explain: "Le menthol active nos capteurs de froid : on imagine le frais transparent, bleu et glacé.",
  },
  {
    type: "shape",
    q: "À quoi ressemblerait le GRAS du beurre et de l'huile ?",
    options: ["astringent", "smoky", "fat"],
    answer: 2,
    big: "C : LE GRAS",
    explain: "Le gras est lisse, rond, brillant et doré, comme une goutte d'huile ou du beurre fondu.",
  },
  {
    type: "guess",
    q: "Ces volutes grises et noires représentent quelle saveur ?",
    show: "smoky",
    options: ["L'astringent", "Le fumé", "Le gras"],
    answer: 1,
    big: "B : LE FUMÉ",
    explain: "Le fumé rappelle le feu de bois : on l'imagine gris, sombre et tout en volutes.",
  },
  {
    type: "shape",
    q: "Quel objet représente l'ASTRINGENT, la sensation du thé trop infusé ?",
    options: ["astringent", "spicy", "fresh"],
    answer: 0,
    big: "A : L'ASTRINGENT",
    explain: "L'astringent assèche la bouche et la rend rugueuse : on l'imagine mat, sec et violet comme la peau du raisin.",
  },
];

// ===== Les SUPER-HÉROS DU GOÛT =====
// À chaque réponse, le modèle 3D devient un super-héros (yeux, masque, cape) et se présente.
// Les 3 jauges (de 0 à 5) apprennent aux enfants à « voir » un goût :
//  - rond     : 0 = tout pointu, 5 = tout rond
//  - chaud    : 0 = couleurs froides (bleu), 5 = couleurs chaudes (rouge, orange)
//  - brillant : 0 = mat et rugueux, 5 = brillant et lisse
// shout : le cri du héros, affiché dans une bulle de BD quand il apparaît
window.QUIZ_HEROES = {
  sweet:      { name: "CAPITAINE BONBON", power: "Rend tout doux, rond et câlin !",             shout: "MIAM !",  color: "#ff4f9a", round: 5, warm: 3, shiny: 4 },
  salty:      { name: "SALINATOR",        power: "Lance des cristaux de sel croustillants !",   shout: "CRUNCH !", color: "#2f8fff", round: 1, warm: 1, shiny: 2 },
  umami:      { name: "UMAMI-MAN",        power: "Rend la pizza et la tomate super savoureuses !", shout: "WOUAH !", color: "#d62828", round: 3, warm: 5, shiny: 4 },
  sour:       { name: "ZAP CITRON",       power: "Fait pétiller la langue comme un éclair !",    shout: "ZAP !",   color: "#6cc400", round: 0, warm: 2, shiny: 4 },
  bitter:     { name: "DOCTEUR AMER",     power: "Fort et sérieux comme le chocolat noir.",      shout: "BOUM !",  color: "#6b4226", round: 1, warm: 2, shiny: 1 },
  spicy:      { name: "FLAMMOR",          power: "Allume un feu d'artifice dans la bouche !",    shout: "POW !",   color: "#ff3b1f", round: 0, warm: 5, shiny: 5 },
  fresh:      { name: "MISS GIVRE",       power: "Souffle un vent glacé à la menthe !",          shout: "BRRR !",  color: "#16b8e8", round: 1, warm: 0, shiny: 5 },
  fat:        { name: "GOLDEN GLOUP",     power: "Tout doux, tout lisse, tout doré !",           shout: "SPLASH !", color: "#ffa600", round: 5, warm: 4, shiny: 5 },
  smoky:      { name: "L'OMBRE FUMÉE",    power: "Sort du feu de camp en volutes grises.",       shout: "FSSHH !", color: "#3c3c48", round: 3, warm: 1, shiny: 1 },
  astringent: { name: "SÉCHOR",           power: "Assèche la bouche comme le thé trop infusé.",  shout: "CRAC !",  color: "#8a4dff", round: 2, warm: 1, shiny: 0 },
};
