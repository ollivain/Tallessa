const STORAGE_KEY = "tallessa.prototype.v1";

const monthNames = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

const defaultState = {
  horseName: "Pepe",
  petType: "horse",
  petTypeCustom: "",
  memorialName: "Pepen päivä",
  memorialDate: "2026-05-19",
  heroImage: "",
  heroImagePosition: { x: 50, y: 50, zoom: 1 },
  memorialNote: "",
  memorialText: "",
  memorialImage: "",
  memorialImagePosition: { x: 50, y: 50, zoom: 1 },
  candleLit: false,
  memories: [
    {
      id: crypto.randomUUID(),
      type: "image",
      media:
        "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=900&q=80",
      text: "Aamu, jolloin laitumen valo tuntui pysähtyvän hetkeksi.",
      createdAt: new Date().toISOString(),
    },
  ],
  letters: [
    {
      id: crypto.randomUUID(),
      title: "Rakas Pepe",
      body: "Kirjoitan tämän, jotta muistan hengittää hitaammin. Sinä olet yhä mukana pienissä paikoissa: tallin hiljaisuudessa, käsissäni ja niissä päivissä, joihin palaan lempeästi.",
      createdAt: new Date().toISOString(),
    },
  ],
  importantDays: [],
  monthPhotos: {},
  monthPhotoPositions: {},
};

let state = loadState();
let visibleMonth = new Date();
let imageDrag = null;
let suppressImageToggle = false;
let memoryDraft = null;
let memorialSkyTimer = null;

const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];

const elements = {
  heroImage: document.querySelector("[data-hero-image]"),
  heroTitle: document.querySelector("[data-hero-title]"),
  heroPhoto: document.querySelector("[data-hero-photo]"),
  memoryOfDay: document.querySelector("[data-memory-of-day]"),
  dailyQuote: document.querySelector("[data-daily-quote]"),
  memoryForm: document.querySelector("[data-memory-form]"),
  memoryMedia: document.querySelector("[data-memory-media]"),
  memoryMessage: document.querySelector("[data-memory-message]"),
  draftPicker: document.querySelector("[data-draft-picker]"),
  draftPreview: document.querySelector("[data-draft-preview]"),
  memoryList: document.querySelector("[data-memory-list]"),
  letterForm: document.querySelector("[data-letter-form]"),
  letterList: document.querySelector("[data-letter-list]"),
  monthCover: document.querySelector("[data-month-cover]"),
  currentMonth: document.querySelector("[data-current-month]"),
  calendarGrid: document.querySelector("[data-calendar-grid]"),
  monthPhoto: document.querySelector("[data-month-photo]"),
  dayForm: document.querySelector("[data-day-form]"),
  dayList: document.querySelector("[data-day-list]"),
  memorialTitle: document.querySelector("[data-memorial-title]"),
  memorialButton: document.querySelector("[data-memorial-button]"),
  memorialDate: document.querySelector("[data-memorial-date]"),
  memorialDateInput: document.querySelector("[data-memorial-date-input]"),
  memorialDateDisplay: document.querySelector("[data-memorial-date-display]"),
  memorialHeading: document.querySelector("[data-memorial-heading]"),
  memorialText: document.querySelector("[data-memorial-text]"),
  memorialImage: document.querySelector("[data-memorial-image]"),
  memorialPhoto: document.querySelector("[data-memorial-photo]"),
  candleState: document.querySelector("[data-candle-state]"),
  settingsForm: document.querySelector("[data-settings-form]"),
  petType: document.querySelector("[data-pet-type]"),
};

document.addEventListener("click", handleClick);
elements.memoryList.addEventListener("change", updateMemoryImage);
elements.heroPhoto.addEventListener("change", updateHeroPhoto);
elements.memoryMedia.addEventListener("change", updateMemoryFileMessage);
elements.memoryForm.addEventListener("submit", addMemory);
elements.letterForm.addEventListener("submit", addLetter);
elements.dayForm.addEventListener("submit", addImportantDay);
elements.monthPhoto.addEventListener("change", updateMonthPhoto);
elements.memorialPhoto.addEventListener("change", updateMemorialPhoto);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.petType.addEventListener("change", previewPetMemorialText);
elements.memorialDateInput.addEventListener("change", updateMemorialDateDisplay);
document.addEventListener("pointerdown", startImageCompose);
document.addEventListener("pointermove", moveImageCompose);
document.addEventListener("pointerup", stopImageCompose);
document.addEventListener("pointercancel", stopImageCompose);
document.addEventListener("wheel", zoomImageWithWheel, { passive: false });

function handleClick(event) {
  if (event.target.closest("[data-image-change]")) return;

  const imagePicker = event.target.closest("[data-image-picker], [data-draft-picker]");
  const imageSurface = event.target.closest(".hero-image, .month-cover, .memorial-image, .media-preview");
  const isHeroTap = imagePicker?.classList.contains("hero");
  if (imagePicker && (imageSurface || isHeroTap)) {
    if (suppressImageToggle) {
      suppressImageToggle = false;
      return;
    }
    const isOpen = toggleImagePicker(imagePicker);
    const memoryCard = imagePicker.closest('[data-deletable-item="memory"]');
    if (memoryCard) {
      if (isOpen) showDeleteAction(memoryCard);
      else hideDeleteAction(memoryCard);
    }
    return;
  }

  const deleteButton = event.target.closest("[data-delete-item]");
  if (deleteButton) {
    handleDeleteAction(deleteButton);
    return;
  }

  const deletableItem = event.target.closest("[data-deletable-item]");
  if (deletableItem) {
    toggleDeleteAction(deletableItem);
    return;
  }

  const cardTarget = event.target.closest("[data-open-card]")?.dataset.openCard;
  if (cardTarget) {
    openCard(cardTarget);
    return;
  }

  const closeTarget = event.target.closest("[data-close-card]")?.dataset.closeCard;
  if (closeTarget) {
    closeCard(closeTarget);
    return;
  }

  const navTarget = event.target.closest("[data-nav]")?.dataset.nav;
  if (navTarget) {
    showScreen(navTarget);
    return;
  }

  const monthDirection = event.target.closest("[data-month]")?.dataset.month;
  if (monthDirection) {
    visibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + (monthDirection === "next" ? 1 : -1),
      1,
    );
    renderCalendar();
    return;
  }

  if (event.target.closest("[data-light-candle]")) {
    state.candleLit = true;
    saveState();
    renderMemorial();
  }
}

function toggleImagePicker(picker) {
  const control = picker.querySelector("[data-image-change]");
  const hint = picker.querySelector("[data-image-hint]");
  if (!control) return false;

  control.hidden = !control.hidden;
  if (hint) hint.hidden = control.hidden;
  picker.classList.toggle("is-composing", !control.hidden);
  return !control.hidden;
}

function hideImagePickers() {
  document.querySelectorAll("[data-image-change]").forEach((control) => {
    control.hidden = true;
  });
  document.querySelectorAll("[data-image-hint]").forEach((hint) => {
    hint.hidden = true;
  });
  document.querySelectorAll("[data-image-picker]").forEach((picker) => {
    picker.classList.remove("is-composing", "is-dragging");
  });
  elements.draftPicker.classList.remove("is-dragging");
}

function openCard(name) {
  const button = document.querySelector(`[data-open-card="${name}"]`);
  const panel = document.querySelector(`[data-card-panel="${name}"]`);
  if (!button || !panel) return;

  button.classList.add("is-hidden");
  panel.classList.remove("is-collapsed");
  panel.querySelector("input, textarea, select")?.focus();
}

