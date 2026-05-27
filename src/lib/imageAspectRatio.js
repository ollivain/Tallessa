// Shared aspect-ratio resolver for every image card in the app.
//
// Metadata schema (the same object PositionedImage consumes):
//   aspectRatio   : 'fill' | 'original' | number
//   naturalAspect : number — w/h of the image file (from Image.getSize)
//   width, height : numbers — raw pixel dims (optional, derived if missing)
//   fitMode       : 'cover' | 'contain'
//   x, y, zoom    : positioning inside the frame
//
// The card render path calls `resolveCardAspectRatio(position, fallback)`.
// When the user has picked a specific aspect ratio, the card adopts that
// shape; when they kept "Fill card" or have no metadata at all, the card
// reverts to the PWA-equivalent fixed height passed as `fallback`.
//
// Clamp limits keep extremely tall / extremely wide images from blowing up
// the layout. Anything outside the safe band is rendered at the closest
// in-range aspect with cover-fit so the image stays visible but the card
// keeps a sane shape on phone-sized screens.
export const MIN_CARD_ASPECT = 0.5;   // 1:2 portrait (e.g. 9:18) cap
export const MAX_CARD_ASPECT = 2.5;   // 5:2 landscape (e.g. 21:9) cap

export function clampAspect(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value < MIN_CARD_ASPECT) return MIN_CARD_ASPECT;
  if (value > MAX_CARD_ASPECT) return MAX_CARD_ASPECT;
  return value;
}

// Returns one of:
//   - null               → caller should use its own fallback height (PWA mode)
//   - number (clamped)   → caller should apply this as `aspectRatio` style
//
// The card's render style stays in charge of the *fallback* — when this
// returns null, the card keeps its existing fixed height (PWA parity).
export function resolveCardAspectRatio(position /*, fallback */) {
  if (!position) return null;

  const aspect = position.aspectRatio;

  // 'fill' explicitly means "use the card's PWA-equivalent fixed height"
  if (aspect === 'fill') return null;

  // 'original' → derive from the image's intrinsic dimensions
  if (aspect === 'original') {
    const derived =
      Number(position.naturalAspect) > 0 ? Number(position.naturalAspect) :
      Number(position.originalAspectRatio) > 0 ? Number(position.originalAspectRatio) :
      (Number(position.width) > 0 && Number(position.height) > 0)
        ? Number(position.width) / Number(position.height)
        : null;
    return clampAspect(derived);
  }

  // Numeric aspect (1, 0.8, 1.333, 1.7777, …)
  if (typeof aspect === 'number') return clampAspect(aspect);
  if (typeof aspect === 'string') {
    const parsed = Number(aspect);
    if (Number.isFinite(parsed)) return clampAspect(parsed);
  }

  // No metadata or unknown shape → caller uses its fallback height
  return null;
}

// Helper for the picker preview: it wants the actual user-selected aspect
// even when that is 'fill' (so the preview can also collapse to a default
// shape). Returns the same as `resolveCardAspectRatio` plus a number for
// 'fill' when caller supplies one.
export function resolvePreviewAspectRatio(position, fillFallback) {
  const resolved = resolveCardAspectRatio(position);
  if (resolved != null) return resolved;
  // 'fill' or missing — use the caller-supplied fallback (e.g. 360/280)
  return clampAspect(fillFallback) ?? null;
}
