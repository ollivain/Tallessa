import {
  formatDate as formatCalendarDate,
  formatDateInput as formatCalendarDateInput,
  getMonthKey as getCalendarMonthKey,
  monthNames,
  parseDate as parseCalendarDate,
  parseDateInput as parseCalendarDateInput,
  renderCalendarView,
} from "./calendar.js?v=20260523-i18nv9";
import {
  createMemory,
  getHomeMemoryOfDay as getMemoryOfDay,
  renderMemoriesView,
  updateMemoryImage as updateMemoryImageView,
} from "./memories.js?v=20260523-i18nv9";
import { onAuthChange } from "./auth.js?v=20260523-i18nv9";
import {
  createBlankMemorial as createStoredBlankMemorial,
  getActiveMemorial as getStoredActiveMemorial,
  getSupabaseClient,
  isSupabaseConfigured,
  loadLanguage,
  loadState as loadStoredState,
  saveLanguage,
  saveState as saveStoredState,
  setAuthUser,
  syncFromCloud,
} from "./storage.js?v=20260523-i18nv9";
import {
  applyImagePosition as positionImage,
  applyTheme as applyDocumentTheme,
  buildMemorialText as buildPetMemorialText,
  capitalize as capitalizeText,
  clamp as clampNumber,
  escapeHtml as escapeMarkup,
  getComposedBackgroundSize as composeBackgroundSize,
  getPointerDistance as measurePointerDistance,
  normalizePosition as normalizeImagePosition,
  normalizeTheme as normalizeThemeId,
  setActiveView,
  toAllative as toAllativeName,
  toGenitive as toGenitiveName,
  toPossessive,
} from "./ui.js?v=20260523-i18nv9";
import {
  applyTranslations,
  getDailyQuote,
  getLanguage,
  onLanguageChange,
  setLanguage,
  t,
} from "./i18n.js?v=20260523-i18nv9";

// ── i18n bootstrap ──────────────────────────────────────────────────────────
// Default new users to English. Restore the user's saved choice from
// localStorage. Apply translations to the DOM, then re-render the whole UI
// every time the language changes.
setLanguage(loadLanguage());
applyTranslations();
onLanguageChange(() => {
  applyTranslations();
  // Re-render dynamic UI so JS-generated strings pick up the new language
  if (typeof renderAll === "function") renderAll();
});
const VIDEO_CLIP_SECONDS = 10;
const MAX_STANDARD_VIDEO_SIZE = 50 * 1024 * 1024;
const VIDEO_PROCESSING_TIMEOUT = 20_000;
const SUPABASE_CONFIG = window.TallessaSupabase || {};
const SUPABASE_BUCKET = SUPABASE_CONFIG.bucket || "memories";

let ffmpegClientPromise = null;

let appState = loadStoredState();
let state = getActiveMemorial();
let visibleMonth = new Date();
let imageDrag = null;
let suppressImageToggle = false;
let memoryDraft = null;
let memorialSkyTimer = null;
let isCreatingMemorial = false;

registerServiceWorker();

const screens = [...document.querySelectorAll("[data-screen]")];
const navButtons = [...document.querySelectorAll("[data-nav]")];

const elements = {
  appNav: document.querySelector("[data-app-nav]"),
  memorialPlaceList: document.querySelector("[data-memorial-place-list]"),
  createMemorialButton: document.querySelector("[data-create-memorial]"),
  settingsCreateNote: document.querySelector("[data-settings-create-note]"),
  settingsTitle: document.querySelector("[data-settings-title]"),
  memorialDanger: document.querySelector("[data-memorial-danger]"),
  deleteMemorialDialog: document.querySelector("[data-delete-memorial-dialog]"),
  deleteMemorialMessage: document.querySelector("[data-delete-memorial-message]"),
  heroImage: document.querySelector("[data-hero-image]"),
  heroMemoryLine: document.querySelector("[data-hero-memory-line]"),
  heroPhoto: document.querySelector("[data-hero-photo]"),
  memoryOfDay: document.querySelector("[data-memory-of-day]"),
  dailyQuote: document.querySelector("[data-daily-quote]"),
  memoryForm: document.querySelector("[data-memory-form]"),
  memoryMedia: document.querySelector("[data-memory-media]"),
  memoryMessage: document.querySelector("[data-memory-message]"),
  draftPicker: document.querySelector("[data-draft-picker]"),
  draftPreview: document.querySelector("[data-draft-preview]"),
  videoTrim: document.querySelector("[data-video-trim]"),
  videoPreview: document.querySelector("[data-video-preview]"),
  videoStart: document.querySelector("[data-video-start]"),
  videoRangeLabel: document.querySelector("[data-video-range-label]"),
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
  langDialog: document.querySelector("[data-lang-dialog]"),
};