function closeCard(name) {
  const button = document.querySelector(`[data-open-card="${name}"]`);
  const panel = document.querySelector(`[data-card-panel="${name}"]`);
  if (!button || !panel) return;

  panel.classList.add("is-collapsed");
  button.classList.remove("is-hidden");
  if (name === "memory") resetMemoryDraft();
}

function toggleDeleteAction(card) {
  const button = card.querySelector("[data-delete-item]");
  if (!button) return;

  const nextHidden = !button.hidden;
  hideDeleteActions();
  button.hidden = nextHidden;
}

function showDeleteAction(card) {
  const button = card.querySelector("[data-delete-item]");
  if (!button) return;

  hideDeleteActions();
  button.hidden = false;
}

function hideDeleteAction(card) {
  const button = card.querySelector("[data-delete-item]");
  if (!button) return;

  button.hidden = true;
  button.dataset.confirming = "false";
  button.classList.remove("is-confirming");
  button.textContent = "Poista";
}

function hideDeleteActions() {
  document.querySelectorAll("[data-delete-item]").forEach((button) => {
    button.hidden = true;
    button.dataset.confirming = "false";
    button.classList.remove("is-confirming");
    button.textContent = "Poista";
  });
}

function handleDeleteAction(button) {
  const type = button.dataset.deleteItem;
  const id = button.dataset.itemId;

  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.classList.add("is-confirming");
    button.textContent = "Vahvista poisto";
    return;
  }

  if (type === "memory") state.memories = state.memories.filter((memory) => memory.id !== id);
  if (type === "letter") state.letters = state.letters.filter((letter) => letter.id !== id);
  saveState();
  renderHome();
  renderMemories();
  renderLetters();
}

function startImageCompose(event) {
  const surface = event.target.closest(".hero-image, .month-cover, .memorial-image, .media-preview");
  const picker = event.target.closest("[data-image-picker], [data-draft-picker]");
  if (!surface || !picker) return;
  if (picker.matches("[data-image-picker]") && picker.querySelector("[data-image-change]")?.hidden) return;

  if (imageDrag?.surface === surface) {
    imageDrag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    imageDrag.pinchStartDistance = null;
    imageDrag.pinchStartZoom = getImagePosition(imageDrag.key).zoom;
    surface.setPointerCapture?.(event.pointerId);
    return;
  }

  const key = getImagePositionKey(surface);
  const position = getImagePosition(key);
  const rect = surface.getBoundingClientRect();
  imageDrag = {
    key,
    surface,
    picker,
    startX: event.clientX,
    startY: event.clientY,
    startPosition: { ...position },
    moved: false,
    width: rect.width,
    height: rect.height,
    pointers: new Map([[event.pointerId, { x: event.clientX, y: event.clientY }]]),
    pinchStartDistance: null,
    pinchStartZoom: position.zoom,
  };
  picker.classList.add("is-dragging");
  surface.setPointerCapture?.(event.pointerId);
}

function moveImageCompose(event) {
  if (!imageDrag) return;

  if (imageDrag.pointers.has(event.pointerId)) {
    imageDrag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  if (imageDrag.pointers.size >= 2) {
    const points = [...imageDrag.pointers.values()];
    const distance = getPointerDistance(points[0], points[1]);
    if (!imageDrag.pinchStartDistance) {
      imageDrag.pinchStartDistance = distance;
      imageDrag.pinchStartZoom = getImagePosition(imageDrag.key).zoom;
      return;
    }

    const nextPosition = {
      ...getImagePosition(imageDrag.key),
      zoom: clamp(imageDrag.pinchStartZoom * (distance / imageDrag.pinchStartDistance), 1, 2.6),
    };
    imageDrag.moved = true;
    setImagePosition(imageDrag.key, nextPosition);
    applyImagePosition(imageDrag.surface, nextPosition);
    return;
  }

  const deltaX = event.clientX - imageDrag.startX;
  const deltaY = event.clientY - imageDrag.startY;
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) imageDrag.moved = true;

  const nextPosition = {
    x: clamp(imageDrag.startPosition.x + (deltaX / imageDrag.width) * 100, 0, 100),
    y: clamp(imageDrag.startPosition.y + (deltaY / imageDrag.height) * 100, 0, 100),
    zoom: imageDrag.startPosition.zoom,
  };
  setImagePosition(imageDrag.key, nextPosition);
  applyImagePosition(imageDrag.surface, nextPosition);
}

function stopImageCompose(event) {
  if (!imageDrag) return;

  if (event?.pointerId && imageDrag.pointers.has(event.pointerId)) {
    imageDrag.pointers.delete(event.pointerId);
    if (imageDrag.pointers.size > 0) return;
  }

  if (imageDrag.moved) {
    saveState();
    suppressImageToggle = true;
    window.setTimeout(() => {
      suppressImageToggle = false;
    }, 120);
  }
  imageDrag.picker.classList.remove("is-dragging");
  imageDrag = null;
}

function zoomImageWithWheel(event) {
  const surface = event.target.closest?.(".hero-image, .month-cover, .memorial-image, .media-preview");
  const picker = event.target.closest?.("[data-image-picker]");
  if (!surface || !picker || picker.querySelector("[data-image-change]")?.hidden) return;

  event.preventDefault();
  const key = getImagePositionKey(surface);
  const position = getImagePosition(key);
  const nextPosition = {
    ...position,
    zoom: clamp(position.zoom + (event.deltaY < 0 ? 0.08 : -0.08), 1, 2.6),
  };
  setImagePosition(key, nextPosition);
  applyImagePosition(surface, nextPosition);
  saveState();
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === name);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  hideImagePickers();
  if (name === "memorial") updateMemorialSky();
}

function updateMemorialSky() {
  const memorialScreen = document.querySelector('[data-screen="memorial"]');
  if (!memorialScreen) return;

  const nextClass = `memorial-sky-${getMemorialSkyPhase(new Date())}`;
  const classes = ["memorial-sky-morning", "memorial-sky-day", "memorial-sky-evening", "memorial-sky-night"];
  classes.forEach((className) => {
    memorialScreen.classList.toggle(className, className === nextClass);
  });
}

