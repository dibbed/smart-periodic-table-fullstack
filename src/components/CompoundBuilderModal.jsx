import React, { useState, useMemo } from 'react';
import { Beaker, X, Plus, Minus, RotateCcw } from 'lucide-react';

const PRESETS = [
  { name: 'آب (Water)', formula: [{ num: 1, count: 2 }, { num: 8, count: 1 }] },
  { name: 'نمک طعام (NaCl)', formula: [{ num: 11, count: 1 }, { num: 17, count: 1 }] },
  { name: 'سولفوریک اسید (H2SO4)', formula: [{ num: 1, count: 2 }, { num: 16, count: 1 }, { num: 8, count: 4 }] },
  { name: 'گلوکز (Glucose)', formula: [{ num: 6, count: 6 }, { num: 1, count: 12 }, { num: 8, count: 6 }] },
  { name: 'دی‌اکسید کربن (CO2)', formula: [{ num: 6, count: 1 }, { num: 8, count: 2 }] },
];

/**
 * CompoundBuilderModal: Molecule constructor and molar mass calculator.
 */
export const CompoundBuilderModal = ({ isOpen, onClose, elements = [] }) => {
  const [selectedFormula, setSelectedFormula] = useState([]);

  const addElementToFormula = (el) => {
    setSelectedFormula((prev) => {
      const existing = prev.find((item) => item.element.number === el.number);
      if (existing) {
        return prev.map((item) =>
          item.element.number === el.number ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { element: el, count: 1 }];
    });
  };

  const updateCount = (num, delta) => {
    setSelectedFormula((prev) =>
      prev
        .map((item) => {
          if (item.element.number === num) {
            const newCount = item.count + delta;
            return newCount > 0 ? { ...item, count: newCount } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const loadPreset = (preset) => {
    const formula = preset.formula
      .map((p) => ({
        element: elements.find((e) => e.number === p.num),
        count: p.count,
      }))
      .filter((p) => p.element);
    setSelectedFormula(formula);
  };

  const totalMass = useMemo(() => {
    return selectedFormula.reduce(
      (sum, item) => sum + (item.element.atomicMass || 0) * item.count,
      0
    );
  }, [selectedFormula]);

  const formulaString = useMemo(() => {
    if (selectedFormula.length === 0) return '';
    return selectedFormula
      .map((item) => `${item.element.symbol}${item.count > 1 ? item.count : ''}`)
      .join('');
  }, [selectedFormula]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-black text-emerald-400">مولکول‌ساز و محاسبه‌گر جرم مولی</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Compound Presets */}
          <div>
            <span className="text-xs text-slate-400 mb-2 block">ترکیب‌های آماده:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-medium transition active:scale-95"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Formula Display Banner */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center cyber-glass">
            <span className="text-xs text-slate-500 block mb-1 font-sans">فرمول شیمیایی:</span>
            <div className="text-3xl font-black text-cyan-400 font-mono min-h-[40px] flex items-center justify-center gap-1">
              {formulaString || <span className="text-slate-600 text-sm font-sans">عنصری برای ترکیب انتخاب نشده است</span>}
            </div>
            {totalMass > 0 && (
              <div className="mt-2 text-sm font-bold text-amber-400 font-mono">
                جرم مولی: {totalMass.toFixed(3)} g/mol
              </div>
            )}
          </div>

          {/* Formula Components List with Mass % */}
          {selectedFormula.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block">عناصر ترکیب و درصد جرمی:</span>
              {selectedFormula.map((item) => {
                const massPart = (item.element.atomicMass || 0) * item.count;
                const percent = totalMass > 0 ? ((massPart / totalMass) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={item.element.number}
                    className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-cyan-400 font-mono w-8">{item.element.symbol}</span>
                      <span>{item.element.nameFa}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => updateCount(item.element.number, -1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center font-bold text-rose-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.count}</span>
                        <button
                          onClick={() => updateCount(item.element.number, 1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center font-bold text-emerald-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-amber-300 w-16 text-left">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Elements Quick Picker */}
          <div>
            <span className="text-xs text-slate-400 mb-2 block">افزودن عنصر با کلیک:</span>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {elements.map((el) => (
                <button
                  key={el.number}
                  onClick={() => addElementToFormula(el)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-mono font-bold text-cyan-300 transition active:scale-95"
                  title={el.nameFa}
                >
                  {el.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => setSelectedFormula([])}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs border border-rose-500/30 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>پاک کردن</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/40"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompoundBuilderModal;