document.addEventListener("click", handleClick);
elements.memoryList.addEventListener("change", updateMemoryImage);
elements.heroPhoto.addEventListener("change", updateHeroPhoto);
elements.memoryMedia.addEventListener("change", updateMemoryFileMessage);
elements.videoStart.addEventListener("input", updateVideoClipSelection);
elements.memoryForm.addEventListener("submit", addMemory);
elements.letterForm.addEventListener("submit", addLetter);
elements.dayForm.addEventListener("submit", addImportantDay);
elements.monthPhoto.addEventListener("change", updateMonthPhoto);
elements.memorialPhoto.addEventListener("change", updateMemorialPhoto);
document.querySelector("[data-cal-photos-bulk]").addEventListener("change", updateCalendarMonthPhotosBulk);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.settingsForm.addEventListener("change", handleSettingsChange);
elements.petType.addEventListener("change", previewPetMemorialText);
elements.memorialDateInput.addEventListener("change", updateMemorialDateDisplay);
document.addEventListener("pointerdown", startImageCompose);
document.addEventListener("pointermove", moveImageCompose);
document.addEventListener("pointerup", stopImageCompose);
document.addEventListener("pointercancel", stopImageCompose);
document.addEventListener("wheel", zoomImageWithWheel, { passive: false });

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Tallessa service worker registration failed", error);
    });
  });
}