function getMemorialSkyPhase(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

async function addMemory(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const file = form.get("media");
  const text = String(form.get("text") || "").trim();

  if (!text && !(file instanceof File && file.size)) return;

  setMemoryMessage("Tallennetaan muistoa...");
  const media = memoryDraft?.media || "";
  const type = memoryDraft?.type || (file instanceof File && file.type.startsWith("video") ? "video" : "image");

  state.memories.unshift({
    id: crypto.randomUUID(),
    type,
    media,
    imagePosition: memoryDraft?.position || { x: 50, y: 50, zoom: 1 },
    text: text || "Muisto ilman sanoja.",
    createdAt: new Date().toISOString(),
  });

  if (!saveState()) {
    state.memories.shift();
    setMemoryMessage(
      "Kuva tai video on liian suuri paikalliseen tallennukseen. Kokeile pienempää kuvaa.",
      true,
    );
    return;
  }

  event.currentTarget.reset();
  resetMemoryDraft();
  setMemoryMessage("");
  closeCard("memory");
  renderHome();
  renderMemories();
}

async function updateMemoryFileMessage(event) {
  const file = event.target.files?.[0];
  if (!file) {
    resetMemoryDraft();
    return;
  }

  const size = `${(file.size / 1024 / 1024).toFixed(1)} Mt`;
  const note = file.type.startsWith("image/")
    ? "Kuva avataan alle sommittelua varten."
    : "Video tallennetaan vain, jos se mahtuu selaimen paikalliseen muistiin.";
  setMemoryMessage(`${file.name} (${size}). ${note}`);

  try {
    const type = file.type.startsWith("video") ? "video" : "image";
    const media = type === "image" ? await prepareImageFile(file) : await fileToDataUrl(file);
    memoryDraft = {
      type,
      media,
      position: { x: 50, y: 50, zoom: 1 },
    };
    renderMemoryDraft();
    setMemoryMessage(
      type === "image"
        ? "Kuva valmis. Voit sommitella sitä ennen tallennusta."
        : "Video valmis tallennettavaksi.",
    );
  } catch {
    resetMemoryDraft();
    setMemoryMessage("Tiedostoa ei voitu lukea. Kokeile toista kuvaa tai pienempää tiedostoa.", true);
  }
}

function setMemoryMessage(text, isError = false) {
  elements.memoryMessage.textContent = text;
  elements.memoryMessage.classList.toggle("is-error", isError);
}

function renderMemoryDraft() {
  if (!memoryDraft?.media || memoryDraft.type !== "image") {
    elements.draftPicker.hidden = true;
    elements.draftPreview.style.backgroundImage = "";
    return;
  }

  elements.draftPicker.hidden = false;
  elements.draftPicker.classList.add("is-composing");
  elements.draftPreview.style.backgroundImage = `url('${memoryDraft.media}')`;
  applyImagePosition(elements.draftPreview, memoryDraft.position);
}

function resetMemoryDraft() {
  memoryDraft = null;
  elements.draftPicker.hidden = true;
  elements.draftPicker.classList.remove("is-composing", "is-dragging");
  elements.draftPreview.style.backgroundImage = "";
  elements.draftPreview.style.backgroundPosition = "";
  elements.draftPreview.style.backgroundSize = "";
  setMemoryMessage("");
}

function addLetter(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const title = String(form.get("title") || "").trim();
  const body = String(form.get("body") || "").trim();

  if (!title && !body) return;

  state.letters.unshift({
    id: crypto.randomUUID(),
    title: title || `Kirje ${toAllative(state.horseName)}`,
    body,
    createdAt: new Date().toISOString(),
  });

  saveState();
  event.currentTarget.reset();
  closeCard("letter");
  renderLetters();
}

function addImportantDay(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get("name") || "").trim();
  const date = String(form.get("date") || "");
  const note = String(form.get("note") || "").trim();
  const symbol = String(form.get("symbol") || "♡");

  if (!name || !date) return;

  state.importantDays.push({
    id: crypto.randomUUID(),
    name,
    date,
    note,
    symbol,
  });

  saveState();
  event.currentTarget.reset();
  closeCard("day");
  renderCalendar();
}

async function updateMonthPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  state.monthPhotos[getMonthKey(visibleMonth)] = await prepareImageFile(file);
  state.monthPhotoPositions[getMonthKey(visibleMonth)] = { x: 50, y: 50 };
  saveState();
  event.target.value = "";
  hideImagePickers();
  renderCalendar();
}

async function updateHeroPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  state.heroImage = await prepareImageFile(file);
  state.heroImagePosition = { x: 50, y: 50 };
  saveState();
  event.target.value = "";
  hideImagePickers();
  renderHome();
}

async function updateMemorialPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  state.memorialImage = await prepareImageFile(file);
  state.memorialImagePosition = { x: 50, y: 50 };
  saveState();
  event.target.value = "";
  hideImagePickers();
  renderMemorial();
}

async function updateMemoryImage(event) {
  const input = event.target.closest("[data-memory-photo]");
  if (!input) return;

  const memory = findMemory(input.dataset.memoryPhoto);
  const file = input.files?.[0];
  if (!memory || !file) return;

  memory.media = await prepareImageFile(file);
  memory.type = "image";
  memory.imagePosition = { x: 50, y: 50, zoom: 1 };
  saveState();
  input.value = "";
  hideImagePickers();
  renderHome();
  renderMemories();
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const image = form.get("memorialImage");

  state.horseName = String(form.get("horseName") || state.horseName).trim() || state.horseName;
  state.petType = String(form.get("petType") || state.petType);
  state.petTypeCustom = String(form.get("petTypeCustom") || "").trim();
  state.memorialName =
    String(form.get("memorialName") || state.memorialName).trim() || state.memorialName;
  state.memorialDate = parseDateInput(String(form.get("memorialDate") || "")) || state.memorialDate;
  state.memorialNote = String(form.get("memorialNote") || "").trim();
  state.memorialText = buildMemorialText(state);

  if (image instanceof File && image.size) {
    state.memorialImage = await prepareImageFile(image);
    state.memorialImagePosition = { x: 50, y: 50 };
  }

  saveState();
  renderAll();
  showScreen("memorial");
}

function renderAll() {
  renderHome();
  renderMemories();
  renderLetters();
  renderCalendar();
  renderMemorial();
  renderSettings();
}

function renderHome() {
  const memory = state.memories[0];
  const today = new Date();
  const dailyElement = getDailyMemoryElement(today);
  const quote = getDailyQuote(today);
  elements.heroImage.style.backgroundImage = state.heroImage
    ? `linear-gradient(180deg, rgba(37,42,31,0.08) 24%, rgba(37,42,31,0.72) 100%), url('${state.heroImage}')`
    : "";
  applyImagePosition(elements.heroImage, state.heroImagePosition);
  elements.heroTitle.textContent = toGenitive(state.horseName);
  elements.memoryOfDay.innerHTML = `
    <div class="memory-of-day-copy">
      <p class="eyebrow">Päivän muisto</p>
      <h3>${escapeHtml(state.horseName)} on tässä mukana</h3>
      <p>${escapeHtml(memory?.text || "Lisää ensimmäinen muisto, kun hetki tuntuu oikealta.")}</p>
    </div>
    <div class="daily-memory-element" aria-hidden="true">${dailyElement}</div>
  `;
  elements.dailyQuote.innerHTML = `
    <p class="eyebrow">Päivän lause</p>
    <blockquote>“${escapeHtml(quote)}”</blockquote>
  `;
  elements.memorialButton.textContent = state.memorialName;
}

