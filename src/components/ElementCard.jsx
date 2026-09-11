import React from 'react';
import { CATEGORIES, getPhaseAtTemp, fmt } from '../utils/chemistry';

/**
 * ElementCard: Individual Periodic Table Cell Component.
 * Displays atomic number, mass, symbol, Persian name, and dynamic phase indicator at temperature.
 *
 * @param {object} props
 * @param {object} props.element - Element data
 * @param {number} props.temperatureK - Current Kelvin temperature
 * @param {boolean} props.isSelected - Whether element is currently selected
 * @param {boolean} props.isHovered - Whether element is hovered
 * @param {boolean} props.isCompared - Whether element is in comparison list
 * @param {boolean} props.isFilteredOut - Whether element is dimmed by active filters
 * @param {string} props.trendProperty - Currently active heatmap trend property
 * @param {string} props.trendStyle - Precomputed CSS classes for property heatmap
 * @param {function} props.onSelect - Callback on element click
 * @param {function} props.onHover - Callback on element mouse enter
 * @param {function} props.onToggleCompare - Callback on right-click to compare
 */
export const ElementCard = ({
  element,
  temperatureK = 298,
  isSelected = false,
  isHovered = false,
  isCompared = false,
  isFilteredOut = false,
  trendProperty = 'none',
  trendStyle = '',
  onSelect,
  onHover,
  onToggleCompare,
}) => {
  if (!element) return null;

  const currentPhase = getPhaseAtTemp(element, temperatureK);
  const catConfig = CATEGORIES[element.category] || {
    bg: 'bg-slate-800 border-slate-700 text-slate-300',
    hex: '#64748b',
  };

  const getPhaseDotColor = (phase) => {
    if (phase.includes('جامد')) return 'bg-slate-400 shadow-slate-400/50';
    if (phase.includes('مایع')) return 'bg-cyan-400 shadow-cyan-400/50';
    if (phase.includes('گاز')) return 'bg-rose-400 shadow-rose-400/50';
    return 'bg-slate-600';
  };

  const stylePosition = {
    gridColumn: element.gridColumn ?? element.group,
    gridRow: element.gridRow ?? element.period,
  };

  return (
    <div
      style={stylePosition}
      onClick={() => onSelect && onSelect(element)}
      onMouseEnter={() => onHover && onHover(element)}
      onContextMenu={(e) => onToggleCompare && onToggleCompare(element, e)}
      className={`
        relative flex flex-col justify-between p-1 rounded-xl border cursor-pointer transition-all duration-200 select-none
        ${trendProperty !== 'none' ? trendStyle : catConfig.bg}
        ${isSelected ? 'ring-2 ring-cyan-400 scale-105 z-20 shadow-xl neon-border-cyan' : 'hover:scale-105 hover:z-10'}
        ${isCompared ? 'ring-2 ring-amber-400 border-amber-400 neon-border-amber' : ''}
        ${isFilteredOut ? 'opacity-10 grayscale pointer-events-none' : ''}
      `}
      title={`${element.nameFa} (${element.symbol}) - Z=${element.number} | فاز: ${currentPhase} در ${temperatureK}K`}
    >
      {/* Top Header: Atomic Number & Mass */}
      <div className="flex justify-between items-center text-[9px] font-mono opacity-80 pointer-events-none">
        <span className="font-bold">{element.number}</span>
        <span className="truncate max-w-[36px]">{fmt(element.atomicMass)}</span>
      </div>

      {/* Center: Chemical Symbol */}
      <div className="text-center font-black text-base tracking-wide my-0.5 pointer-events-none">
        {element.symbol}
      </div>

      {/* Bottom Footer: Persian Name & Phase Indicator */}
      <div className="flex justify-between items-center text-[8px] px-0.5 font-sans pointer-events-none">
        <span className="truncate max-w-[42px]">{element.nameFa}</span>
        <span
          className={`w-1.5 h-1.5 rounded-full shadow-sm ${getPhaseDotColor(currentPhase)}`}
          title={`حالت در ${temperatureK}K: ${currentPhase}`}
        />
      </div>

      {/* Comparison Badge Checkmark */}
      {isCompared && (
        <div
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center shadow"
          title="انتخاب شده برای مقایسه"
        >
          ✓
        </div>
      )}
    </div>
  );
};

export default ElementCard;
