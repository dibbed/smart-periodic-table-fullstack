import React from 'react';
import { CATEGORIES, fmt } from '../utils/chemistry';
import { Scale, X, Trash2 } from 'lucide-react';

/**
 * CompareModal: Multi-Element Comparison Matrix Modal.
 * Supports exact side-by-side comparison of elements with full tolerance
 * for missing, null, and predicted scientific attributes.
 */
export const CompareModal = ({
  isOpen,
  onClose,
  comparisonList = [],
  setComparisonList = () => {},
  isDarkMode = true,
}) => {
  if (!isOpen) return null;

  const removeElement = (number) => {
    setComparisonList(comparisonList.filter((c) => c.number !== number));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl rounded-2xl p-6 shadow-2xl border flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-amber-400">جدول مقایسه هم‌زمان عناصر</h3>
            <span className="text-xs text-slate-400 font-mono">({comparisonList.length} عنصر)</span>
          </div>

          <div className="flex items-center gap-2">
            {comparisonList.length > 0 && (
              <button
                onClick={() => setComparisonList([])}
                className="flex items-center gap-1 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک کردن همه</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {comparisonList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <Scale className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
            <p>هیچ عنصری برای مقایسه انتخاب نشده است.</p>
            <p className="text-slate-500 text-[11px]">
              روی عناصر در جدول کلیک راست کنید یا از دکمه «+ مقایسه» در پنل جزئیات استفاده نمایید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 flex-1 pr-1">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3 w-40 text-slate-400 font-bold">ویژگی</th>
                  {comparisonList.map((el) => (
                    <th key={el.number} className="p-3 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-base font-black text-cyan-400 font-mono">{el.symbol}</span>
                        <span className="font-bold text-slate-200">
                          {el.nameFa} <span className="text-slate-400 text-[10px]">({el.nameEn})</span>
                        </span>
                        <button
                          onClick={() => removeElement(el.number)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                          title="حذف از مقایسه"
                        >
                          <X className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* 1. Atomic Number */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">عدد اتمی (Z)</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center font-bold text-slate-200 text-sm">
                      {el.number}
                    </td>
                  ))}
                </tr>

                {/* 2. Category */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">دسته‌بندی</td>
                  {comparisonList.map((el) => {
                    const cat = CATEGORIES[el.category];
                    return (
                      <td key={el.number} className="p-3 text-center font-sans">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            cat?.badge || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {cat?.nameFa || el.category}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Atomic Mass */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">جرم اتمی</td>
                  {comparisonList.map((el) => {
                    const mass = Number.isFinite(el.atomicMass) ? el.atomicMass : null;
                    return (
                      <td key={el.number} className="p-3 text-center">
                        <div className="font-bold text-slate-200">{fmt(el.atomicMass, ' u')}</div>
                        {mass !== null ? (
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, (mass / 250) * 100)}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">داده پیش‌بینی‌شده</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Electronegativity */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">الکترونگاتیوی (پاولینگ)</td>
                  {comparisonList.map((el) => {
                    const en = Number.isFinite(el.electronegativity) ? el.electronegativity : null;
                    return (
                      <td key={el.number} className="p-3 text-center">
                        <div className="font-bold text-slate-200">{en !== null ? en : 'نامشخص'}</div>
                        {en !== null ? (
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, (en / 4) * 100)}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">بدون مقدار تجربی</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 5. Atomic Radius */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">شعاع اتمی</td>
                  {comparisonList.map((el) => {
                    const radius = Number.isFinite(el.atomicRadius) ? el.atomicRadius : null;
                    return (
                      <td key={el.number} className="p-3 text-center">
                        <div className="font-bold text-slate-200">
                          {radius !== null ? `${radius} pm` : 'نامشخص'}
                        </div>
                        {radius !== null ? (
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${Math.min(100, (radius / 250) * 100)}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">بدون مقدار تجربی</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Density */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">چگالی</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center">
                      <div className="text-slate-200">{fmt(el.density, ' g/cm³')}</div>
                    </td>
                  ))}
                </tr>

                {/* 7. Melting & Boiling Points */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">نقطه ذوب / جوش</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center">
                      <span className="text-cyan-300">{fmt(el.meltingPoint, ' K')}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-amber-300">{fmt(el.boilingPoint, ' K')}</span>
                    </td>
                  ))}
                </tr>

                {/* 8. First Ionization Energy */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">انرژی اولین یونش</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center">
                      {fmt(el.ionizationEnergy, ' kJ/mol')}
                    </td>
                  ))}
                </tr>

                {/* 9. Oxidation States */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">حالت‌های اکسایش</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center font-bold text-slate-300">
                      {fmt(el.oxidationStates)}
                    </td>
                  ))}
                </tr>

                {/* 10. Electron Configuration */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">آرایش الکترونی</td>
                  {comparisonList.map((el) => {
                    const isPredicted = String(el.electronConfig || '').toLowerCase().includes('predicted');
                    return (
                      <td key={el.number} className="p-3 text-center text-[11px]">
                        <span className={isPredicted ? 'text-amber-300' : 'text-slate-200'}>
                          {el.electronConfig || 'نامشخص'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 11. Protons / Neutrons / Electrons */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">ذرات زیراتمی (p⁺ / n⁰ / e⁻)</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center text-[11px]">
                      <span className="text-rose-400">{el.protons}p</span>
                      <span className="text-slate-600 mx-1">|</span>
                      <span className="text-amber-400">{el.neutrons ?? '?'}n</span>
                      <span className="text-slate-600 mx-1">|</span>
                      <span className="text-cyan-400">{el.electrons}e</span>
                    </td>
                  ))}
                </tr>

                {/* 12. Discovery */}
                <tr>
                  <td className="p-3 font-sans text-slate-400">کاشف و سال</td>
                  {comparisonList.map((el) => (
                    <td key={el.number} className="p-3 text-center font-sans text-[11px] text-slate-300">
                      {el.discoveredBy || el.yearDiscovered
                        ? `${el.discoveredBy || 'نامشخص'} (${el.yearDiscovered ?? 'نامشخص'})`
                        : 'باستان / ناشناخته'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer Note */}
        <div className="pt-3 mt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
          <span>داده‌های عناصر فوق‌سنگین و پیش‌بینی‌شده با احتیاط علمی برچسب‌گذاری شده‌اند.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
