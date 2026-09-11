// ==========================================================================
// Smart Periodic Table - PeriodicTable Component (components/PeriodicTable.js)
// Table grid (18x10), sub-shell blocks (s,p,d,f), phase matrix,
// interactive temperature filter, property trend heatmap, search bar, and category legend.
// ==========================================================================

(function(root) {
  const { useMemo } = React;

  const PeriodicTable = ({
    elements = [],
    selectedElement,
    onSelectElement,
    hoveredElement,
    onHoverElement,
    comparisonList = [],
    onToggleCompare,
    searchQuery = '',
    setSearchQuery,
    searchSuggestions = [],
    selectedCategory = 'all',
    setSelectedCategory,
    selectedPhase = 'all',
    setSelectedPhase,
    selectedGroup = 'all',
    setSelectedPeriod,
    trendProperty = 'none',
    setTrendProperty,
    temperatureK = 298,
    setTemperatureK,
    viewMode = 'grid',
    setViewMode,
    isDarkMode = true
  }) => {
    const CATEGORIES = root.CATEGORIES || root.SPT?.CATEGORIES || {};
    const getPhaseAtTemp = root.getPhaseAtTemp || root.SPT?.getPhaseAtTemp || (() => 'نامشخص');
    const fmt = root.fmt || root.SPT?.fmt || ((v, s = '') => v == null || v === '' ? 'نامشخص' : `${v}${s}`);

    // Filter elements based on search, category, phase, group, and period
    const filteredElementNumbers = useMemo(() => {
      const q = (searchQuery || '').trim().toLowerCase();
      return new Set(elements.filter(el => {
        const matchSearch = !q || 
          (el.nameFa && el.nameFa.toLowerCase().includes(q)) || 
          (el.nameEn && el.nameEn.toLowerCase().includes(q)) || 
          (el.symbol && el.symbol.toLowerCase().includes(q)) ||
          el.number.toString() === q;
        
        const matchCat = selectedCategory === 'all' || el.category === selectedCategory;
        const currentPhase = getPhaseAtTemp(el, temperatureK);
        const matchPhase = selectedPhase === 'all' || currentPhase === selectedPhase || currentPhase.includes(selectedPhase);
        const matchGrp = selectedGroup === 'all' || (el.group != null && el.group.toString() === selectedGroup);

        return matchSearch && matchCat && matchPhase && matchGrp;
      }).map(e => e.number));
    }, [elements, searchQuery, selectedCategory, selectedPhase, selectedGroup, temperatureK]);

    // Trend style color mapper
    const getTrendStyle = (el) => {
      if (trendProperty === 'none') return '';
      const val = el[trendProperty];
      if (val === null || val === undefined) return 'opacity-20';

      let ratio = 0.5;
      if (trendProperty === 'electronegativity') ratio = (val - 0.7) / (4.0 - 0.7);
      if (trendProperty === 'atomicRadius') ratio = (val - 30) / (220 - 30);
      if (trendProperty === 'ionizationEnergy') ratio = (val - 350) / (2400 - 350);
      if (trendProperty === 'density') ratio = Math.min(1, val / 22);
      if (trendProperty === 'meltingPoint') ratio = Math.min(1, val / 3800);
      if (trendProperty === 'boilingPoint') ratio = Math.min(1, val / 5500);

      ratio = Math.max(0, Math.min(1, ratio));

      if (ratio > 0.75) return 'bg-rose-600 text-white font-bold border-rose-400 shadow-md shadow-rose-900/50';
      if (ratio > 0.5) return 'bg-amber-600 text-white font-bold border-amber-400';
      if (ratio > 0.25) return 'bg-teal-600 text-white border-teal-400';
      return 'bg-indigo-950 text-indigo-300 border-indigo-800 opacity-70';
    };

    return (
      <div className="w-full flex flex-col items-center justify-start gap-4">
        
        {/* SEARCH BAR & VIEW MODE CONTROLLER */}
        <div className={`w-full max-w-6xl p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 cyber-glass ${
          isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-300 text-slate-800 bg-white/70'
        }`}>
          {/* Search Input with Auto-suggest */}
          <div className="relative flex-1 min-w-[280px]">
            <input
              id="searchInput"
              type="text"
              placeholder="جستجو در عناصر (نام، نماد یا عدد اتمی) - کلید / ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pr-3 pl-8 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                isDarkMode ? 'bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500' : 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery && setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
                title="پاک کردن جستجو"
              >
                ✕
              </button>
            )}

            {/* Auto Suggest Dropdown */}
            {searchSuggestions && searchSuggestions.length > 0 && (
              <div className={`absolute top-full right-0 left-0 mt-1 rounded-xl border shadow-2xl z-50 overflow-hidden ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                {searchSuggestions.map(el => (
                  <div
                    key={el.number}
                    onClick={() => {
                      onSelectElement && onSelectElement(el);
                      setSearchQuery && setSearchQuery('');
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer text-xs border-b last:border-0 ${
                      isDarkMode ? 'hover:bg-slate-800/80 border-slate-800/50' : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-400 font-mono w-6">{el.symbol}</span>
                      <span>{el.nameFa} ({el.nameEn})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Z = {el.number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Switcher */}
          {setViewMode && (
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-bold shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                title="نمایش جدول استاندارد ۱۸ ستونی"
              >
                جدول
              </button>
              <button
                onClick={() => setViewMode('blocks')}
                className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'blocks' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                title="نمایش بر اساس زیرلایه‌ها (s,p,d,f)"
              >
                بلوک‌ها
              </button>
              <button
                onClick={() => setViewMode('phase')}
                className={`px-2.5 py-1 rounded-lg transition ${viewMode === 'phase' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                title="نمایش بر اساس حالت فیزیکی ماده"
              >
                حالت‌ها
              </button>
            </div>
          )}
        </div>

        {/* INTERACTIVE TEMPERATURE & PROPERTY TREND CONTROLLER */}
        {setTemperatureK && setTrendProperty && (
          <div className={`w-full max-w-6xl px-4 py-2 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs font-mono cyber-glass ${
            isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-300 text-slate-800 bg-white/70'
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="font-bold font-sans text-cyan-400 flex items-center gap-1 shrink-0">
                🌡️ دماسنج تعاملی:
              </span>
              <input
                type="range"
                min="0"
                max="6000"
                step="25"
                value={temperatureK}
                onChange={(e) => setTemperatureK(parseInt(e.target.value, 10))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-28 text-left font-bold text-amber-400 shrink-0">
                {temperatureK} K / {(temperatureK - 273.15).toFixed(0)} °C
              </div>
            </div>

            <div className="flex items-center gap-2 font-sans shrink-0">
              <span className="text-slate-400 text-[11px]">نقشه خواص:</span>
              <select
                value={trendProperty}
                onChange={(e) => setTrendProperty(e.target.value)}
                className={`text-xs rounded-xl px-2.5 py-1 font-semibold focus:outline-none border ${
                  trendProperty !== 'none'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <option value="none">خاموش</option>
                <option value="electronegativity">الکترونگاتیوی</option>
                <option value="atomicRadius">شعاع اتمی</option>
                <option value="ionizationEnergy">انرژی یونش</option>
                <option value="density">چگالی</option>
                <option value="meltingPoint">نقطه ذوب</option>
                <option value="boilingPoint">نقطه جوش</option>
              </select>
            </div>
          </div>
        )}

        {/* TREND HEATMAP COLOR LEGEND */}
        {trendProperty !== 'none' && (
          <div className="w-full max-w-6xl flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs cyber-glass">
            <span className="font-bold text-amber-400">طیف خواص ({trendProperty}):</span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-indigo-400">پایین‌تر</span>
              <div className="h-3 w-48 rounded-lg bg-gradient-to-r from-indigo-950 via-teal-600 via-amber-600 to-rose-600 border border-slate-700"></div>
              <span className="text-rose-400">بالاتر</span>
            </div>
          </div>
        )}

        {/* VIEW MODE 1: STANDARD 18x10 PERIODIC GRID */}
        {viewMode === 'grid' && (
          <div className="grid-periodic w-full max-w-6xl min-w-[980px]" style={{ direction: 'ltr' }}>
            {elements.map(el => {
              const isSelected = selectedElement?.number === el.number;
              const isCompared = comparisonList.some(c => c.number === el.number);
              const isFilteredOut = !filteredElementNumbers.has(el.number);
              const catConfig = CATEGORIES[el.category] || { bg: 'bg-slate-800 border-slate-700 text-slate-300', hex: '#64748b' };
              const trendStyle = getTrendStyle(el);
              const currentPhase = getPhaseAtTemp(el, temperatureK);

              return (
                <div
                  key={el.number}
                  style={{ gridColumn: el.gridColumn ?? el.group, gridRow: el.gridRow ?? el.period }}
                  onClick={() => onSelectElement(el)}
                  onMouseEnter={() => onHoverElement && onHoverElement(el)}
                  onContextMenu={(e) => onToggleCompare && onToggleCompare(el, e)}
                  className={`
                    relative flex flex-col justify-between p-1 rounded-xl border cursor-pointer transition-all duration-200 select-none
                    ${trendProperty !== 'none' ? trendStyle : catConfig.bg}
                    ${isSelected ? 'ring-2 ring-cyan-400 scale-105 z-20 shadow-xl neon-border-cyan' : 'hover:scale-105 hover:z-10'}
                    ${isCompared ? 'ring-2 ring-amber-400 border-amber-400 neon-border-amber' : ''}
                    ${isFilteredOut ? 'opacity-10 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex justify-between items-center text-[9px] font-mono opacity-80">
                    <span>{el.number}</span>
                    <span>{fmt(el.atomicMass)}</span>
                  </div>
                  <div className="text-center font-black text-base tracking-wide my-0.5">{el.symbol}</div>
                  
                  <div className="flex justify-between items-center text-[8px] px-0.5 font-sans">
                    <span className="truncate">{el.nameFa}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentPhase.includes('جامد')
                          ? 'bg-slate-400'
                          : currentPhase.includes('مایع')
                          ? 'bg-cyan-400'
                          : currentPhase.includes('گاز')
                          ? 'bg-rose-400'
                          : 'bg-slate-700'
                      }`}
                      title={`حالت در ${temperatureK}K: ${currentPhase}`}
                    ></span>
                  </div>

                  {isCompared && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 font-bold text-[8px] rounded-full flex items-center justify-center shadow">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 2: SUB-SHELL BLOCKS VIEW (s, p, d, f) */}
        {viewMode === 'blocks' && (
          <div className="w-full max-w-6xl space-y-6" style={{ direction: 'rtl' }}>
            {['s', 'p', 'd', 'f'].map(blockName => {
              const blockElements = elements.filter(e => e.block === blockName);
              return (
                <div key={blockName} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 cyber-glass">
                  <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                    <span>بلوک {blockName.toUpperCase()} ({blockElements.length} عنصر)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {blockElements.map(el => (
                      <div
                        key={el.number}
                        onClick={() => onSelectElement(el)}
                        onMouseEnter={() => onHoverElement && onHoverElement(el)}
                        className={`w-14 h-16 p-1 rounded-xl border flex flex-col justify-between cursor-pointer transition ${CATEGORIES[el.category]?.bg || 'bg-slate-800'}`}
                      >
                        <div className="text-[9px] font-mono opacity-70">{el.number}</div>
                        <div className="text-center font-bold text-sm">{el.symbol}</div>
                        <div className="text-[8px] truncate text-center">{el.nameFa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 3: PHYSICAL PHASE MATRIX VIEW */}
        {viewMode === 'phase' && (
          <div className="w-full max-w-6xl space-y-6" style={{ direction: 'rtl' }}>
            {['جامد', 'مایع', 'گاز', 'پیش‌بینی: جامد', 'پیش‌بینی: مایع', 'پیش‌بینی: گاز', 'نامشخص'].map(phaseName => {
              const phaseElements = elements.filter(e => getPhaseAtTemp(e, temperatureK) === phaseName);
              return (
                <div key={phaseName} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 cyber-glass">
                  <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                    <span>عناصر با حالت {phaseName} در دمای {temperatureK}K ({phaseElements.length} عنصر)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {phaseElements.map(el => (
                      <div
                        key={el.number}
                        onClick={() => onSelectElement(el)}
                        onMouseEnter={() => onHoverElement && onHoverElement(el)}
                        className={`w-14 h-16 p-1 rounded-xl border flex flex-col justify-between cursor-pointer transition ${CATEGORIES[el.category]?.bg || 'bg-slate-800'}`}
                      >
                        <div className="text-[9px] font-mono opacity-70">{el.number}</div>
                        <div className="text-center font-bold text-sm">{el.symbol}</div>
                        <div className="text-[8px] truncate text-center">{el.nameFa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CATEGORY LEGEND BAR */}
        <div className="w-full max-w-6xl flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[10px]">
          {Object.entries(CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory && setSelectedCategory(selectedCategory === key ? 'all' : key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition ${val.bg} ${
                selectedCategory === key ? 'ring-2 ring-white scale-105' : 'opacity-80'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: val.hex }}></span>
              <span>{val.nameFa}</span>
            </button>
          ))}
        </div>

      </div>
    );
  };

  root.PeriodicTable = PeriodicTable;
})(window);
