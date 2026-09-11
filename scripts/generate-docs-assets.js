const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const atom3dSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0c1836"/>
      <stop offset="60%" stop-color="#050814"/>
      <stop offset="100%" stop-color="#03050c"/>
    </radialGradient>
    <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#e11d48" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#050814" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="protonGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fda4af"/>
      <stop offset="40%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
    <radialGradient id="neutronGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#78350f"/>
    </radialGradient>
    <radialGradient id="electronGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="40%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </radialGradient>
    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="900" height="480" rx="12" fill="url(#bgGlow)"/>
  <rect width="898" height="478" x="1" y="1" rx="11" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <rect x="24" y="20" width="852" height="44" rx="8" fill="#0b1329" stroke="#1e293b" stroke-width="1"/>
  <circle cx="44" cy="42" r="5" fill="#ef4444"/>
  <circle cx="60" cy="42" r="5" fill="#f59e0b"/>
  <circle cx="76" cy="42" r="5" fill="#10b981"/>
  <text x="100" y="46" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">3D WebGL Atom Simulation Engine &bull; Iron (26-Fe)</text>
  <rect x="680" y="28" width="180" height="28" rx="6" fill="#0f172a" stroke="#0284c7" stroke-width="1"/>
  <text x="695" y="46" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">60 FPS &bull; ZERO-LEAK GC</text>

  <g transform="translate(450, 260)" stroke="#1e293b" stroke-dasharray="3,3" fill="none">
    <circle r="210"/>
    <circle r="160"/>
    <circle r="110"/>
    <circle r="60"/>
  </g>

  <g transform="translate(450, 260) rotate(-22)">
    <ellipse rx="210" ry="85" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.35"/>
    <circle cx="195" cy="-32" r="6" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-195" cy="32" r="6" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
  </g>

  <g transform="translate(450, 260) rotate(35)">
    <ellipse rx="160" ry="65" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.45"/>
    <circle cx="150" cy="-22" r="5.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-135" cy="34" r="5.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="0" cy="65" r="5.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-60" cy="-60" r="5.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
  </g>

  <g transform="translate(450, 260) rotate(-60)">
    <ellipse rx="110" ry="46" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.55"/>
    <circle cx="104" cy="-15" r="5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-104" cy="15" r="5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="45" cy="42" r="5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-45" cy="-42" r="5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
  </g>

  <g transform="translate(450, 260) rotate(15)">
    <ellipse rx="60" ry="25" fill="none" stroke="#00f0ff" stroke-width="2" stroke-opacity="0.75"/>
    <circle cx="58" cy="7" r="4.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
    <circle cx="-58" cy="-7" r="4.5" fill="url(#electronGrad)" filter="url(#glowFilter)"/>
  </g>

  <circle cx="450" cy="260" r="45" fill="url(#nucleusGlow)"/>

  <g transform="translate(450, 260)">
    <circle cx="-14" cy="-12" r="9" fill="url(#neutronGrad)"/>
    <circle cx="12" cy="-14" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="-16" cy="10" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="14" cy="12" r="9" fill="url(#neutronGrad)"/>
    <circle cx="0" cy="-18" r="9" fill="url(#neutronGrad)"/>
    <circle cx="-18" cy="-2" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="18" cy="-2" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="0" cy="18" r="9" fill="url(#neutronGrad)"/>
    <circle cx="-7" cy="-7" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="8" cy="-6" r="9" fill="url(#neutronGrad)"/>
    <circle cx="-6" cy="8" r="9" fill="url(#neutronGrad)"/>
    <circle cx="7" cy="7" r="9.5" fill="url(#protonGrad)"/>
    <circle cx="1" cy="0" r="10" fill="url(#protonGrad)" filter="url(#glowFilter)"/>
  </g>

  <g transform="translate(40, 85)">
    <rect width="180" height="150" rx="8" fill="#080e21" fill-opacity="0.85" stroke="#1e293b" stroke-width="1"/>
    <text x="16" y="26" fill="#f43f5e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">NUCLEUS (Z = 26)</text>
    <text x="16" y="52" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Protons (p⁺): <tspan fill="#f43f5e" font-weight="700">26</tspan></text>
    <text x="16" y="74" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Neutrons (n⁰): <tspan fill="#f59e0b" font-weight="700">30</tspan></text>
    <text x="16" y="96" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Mass (A): <tspan fill="#38bdf8" font-weight="700">55.845 u</tspan></text>
    <line x1="16" y1="108" x2="164" y2="108" stroke="#1e293b" stroke-width="1"/>
    <text x="16" y="128" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Isotope: ⁵⁶Fe (91.75%)</text>
  </g>

  <g transform="translate(680, 85)">
    <rect width="180" height="185" rx="8" fill="#080e21" fill-opacity="0.85" stroke="#1e293b" stroke-width="1"/>
    <text x="16" y="26" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="1">QUANTUM SHELLS</text>
    <text x="16" y="50" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">K (n=1): <tspan fill="#00f0ff" font-weight="700">2 e⁻</tspan></text>
    <text x="16" y="72" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">L (n=2): <tspan fill="#00f0ff" font-weight="700">8 e⁻</tspan></text>
    <text x="16" y="94" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">M (n=3): <tspan fill="#00f0ff" font-weight="700">14 e⁻</tspan></text>
    <text x="16" y="116" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">N (n=4): <tspan fill="#00f0ff" font-weight="700">2 e⁻</tspan></text>
    <line x1="16" y1="130" x2="164" y2="130" stroke="#1e293b" stroke-width="1"/>
    <text x="16" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Total Electrons: 26</text>
    <text x="16" y="168" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Ground Config: [Ar] 3d⁶ 4s²</text>
  </g>

  <g transform="translate(275, 415)">
    <rect width="350" height="45" rx="8" fill="#080e21" fill-opacity="0.9" stroke="#1e293b" stroke-width="1"/>
    <circle cx="35" cy="22.5" r="14" fill="#1e293b"/>
    <polygon points="32,16 41,22.5 32,29" fill="#00f0ff"/>
    <text x="60" y="27" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">Speed: 1.0x</text>
    <text x="160" y="27" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Drag to Orbit &bull; Scroll to Zoom</text>
  </g>
