import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PeriodicTable } from './PeriodicTable';
import { AtomViewer } from './AtomViewer';
import { CompareModal } from './CompareModal';
import { QuizModal } from './QuizModal';
import { CompoundBuilderModal } from './CompoundBuilderModal';
import { fetchElements } from '../services/api';
import { CATEGORIES, getPhaseAtTemp, fmt } from '../utils/chemistry';
import { playSound } from '../utils/sound';
import {
  Search,
  Scale,
  Trophy,
  Beaker,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  X,
  Atom,
  Info,
  BookOpen,
  Users,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * App: Central State Coordinator and Application Shell.
 * Manages element datasets, keyboard navigation shortcuts, theme switches,
 * inspector drawer tabs, and modal states.
 */
export const App = () => {
  const [elements, setElements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [trendProperty, setTrendProperty] = useState('none');
  const [temperatureK, setTemperatureK] = useState(298);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'blocks' | 'phase'
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'model' | 'apps' | 'similar' | 'trivia'

  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isCompoundModalOpen, setIsCompoundModalOpen] = useState(false);

  // Load periodic table data on mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchElements();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('دیتابیس هیچ عنصری بازنگرداند.');
      }
      setElements(data);
      setSelectedElement(data[0]);
      setHoveredElement(data[0]);
    } catch (err) {
      setLoadError(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      } else if (e.key === 'Escape') {
        setIsQuizOpen(false);
        setIsCompareModalOpen(false);
        setIsCompoundModalOpen(false);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const curr = selectedElement || elements[0];
        if (!curr) return;

        const currCol = curr.gridColumn ?? curr.group ?? 1;
        const currRow = curr.gridRow ?? curr.period ?? 1;
        let nextEl = null;

        if (e.key === 'ArrowRight') {
          nextEl =
            elements.find(
              (el) => (el.gridRow ?? el.period) === currRow && (el.gridColumn ?? el.group) === currCol + 1
            ) || elements.find((el) => el.number === curr.number + 1);
        } else if (e.key === 'ArrowLeft') {
          nextEl =
            elements.find(
              (el) => (el.gridRow ?? el.period) === currRow && (el.gridColumn ?? el.group) === currCol - 1
            ) || elements.find((el) => el.number === curr.number - 1);
        } else if (e.key === 'ArrowDown') {
          nextEl =
            elements.find(
              (el) => (el.gridColumn ?? el.group) === currCol && (el.gridRow ?? el.period) === currRow + 1
            ) || elements.find((el) => el.number === Math.min(118, curr.number + 18));
        } else if (e.key === 'ArrowUp') {
          nextEl =
            elements.find(
              (el) => (el.gridColumn ?? el.group) === currCol && (el.gridRow ?? el.period) === currRow - 1
            ) || elements.find((el) => el.number === Math.max(1, curr.number - 18));
        }

        if (nextEl) {
          setSelectedElement(nextEl);
          setHoveredElement(nextEl);
        }
      } else if (e.key.toLowerCase() === 'c' && selectedElement) {
        toggleCompare(selectedElement);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, elements, comparisonList]);

  // Auto-suggest search suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return elements
      .filter(
        (el) =>
          el.nameFa.includes(q) ||
          el.nameEn.toLowerCase().includes(q) ||
          el.symbol.toLowerCase().includes(q) ||
          el.number.toString() === q
      )
      .slice(0, 6);
  }, [searchQuery, elements]);

  const handleSelectElement = (el) => {
    playSound('click', isAudioEnabled);
    setSelectedElement(el);
  };

  const handleHoverElement = (el) => {
    playSound('hover', isAudioEnabled);
    setHoveredElement(el);
  };

  const toggleCompare = (el, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    playSound('click', isAudioEnabled);
    if (comparisonList.some((c) => c.number === el.number)) {
      setComparisonList(comparisonList.filter((c) => c.number !== el.number));
    } else {
      if (comparisonList.length >= 6) {
        alert('حداکثر ۶ عنصر را می‌توانید هم‌زمان مقایسه کنید.');
        return;
      }
      setComparisonList([...comparisonList, el]);
    }
  };

  const activeDisplayElement = hoveredElement || selectedElement || elements[0] || {};

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <h2 className="text-base font-bold text-cyan-400">در حال بارگذاری جدول تناوبی کوانتومی...</h2>
        <p className="text-xs text-slate-500 font-mono">SQLite Snapshot Engine</p>
      </div>
    );
  }

  // Error State
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h1 className="text-lg font-black text-rose-300">ارتباط با بک‌اند برقرار نشد</h1>
          <p className="text-sm text-slate-300 leading-7">{loadError}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. CYBER HUD HEADER NAVBAR */}
      <header
        className={`h-16 border-b px-4 lg:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md ${
          isDarkMode ? 'bg-slate-950/80 border-slate-800/80' : 'bg-white/80 border-slate-200'
        }`}
      >
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
            Pt
          </div>
          <div>
            <h1 className="text-sm lg:text-base font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              جدول تناوبی هوشمند کوانتومی
            </h1>
            <p className="text-[9px] text-slate-400 font-mono">Quantum Chemistry HUD v3.0</p>
          </div>
        </div>

        {/* Live Hover Micro-HUD Panel */}
        <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono cyber-glass">
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <span className="text-2xl font-black text-cyan-400">{activeDisplayElement.symbol}</span>
            <div>
              <div className="font-bold font-sans text-slate-200">{activeDisplayElement.nameFa}</div>
              <div className="text-[10px] text-slate-400">
                {activeDisplayElement.nameEn} (Z={activeDisplayElement.number})
              </div>
            </div>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>
              جرم: <strong className="text-amber-400">{fmt(activeDisplayElement.atomicMass, ' u')}</strong>
            </div>
            <div>
              حالت: <strong className="text-emerald-400">{getPhaseAtTemp(activeDisplayElement, temperatureK)}</strong>
            </div>
          </div>
          <div className="space-y-0.5 text-[11px] border-r border-slate-800 pr-3">
            <div>
              شعاع: <strong className="text-purple-400">{fmt(activeDisplayElement.atomicRadius, ' pm')}</strong>
            </div>
            <div>
              الکترونگاتیوی: <strong className="text-rose-400">{activeDisplayElement.electronegativity ?? '-'}</strong>
            </div>
          </div>
        </div>

        {/* Search Quick Shortcut */}
        <button
          onClick={() => document.getElementById('searchInput')?.focus()}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
          title="رفتن به نوار جستجو (کلید /)"
        >
          <Search className="w-3.5 h-3.5" />
          <span>جستجو در عناصر</span>
          <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">/</kbd>
        </button>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCompoundModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition active:scale-95"
            title="باز کردن مولکول‌ساز"
          >
            <Beaker className="w-3.5 h-3.5" />
            <span>مولکول‌ساز</span>
          </button>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition active:scale-95"
            title="مشاهده جدول مقایسه"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>مقایسه ({comparisonList.length})</span>
          </button>

          <button
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition active:scale-95"
            title="شروع آزمون و چالش"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>چالش</span>
          </button>

          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-2 rounded-xl border transition ${
              isAudioEnabled ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'opacity-40 bg-slate-900 border-slate-800'
            }`}
            title={isAudioEnabled ? 'قطع صدا' : 'وصل صدا'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400"
            title={isDarkMode ? 'حالت روشن' : 'حالت تاریک'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Periodic Grid & Modes Container */}
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start gap-4">
          <PeriodicTable
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={handleSelectElement}
            hoveredElement={hoveredElement}
            onHoverElement={handleHoverElement}
            comparisonList={comparisonList}
            onToggleCompare={toggleCompare}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchSuggestions={searchSuggestions}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPhase={selectedPhase}
            setSelectedPhase={setSelectedPhase}
            selectedGroup={selectedGroup}
            setSelectedPeriod={setSelectedPeriod}
            trendProperty={trendProperty}
            setTrendProperty={setTrendProperty}
            temperatureK={temperatureK}
            setTemperatureK={setTemperatureK}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* 3. INSPECTOR DRAWER SIDEBAR */}
        {selectedElement && (
          <aside
            className={`inspector-drawer w-96 border-r flex flex-col h-full z-30 shadow-2xl transition-all duration-300 ${
              isDarkMode ? 'bg-slate-900/95 border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-cyan-400 font-mono">{selectedElement.symbol}</span>
                  <h2 className="text-xl font-bold">{selectedElement.nameFa}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedElement.nameEn} - عدد اتمی {selectedElement.number}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleCompare(selectedElement)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    comparisonList.some((c) => c.number === selectedElement.number)
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {comparisonList.some((c) => c.number === selectedElement.number) ? 'حذف مقایسه' : '+ مقایسه'}
                </button>

                <button
                  onClick={() => setSelectedElement(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="بستن پنل جزئیات"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs Navigation */}
            <div className={`flex border-b text-xs font-bold ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              {[
                { id: 'info', label: 'مشخصات', icon: Info },
                { id: 'model', label: 'مدل ۳D', icon: Atom },
                { id: 'apps', label: 'کاربردها', icon: BookOpen },
                { id: 'similar', label: 'مشابه‌ها', icon: Users },
                { id: 'trivia', label: 'دانستنی', icon: Lightbulb },
              ].map((t) => {
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      playSound('click', isAudioEnabled);
                      setActiveTab(t.id);
                    }}
                    className={`flex-1 py-2.5 flex flex-col items-center gap-1 border-b-2 transition ${
                      activeTab === t.id
                        ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs pr-1">
              {/* TAB 1: SCIENTIFIC PROPERTIES */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-2xl border space-y-2 font-mono ${
                      isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">حالت (در {temperatureK}K):</span>
                      <span className="font-bold text-cyan-400">{getPhaseAtTemp(selectedElement, temperatureK)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">حالت استاندارد منبع:</span>
                      <span>{fmt(selectedElement.standardState)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">گروه و دوره:</span>
                      <span>
                        {selectedElement.group == null
                          ? 'گروه مستقل ندارد'
                          : `گروه ${selectedElement.group}`}{' '}
                        / دوره {selectedElement.period}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">بلوک:</span>
                      <span>{selectedElement.block?.toUpperCase() || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">دسته‌بندی:</span>
                      <span>{CATEGORIES[selectedElement.category]?.nameFa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">جرم اتمی:</span>
                      <span>{fmt(selectedElement.atomicMass, ' u')}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-sans text-slate-400 shrink-0">آرایش الکترونی:</span>
                      <span className="text-left">{fmt(selectedElement.electronConfig)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">لایه‌ها:</span>
                      <span>
                        {selectedElement.shells?.length ? selectedElement.shells.join(' , ') : 'نامشخص'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">ایزوتوپ مرجع مدل:</span>
                      <span>
                        {selectedElement.representativeIsotopeMassNumber
                          ? `${selectedElement.symbol}-${selectedElement.representativeIsotopeMassNumber}`
                          : 'نامشخص'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">نوترون در ایزوتوپ مرجع:</span>
                      <span>{fmt(selectedElement.neutrons)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">چگالی:</span>
                      <span>{fmt(selectedElement.density, ' g/cm³')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">نقطه ذوب:</span>
                      <span>{fmt(selectedElement.meltingPoint, ' K')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">نقطه جوش:</span>
                      <span>{fmt(selectedElement.boilingPoint, ' K')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">الکترونگاتیوی:</span>
                      <span>{fmt(selectedElement.electronegativity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">انرژی یونش اول:</span>
                      <span>{fmt(selectedElement.ionizationEnergy, ' kJ/mol')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">شعاع اتمی:</span>
                      <span>{fmt(selectedElement.atomicRadius, ' pm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">شعاع کووالانسی:</span>
                      <span>{fmt(selectedElement.covalentRadius, ' pm')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-400">حالت‌های اکسایش:</span>
                      <span>{fmt(selectedElement.oxidationStates)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="font-sans text-slate-400 shrink-0">کاشف و سال:</span>
                      <span className="text-left">
                        {selectedElement.discoveredBy || selectedElement.yearDiscovered
                          ? `${selectedElement.discoveredBy || 'نامشخص'} (${selectedElement.yearDiscovered ?? 'نامشخص'})`
                          : 'نامشخص'}
                      </span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-500 font-sans leading-5">
                      داده‌های ناموجود عمداً «نامشخص» نمایش داده می‌شوند و با عدد تخمینی پر نمی‌شوند.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THREE.JS 3D ATOM MODEL */}
              {activeTab === 'model' && (
                <div className="space-y-3">
                  <AtomViewer element={selectedElement} />
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1">
                    <div className="font-bold text-cyan-400">توزیع الکترون در لایه‌ها:</div>
                    <div className="text-slate-300 font-mono space-y-1">
                      {(selectedElement.shells || []).map((count, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between border-b border-slate-700/30 py-1 last:border-0"
                        >
                          <span>
                            لایه {idx + 1} ({['K', 'L', 'M', 'N', 'O', 'P', 'Q'][idx]}):
                          </span>
                          <span className="text-cyan-400 font-bold">{count} الکترون</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPLICATIONS */}
              {activeTab === 'apps' && (
                <div className="space-y-3">
                  {selectedElement.usesText && (
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <h4 className="font-bold mb-2 text-emerald-300">کاربردهای ثبت‌شده در منبع:</h4>
                      <p className="text-slate-300 leading-7 whitespace-pre-line">{selectedElement.usesText}</p>
                    </div>
                  )}
                  {[
                    { title: 'صنعتی', items: selectedElement.applications?.industry || [], color: 'text-amber-400' },
                    { title: 'پزشکی و سلامت', items: selectedElement.applications?.medical || [], color: 'text-rose-400' },
                    { title: 'آزمایشگاهی', items: selectedElement.applications?.lab || [], color: 'text-emerald-400' },
                    { title: 'الکترونیک', items: selectedElement.applications?.electronic || [], color: 'text-cyan-400' },
                    { title: 'روزمره', items: selectedElement.applications?.daily || [], color: 'text-purple-400' },
                  ]
                    .filter((app) => app.items.length > 0)
                    .map((app, i) => (
                      <div key={i} className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
                        <h4 className={`font-bold mb-1.5 ${app.color}`}>{app.title}:</h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {app.items.map((it, idx) => (
                            <li key={idx}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  {!selectedElement.usesText &&
                    !Object.values(selectedElement.applications || {}).some(
                      (items) => Array.isArray(items) && items.length
                    ) && (
                      <div className="p-4 text-center text-slate-500 border border-slate-800 rounded-xl">
                        دادهٔ کاربرد معتبر برای این عنصر هنوز در دیتابیس محلی ثبت نشده است.
                      </div>
                    )}
                </div>
              )}

              {/* TAB 4: SIMILAR ELEMENTS */}
              {activeTab === 'similar' && (
                <div className="space-y-2">
                  <p className="text-slate-400 mb-2">عناصر هم‌گروه با خواص شیمیایی مشابه:</p>
                  {elements
                    .filter(
                      (e) =>
                        (selectedElement.group == null
                          ? e.category === selectedElement.category
                          : e.group === selectedElement.group) && e.number !== selectedElement.number
                    )
                    .map((sim) => (
                      <div
                        key={sim.number}
                        onClick={() => handleSelectElement(sim)}
                        className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-400 font-mono">{sim.symbol}</span>
                          <span>{sim.nameFa}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Z = {sim.number}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* TAB 5: SCIENTIFIC TRIVIA */}
              {activeTab === 'trivia' && (
                <div className="p-4 bg-gradient-to-br from-cyan-950/40 to-slate-900 rounded-2xl border border-cyan-800/50 space-y-2">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    💡 آیا می‌دانستید؟
                  </h4>
                  <p className="leading-relaxed text-slate-200">
                    {selectedElement.trivia || 'دانستنی معتبر برای این عنصر هنوز در دیتابیس محلی همگام نشده است.'}
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 4. MODALS */}
      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparisonList={comparisonList}
        setComparisonList={setComparisonList}
        isDarkMode={isDarkMode}
      />

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        elements={elements}
        isDarkMode={isDarkMode}
        isAudioEnabled={isAudioEnabled}
      />

      {/* Compound Builder Modal */}
      <CompoundBuilderModal
        isOpen={isCompoundModalOpen}
        onClose={() => setIsCompoundModalOpen(false)}
        elements={elements}
      />
    </div>
  );
};

export default App;