function getDailyMemoryElement(date) {
  const dayIndex = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  const elements = [
    `<svg viewBox="0 0 90 120"><path class="stem" d="M45 112C43 83 43 52 48 14"/><path d="M45 78c-18-7-27-19-28-34 17 4 27 15 28 34Z"/><path d="M48 61c17-9 25-23 23-40-15 6-24 18-23 40Z"/><path d="M44 96c-14-5-23-15-26-28 14 2 24 12 26 28Z"/><circle cx="50" cy="14" r="3"/><circle cx="58" cy="29" r="2.5"/><circle cx="38" cy="39" r="2.5"/></svg>`,
    `<svg viewBox="0 0 90 120"><path class="stem" d="M42 112C48 82 52 51 40 18"/><path d="M42 85c-15-12-20-26-16-42 15 9 22 23 16 42Z"/><path d="M45 69c20-3 32-13 38-30-18 0-31 10-38 30Z"/><path d="M39 101c-12-8-18-19-18-33 13 6 20 17 18 33Z"/><circle cx="40" cy="18" r="3"/><circle cx="31" cy="31" r="2.5"/><circle cx="55" cy="46" r="2.5"/></svg>`,
    `<svg viewBox="0 0 90 120"><path class="stem" d="M47 112C39 82 36 54 35 20"/><path d="M42 82c-18-4-30-15-35-31 18 1 30 12 35 31Z"/><path d="M43 55c14-13 20-28 16-45-13 9-20 24-16 45Z"/><path d="M48 95c17-6 27-18 30-34-16 3-27 15-30 34Z"/><circle cx="35" cy="20" r="3"/><circle cx="52" cy="28" r="2.5"/><circle cx="28" cy="48" r="2.5"/></svg>`,
    `<svg viewBox="0 0 90 120"><path class="stem" d="M44 112C47 83 45 54 56 18"/><path d="M44 88c-16-9-24-22-24-38 16 6 25 19 24 38Z"/><path d="M50 70c17-7 28-19 30-36-17 3-28 16-30 36Z"/><path d="M42 101c-15-4-25-13-30-26 15 1 25 11 30 26Z"/><circle cx="56" cy="18" r="3"/><circle cx="63" cy="36" r="2.5"/><circle cx="36" cy="47" r="2.5"/></svg>`,
  ];
  return elements[dayIndex % elements.length];
}

