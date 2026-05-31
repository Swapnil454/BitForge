import { useState, useRef, useEffect } from 'react';
import { usePromotionFormStore } from '../store';
import { SectionCard } from './SectionCard';
import { Tag, ChevronDown, Check } from 'lucide-react';

const inputClass = "w-full rounded-xl md:rounded-2xl border border-slate-200 bg-white px-3 py-2 md:px-4 md:py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

const GOAL_CHIPS = ["Product Launch", "Seasonal Sale", "Boost Visibility", "Flash Offer", "New Release"];

export function CardCampaignDetails({ locked }: { locked: boolean }) {
  const { 
    promotionGoal, goalChipSelected, requestedDuration, customDuration, adminNotes, 
    setCampaignDetails 
  } = usePromotionFormStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChipSelect = (chip: string) => {
    setCampaignDetails({ goalChipSelected: chip, promotionGoal: chip });
    setIsDropdownOpen(false);
  };

  const handleDurationSelect = (val: number | 'custom') => {
    if (val === 'custom') {
      setCampaignDetails({ requestedDuration: -1 }); // -1 indicates custom is active
    } else {
      setCampaignDetails({ requestedDuration: val as number, customDuration: '' });
    }
  };

  return (
    <SectionCard stepNumber={3} title="Campaign Details" locked={locked}>
      <div className="space-y-4 md:space-y-8">
        
        {/* Promotion Goal */}
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
            What is the primary goal of this promotion?
          </label>
          
          {/* Desktop Chips */}
          <div className="hidden md:flex flex-wrap gap-2 mb-4">
            {GOAL_CHIPS.map(chip => {
              const isSelected = goalChipSelected === chip;
              return (
                <button
                  key={chip}
                  onClick={() => handleChipSelect(chip)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 shadow-md scale-105' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Mobile Custom Dropdown */}
          <div className="md:hidden mb-2 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs font-bold transition outline-none dark:bg-[#0a0a0f] ${
                isDropdownOpen ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-white/10'
              }`}
            >
              <span className={goalChipSelected ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                {goalChipSelected || "Select a preset goal..."}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#12121a] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-48 overflow-y-auto px-1.5">
                  {GOAL_CHIPS.map(chip => {
                    const isSelected = chip === goalChipSelected;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleChipSelect(chip)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors mb-0.5 last:mb-0 ${
                          isSelected 
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 font-bold' 
                            : 'text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/5 font-medium'
                        }`}
                      >
                        <span className="truncate pr-4">{chip}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <input 
            type="text"
            value={promotionGoal}
            onChange={(e) => setCampaignDetails({ promotionGoal: e.target.value, goalChipSelected: '' })}
            placeholder="Or type your specific goal here..."
            className={inputClass}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
            Requested Duration
          </label>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 md:p-1.5 rounded-xl md:rounded-2xl">
            {[3, 7, 14, 30, 'custom'].map(val => {
              const isActive = val === 'custom' ? requestedDuration === -1 : requestedDuration === val;
              return (
                <button
                  key={val}
                  onClick={() => handleDurationSelect(val as any)}
                  className={`flex-1 py-1.5 md:py-2.5 text-[10px] md:text-sm font-bold rounded-lg md:rounded-xl transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                  }`}
                >
                  {val === 'custom' ? 'Custom' : `${val} days`}
                </button>
              );
            })}
          </div>
          
          {requestedDuration === -1 && (
            <div className="mt-2 md:mt-4 animate-in fade-in slide-in-from-top-2">
              <input 
                type="number"
                min={1}
                value={customDuration}
                onChange={(e) => setCampaignDetails({ customDuration: e.target.value })}
                placeholder="Enter number of days..."
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 md:mb-1.5">
            Notes for Admin (Optional)
          </label>
          <textarea 
            value={adminNotes}
            onChange={(e) => setCampaignDetails({ adminNotes: e.target.value })}
            placeholder="Any additional context for the review team..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

      </div>
    </SectionCard>
  );
}
