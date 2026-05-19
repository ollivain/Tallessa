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
  heroPhoto: document.querySelector("[data-hero-photo]"),
  memoryOfDay: document.querySelector("[data-memory-of-day]"),
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
  memorialButton: document.querySelector("[data-memorial-button]"),
  memorialTitle: document.querySelector("[data-memorial-title]"),
  memorialDate: document.querySelector("[data-memorial-date]"),
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
document.addEventListener("pointerdown", startImageCompose);
document.addEventListener("pointermove", moveImageCompose);
document.addEventListener("pointerup", stopImageCompose);
document.addEventListener("pointercancel", stopImageCompose);
document.addEventListener("wheel", zoomImageWithWheel, { passive: false });

renderAll();
updateMemorialSky();
memorialSkyTimer = window.setInterval(updateMemorialSky, 60 * 1000);

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
  state.memorialDate = String(form.get("memorialDate") || state.memorialDate);
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
  elements.heroImage.style.backgroundImage = state.heroImage
    ? `linear-gradient(180deg, rgba(37,42,31,0.12), rgba(37,42,31,0.7)), url('${state.heroImage}')`
    : "";
  applyImagePosition(elements.heroImage, state.heroImagePosition);
  elements.memoryOfDay.innerHTML = `
    <p class="eyebrow">Päivän muisto</p>
    <h3>${escapeHtml(state.horseName)} on tässä mukana</h3>
    <p>${escapeHtml(memory?.text || "Lisää ensimmäinen muisto, kun hetki tuntuu oikealta.")}</p>
  `;
  elements.memorialButton.textContent = state.memorialName;
}

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
  elements.settingsForm.memorialNote.value = state.memorialNote || "";
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
