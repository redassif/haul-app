// src/lib/fit.js
// Deterministic fit projection from creator body+style tags to user body.
// No computer vision — purely structured inputs from onboarding/upload.
//
// This module is shared by the Vercel serverless chat endpoint and the
// client. Keep it pure (no Supabase, no fetch, no side effects) so it's
// cheap to test and safe to run anywhere.

// -----------------------------
// Canonical vocabularies
// -----------------------------

// Length categories for tops/dresses/outerwear, ordered short → long.
export const LENGTH_CATEGORIES = [
  'crop',       // above navel
  'waist',      // at natural waist
  'hip',        // at hip
  'mid_thigh',  // mid thigh
  'knee',       // at knee
  'midi',       // mid-calf
  'maxi',       // ankle+
];

// Roughly one length-category shift per ~10cm of height difference.
// Deliberately conservative — being surprised by "it's shorter than I
// thought" is tolerable; predicting midi and having it hit knee breaks
// trust. Tune from return-rate data once we have it.
const CM_PER_LENGTH_STEP = 10;

// Fit style, ordered fitted → loose.
export const FIT_STYLES = ['slim', 'regular', 'relaxed', 'oversized'];

// Size ladder. Brand sizing varies; assume "usual size" is self-reported
// and normalized to this ladder via the onboarding UI.
export const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Build categories. Affects how loose fits read on different bodies.
export const BUILDS = ['slim', 'mid', 'curvy'];

// Categories where length projection does NOT apply.
const LENGTH_EXCLUDED_CATEGORIES = new Set(['shoes', 'accessory', 'bottom']);

// Categories where fit_style projection does NOT apply (shoes don't
// have a meaningful slim/relaxed/oversized read on the wearer's build).
const FIT_STYLE_EXCLUDED_CATEGORIES = new Set(['shoes', 'accessory']);

// -----------------------------
// Primitives
// -----------------------------

const indexIn = (list, value) => {
  const i = list.indexOf(value);
  return i >= 0 ? i : null;
};

const clamp = (i, min, max) => Math.max(min, Math.min(max, i));

// -----------------------------
// Projections
// -----------------------------

/**
 * Project a garment's length from creator height onto user height.
 * Garments don't scale with the wearer — a 70cm blazer is 70cm on anyone —
 * so a shorter user sees a longer hem relative to their body.
 *
 * @returns {{on_creator, on_user, shift_steps, height_diff_cm}|null}
 */
export function projectLength(creatorHeightCm, userHeightCm, creatorLength) {
  const i = indexIn(LENGTH_CATEGORIES, creatorLength);
  if (i === null || !creatorHeightCm || !userHeightCm) return null;

  const heightDiff = creatorHeightCm - userHeightCm; // +ve = user is shorter
  const shift = Math.round(heightDiff / CM_PER_LENGTH_STEP);
  const newIdx = clamp(i + shift, 0, LENGTH_CATEGORIES.length - 1);

  return {
    on_creator: creatorLength,
    on_user: LENGTH_CATEGORIES[newIdx],
    shift_steps: shift,
    height_diff_cm: heightDiff,
  };
}

/**
 * Project how a "fit style" will read on the user's build vs the creator's.
 * A relaxed cut on a slim creator can read fitted on a curvier user, etc.
 *
 * @returns {{on_creator, on_user, build_diff, adjusted}|null}
 */
export function projectFitStyle(creatorBuild, userBuild, fitStyle) {
  const cb = indexIn(BUILDS, creatorBuild);
  const ub = indexIn(BUILDS, userBuild);
  const si = indexIn(FIT_STYLES, fitStyle);
  if (cb === null || ub === null || si === null) return null;

  const buildDiff = ub - cb; // +ve = user is curvier → style reads tighter
  const adjustedIdx = clamp(si - buildDiff, 0, FIT_STYLES.length - 1);

  return {
    on_creator: fitStyle,
    on_user: FIT_STYLES[adjustedIdx],
    build_diff: buildDiff,
    adjusted: adjustedIdx !== si,
  };
}

/**
 * Compare "usual size" between creator and user. Surfaces direction,
 * not an absolute recommendation (brand sizing still varies).
 *
 * @returns {{delta, creator, user}|null}  delta > 0 means user sizes up vs creator
 */
export function sizeDelta(creatorSize, userSize) {
  const c = indexIn(SIZES, creatorSize);
  const u = indexIn(SIZES, userSize);
  if (c === null || u === null) return null;
  return { delta: u - c, creator: creatorSize, user: userSize };
}

// -----------------------------
// Main analyzer
// -----------------------------

/**
 * Produce a structured fit analysis for one item + user + creator.
 * The output is what you feed into the chat system prompt and what
 * drives fit-note UI on item cards.
 *
 * Every dimension degrades gracefully — missing data yields nulls, not
 * errors. The caller decides how much to surface.
 *
 * @param {Object}  args
 * @param {Object}  args.creator  { height_cm, build, usual_size, name? }
 * @param {Object}  args.user     { height_cm, build, usual_size, bust_cm?, waist_cm?, hip_cm? }
 * @param {Object}  args.item     { category, fit_style, length_on_creator }
 * @returns {{ length, fit_style, size, flags }}
 */
export function analyzeFit({ creator = {}, user = {}, item = {} } = {}) {
  const out = {
    length: null,
    fit_style: null,
    size: null,
    flags: [], // high-severity mismatches worth surfacing in UI
  };

  // Length projection — skip for categories where it doesn't apply.
  const lengthApplies =
    item.length_on_creator && !LENGTH_EXCLUDED_CATEGORIES.has(item.category);

  if (lengthApplies) {
    out.length = projectLength(
      creator.height_cm,
      user.height_cm,
      item.length_on_creator
    );
    if (out.length && Math.abs(out.length.shift_steps) >= 2) {
      out.flags.push({
        kind: 'length_mismatch',
        message: `Length shifts ${Math.abs(out.length.shift_steps)} categories ${
          out.length.shift_steps > 0 ? 'longer' : 'shorter'
        } on you.`,
      });
    }
  }

  // Fit style × build projection. Skips for shoes/accessories.
  const fitStyleApplies =
    item.fit_style && creator.build && user.build &&
    !FIT_STYLE_EXCLUDED_CATEGORIES.has(item.category);

  if (fitStyleApplies) {
    out.fit_style = projectFitStyle(creator.build, user.build, item.fit_style);
    if (out.fit_style && Math.abs(out.fit_style.build_diff) >= 2) {
      out.flags.push({
        kind: 'build_mismatch',
        message: `Cut was styled on a very different build — will read quite differently.`,
      });
    }
  }

  // Size differential.
  if (creator.usual_size && user.usual_size) {
    out.size = sizeDelta(creator.usual_size, user.usual_size);
  }

  return out;
}