const dailyQuotes = `
Muisto ei katoa, se vaihtaa vain paikkaa sydämeen.
Rakkaus jää sinne, missä kaipauskin asuu.
Tänäänkin yksi muisto kantaa enemmän kuin tuhat sanaa.
Se, mikä oli tärkeää, ei koskaan lakkaa olemasta.
Kaipaus on rakkauden hiljainen ääni.
Muistot kulkevat mukana silloinkin, kun askeleet jatkuvat ilman toista.
Sydän muistaa sen, mitä aika ei voi viedä.
Jokainen lämmin muisto on pieni valo pimeässä.
Poissaolo voi tuntua suurelta, koska rakkaus oli niin suuri.
Tänään saa ikävöidä lempeästi.
Jotkut jättävät jäljen, jota ei tarvitse nähdä tunteakseen.
Rakkaus ei pääty siihen, mihin yhteinen aika päättyi.
Muistoissa on koti niille hetkille, joihin haluaa palata.
Hiljaisuuskin voi olla täynnä rakkautta.
Ikävä kertoo, että joku oli todella merkityksellinen.
Tänään muistot saavat olla lähellä.
Jälki sydämessä on pysyvämpi kuin jälki maassa.
Kauneimmat hetket eivät katoa, ne pehmenevät ajan mukana.
Rakkaus löytää tiensä myös hiljaisuuden läpi.
Jokainen muisto on pieni tapa sanoa: olet yhä tärkeä.
Kaipaus ei ole heikkoutta, vaan rakkautta ilman paikkaa minne mennä.
Se, mitä rakastettiin, jää osaksi kaikkea.
Tänään yksi ajatus voi tuoda lähelle.
Muistot ovat siltoja eilisen ja tämän päivän välillä.
Sydän kantaa sitä, mitä kädet eivät enää voi.
Rakkaus ei tarvitse ääntä kuuluakseen.
Jotkut nimet tuntuvat aina lämpimiltä.
Muisto voi olla pieni, mutta sen merkitys suuri.
Poissa oleva voi silti olla lähellä.
Tänäänkin rakkaus jatkuu muistojen muodossa.
Kaikki kaunis ei pääty, osa siitä jää elämään meissä.
Muisto on kuin valo, joka ei sammu kokonaan.
Ikävä on sydämen tapa pitää kiinni rakkaasta.
Tänään saa pysähtyä sen äärelle, mikä oli kaunista.
Rakkaus ei katoa, vaikka maailma muuttuu.
Jotkut hetket jäävät ikuisiksi, koska ne tuntuivat kodilta.
Sydämessä säilyy se, mitä ei halua unohtaa.
Kaipaus kulkee rinnalla, mutta niin kulkee rakkauskin.
Muistot tekevät poissaolevasta yhä osan päivää.
Rakkaan jälki näkyy siinä, miten muistamme.
Tänään yksi muisto voi riittää lohduttamaan.
Hiljainen ajatus voi olla kaunein tervehdys.
Se, joka oli rakas, pysyy rakkaana.
Muistot eivät kysy aikaa, ne tulevat kun sydän tarvitsee.
Ikävä kertoo tarinan rakkaudesta.
Jotkut sydämet jäävät toisiin sydämiin asumaan.
Tänään saa antaa muistojen olla pehmeitä.
Rakkaus on vahvempi kuin välimatka.
Kaipaus tekee näkyväksi sen, mikä merkitsi paljon.
Muistoissa rakas saa aina tulla lähelle.
Poissaolo ei poista merkitystä.
Jokainen lämmin ajatus on pieni kukka muistolle.
Rakkaus jatkuu siinä, miten puhumme, muistamme ja kannamme.
Sydän osaa löytää tien takaisin tärkeisiin hetkiin.
Tänäänkin voit kohdata rakkaan muiston kautta.
Muistot ovat ajan pehmentämiä aarteita.
Kaikki hyvä ei jää taakse, osa siitä jää sisään.
Ikävä on merkki siitä, että rakkaus oli totta.
Jotkut muistot hengittävät hiljaa mukana.
Kevytkin muisto voi kantaa raskaan päivän yli.
Rakkaus näkyy siinä, mitä emme koskaan unohda.
Tänään muistot saavat kulkea vierellä.
Sydän pitää tallessa sen, mikä oli tärkeintä.
Kaipaus voi satuttaa, mutta se syntyi rakkaudesta.
Jotkut kohtaamiset muuttavat meitä pysyvästi.
Muisto on pieni hetki, joka ei suostu katoamaan.
Rakkaan merkitys ei vähene ajan myötä.
Tänään yksi nimi voi tuoda hymyn ja kyyneleen.
Ikävä on hiljainen side menneen ja nykyisen välillä.
Se, mikä kosketti sydäntä, jää sinne.
Muistot tekevät näkymättömästä läsnä olevaa.
Rakkaus voi olla poissa silmistä, mutta ei sydämestä.
Tänään saa muistaa ilman kiirettä.
Kauniit hetket eivät ole menneet hukkaan.
Sydän säilyttää omansa hellästi.
Poissaoleva voi yhä tuoda lohtua.
Muisto on rakkauden tapa palata.
Ikävä kulkee kevyemmin, kun sitä kantaa lempeydellä.
Jotkut jäljet ovat niin kauniita, ettei niitä halua pyyhkiä pois.
Rakkaus jää elämään pienissä asioissa.
Tänäänkin mennyt voi tuntua lämpimältä.
Muistot ovat kuin ikkunoita yhteiseen aikaan.
Se, joka toi valoa, jättää valoa jälkeensä.
Kaipaus on osa rakkautta, joka ei päättynyt.
Sydämen tärkeimmät paikat eivät tyhjene.
Jokainen muisto kertoo: sinulla oli merkitys.
Rakkaus ei katoa, se muuttaa muotoaan.
Tänään saa löytää lohtua siitä, mikä oli hyvää.
Muistoissa rakas saa aina olla lähellä.
Jotkut hetket jäävät kulkemaan mukanamme.
Rakkaus kukkii myös muistoissa.
Ikävä voi olla raskas, mutta sen juuret ovat kauniit.
Tänään muistetaan sitä, mikä toi valoa.
Muisto on sydämen oma kevät.
Kaikki tärkeä ei katoa ajan mukana.
Rakas voi olla poissa, mutta vaikutus jää.
Sydän tunnistaa ne, joita se rakasti.
Tänään yksi muisto voi avata lempeän oven.
Kaipaus kertoo, että yhteinen aika oli arvokasta.
Muistoissa elää se, mitä ei voi menettää kokonaan.
Rakkaus jää näkyviin tavoissa, ajatuksissa ja tarinoissa.
Hiljaisuus voi olla täynnä yhteisiä hetkiä.
Jotkut muistot palaavat kuin aurinko pilvien takaa.
Tänään saa hymyillä sille, mitä oli.
Ikävä ja kiitollisuus voivat asua samassa sydämessä.
Rakkaan jälki ei tarvitse sanoja.
Muistot tekevät menneestä pehmeän paikan levätä.
Se, mikä oli rakasta, on yhä arvokasta.
Sydän ei unohda niitä, jotka tekivät siitä täydemmän.
Tänään rakkaus saa puhua hiljaa.
Kaipaus ei vie pois sitä, mitä saatiin kokea.
Muisto on pieni pala yhteistä aikaa.
Rakkaus kantaa yli päivien, vuosien ja hiljaisuuden.
Jotkut hetket pysyvät, koska ne olivat täynnä merkitystä.
Tänään saa pitää kiinni hyvästä.
Poissaolo ei tee rakkaasta vähemmän tärkeää.
Muistot ovat sydämen oma tapa säilyttää.
Kauniisti eletty hetki elää pitkään.
Rakkaus jättää jäljen, jota aika vain pehmentää.
Tänäänkin muisto voi olla lähellä kuin hengitys.
Muisto voi tuoda valoa tavalliseen päivään.
Rakkaus ei kysy, onko toinen lähellä.
Tänään sydän saa muistaa omalla tavallaan.
Kaipaus on rakkauden varjo, mutta myös sen todiste.
Jotkut nimet tuntuvat aina kodilta.
Muistot kasvavat kauniiksi, kun niitä vaalitaan.
Se, mikä oli hyvää, ei katoa kokonaan.
Tänään yksi ajatus voi kantaa paljon.
Rakas jää elämään siinä, mitä hän opetti.
Hiljainen muisto voi olla päivän lämpimin hetki.
Rakkaus säilyy siellä, missä sitä tarvitaan.
Ikävä tekee näkyväksi yhteisen ajan arvon.
Muisto on sydämen tapa sanoa: olet mukana.
Tänään saa olla sekä kiitollinen että ikävissään.
Kauniit jäljet eivät haalistu kokonaan.
Jotkut hetket jäävät sydämeen asumaan.
Rakkaus voi olla hiljaista, mutta se ei ole poissa.
Muistot ovat lempeitä tervehdyksiä menneestä.
Tänäänkin yhteinen aika saa merkityksen.
Ikävä ei vähennä rakkautta, se paljastaa sen suuruuden.
Sydän löytää rakkaan pienistä merkeistä.
Muisto voi olla kuin kukka, joka avautuu uudelleen.
Se, mitä rakastimme, kulkee meissä eteenpäin.
Tänään saa antaa muistolle tilaa.
Rakkaus ei pääty viimeiseen päivään.
Kaipaus ja lämpö voivat kulkea käsi kädessä.
Muistoissa on voimaa, kun päivä tuntuu raskaalta.
Jotkut jäävät lähelle ilman askelia.
Tänäänkin rakas voi tuntua ajatuksessa.
Sydämen muistot eivät tarvitse kalenteria.
Rakkaus tekee muistoista ikuisia.
Muistot loistavat joskus kirkkaimmin hiljaisina hetkinä.
Tänään saa palata siihen, mikä tuntui hyvältä.
Rakkaan läsnäolo voi jatkua muiston valossa.
Kaipaus on merkki syvästä yhteydestä.
Jokainen lämmin muisto on pieni lahja.
Sydän kantaa yhteiset hetket mukanaan.
Se, mikä oli rakasta, on yhä osa elämää.
Tänään yksi muisto voi tehdä päivästä pehmeämmän.
Rakkaus säilyy, vaikka aika liikkuu eteenpäin.
Muistoissa on paikka, jossa mikään ei katoa.
Ikävä kertoo siitä, että joku teki elämästä kauniimpaa.
Jotkut hetket jäävät kuin auringonvalo iholle.
Tänään saa muistaa ilolla ja kaipauksella.
Rakas ei poistu siitä, mitä hän merkitsi.
Muisto on hiljainen lupaus olla unohtamatta.
Sydän tietää, ketkä kuuluvat siihen aina.
Rakkaus voi olla muisto, mutta se tuntuu yhä elävältä.
Tänäänkin jokin pieni asia voi muistuttaa rakkaasta.
Kaikki arvokas ei tarvitse olla näkyvää.
Muistot tekevät poissaolosta hieman lempeämpää.
Ikävä on rakkauden pitkä kaiku.
Jotkut jäljet ovat lahjoja, vaikka ne sattuvatkin.
Tänään saa kiittää siitä, että sai tuntea.
Rakkaus ei vähene, vaikka sitä kantaa muistoissa.
Muisto on sydämen kesäpäivä.
Kaipaus tuo lähelle sen, mitä ei voi koskettaa.
Se, joka oli tärkeä, pysyy tärkeänä.
Tänään sydän saa levätä hyvässä muistossa.
Rakkaan valo ei sammu, se jää heijastumaan.
Muistot ovat lempeitä jalanjälkiä ajassa.
Tänään muisto saa olla kevyt kuin kesätuuli.
Rakkaus kulkee mukana hiljaisissa hetkissä.
Kaipaus voi muuttua kiitollisuudeksi yhteisestä ajasta.
Muisto on paikka, jossa rakas on aina lähellä.
Sydän säilyttää sen, mitä se ei halua päästää pois.
Jotkut hetket jäävät lämpiminä ihon alle.
Tänään saa hymyillä sille, mikä kerran oli.
Rakkaus ei katoa, vaikka sen muoto muuttuu.
Ikävä on sydämen tapa puhua rakkaasta.
Kauniit muistot ovat pieniä valoja arjessa.
Se, joka toi iloa, jätti iloa jälkeensä.
Tänään yksi ajatus voi olla tervehdys.
Muistoissa yhteinen aika ei pääty.
Rakas jää elämään siinä, mitä hän herätti.
Hiljainen hetki voi olla täynnä läsnäoloa.
Kaipaus syntyy siitä, että jokin oli korvaamatonta.
Tänään saa antaa sydämen muistaa vapaasti.
Rakkaus ei tarvitse näkyä ollakseen totta.
Muistot kantavat sinne, mihin jalat eivät voi palata.
Jotkut nimet jäävät sydämen kielelle.
Ikävä voi olla myös kaunis, kun sen alla on rakkaus.
Tänäänkin rakas voi löytyä pienestä merkistä.
Sydän osaa säilyttää tärkeimmät hetket.
Muisto on lahja, joka avautuu yhä uudelleen.
Rakkaus jää niihin paikkoihin, joissa sitä jaettiin.
Kaikki päättynyt ei ole kadonnut.
Tänään saa kantaa muistoa lempeästi.
Jälki sydämessä kertoo yhteisestä matkasta.
Muistot ovat rakkauden hiljaisia kukkia.
Se, mikä merkitsi paljon, merkitsee yhä.
Rakkaus on joskus läsnä kaipauksen muodossa.
Tänään muisto voi tuntua lämpimältä kädeltä olalla.
Ikävä ei vie pois sitä, mitä saatiin rakastaa.
Rakkaus säilyy ajassa, vaikka päivät vaihtuvat.
Muisto on sydämen oma tapa pitää lähellä.
Jotkut hetket eivät pääty, ne muuttuvat osaksi meitä.
Kaipaus kertoo, että yhteys oli todellinen.
Tänään saa olla hetken menneen valossa.
Rakas jää elämään niissä tarinoissa, joita kerromme.
Sydän ei mittaa aikaa, vaan merkitystä.
Muistot voivat olla hiljaisia, mutta ne kantavat pitkälle.
Rakkaus ei katoa, vaikka sitä ei voi enää koskettaa.
Tänään yksi muisto voi tehdä tilaa rauhalle.
Se, mikä oli kaunista, jää valoksi.
Ikävä on rakkauden lempeä varjo.
Muistoissa rakas saa aina palata kotiin.
Jotkut jäljet ovat ikuisia siksi, että ne syntyivät rakkaudesta.
Tänään saa kiittää jokaisesta yhteisestä hetkestä.
Rakkaus jää näkymättömäksi voimaksi.
Kaipaus voi olla hiljainen, mutta se puhuu paljon.
Sydän muistaa sen, mitä sanat eivät tavoita.
Muisto on pieni ikkuna rakkaaseen aikaan.
Tänäänkin läsnäolo voi löytyä poissaolon keskeltä.
Rakas on mukana siinä, miten jatkamme.
Muistot eivät sido menneeseen, ne kuljettavat rakkautta eteenpäin.
Ikävä kertoo, että elämässä oli jotain hyvin kaunista.
Rakkaus on suurempi kuin viimeinen hyvästi.
Tänään saa pysähtyä lempeästi.
Jotkut muistot tulevat luo silloin, kun niitä tarvitsee.
Sydämen tärkeimmät paikat ovat aina varattuja.
Muisto kantaa silloinkin, kun sanat loppuvat.
Rakkaus jää olemaan siellä, missä se kerran syttyi.
Muisto on kuin lämmin valo viilenevässä illassa.
Tänään saa antaa kaipauksen tulla ja mennä.
Rakkaus elää siinä, mitä muistamme hellästi.
Jotkut hetket jäävät lehdiksi sydämen kirjaan.
Ikävä syntyy siitä, että joku oli korvaamaton.
Muistot tekevät menneestä läsnä olevan.
Sydän pitää tallessa kaiken tärkeimmän.
Tänään yksi muisto voi riittää lohduttamaan.
Rakkaus ei kysy aikaa eikä paikkaa.
Kaipaus on hiljainen side rakkaaseen.
Muistoissa on lempeä koti yhteiselle ajalle.
Se, joka toi hyvää, jätti hyvää jälkeensä.
Tänään saa kulkea muiston kanssa rauhassa.
Rakas voi olla poissa arjesta, mutta ei sydämestä.
Muistot ovat pieniä tapoja olla yhdessä yhä.
Ikävä ei pyyhi pois kiitollisuutta.
Rakkaus näkyy siinä, mikä pysyy mielessä.
Jotkut muistot ovat kuin pehmeitä sateen ääniä.
Tänäänkin sydän saa kaivata.
Kaikki arvokas ei katoa näkyvistä kadotessaan.
Muisto on rakkauden lempeä jälki.
Sydän tietää, ketä se kantaa.
Rakas jää osaksi vuodenaikoja, paikkoja ja pieniä hetkiä.
Tänään saa löytää rauhaa siitä, että sai rakastaa.
Kaipaus on osa yhteistä tarinaa.
Muistot eivät vanhene samalla tavalla kuin päivät.
Rakkaus tekee menneestä elävän.
Jotkut jäljet ovat hiljaisia, mutta syviä.
Tänään muisto saa olla lähellä.
Se, mikä oli tärkeää, pysyy sydämen sisällä.
Muisto voi lämmittää silloinkin, kun päivä on viileä.
Rakkaus kulkee mukana hiljaisena voimana.
Tänään saa sytyttää ajatuksissa valon rakkaalle.
Kaipaus kertoo siitä, että yhteinen aika oli lahja.
Sydän säilyttää omansa hellästi ja tarkasti.
Muistot ovat rakkauden pehmeitä jälkiä.
Jotkut hetket jäävät niin lähelle, ettei niitä tarvitse etsiä.
Tänään yksi muisto voi tehdä pimeästä lempeämmän.
Rakas ei katoa siitä, mitä hän merkitsi.
Ikävä on sydämen hiljainen rukous.
Rakkaus voi tuntua kaipauksena ja silti lohduttaa.
Muistoissa on paikka, jossa aika pysähtyy.
Tänään saa olla kiitollinen myös kyynelten läpi.
Se, mikä kerran toi valoa, voi tuoda sitä yhä.
Sydän muistaa ilman muistuttamista.
Muistot eivät poista ikävää, mutta tekevät sille tilaa.
Rakkaus jää elämään tavallisissa hetkissä.
Jotkut nimet ovat sydämessä aina lämpimiä.
Tänään saa antaa muistojen puhua.
Kaipaus on rakkauden jälkikaiku.
Muisto voi olla pieni suoja raskaan päivän keskellä.
Rakas on mukana siinä, mitä kannamme eteenpäin.
Ikävä ei tarkoita, että rakkaus olisi jäänyt taakse.
Tänäänkin mennyt voi olla kauniisti läsnä.
Sydän löytää lohtua siitä, mikä oli totta.
Muistot ovat hiljaisia aarteita.
Rakkaus tekee poissaolevasta yhä merkityksellisen.
Jotkut jäljet näkyvät vain sydämessä.
Tänään saa muistaa lämmöllä.
Kaikki hyvä ei pääty menneeseen.
Muisto kantaa rakkauden ääntä.
Pimeässäkin muisto voi olla valo.
Tänään saa sytyttää sydämessä kynttilän.
Rakkaus ei sammu, se muuttaa sävyään.
Kaipaus kertoo siitä, että joku oli syvästi rakas.
Muistot ovat pieniä valoja hiljaisessa illassa.
Sydän kantaa sen, mitä se ei voi enää pitää sylissä.
Jotkut hetket ovat ikuisia juuri siksi, että ne olivat niin rakkaita.
Tänään saa pysähtyä rakkaan äärelle ajatuksissa.
Ikävä on rakkauden toinen nimi.
Muistoissa on lämpöä, vaikka ulkona olisi kylmä.
Se, mikä oli tärkeää, jää näkyviin sydämen tavassa muistaa.
Rakkaus ei tarvitse läsnäoloa jatkuakseen.
Tänään yksi ajatus voi olla kaunis tervehdys.
Muistot tekevät hiljaisuudesta pehmeämmän.
Rakas jää osaksi niitä päiviä, joissa häntä muistetaan.
Kaipaus saa olla, koska rakkauskin saa olla.
Sydän ei päästä irti siitä, mikä teki hyvää.
Tänään saa antaa ikävälle lempeän paikan.
Muisto on kuin kynttilä, joka palaa sisällä.
Jotkut jäljet muuttuvat osaksi meitä.
Rakkaus näkyy siinä, miten muistamme vieläkin.
Tänään saa kuunnella hiljaisuutta.
Poissaolo ei voi poistaa yhteisiä hetkiä.
Muistot ovat rakkauden arkisto.
Ikävä voi olla raskas, mutta se kantaa mukanaan kauneutta.
Se, joka oli rakas, pysyy rakkaana jokaisena vuodenaikana.
Tänäänkin yksi muisto voi tuoda lohtua.
Rakkaus elää siellä, missä nimi sanotaan lämmöllä.
Muisto voi tehdä kylmästä päivästä vähän lämpimämmän.
Sydän tietää, miksi se kaipaa.
Muisto voi loistaa kuin tähti talvi-illassa.
Tänään saa kantaa rakkautta hiljaa mukana.
Kaipaus tuntuu suurelta, koska rakkaus oli suuri.
Rakkaan merkitys ei vähene vuoden vaihtuessa.
Muistot ovat lahjoja, joita aika ei voi paketoida pois.
Sydän säilyttää sen, mitä joulun valotkin muistuttavat.
Tänään yksi lämmin ajatus voi riittää.
Rakkaus jää elämään pienissä perinteissä ja tavoissa.
Ikävä voi olla osa juhlaa, kun rakas on ollut osa elämää.
Muistoissa on paikka kaikelle kauniille, mitä oli.
Jotkut hetket palaavat vuoden lopussa erityisen lähelle.
Tänään saa muistaa ilman sanoja.
Rakas kulkee mukana vuoden viimeisissäkin päivissä.
Muistot tekevät menneestä valoisamman.
Kaipaus on sydämen tapa pitää tärkeä lähellä.
Rakkaus ei jää taakse, vaikka vuosi jää.
Tänään saa olla kiitollinen siitä, että sai kokea.
Muisto on pieni valo, joka ei pyydä paljon tilaa.
Sydän kantaa rakkaansa myös vuodenvaihteen yli.
Se, mikä oli merkityksellistä, pysyy mukana.
Ikävä ja rakkaus voivat istua saman pöydän ääressä.
Tänään yksi muisto voi tehdä olon pehmeämmäksi.
Rakkaan jälki näkyy siinä, mitä vaalimme.
Muistot eivät lopu, vaikka kalenteri vaihtuu.
Jotkut valot jäävät palamaan meihin.
Tänään saa sulkea vuoden lempeästi muistojen kanssa.
Rakkaus jatkuu niissä hetkissä, joissa pysähdymme muistamaan.
Kaipaus kertoo, ettei yhteinen aika ollut turhaa.
Muistoissa rakas saa kulkea mukana myös uuteen vuoteen.
Vuosi vaihtuu, mutta rakkauden jälki pysyy.
Se, mikä on ollut sydämessä, pysyy siellä aina.
`.trim().split("\n");

