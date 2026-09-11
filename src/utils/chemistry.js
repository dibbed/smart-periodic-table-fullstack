/**
 * Chemistry Constants, Scientific Calculations, and Formatting Utilities
 */

export const CATEGORIES = {
  'alkali-metal': {
    nameFa: 'فلزات قلیایی',
    nameEn: 'Alkali Metal',
    bg: 'bg-rose-500/15 hover:bg-rose-500/30 border-rose-500/50 text-rose-300',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    hex: '#f43f5e',
    block: 's',
  },
  'alkaline-earth': {
    nameFa: 'فلزات قلیایی خاکی',
    nameEn: 'Alkaline Earth Metal',
    bg: 'bg-orange-500/15 hover:bg-orange-500/30 border-orange-500/50 text-orange-300',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    hex: '#f97316',
    block: 's',
  },
  'transition-metal': {
    nameFa: 'فلزات واسطه',
    nameEn: 'Transition Metal',
    bg: 'bg-amber-500/15 hover:bg-amber-500/30 border-amber-500/50 text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    hex: '#eab308',
    block: 'd',
  },
  'post-transition-metal': {
    nameFa: 'فلزات پس‌واسطه',
    nameEn: 'Post-Transition Metal',
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    hex: '#10b981',
    block: 'p',
  },
  'metalloid': {
    nameFa: 'شبه‌فلزات',
    nameEn: 'Metalloid',
    bg: 'bg-teal-500/15 hover:bg-teal-500/30 border-teal-500/50 text-teal-300',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    hex: '#14b8a6',
    block: 'p',
  },
  'reactive-nonmetal': {
    nameFa: 'نافلزهای واکنش‌پذیر',
    nameEn: 'Reactive Nonmetal',
    bg: 'bg-blue-500/15 hover:bg-blue-500/30 border-blue-500/50 text-blue-300',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    hex: '#3b82f6',
    block: 'p',
  },
  'halogen': {
    nameFa: 'هالوژن‌ها',
    nameEn: 'Halogen',
    bg: 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-300',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    hex: '#06b6d4',
    block: 'p',
  },
  'noble-gas': {
    nameFa: 'گازهای نجیب',
    nameEn: 'Noble Gas',
    bg: 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/50 text-purple-300',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    hex: '#a855f7',
    block: 'p',
  },
  'lanthanide': {
    nameFa: 'لانتانیدها',
    nameEn: 'Lanthanide',
    bg: 'bg-fuchsia-500/15 hover:bg-fuchsia-500/30 border-fuchsia-500/50 text-fuchsia-300',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    hex: '#d946ef',
    block: 'f',
  },
  'actinide': {
    nameFa: 'اکتینیدها',
    nameEn: 'Actinide',
    bg: 'bg-pink-500/15 hover:bg-pink-500/30 border-pink-500/50 text-pink-300',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    hex: '#ec4899',
    block: 'f',
  },
};

/**
 * Calculates phase of an element at a specified Kelvin temperature.
 * Strictly maintains scientific fidelity:
 * - If meltingPoint and boilingPoint are known: returns 'جامد', 'مایع', or 'گاز'.
 * - If at near room temperature (298K +- 5K) and standardState exists:
 *   returns verified state or 'پیش‌بینی: ...' when labeled expected/predicted.
 * - Otherwise returns 'نامشخص' without inventing fake values.
 *
 * @param {object} el
 * @param {number} tempK
 * @returns {string}
 */
export const getPhaseAtTemp = (el, tempK) => {
  if (!el) return 'نامشخص';
  const melt = Number.isFinite(el.meltingPoint) ? el.meltingPoint : null;
  const boil = Number.isFinite(el.boilingPoint) ? el.boilingPoint : null;

  if (melt !== null && boil !== null) {
    if (tempK < melt) return 'جامد';
    if (tempK < boil) return 'مایع';
    return 'گاز';
  }

  // If melting point is known and temperature is strictly below it:
  if (melt !== null && tempK < melt) {
    return 'جامد';
  }

  // If boiling point is known and temperature is at or above it:
  if (boil !== null && tempK >= boil) {
    return 'گاز';
  }

  if (Math.abs(tempK - 298) <= 5 && el.standardState) {
    const state = String(el.standardState).toLowerCase();
    const predicted = state.includes('expected') || state.includes('predicted');
    if (state.includes('solid')) return predicted ? 'پیش‌بینی: جامد' : 'جامد';
    if (state.includes('liquid')) return predicted ? 'پیش‌بینی: مایع' : 'مایع';
    if (state.includes('gas')) return predicted ? 'پیش‌بینی: گاز' : 'گاز';
  }

  return 'نامشخص';
};

/**
 * Formats a value with a suffix, returning 'نامشخص' for null/undefined/empty values
 * @param {any} value
 * @param {string} suffix
 * @returns {string}
 */
export const fmt = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') {
    return 'نامشخص';
  }
  return `${value}${suffix}`;
};

export default {
  CATEGORIES,
  getPhaseAtTemp,
  fmt,
};

