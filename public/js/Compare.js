// ==========================================================================
// Smart Periodic Table - Compare Component
// Multi-element comparison matrix modal with graphical visual progress bars
// ==========================================================================

(function(root) {
  const Compare = ({
    isOpen,
    onClose,
    comparisonList = [],
    setComparisonList = () => {},
    isDarkMode = true
  }) => {
    if (!isOpen) return null;

    const fmt = root.fmt || root.SPT?.fmt || ((v, s = '') => v == null || v === '' ? 'نامشخص' : `${v}${s}`);

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`w-full max-w-5xl rounded-2xl p-6 shadow-2xl border flex flex-col max-h-[90vh] ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}>
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <h3 className="text-lg font-black text-amber-400">جدول مقایسه هم‌زمان عناصر</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparisonList([])}
                className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/30 transition"
              >
                پاک کردن همه
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 transition"
                title="بستن"
              >
                ✕
              </button>
            </div>
          </div>

          {comparisonList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              هیچ عنصری برای مقایسه انتخاب نشده است. روی عناصر راست‌کلیک کنید یا دکمه «+ مقایسه» را بزنید.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="p-2.5">ویژگی</th>
                    {comparisonList.map(el => (
                      <th key={el.number} className="p-2.5 text-center text-cyan-400 font-bold">
                        <div className="flex flex-col items-center gap-1">
                          <span>{el.nameFa} ({el.symbol})</span>
                          <button
                            onClick={() => setComparisonList(comparisonList.filter(c => c.number !== el.number))}
                            className="text-[10px] text-rose-400 hover:text-rose-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700"
                            title="حذف از مقایسه"
                          >
                            حذف ✕
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">عدد اتمی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center font-bold text-slate-200">
                        {el.number}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">جرم اتمی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center">
                        <div>{fmt(el.atomicMass, ' u')}</div>
                        <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (el.atomicMass / 250) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">الکترونگاتیوی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center">
                        <div>{el.electronegativity ?? '-'}</div>
                        {el.electronegativity && (
                          <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full transition-all duration-300"
                              style={{ width: `${(el.electronegativity / 4) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">شعاع اتمی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center">
                        <div>{el.atomicRadius ? `${el.atomicRadius} pm` : '-'}</div>
                        {el.atomicRadius && (
                          <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all duration-300"
                              style={{ width: `${(el.atomicRadius / 250) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">چگالی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center">
                        {fmt(el.density, ' g/cm³')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">نقطه ذوب / جوش</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center">
                        {fmt(el.meltingPoint, 'K')} / {fmt(el.boilingPoint, 'K')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans text-slate-400">آرایش الکترونی</td>
                    {comparisonList.map(el => (
                      <td key={el.number} className="p-2.5 text-center text-[10px]">
                        {el.electronConfig || 'نامشخص'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  root.Compare = Compare;
})(window);