function getDailyQuote(date) {
  const day = getDayOfYear(date);
  return dailyQuotes[day % dailyQuotes.length];
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000) - 1;
}

renderAll();
updateMemorialSky();
memorialSkyTimer = window.setInterval(updateMemorialSky, 60 * 1000);

function renderMemories() {
  if (!state.memories.length) {
    elements.memoryList.innerHTML = `<p class="empty-state">Muistoseinä odottaa ensimmäistä kuvaa, videota tai lausetta.</p>`;
    return;
  }

  elements.memoryList.innerHTML = state.memories.map(renderMemoryCard).join("");
  applyMemoryImagePositions();
}

function renderMemoryCard(memory) {
  const media = memory.media
    ? memory.type === "video"
      ? `<video src="${memory.media}" controls playsinline></video>`
      : `
          <div class="memory-media-frame" data-image-picker>
            <div class="media-preview" data-memory-image-id="${memory.id}" style="background-image:url('${memory.media}')"></div>
            <label class="image-change memory-change" data-image-change hidden>
              Vaihda kuva
              <input data-memory-photo="${memory.id}" type="file" accept="image/*" />
            </label>
            <span class="image-compose-hint memory-hint" data-image-hint hidden>Vedä kuvaa. Zoomaa kahdella sormella tai rullalla.</span>
          </div>
        `
    : `<div class="media-preview" data-memory-image-id="${memory.id}"></div>`;

  return `
    <article class="memory-card card" data-deletable-item="memory" data-item-id="${memory.id}">
      <button class="delete-action" type="button" data-delete-item="memory" data-item-id="${memory.id}" hidden>Poista</button>
      ${media}
      <div class="memory-body">
        <p class="date-line">${formatDate(memory.createdAt)}</p>
        <p>${escapeHtml(memory.text)}</p>
      </div>
    </article>
  `;
}

