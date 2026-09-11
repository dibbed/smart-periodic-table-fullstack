// ==========================================================================
// Smart Periodic Table - Constants & Utilities
// Audio synthesizer, categories mapping, phase calculations, formatters
// ==========================================================================

// --- ENHANCED SOUND EFFECTS SYNTHESIZER ---
const playSound = (type, enabled = true) => {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {}
};

const CATEGORIES = {
  'alkali-metal': { nameFa: 'فلزات قلیایی', nameEn: 'Alkali Metal', bg: 'bg-rose-500/15 hover:bg-rose-500/30 border-rose-500/50 text-rose-300', hex: '#f43f5e', block: 's' },
  'alkaline-earth': { nameFa: 'فلزات قلیایی خاکی', nameEn: 'Alkaline Earth Metal', bg: 'bg-orange-500/15 hover:bg-orange-500/30 border-orange-500/50 text-orange-300', hex: '#f97316', block: 's' },
  'transition-metal': { nameFa: 'فلزات واسطه', nameEn: 'Transition Metal', bg: 'bg-amber-500/15 hover:bg-amber-500/30 border-amber-500/50 text-amber-300', hex: '#eab308', block: 'd' },
  'post-transition-metal': { nameFa: 'فلزات پس‌واسطه', nameEn: 'Post-Transition Metal', bg: 'bg-emerald-500/15 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300', hex: '#10b981', block: 'p' },
  'metalloid': { nameFa: 'شبه‌فلزات', nameEn: 'Metalloid', bg: 'bg-teal-500/15 hover:bg-teal-500/30 border-teal-500/50 text-teal-300', hex: '#14b8a6', block: 'p' },
  'reactive-nonmetal': { nameFa: 'نافلزهای واکنش‌پذیر', nameEn: 'Reactive Nonmetal', bg: 'bg-blue-500/15 hover:bg-blue-500/30 border-blue-500/50 text-blue-300', hex: '#3b82f6', block: 'p' },
  'halogen': { nameFa: 'هالوژن‌ها', nameEn: 'Halogen', bg: 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-300', hex: '#06b6d4', block: 'p' },
  'noble-gas': { nameFa: 'گازهای نجیب', nameEn: 'Noble Gas', bg: 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/50 text-purple-300', hex: '#a855f7', block: 'p' },
  'lanthanide': { nameFa: 'لانتانیدها', nameEn: 'Lanthanide', bg: 'bg-fuchsia-500/15 hover:bg-fuchsia-500/30 border-fuchsia-500/50 text-fuchsia-300', hex: '#d946ef', block: 'f' },
  'actinide': { nameFa: 'اکتینیدها', nameEn: 'Actinide', bg: 'bg-pink-500/15 hover:bg-pink-500/30 border-pink-500/50 text-pink-300', hex: '#ec4899', block: 'f' },
};

// Calculate phase only when enough scientific data exists. Missing values are never invented.
const getPhaseAtTemp = (el, tempK) => {
  const melt = Number.isFinite(el.meltingPoint) ? el.meltingPoint : null;
  const boil = Number.isFinite(el.boilingPoint) ? el.boilingPoint : null;
  if (melt !== null && boil !== null) {
    if (tempK < melt) return 'جامد';
    if (tempK < boil) return 'مایع';
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

const fmt = (value, suffix = '') =>
  value === null || value === undefined || value === '' ? 'نامشخص' : `${value}${suffix}`;

// Global attachment for modular interoperability
window.SPT = window.SPT || {};
window.SPT.playSound = playSound;
window.SPT.CATEGORIES = CATEGORIES;
window.SPT.getPhaseAtTemp = getPhaseAtTemp;
window.SPT.fmt = fmt;

window.playSound = playSound;
window.CATEGORIES = CATEGORIES;
window.getPhaseAtTemp = getPhaseAtTemp;
window.fmt = fmt;
