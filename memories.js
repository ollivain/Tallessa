import { escapeHtml } from "./ui.js?v=20260523-i18nv9";
import { t } from "./i18n.js?v=20260523-i18nv9";

export function createMemory({
  type,
  media,
  storagePath,
  draft,
  text,
  calendarDate,
  videoClipSeconds,
}) {
  return {
    id: crypto.randomUUID(),
    type,
    media,
    storagePath,
    clipStart: draft?.clipStart || 0,
    clipEnd: draft?.clipEnd || (type === "video" ? videoClipSeconds : 0),
    imagePosition: draft?.position || { x: 50, y: 50, zoom: 1 },
    text: text || t("wall.memoryNoWords"),
    calendarDate,
    createdAt: new Date().toISOString(),
  };
}

export function getHomeMemoryOfDay(memories) {
  return memories.find((memory) => memory.isFirstMemorialMemory) || memories[0];
}

export function renderMemoriesView({
  elements,
  state,
  formatDate,
  applyMemoryImagePositions,
  videoClipSeconds,
}) {
  if (!state.memories.length) {
    elements.memoryList.innerHTML = `<p class="empty-state">${escapeHtml(t("wall.empty"))}</p>`;
    return;
  }

  elements.memoryList.innerHTML = state.memories.map((memory) => renderMemoryCard(memory, formatDate)).join("");
  applyMemoryImagePositions();
  setupMemoryVideoClips(elements.memoryList, videoClipSeconds);
}

export async function updateMemoryImage({
  event,
  findMemory,
  prepareImageFile,
  saveState,
  hideImagePickers,
  renderHome,
  renderMemories,
}) {
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

function renderMemoryCard(memory, formatDate) {
  const clipStart = Number(memory.clipStart) || 0;
  const clipEnd = Number(memory.clipEnd) || 0;
  const media = memory.media
    ? memory.type === "video"
      ? `<video src="${memory.media}" controls playsinline preload="metadata" data-video-clip-start="${clipStart}" data-video-clip-end="${clipEnd}"></video>`
      : `
          <div class="memory-media-frame" data-image-picker>
            <div class="media-preview" data-memory-image-id="${memory.id}" style="background-image:url('${memory.media}')"></div>
            <label class="image-change memory-change" data-image-change hidden>
              ${escapeHtml(t("wall.changeImage"))}
              <input data-memory-photo="${memory.id}" type="file" accept="image/*" />
            </label>
            <span class="image-compose-hint memory-hint" data-image-hint hidden>${escapeHtml(t("wall.form.dragHint"))}</span>
          </div>
        `
    : `
        <div class="memory-media-frame" data-image-picker>
          <div class="media-preview" data-memory-image-id="${memory.id}"></div>
          <label class="image-change memory-change" data-image-change hidden>
            ${escapeHtml(t("wall.changeImage"))}
            <input data-memory-photo="${memory.id}" type="file" accept="image/*" />
          </label>
        </div>
      `;

  return `
    <article class="memory-card card" data-deletable-item="memory" data-item-id="${memory.id}">
      <button class="delete-action" type="button" data-delete-item="memory" data-item-id="${memory.id}" hidden>${escapeHtml(t("delete.item"))}</button>
      ${media}
      <div class="memory-body">
        <p class="date-line">${formatDate(memory.calendarDate || memory.createdAt)}</p>
        <p>${escapeHtml(memory.text)}</p>
      </div>
    </article>
  `;
}

function setupMemoryVideoClips(memoryList, videoClipSeconds) {
  memoryList.querySelectorAll("video[data-video-clip-start]").forEach((video) => {
    const start = Number(video.dataset.videoClipStart) || 0;
    const end = Number(video.dataset.videoClipEnd) || start + videoClipSeconds;

    video.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(video.duration) && start < video.duration) {
        video.currentTime = start;
      }
    });

    video.addEventListener("play", () => {
      if (Number.isFinite(video.currentTime) && (video.currentTime < start || video.currentTime >= end)) {
        video.currentTime = start;
      }
    });

    video.addEventListener("timeupdate", () => {
      if (end > start && video.currentTime >= end) {
        video.pause();
        video.currentTime = start;
      }
    });
  });
}