function handleClick(event) {
  const dailyMemory = event.target.closest("[data-open-daily-memory]");
  if (dailyMemory) {
    openDailyMemory(dailyMemory.dataset.openDailyMemory);
    return;
  }

  if (event.target.closest("[data-delete-memorial]")) {
    openDeleteMemorialDialog();
    return;
  }

  if (event.target.closest("[data-cancel-delete-memorial]")) {
    elements.deleteMemorialDialog?.close();
    return;
  }

  if (event.target.closest("[data-confirm-delete-memorial]")) {
    deleteActiveMemorial();
    return;
  }

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

  const memorialTarget = event.target.closest("[data-select-memorial]")?.dataset.selectMemorial;
  if (memorialTarget) {
    selectMemorial(memorialTarget);
    return;
  }

  if (event.target.closest("[data-create-memorial]")) {
    startMemorialCreation();
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

function openDailyMemory(memoryId) {
  showScreen("wall");
  if (!memoryId) return;

  window.requestAnimationFrame(() => {
    const memoryCard = [...elements.memoryList.querySelectorAll('[data-deletable-item="memory"]')].find(
      (card) => card.dataset.itemId === memoryId,
    );
    if (!memoryCard) return;

    elements.memoryList.querySelectorAll(".is-daily-memory-target").forEach((card) => {
      card.classList.remove("is-daily-memory-target");
    });
    memoryCard.classList.add("is-daily-memory-target");
    memoryCard.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    window.setTimeout(() => memoryCard.classList.remove("is-daily-memory-target"), 2200);
  });
}

function openDeleteMemorialDialog() {
  if (!elements.deleteMemorialDialog || !elements.deleteMemorialMessage) return;

  const name = `${toPossessive(state.horseName || t("memorialText.fallbackName"))} ${t("selector.placeSuffix")}`;
  elements.deleteMemorialMessage.textContent = t("delete.confirmMessage", { name });
  elements.deleteMemorialDialog.showModal();
}

function deleteActiveMemorial() {
  const removedId = appState.activeMemorialId;
  appState.memorials = appState.memorials.filter((memorial) => memorial.id !== removedId);
  appState.activeMemorialId = appState.memorials[0]?.id || "";
  state = appState.memorials[0] || createBlankMemorial(state.theme);
  isCreatingMemorial = false;
  elements.deleteMemorialDialog?.close();
  saveState();
  renderAll();
  showScreen("selector");
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
  panel.scrollIntoView({ block: "center", inline: "nearest" });
  window.requestAnimationFrame(() => {
    panel.querySelector("input, textarea, select")?.focus({ preventScroll: true });
  });
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

async function handleDeleteAction(button) {
  const type = button.dataset.deleteItem;
  const id = button.dataset.itemId;

  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.classList.add("is-confirming");
    button.textContent = "Vahvista poisto";
    return;
  }

  if (type === "memory") {
    const memory = findMemory(id);
    state.memories = state.memories.filter((item) => item.id !== id);
    if (memory?.storagePath) deleteSupabaseFile(memory.storagePath);
  }
  if (type === "letter") state.letters = state.letters.filter((letter) => letter.id !== id);
  if (type === "day") state.importantDays = state.importantDays.filter((day) => day.id !== id);
  if (type === "memorial-day") state.memorialDate = "";
  saveState();
  renderHome();
  renderMemories();
  renderLetters();
  renderCalendar();
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
  if (name === "selector") {
    isCreatingMemorial = false;
    state = getActiveMemorial();
  }

  setActiveView({ name, screens, navButtons });
  hideImagePickers();
  renderMemorialSelector();
  if (name === "memorial") updateMemorialSky();
}

function selectMemorial(id) {
  const memorial = appState.memorials.find((item) => item.id === id);
  if (!memorial) return;

  appState.activeMemorialId = id;
  state = memorial;
  isCreatingMemorial = false;
  saveState();
  renderAll();
  showScreen("home");
}

function startMemorialCreation() {
  const memorial = createBlankMemorial(state.theme);
  state = memorial;
  isCreatingMemorial = true;
  renderAll();
  showScreen("settings");
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
  const calendarDate = parseDateInput(String(form.get("calendarDate") || ""));

  if (!text && !(file instanceof File && file.size)) return;

  setMemoryMessage("Tallennetaan muistoa...");
  const type = memoryDraft?.type || (file instanceof File && isVideoFile(file) ? "video" : "image");
  let media = memoryDraft?.media || "";
  let storagePath = memoryDraft?.storagePath || "";
  let uploadedStoragePath = "";

  try {
   if (type === "video") {
  const videoFile = memoryDraft?.file || file;
  if (!(videoFile instanceof File && videoFile.size)) {
    throw new Error("missing-video-file");
  }

  let videoToUpload = videoFile;
  let shouldTrimVideo = true;

  try {
    const duration = await getVideoDuration(videoFile);

    if (duration && duration <= VIDEO_CLIP_SECONDS) {
      shouldTrimVideo = false;
    }
  } catch (error) {
    console.warn(t("msg.video.durationFailed"), error);
  }

  if (shouldTrimVideo) {
    setMemoryMessage(t("msg.video.preparingTrim"));
    videoToUpload = await trimVideoFile(videoFile, memoryDraft?.clipStart || 0);
  }

  if (videoToUpload.size > MAX_STANDARD_VIDEO_SIZE) {
    throw new Error("video-too-large");
  }

  setMemoryMessage(
    shouldTrimVideo
      ? t("msg.video.uploadingTrimmed")
      : t("msg.video.uploading"),
  );

  const uploaded = await uploadMemoryVideo(videoToUpload);
  media = uploaded.publicUrl;
  storagePath = uploaded.path;
      uploadedStoragePath = uploaded.path;
    } else if (!media && file instanceof File && file.size) {
      media = await prepareImageFile(file);
    }
  } catch (error) {
    setMemoryMessage(getUploadErrorMessage(error), true);
    return;
  }

  state.memories.unshift(createMemory({
    type,
    media,
    storagePath,
    draft: memoryDraft,
    text,
    calendarDate,
    videoClipSeconds: VIDEO_CLIP_SECONDS,
  }));

  if (!saveState()) {
    state.memories.shift();
    if (uploadedStoragePath) deleteSupabaseFile(uploadedStoragePath);
    setMemoryMessage(
      type === "video" ? t("msg.video.localFailed") : t("msg.image.tooLarge"),
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
  renderCalendar();
}

async function updateMemoryFileMessage(event) {
  const file = event.target.files?.[0];
  if (!file) {
    resetMemoryDraft();
    return;
  }

  const size = `${(file.size / 1024 / 1024).toFixed(1)} ${t("msg.fileSize.mb")}`;
  const type = isVideoFile(file) ? "video" : "image";
  const note = type === "image"
    ? t("msg.image.composing")
    : file.size > MAX_STANDARD_VIDEO_SIZE
      ? t("msg.video.trimmedInBrowser")
      : t("msg.video.sentOnSave");
  setMemoryMessage(`${file.name} (${size}). ${note}`);

  try {
    const media = type === "image" ? await prepareImageFile(file) : "";
    const videoDraft = type === "video" ? await prepareVideoDraft(file) : null;
    memoryDraft = {
      type,
      media,
      file: videoDraft?.file || null,
      previewUrl: videoDraft?.previewUrl || "",
      duration: videoDraft?.duration || 0,
      clipStart: videoDraft?.clipStart || 0,
      clipEnd: videoDraft?.clipEnd || 0,
      position: { x: 50, y: 50, zoom: 1 },
    };
    renderMemoryDraft();
    setMemoryMessage(
      type === "image"
        ? t("msg.image.ready")
        : file.size > MAX_STANDARD_VIDEO_SIZE
          ? t("msg.video.trimmedNote", { size: formatFileSize(file.size) })
          : isSupabaseConfigured()
          ? t("msg.video.ready")
          : t("msg.video.needConfig"),
    );
  } catch {
    resetMemoryDraft();
    setMemoryMessage(t("msg.file.unreadable"), true);
  }
}

function setMemoryMessage(text, isError = false) {
  elements.memoryMessage.textContent = text;
  elements.memoryMessage.classList.toggle("is-error", isError);
}

function renderMemoryDraft() {
  renderVideoTrim();

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
  if (memoryDraft?.previewUrl) URL.revokeObjectURL(memoryDraft.previewUrl);
  memoryDraft = null;
  elements.draftPicker.hidden = true;
  elements.draftPicker.classList.remove("is-composing", "is-dragging");
  elements.draftPreview.style.backgroundImage = "";
  elements.draftPreview.style.backgroundPosition = "";
  elements.draftPreview.style.backgroundSize = "";
  elements.videoTrim.hidden = true;
  elements.videoPreview.removeAttribute("src");
  elements.videoPreview.load();
  elements.videoStart.value = "0";
  elements.videoStart.max = "0";
  elements.videoRangeLabel.textContent = "0:00-0:10";
  setMemoryMessage("");
}

async function prepareVideoDraft(file) {
  const previewUrl = URL.createObjectURL(file);
  try {
    const duration = await readVideoDuration(previewUrl);
    const clipEnd = Math.min(VIDEO_CLIP_SECONDS, duration);
    return {
      file,
      previewUrl,
      duration,
      clipStart: 0,
      clipEnd,
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

function getVideoDuration(file) {
  const previewUrl = URL.createObjectURL(file);

  return readVideoDuration(previewUrl).finally(() => {
    URL.revokeObjectURL(previewUrl);
  });
}

function readVideoDuration(src) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      resolve(duration);
      video.removeAttribute("src");
      video.load();
    }, { once: true });
    video.addEventListener("error", reject, { once: true });
    video.src = src;
  });
}

function renderVideoTrim() {
  if (!memoryDraft || memoryDraft.type !== "video") {
    elements.videoTrim.hidden = true;
    return;
  }

  elements.videoTrim.hidden = false;
  if (elements.videoPreview.src !== memoryDraft.previewUrl) {
    elements.videoPreview.src = memoryDraft.previewUrl;
  }
  const maxStart = Math.max(0, memoryDraft.duration - VIDEO_CLIP_SECONDS);
  elements.videoStart.max = String(maxStart.toFixed(1));
  elements.videoStart.value = String(memoryDraft.clipStart || 0);
  updateVideoRangeLabel();
  previewVideoClipStart();
}

function updateVideoClipSelection() {
  if (!memoryDraft || memoryDraft.type !== "video") return;

  const maxStart = Math.max(0, memoryDraft.duration - VIDEO_CLIP_SECONDS);
  const clipStart = Math.min(maxStart, Math.max(0, Number(elements.videoStart.value) || 0));
  memoryDraft.clipStart = clipStart;
  memoryDraft.clipEnd = Math.min(memoryDraft.duration, clipStart + VIDEO_CLIP_SECONDS);
  updateVideoRangeLabel();
  previewVideoClipStart();
}

function updateVideoRangeLabel() {
  const start = memoryDraft?.clipStart || 0;
  const end = memoryDraft?.clipEnd || VIDEO_CLIP_SECONDS;
  elements.videoRangeLabel.textContent = `${formatDuration(start)}-${formatDuration(end)}`;
}

function previewVideoClipStart() {
  if (!memoryDraft || memoryDraft.type !== "video") return;
  const video = elements.videoPreview;
  if (Number.isFinite(video.duration)) video.currentTime = memoryDraft.clipStart || 0;
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

async function updateCalendarMonthPhotosBulk(event) {
  const files = [...(event.target.files || [])].slice(0, 12);
  if (!files.length) return;

  // Process sequentially so thumbnails update one by one as each image loads —
  // gives the user visual feedback on mobile without blocking the whole batch.
  for (let i = 0; i < files.length; i++) {
    const monthNum = String(i + 1).padStart(2, "0");
    state.monthPhotos[monthNum] = await prepareImageFile(files[i]);
    state.monthPhotoPositions[monthNum] = { x: 50, y: 50 };
    renderCalendarPhotoThumbs(); // update UI after each photo
  }

  saveState();
  event.target.value = "";
  renderCalendar();
}

function renderCalendarPhotoThumbs() {
  const count = ["01","02","03","04","05","06","07","08","09","10","11","12"]
    .filter((m) => state.monthPhotos[m]).length;
  const countEl = document.querySelector("[data-cal-photo-count]");
  if (countEl) countEl.textContent = count ? `${count}/12` : "";
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
  await updateMemoryImageView({
    event,
    findMemory,
    prepareImageFile,
    saveState,
    hideImagePickers,
    renderHome,
    renderMemories,
  });
}

async function saveSettings(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const image = form.get("memorialImage");
  const selectedTheme = String(form.get("theme") || state.theme || "classic");
  const nextMemorialDate = parseDateInput(String(form.get("memorialDate") || ""));

  state.theme = normalizeTheme(selectedTheme);
  state.horseName = String(form.get("horseName") || state.horseName).trim() || state.horseName;
  state.petType = String(form.get("petType") || state.petType);
  state.petTypeCustom = String(form.get("petTypeCustom") || "").trim();
  state.memorialName =
    String(form.get("memorialName") || state.memorialName).trim() || state.memorialName;
  state.memorialDate = nextMemorialDate || state.memorialDate;
  state.memorialText = buildMemorialText(state);

  if (image instanceof File && image.size) {
    const memorialImage = await prepareImageFile(image);
    state.memorialImage = memorialImage;
    state.memorialImagePosition = { x: 50, y: 50 };
    if (isCreatingMemorial) {
      state.heroImage = memorialImage;
      state.heroImagePosition = { x: 50, y: 50 };
    }
  }

  if (isCreatingMemorial && !appState.memorials.some((memorial) => memorial.id === state.id)) {
    appState.memorials.push(state);
    appState.activeMemorialId = state.id;
  }

  saveState();
  const targetScreen = isCreatingMemorial ? "home" : "memorial";
  isCreatingMemorial = false;
  renderAll();
  showScreen(targetScreen);
}

function isVideoFile(file) {
  return file.type.startsWith("video/") || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
}

function handleSettingsChange(event) {
  if (event.target.name === "theme") {
    state.theme = normalizeTheme(event.target.value);
    applyTheme();
    saveState();
    return;
  }
  if (event.target.name === "language") {
    const next = event.target.value === "fi" ? "fi" : "en";
    setLanguage(next);
    saveLanguage(next);
    // onLanguageChange listener in i18n.js already triggers applyTranslations + renderAll
  }
}

function renderAll() {
  if (!isCreatingMemorial) state = getActiveMemorial();
  applyTheme();
  renderMemorialSelector();
  renderHome();
  renderMemories();
  renderLetters();
  renderCalendar();
  renderMemorial();
  renderSettings();
}

function renderMemorialSelector() {
  if (!elements.memorialPlaceList) return;

  if (!appState.memorials.length) {
    if (elements.createMemorialButton) elements.createMemorialButton.textContent = t("selector.firstTime.action");
    elements.memorialPlaceList.innerHTML = `
      <article class="selector-empty card">
        <h2>${escapeHtml(t("selector.firstTime.title"))}</h2>
        <p>${escapeHtml(t("selector.firstTime.body"))}</p>
      </article>
    `;
    return;
  }

  if (elements.createMemorialButton) elements.createMemorialButton.textContent = t("selector.addPlace");
  elements.memorialPlaceList.innerHTML = appState.memorials
    .map((memorial) => {
      const image = memorial.heroImage || memorial.memorialImage || "";
      const isActive = memorial.id === appState.activeMemorialId;
      const possessive = toPossessive(memorial.horseName || t("memorialText.fallbackName"));
      const title = getLanguage() === "fi"
        ? `${possessive} ${t("selector.placeSuffix")}`
        : `${possessive} ${t("selector.placeSuffix")}`;
      const imageStyle = image ? ` style="background-image:url('${image}')"` : "";
      return `
        <button class="memorial-place-card${isActive ? " is-active" : ""}" type="button" data-select-memorial="${memorial.id}">
          <span class="memorial-place-image"${imageStyle}></span>
          <span class="memorial-place-copy">
            <strong>${escapeHtml(title)}</strong>
          </span>
          <span class="memorial-place-arrow" aria-hidden="true">›</span>
        </button>
      `;
    })
    .join("");
}

function renderHome() {
  const memory = getHomeMemoryOfDay();
  const today = new Date();
  const dailyElement = getDailyMemoryElement(today);
  const quote = getDailyQuote(today);
  elements.heroImage.style.backgroundImage = state.heroImage
    ? `linear-gradient(180deg, rgba(37,42,31,0.08) 24%, rgba(37,42,31,0.72) 100%), url('${state.heroImage}')`
    : "";
  applyImagePosition(elements.heroImage, state.heroImagePosition);
  const possessiveName = toPossessive(state.horseName);
  elements.heroMemoryLine.textContent = t("home.heroLine", { name: possessiveName });
  elements.memoryOfDay.dataset.openDailyMemory = memory?.id || "";
  elements.memoryOfDay.innerHTML = `
    <div class="memory-of-day-copy">
      <p class="eyebrow">${escapeHtml(t("home.memoryOfDay.eyebrow"))}</p>
      <h3>${escapeHtml(t("home.memoryOfDay.title", { name: possessiveName }))}</h3>
      <p>${escapeHtml(memory?.text || t("home.memoryOfDay.empty"))}</p>
      <span class="memory-of-day-link">${escapeHtml(t("home.memoryOfDay.openLink"))} <span aria-hidden="true">→</span></span>
    </div>
    <div class="daily-memory-element" aria-hidden="true">
      ${dailyElement}
      <span class="memory-of-day-chevron">›</span>
    </div>
  `;
  elements.dailyQuote.innerHTML = `
    <p class="eyebrow">${escapeHtml(t("home.dailyQuote.eyebrow"))}</p>
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


renderAll();
showScreen("selector");
updateMemorialSky();
memorialSkyTimer = window.setInterval(updateMemorialSky, 60 * 1000);

syncFromCloud(appState, (cloudState) => {
  appState = cloudState;
  state = getStoredActiveMemorial(appState);
  renderAll();
});

// Auth runs silently in the background — no UI change, no mandatory login.
// When a user is signed in, cloud saves/reads switch to their user-scoped path.
// TODO: Show a login/logout option in the settings screen when auth UI is ready.
onAuthChange((user) => {
  setAuthUser(user);
  if (user) {
    // User just signed in — pull their cloud data and re-render if it is newer.
    syncFromCloud(appState, (cloudState) => {
      appState = cloudState;
      state = getStoredActiveMemorial(appState);
      renderAll();
    });
  }
});

function renderMemories() {
  renderMemoriesView({
    elements,
    state,
    formatDate,
    applyMemoryImagePositions,
    videoClipSeconds: VIDEO_CLIP_SECONDS,
  });
}

function renderLetters() {
  if (!state.letters.length) {
    elements.letterList.innerHTML = `<p class="empty-state">${escapeHtml(t("letters.empty"))}</p>`;
    return;
  }

  const deleteLabel = escapeHtml(t("delete.item"));
  elements.letterList.innerHTML = state.letters
    .map(
      (letter) => `
        <article class="letter-card card" data-deletable-item="letter" data-item-id="${letter.id}">
          <button class="delete-action" type="button" data-delete-item="letter" data-item-id="${letter.id}" hidden>${deleteLabel}</button>
          <p class="date-line">${formatDate(letter.createdAt)}</p>
          <h3>${escapeHtml(letter.title)}</h3>
          <p>${escapeHtml(letter.body)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCalendar() {
  renderCalendarView({
    elements,
    state,
    visibleMonth,
    applyImagePosition,
    getMonthPosition,
  });
}

function renderMemorial() {
  const memorialDate = parseDate(state.memorialDate);
  elements.memorialTitle.textContent = state.memorialName;
  elements.memorialHeading.textContent = toAllative(state.horseName);
  elements.memorialDate.textContent = memorialDate
    ? `${memorialDate.getDate()}. ${monthNames[memorialDate.getMonth()]} — ${t("calendar.memorialRecurring").replace(/\.$/, "")}`
    : t("memorial.dateFallback");
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
  elements.settingsForm.horseName.value = isCreatingMemorial ? "" : state.horseName;
  elements.settingsForm.petType.value = isCreatingMemorial ? "" : state.petType || "horse";
  elements.settingsForm.petTypeCustom.value = state.petTypeCustom || "";
  elements.settingsForm.memorialName.value = isCreatingMemorial ? "" : state.memorialName;
  elements.settingsForm.memorialDate.value = state.memorialDate;
  updateMemorialDateDisplay();
  const themeInput = elements.settingsForm.querySelector(`input[name="theme"][value="${normalizeTheme(state.theme)}"]`);
  if (themeInput) themeInput.checked = true;
  if (elements.settingsCreateNote) elements.settingsCreateNote.hidden = !isCreatingMemorial;
  if (elements.settingsTitle) elements.settingsTitle.hidden = isCreatingMemorial;
  if (elements.memorialDanger) elements.memorialDanger.hidden = isCreatingMemorial;
  const saveButton = elements.settingsForm.querySelector('button[type="submit"]');
  if (saveButton) saveButton.textContent = t("settings.save");
  // Reflect the currently chosen language in the dropdown
  const languageSelect = elements.settingsForm.querySelector("[data-language-select]");
  if (languageSelect) languageSelect.value = getLanguage();
  // When creating a new memorial space, surface the language picker at the
  // very top of the form so an English-speaking user can switch before
  // reading anything else. In normal settings view it stays near the bottom.
  const languagePicker = elements.settingsForm.querySelector(".language-picker");
  if (languagePicker && saveButton) {
    if (isCreatingMemorial) {
      elements.settingsForm.insertBefore(languagePicker, elements.settingsForm.firstChild);
    } else if (languagePicker.nextElementSibling !== saveButton) {
      elements.settingsForm.insertBefore(languagePicker, saveButton);
    }
  }
  renderCalendarPhotoThumbs();
}

function getHomeMemoryOfDay() {
  return getMemoryOfDay(state.memories);
}

function applyTheme() {
  applyDocumentTheme(state.theme);
}

function normalizeTheme(theme) {
  return normalizeThemeId(theme);
}

function updateMemorialDateDisplay() {
  if (!elements.memorialDateDisplay) return;
  elements.memorialDateDisplay.textContent =
    formatDateInput(elements.memorialDateInput.value) || t("msg.dateChoose");
}

function previewPetMemorialText() {
  const form = elements.settingsForm;
  const previewState = {
    ...state,
    horseName: form.horseName.value.trim() || state.horseName,
    petType: form.petType.value,
    petTypeCustom: form.petTypeCustom.value.trim(),
  };
  state.memorialText = buildMemorialText(previewState);
  renderMemorial();
}

function buildMemorialText(source) {
  return buildPetMemorialText(source);
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
  positionImage(element, position);
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
  return normalizeImagePosition(position);
}

function clamp(value, min, max) {
  return clampNumber(value, min, max);
}

function getComposedBackgroundSize(element, zoom) {
  return composeBackgroundSize(element, zoom);
}

function getPointerDistance(first, second) {
  return measurePointerDistance(first, second);
}

function toAllative(name) {
  return toAllativeName(name);
}

function toGenitive(name) {
  return toGenitiveName(name);
}

function parseDate(value) {
  return parseCalendarDate(value);
}

function parseDateInput(value) {
  return parseCalendarDateInput(value);
}

function formatDateInput(value) {
  return formatCalendarDateInput(value);
}

function getMonthKey(date) {
  return getCalendarMonthKey(date);
}

function formatDate(value) {
  return formatCalendarDate(value);
}

function formatDuration(value) {
  const totalSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} Mt`;
}

function capitalize(value) {
  return capitalizeText(value);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

async function uploadMemoryVideo(file) {
  if (!isSupabaseConfigured()) {
    throw new Error("supabase-not-configured");
  }

  const supabase = await getSupabaseClient();
  const path = createStoragePath(file);
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "video/mp4",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

async function trimVideoFile(file, startTime) {
  try {
    setMemoryMessage("Leikataan video selaimessa...");
    return await withTimeout(trimVideoWithMediaRecorder(file, startTime), VIDEO_PROCESSING_TIMEOUT, "media-recorder-timeout");
  } catch (error) {
    console.warn("Browser video trim failed", error);
    throw error;
  }
}

async function trimVideoWithMediaRecorder(file, startTime) {
  if (!window.MediaRecorder) throw new Error("media-recorder-unavailable");

  const previewUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = previewUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.style.position = "fixed";
  video.style.left = "-9999px";
  video.style.width = "1px";
  video.style.height = "1px";
  document.body.append(video);
  let stream = null;

  try {
    await waitForVideoMetadata(video);
    video.currentTime = Math.min(Math.max(0, Number(startTime) || 0), Math.max(0, video.duration - 0.2));
    await waitForVideoSeek(video);

    const capture = video.captureStream || video.mozCaptureStream || video.webkitCaptureStream;
    if (!capture) throw new Error("capture-stream-unavailable");

    stream = capture.call(video);
    const mimeType = getSupportedRecordingMimeType();
    const chunks = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) chunks.push(event.data);
    });

    const stopped = new Promise((resolve, reject) => {
      recorder.addEventListener("stop", resolve, { once: true });
      recorder.addEventListener("error", () => reject(new Error("media-recorder-error")), { once: true });
    });

    recorder.start(250);
    await video.play();
    await delay(VIDEO_CLIP_SECONDS * 1000);
    recorder.stop();
    video.pause();
    await stopped;

    const type = recorder.mimeType || mimeType || "video/webm";
    const extension = type.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type });
    if (!blob.size) throw new Error("empty-recording");
    return new File([blob], createClipFileName(file, extension), { type });
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
    video.remove();
    URL.revokeObjectURL(previewUrl);
  }
}

async function trimVideoWithFfmpeg(file, startTime) {
  const ffmpeg = await getFfmpegClient();
  const inputName = `input.${getFileExtension(file) || "mp4"}`;
  const outputName = "clip.mp4";
  const safeStart = Math.max(0, Number(startTime) || 0);

  setMemoryMessage(t("msg.video.trimming"));
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  try {
    await ffmpeg.exec([
      "-ss",
      String(safeStart),
      "-i",
      inputName,
      "-t",
      String(VIDEO_CLIP_SECONDS),
      "-c",
      "copy",
      "-movflags",
      "faststart",
      outputName,
    ]);
  } catch {
    await removeFfmpegFile(ffmpeg, outputName);
    await ffmpeg.exec([
      "-ss",
      String(safeStart),
      "-i",
      inputName,
      "-t",
      String(VIDEO_CLIP_SECONDS),
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "mpeg4",
      "-q:v",
      "5",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "faststart",
      outputName,
    ]);
  }

  const data = await ffmpeg.readFile(outputName);
  await removeFfmpegFile(ffmpeg, inputName);
  await removeFfmpegFile(ffmpeg, outputName);

  return new File([data.buffer], createClipFileName(file, "mp4"), { type: "video/mp4" });
}

async function getFfmpegClient() {
  if (!ffmpegClientPromise) {
    ffmpegClientPromise = loadFfmpegClient();
  }
  return ffmpegClientPromise;
}

async function loadFfmpegClient() {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("https://esm.sh/@ffmpeg/ffmpeg@0.12.15"),
    import("https://esm.sh/@ffmpeg/util@0.12.2"),
  ]);
  const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}

async function removeFfmpegFile(ffmpeg, path) {
  try {
    await ffmpeg.deleteFile(path);
  } catch {
    // File may not exist if a previous FFmpeg command failed before writing output.
  }
}

function getSupportedRecordingMimeType() {
  const candidates = [
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function waitForVideoMetadata(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) return Promise.resolve();
  return waitForMediaEvent(video, "loadedmetadata", "Video metadata could not be read.");
}

function waitForVideoSeek(video) {
  if (video.readyState >= 2 && !video.seeking) return Promise.resolve();
  return waitForMediaEvent(video, "seeked", "Video seek failed.");
}

function waitForMediaEvent(target, eventName, message) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(eventName, handleSuccess);
      target.removeEventListener("error", handleError);
    };
    const handleSuccess = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error(message));
    };
    target.addEventListener(eventName, handleSuccess, { once: true });
    target.addEventListener("error", handleError, { once: true });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, timeoutMs, errorMessage) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function createClipFileName(file, extension = "mp4") {
  const base = file.name.replace(/\.[^.]+$/, "") || "muisto";
  const safeBase = base.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "muisto";
  return `${safeBase}-10s.${extension}`;
}

async function deleteSupabaseFile(path) {
  if (!isSupabaseConfigured() || !path) return;

  try {
    const supabase = await getSupabaseClient();
    await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
  } catch (error) {
    console.warn("Supabase file cleanup failed", error);
  }
}

function createStoragePath(file) {
  const extension = getFileExtension(file) || "mp4";
  return `memories/${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
}

function getFileExtension(file) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName !== file.name) return fromName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (file.type.includes("quicktime")) return "mov";
  if (file.type.includes("mp4")) return "mp4";
  if (file.type.includes("webm")) return "webm";
  return "";
}

function getUploadErrorMessage(error) {
  const limit = formatFileSize(MAX_STANDARD_VIDEO_SIZE);
  if (error?.message === "supabase-not-configured") return t("msg.supabase.notConfigured");
  if (error?.message === "video-too-large") return t("msg.video.tooLargeForBucket", { size: limit });
  if (error?.message === "missing-video-file") return t("msg.video.missing");
  if (error?.message === "media-recorder-timeout" || error?.message === "ffmpeg-timeout") {
    return t("msg.video.timeout");
  }
  if (error?.message === "media-recorder-unavailable" || error?.message === "capture-stream-unavailable") {
    return t("msg.video.unsupported");
  }
  if (String(error?.message || "").includes("ffmpeg") || String(error?.name || "").includes("FFmpeg")) {
    return t("msg.video.trimFailed");
  }
  if (String(error?.message || "").includes("Payload too large") || String(error?.message || "").includes("exceeded")) {
    return t("msg.video.exceedsBucket", { size: limit });
  }
  return t("msg.video.uploadFailed");
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

function saveState() {
  return saveStoredState(appState);
}

function createBlankMemorial(theme = "classic") {
  return createStoredBlankMemorial(theme);
}

function getActiveMemorial() {
  return getStoredActiveMemorial(appState);
}

function escapeHtml(value) {
  return escapeMarkup(value);
}