function renderLetters() {
  if (!state.letters.length) {
    elements.letterList.innerHTML = `<p class="empty-state">Kirjeet ovat yksityinen paikka sanoille, joita ei tarvitse lähettää mihinkään.</p>`;
    return;
  }

  elements.letterList.innerHTML = state.letters
    .map(
      (letter) => `
        <article class="letter-card card" data-deletable-item="letter" data-item-id="${letter.id}">
          <button class="delete-action" type="button" data-delete-item="letter" data-item-id="${letter.id}" hidden>Poista</button>
          <p class="date-line">${formatDate(letter.createdAt)}</p>
          <h3>${escapeHtml(letter.title)}</h3>
          <p>${escapeHtml(letter.body)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCalendar() {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthKey = getMonthKey(visibleMonth);
  const customPhoto = state.monthPhotos[monthKey];

  elements.currentMonth.textContent = `${capitalize(monthNames[month])} ${year}`;
  elements.monthCover.style.backgroundImage = customPhoto
    ? `linear-gradient(180deg, rgba(47,54,47,0), rgba(47,54,47,0.22)), url('${customPhoto}')`
    : "";
  applyImagePosition(elements.monthCover, getMonthPosition(monthKey));

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayKey = toDateKey(new Date());

  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const isCurrentMonth = date.getMonth() === month;
    const note = getDayNote(date);
    const isMemorial = isMemorialDate(date);
    const classes = [
      "day-cell",
      !isCurrentMonth ? "is-muted" : "",
      dateKey === todayKey ? "is-today" : "",
      note || isMemorial ? "has-note" : "",
      isMemorial ? "is-memorial" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<div class="${classes}" data-symbol="${escapeHtml(isMemorial ? "♡" : note?.symbol || "")}">${date.getDate()}</div>`;
  });

  elements.calendarGrid.innerHTML = cells.join("");
  renderDayList();
}