</svg>`;

const tempSliderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGlow2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050a18"/>
      <stop offset="100%" stop-color="#020409"/>
    </linearGradient>
    <linearGradient id="sliderTrack" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="20%" stop-color="#06b6d4"/>
      <stop offset="45%" stop-color="#10b981"/>
      <stop offset="65%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>

  <rect width="900" height="480" rx="12" fill="url(#bgGlow2)"/>
  <rect width="898" height="478" x="1" y="1" rx="11" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <rect x="24" y="20" width="852" height="44" rx="8" fill="#0b1329" stroke="#1e293b" stroke-width="1"/>
  <circle cx="44" cy="42" r="5" fill="#ef4444"/>
  <circle cx="60" cy="42" r="5" fill="#f59e0b"/>
  <circle cx="76" cy="42" r="5" fill="#10b981"/>
  <text x="100" y="46" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Thermodynamic Kelvin Phase Transition Engine &bull; Spectrum Simulation</text>
  <rect x="680" y="28" width="180" height="28" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
  <text x="698" y="46" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">T = 298.15 K (25.0°C)</text>

  <g transform="translate(60, 95)">
    <rect width="780" height="110" rx="10" fill="#080e21" stroke="#1e293b" stroke-width="1"/>
    <text x="24" y="36" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">SIMULATED TEMPERATURE</text>
    <text x="640" y="36" fill="#00f0ff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700">298 K / 25°C</text>

    <rect x="24" y="58" width="732" height="14" rx="7" fill="url(#sliderTrack)"/>
    <circle cx="95" cy="65" r="14" fill="#ffffff" stroke="#0284c7" stroke-width="4"/>

    <text x="24" y="95" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">0 K (Abs. Zero)</text>
    <text x="95" y="95" fill="#00f0ff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">298 K (SATP)</text>
    <text x="360" y="95" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">1811 K (Fe Tm)</text>
    <text x="540" y="95" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">3134 K (Fe Tb)</text>
    <text x="715" y="95" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">6000 K (Sun surf.)</text>
  </g>

  <g transform="translate(60, 230)">
    <g transform="translate(0, 0)">
      <rect width="180" height="210" rx="8" fill="#080e21" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="0" y="0" width="180" height="34" rx="8" fill="#0284c7" fill-opacity="0.15"/>
      <text x="16" y="23" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">SOLID (جامد)</text>
      <text x="16" y="58" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Elements Count: <tspan fill="#38bdf8" font-weight="700">93</tspan></text>
      <text x="16" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Condition: T &lt; T_melt</text>
      <rect x="16" y="100" width="148" height="90" rx="6" fill="#0b1329"/>
      <text x="26" y="125" fill="#60a5fa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Fe &bull; Au &bull; C &bull; Ti &bull; Cu</text>
      <text x="26" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Iron Tm = 1811 K</text>
      <text x="26" y="170" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Rigid lattice bonds</text>
    </g>

    <g transform="translate(200, 0)">
      <rect width="180" height="210" rx="8" fill="#080e21" stroke="#10b981" stroke-width="1.5"/>
      <rect x="0" y="0" width="180" height="34" rx="8" fill="#10b981" fill-opacity="0.15"/>
      <text x="16" y="23" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">LIQUID (مایع)</text>
      <text x="16" y="58" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Elements Count: <tspan fill="#34d399" font-weight="700">2</tspan></text>
      <text x="16" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Condition: Tm ≤ T &lt; Tb</text>
      <rect x="16" y="100" width="148" height="90" rx="6" fill="#0b1329"/>
      <text x="26" y="125" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Hg (Mercury) &bull; Br (Bromine)</text>
      <text x="26" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Hg Tm: 234.3 K</text>
      <text x="26" y="170" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Br Tm: 265.8 K</text>
    </g>

    <g transform="translate(400, 0)">
      <rect width="180" height="210" rx="8" fill="#080e21" stroke="#f59e0b" stroke-width="1.5"/>
      <rect x="0" y="0" width="180" height="34" rx="8" fill="#f59e0b" fill-opacity="0.15"/>
      <text x="16" y="23" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">GAS (گاز)</text>
      <text x="16" y="58" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Elements Count: <tspan fill="#fbbf24" font-weight="700">11</tspan></text>
      <text x="16" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Condition: T ≥ T_boil</text>
      <rect x="16" y="100" width="148" height="90" rx="6" fill="#0b1329"/>
      <text x="26" y="125" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">H, He, N, O, F, Ne, Ar...</text>
      <text x="26" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Oxygen Tb: 90.2 K</text>
      <text x="26" y="170" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Unbound kinetic freedom</text>
    </g>

    <g transform="translate(600, 0)">
      <rect width="180" height="210" rx="8" fill="#080e21" stroke="#a855f7" stroke-width="1.5"/>
      <rect x="0" y="0" width="180" height="34" rx="8" fill="#a855f7" fill-opacity="0.15"/>
      <text x="16" y="23" fill="#c084fc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">PREDICTED (پیش‌بینی)</text>
      <text x="16" y="58" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Superheavies: <tspan fill="#c084fc" font-weight="700">12</tspan></text>
      <text x="16" y="80" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">SATP / Relativistic calc</text>
      <rect x="16" y="100" width="148" height="90" rx="6" fill="#0b1329"/>
      <text x="26" y="125" fill="#c084fc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">Og (118) &bull; Ts (117) &bull; Fl</text>
      <text x="26" y="150" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">No fake constants</text>
      <text x="26" y="170" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">Safe 'نامشخص' fallback</text>
    </g>
  </g>
</svg>`;

const modalsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow3" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0c1836"/>
      <stop offset="60%" stop-color="#050814"/>
      <stop offset="100%" stop-color="#03050c"/>
    </radialGradient>
  </defs>

  <rect width="900" height="480" rx="12" fill="url(#bgGlow3)"/>
  <rect width="898" height="478" x="1" y="1" rx="11" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <rect x="24" y="20" width="852" height="44" rx="8" fill="#0b1329" stroke="#1e293b" stroke-width="1"/>
  <circle cx="44" cy="42" r="5" fill="#ef4444"/>
  <circle cx="60" cy="42" r="5" fill="#f59e0b"/>
  <circle cx="76" cy="42" r="5" fill="#10b981"/>
  <text x="100" y="46" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Analytical Suite &bull; Multi-Element Matrix Comparison &amp; Knowledge Assessment</text>

  <g transform="translate(35, 85)">
    <rect width="400" height="365" rx="10" fill="#080e21" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="0" y="0" width="400" height="42" rx="10" fill="#0f172a"/>
    <text x="20" y="27" fill="#00f0ff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">POST /api/compare &bull; Matrix Analysis</text>
    
    <rect x="20" y="55" width="70" height="26" rx="5" fill="#f43f5e" fill-opacity="0.2" stroke="#f43f5e" stroke-width="1"/>
    <text x="32" y="72" fill="#fda4af" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">H (1)</text>

    <rect x="100" y="55" width="70" height="26" rx="5" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="1"/>
    <text x="112" y="72" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">C (6)</text>

    <rect x="180" y="55" width="70" height="26" rx="5" fill="#eab308" fill-opacity="0.2" stroke="#eab308" stroke-width="1"/>
    <text x="190" y="72" fill="#fef08a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">Fe (26)</text>

    <g transform="translate(20, 95)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">
      <text x="0" y="15" fill="#64748b" font-weight="600">METRIC</text>
      <text x="130" y="15" fill="#64748b" font-weight="600">MIN (H)</text>
      <text x="210" y="15" fill="#64748b" font-weight="600">MAX (Fe/C)</text>
      <text x="295" y="15" fill="#64748b" font-weight="600">DELTA (Δ)</text>
      <line x1="0" y1="24" x2="360" y2="24" stroke="#1e293b"/>

      <text x="0" y="46" fill="#cbd5e1">Atomic Mass</text>
      <text x="130" y="46" fill="#38bdf8">1.008 u</text>
      <text x="210" y="46" fill="#38bdf8">55.845 u</text>
      <text x="295" y="46" fill="#00f0ff" font-weight="700">54.837</text>

      <text x="0" y="76" fill="#cbd5e1">Melting Pt (K)</text>
      <text x="130" y="76" fill="#38bdf8">13.99 K</text>
      <text x="210" y="76" fill="#38bdf8">3823 K (C)</text>
      <text x="295" y="76" fill="#00f0ff" font-weight="700">3809.0</text>

      <text x="0" y="106" fill="#cbd5e1">Density (g/cm³)</text>
      <text x="130" y="106" fill="#38bdf8">0.00009</text>
      <text x="210" y="106" fill="#38bdf8">7.874 (Fe)</text>
      <text x="295" y="106" fill="#00f0ff" font-weight="700">7.8739</text>

      <text x="0" y="136" fill="#cbd5e1">Electronegativity</text>
      <text x="130" y="136" fill="#38bdf8">1.83 (Fe)</text>
      <text x="210" y="136" fill="#38bdf8">2.55 (C)</text>
      <text x="295" y="136" fill="#00f0ff" font-weight="700">0.7200</text>

      <text x="0" y="166" fill="#cbd5e1">Atomic Radius</text>
      <text x="130" y="166" fill="#38bdf8">53 pm (H)</text>
      <text x="210" y="166" fill="#38bdf8">156 pm</text>
      <text x="295" y="166" fill="#00f0ff" font-weight="700">103 pm</text>
    </g>

    <rect x="20" y="285" width="360" height="60" rx="6" fill="#0f172a" stroke="#1e293b"/>
    <text x="32" y="306" fill="#10b981" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">✓ سنگین‌ترین عنصر: آهن (Fe) با جرم 55.845 u</text>
    <text x="32" y="326" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">✓ سبک‌ترین عنصر: هیدروژن (H) با جرم 1.008 u</text>
  </g>

  <g transform="translate(465, 85)">
    <rect width="400" height="365" rx="10" fill="#080e21" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="0" y="0" width="400" height="42" rx="10" fill="#0f172a"/>
    <text x="20" y="27" fill="#f59e0b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">GET /api/quiz &bull; Question 3 of 10</text>

    <g transform="translate(20, 60)">
      <rect width="360" height="65" rx="6" fill="#0f172a" stroke="#1e293b"/>
      <text x="16" y="28" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">عنصر «آهن» (Fe) در کدام بلوک الکترونی جدول واقع است؟</text>
      <text x="16" y="48" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Category: Block Classification &bull; Fisher-Yates Shuffled Options</text>

      <g transform="translate(0, 80)">
        <rect width="360" height="36" rx="6" fill="#0b1329" stroke="#1e293b"/>
        <circle cx="24" cy="18" r="9" fill="#1e293b"/>
        <text x="20" y="22" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">A</text>
        <text x="45" y="22" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">بلوک S (s-block)</text>
      </g>

      <g transform="translate(0, 125)">
        <rect width="360" height="36" rx="6" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1.5"/>
        <circle cx="24" cy="18" r="9" fill="#10b981"/>
        <text x="20" y="22" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">✓</text>
        <text x="45" y="22" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">بلوک D (d-block) &bull; Correct Answer</text>
      </g>

      <g transform="translate(0, 170)">
        <rect width="360" height="36" rx="6" fill="#0b1329" stroke="#1e293b"/>
        <circle cx="24" cy="18" r="9" fill="#1e293b"/>
        <text x="20" y="22" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">C</text>
        <text x="45" y="22" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">بلوک P (p-block)</text>
      </g>

      <g transform="translate(0, 215)">
        <rect width="360" height="36" rx="6" fill="#0b1329" stroke="#1e293b"/>
        <circle cx="24" cy="18" r="9" fill="#1e293b"/>
        <text x="20" y="22" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700">D</text>
        <text x="45" y="22" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">بلوک F (f-block)</text>
      </g>
    </g>
  </g>
</svg>`;

fs.writeFileSync(path.join(docsDir, 'atom-3d.svg'), atom3dSvg);
fs.writeFileSync(path.join(docsDir, 'temp-slider.svg'), tempSliderSvg);
fs.writeFileSync(path.join(docsDir, 'modals.svg'), modalsSvg);

console.log('Successfully generated docs/atom-3d.svg, docs/temp-slider.svg, docs/modals.svg');

