const THEME_IDS = ["classic", "timeless", "soft", "modern", "romantic"];

export function setActiveView({ name, screens, navButtons }) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  document.querySelector(".phone-shell")?.classList.toggle("is-memorial-active", name === "memorial");
  document.body.classList.toggle("is-selector-active", name === "selector");
  document.body.dataset.activeScreen = name;

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === name);
  });

  document.scrollingElement?.scrollTo({ top: 0 });
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.classList.remove(...THEME_IDS.map((id) => `theme-${id}`));
  document.documentElement.classList.add(`theme-${normalizedTheme}`);
}

export function normalizeTheme(theme) {
  return THEME_IDS.includes(theme) ? theme : "classic";
}

export function normalizePosition(position) {
  return {
    x: clamp(Number(position?.x ?? 50), 0, 100),
    y: clamp(Number(position?.y ?? 50), 0, 100),
    zoom: clamp(Number(position?.zoom ?? 1), 1, 2.6),
  };
}

export function applyImagePosition(element, position) {
  const normalized = normalizePosition(position);
  element.style.backgroundPosition = `${normalized.x}% ${normalized.y}%`;
  element.style.backgroundSize = getComposedBackgroundSize(element, normalized.zoom);
}

export function getComposedBackgroundSize(element, zoom) {
  if (zoom <= 1.001) return "cover";

  const rect = element.getBoundingClientRect();
  const percent = `${Math.round(zoom * 100)}%`;
  return rect.width / rect.height > 1.35 ? `${percent} auto` : `auto ${percent}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getPointerDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function toAllative(name) {
  if (!name) return "Rakkaalle ystävälle";
  const lower = name.toLowerCase();
  const suffix = /[aouå]$/.test(lower) ? "lle" : "lle";
  return `${name}${suffix}`;
}

export function toGenitive(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Rakkaan";
  return /[aeiouyäöå]$/i.test(trimmed) ? `${trimmed}n` : `${trimmed}in`;
}

export function buildMemorialText(source) {
  const name = source.horseName || "rakas ystävä";
  const customAnimal = source.petTypeCustom || "eläin";
  const templates = {
    horse:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: pehmeä turpa, tutut askeleet ja rauha, jonka ${name} toi mukanaan.`,
    dog:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: iloinen katse, tutut tassut ja uskollinen läsnäolo, jonka ${name} toi jokaiseen päivään.`,
    cat:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: hiljainen kehräys, pehmeät tassut ja oma erityinen rauha, jonka ${name} toi kotiin.`,
    rabbit:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: pehmeä olemus, pienet hypyt ja lempeä hiljaisuus, jonka ${name} toi mukanaan.`,
    bird:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: kevyt liike, tuttu ääni ja ilo, jonka ${name} toi huoneeseen.`,
    guineaPig:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: pienet äänet, lämmin läheisyys ja arjen suloinen rauha, jonka ${name} toi kotiin.`,
    hamster:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: pienet tassut, utelias katse ja hellä läsnäolo, jonka ${name} toi mukanaan.`,
    ferret:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: vilkas olemus, leikkisät hetket ja persoonallinen lämpö, jonka ${name} toi elämään.`,
    turtle:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: rauhallinen tahti, tuttu olemus ja hiljainen viisaus, jonka ${name} toi mukanaan.`,
    human:
      `Tänään muistetaan kaikkea sitä, mikä jäi sydämeen: yhteiset hetket, tutut sanat ja rakkaus, jonka ${name} jätti elämään.`,
    other:
      `Tänään muistetaan lämmöllä: ${name}, rakas ${customAnimal}, ja kaikkea sitä, mikä jäi sydämeen: tutut hetket, oma ainutlaatuinen luonne ja lämpö.`,
  };
  const base = templates[source.petType] || templates.other;
  return source.memorialNote ? `${base} ${source.memorialNote}` : base;
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