function renderDayList() {
  const month = visibleMonth.getMonth();
  const year = visibleMonth.getFullYear();
  const days = [
    {
      name: state.memorialName,
      date: state.memorialDate,
      note: "Toistuu automaattisesti joka vuosi.",
      symbol: "♡",
      recurring: true,
    },
    ...state.importantDays,
  ].filter((day) => {
    const date = parseDate(day.date);
    return date && date.getMonth() === month && (day.recurring || date.getFullYear() === year);
  });

  if (!days.length) {
    elements.dayList.innerHTML = `<p class="empty-state">Tässä kuussa ei ole vielä omia muistopäiviä.</p>`;
    return;
  }

  elements.dayList.innerHTML = days
    .map((day) => {
      const date = parseDate(day.date);
      return `
        <article class="day-card card">
          <span class="day-symbol">${escapeHtml(day.symbol)}</span>
          <div>
            <p class="date-line">${date.getDate()}. ${monthNames[date.getMonth()]}</p>
            <h3>${escapeHtml(day.name)}</h3>
            <p>${escapeHtml(day.note || "Hiljainen, tärkeä päivä.")}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMemorial() {
  const memorialDate = parseDate(state.memorialDate);
  elements.memorialTitle.textContent = state.memorialName;
  elements.memorialHeading.textContent = toAllative(state.horseName);
  elements.memorialDate.textContent = memorialDate
    ? `${memorialDate.getDate()}. ${monthNames[memorialDate.getMonth()]} - toistuu joka vuosi`
    : "Muistopäivä";
  elements.memorialText.textContent = buildMemorialText(state);
  elements.candleState.classList.toggle("is-lit", state.candleLit);

  if (state.memorialImage) {
    elements.memorialImage.style.backgroundImage = `linear-gradient(180deg, rgba(47,54,47,0), rgba(47,54,47,0.24)), url('${state.memorialImage}')`;
  } else {
    elements.memorialImage.style.backgroundImage = "";
  }
  applyImagePosition(elements.memorialImage, state.memorialImagePosition);
}

function renderSettings() {
  elements.settingsForm.horseName.value = state.horseName;
  elements.settingsForm.petType.value = state.petType || "horse";
  elements.settingsForm.petTypeCustom.value = state.petTypeCustom || "";
  elements.settingsForm.memorialName.value = state.memorialName;
  elements.settingsForm.memorialDate.value = state.memorialDate;
  updateMemorialDateDisplay();
  elements.settingsForm.memorialNote.value = state.memorialNote || "";
}

function updateMemorialDateDisplay() {
  elements.memorialDateDisplay.textContent =
    formatDateInput(elements.memorialDateInput.value) || "Valitse päivä";
}

function previewPetMemorialText() {
  const form = elements.settingsForm;
  const previewState = {
    ...state,
    horseName: form.horseName.value.trim() || state.horseName,
    petType: form.petType.value,
    petTypeCustom: form.petTypeCustom.value.trim(),
    memorialNote: form.memorialNote.value.trim(),
  };
  state.memorialText = buildMemorialText(previewState);
  renderMemorial();
}

function buildMemorialText(source) {
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

function getImagePositionKey(surface) {
  if (surface.matches("[data-draft-preview]")) return "draft";
  if (surface.matches("[data-hero-image]")) return "hero";
  if (surface.matches("[data-month-cover]")) return `month:${getMonthKey(visibleMonth)}`;
  if (surface.matches("[data-memorial-image]")) return "memorial";
  if (surface.matches("[data-memory-image-id]")) return `memory:${surface.dataset.memoryImageId}`;
  return "hero";
}

function getImagePosition(key) {
  if (key === "draft") return normalizePosition(memoryDraft?.position);
  if (key === "hero") return normalizePosition(state.heroImagePosition);
  if (key === "memorial") return normalizePosition(state.memorialImagePosition);
  if (key.startsWith("month:")) return normalizePosition(state.monthPhotoPositions[key.replace("month:", "")]);
  if (key.startsWith("memory:")) return normalizePosition(findMemory(key.replace("memory:", ""))?.imagePosition);
  return { x: 50, y: 50 };
}

function setImagePosition(key, position) {
  const normalized = normalizePosition(position);
  if (key === "draft" && memoryDraft) memoryDraft.position = normalized;
  if (key === "hero") state.heroImagePosition = normalized;
  if (key === "memorial") state.memorialImagePosition = normalized;
  if (key.startsWith("month:")) {
    state.monthPhotoPositions[key.replace("month:", "")] = normalized;
  }
  if (key.startsWith("memory:")) {
    const memory = findMemory(key.replace("memory:", ""));
    if (memory) memory.imagePosition = normalized;
  }
}

function getMonthPosition(monthKey) {
  return normalizePosition(state.monthPhotoPositions[monthKey]);
}

function applyImagePosition(element, position) {
  const normalized = normalizePosition(position);
  element.style.backgroundPosition = `${normalized.x}% ${normalized.y}%`;
  element.style.backgroundSize = getComposedBackgroundSize(element, normalized.zoom);
}

function applyMemoryImagePositions() {
  elements.memoryList.querySelectorAll("[data-memory-image-id]").forEach((element) => {
    const memory = findMemory(element.dataset.memoryImageId);
    applyImagePosition(element, memory?.imagePosition);
  });
}

function findMemory(id) {
  return state.memories.find((memory) => memory.id === id);
}

function normalizePosition(position) {
  return {
    x: clamp(Number(position?.x ?? 50), 0, 100),
    y: clamp(Number(position?.y ?? 50), 0, 100),
    zoom: clamp(Number(position?.zoom ?? 1), 1, 2.6),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getComposedBackgroundSize(element, zoom) {
  if (zoom <= 1.001) return "cover";

  const rect = element.getBoundingClientRect();
  const percent = `${Math.round(zoom * 100)}%`;
  return rect.width / rect.height > 1.35 ? `${percent} auto` : `auto ${percent}`;
}

function getPointerDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function toAllative(name) {
  if (!name) return "Rakkaalle ystävälle";
  const lower = name.toLowerCase();
  const suffix = /[aouå]$/.test(lower) ? "lle" : "lle";
  return `${name}${suffix}`;
}

function toGenitive(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Rakkaan";
  return /[aeiouyäöå]$/i.test(trimmed) ? `${trimmed}n` : `${trimmed}in`;
}

function getDayNote(date) {
  const dateKey = toDateKey(date);
  return state.importantDays.find((day) => day.date === dateKey);
}

function isMemorialDate(date) {
  const memorial = parseDate(state.memorialDate);
  return memorial && memorial.getMonth() === date.getMonth() && memorial.getDate() === date.getDate();
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function parseDateInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";

  return toDateKey(date);
}

function formatDateInput(value) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value) {
  const date = new Date(value);
  return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

async function prepareMediaFile(file) {
  if (file.type.startsWith("image/")) return prepareImageFile(file);
  return fileToDataUrl(file);
}

async function prepareImageFile(file) {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);

  try {
    const image = await createImageBitmap(file, { imageOrientation: "from-image" });
    return resizeImageToDataUrl(image, 1100, 0.76);
  } catch {
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    return resizeImageToDataUrl(image, 1100, 0.76);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

function resizeImageToDataUrl(image, maxSide, quality) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(image, 0, 0, width, height);
  image.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const loaded = { ...structuredClone(defaultState), ...stored };
    loaded.petType = loaded.petType || "horse";
    loaded.petTypeCustom = loaded.petTypeCustom || "";
    loaded.heroImagePosition = normalizePosition(loaded.heroImagePosition);
    loaded.memorialImagePosition = normalizePosition(loaded.memorialImagePosition);
    loaded.monthPhotoPositions = loaded.monthPhotoPositions || {};
    loaded.memories = (loaded.memories || []).map((memory) => ({
      ...memory,
      imagePosition: normalizePosition(memory.imagePosition),
    }));
    loaded.memorialNote = loaded.memorialNote || "";
    loaded.memorialText = buildMemorialText(loaded);
    return loaded;
  } catch {
    const fresh = structuredClone(defaultState);
    fresh.memorialText = buildMemorialText(fresh);
    return fresh;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Tallessa local save failed", error);
    return false;
  }
}

function escapeHtml(value) {
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
