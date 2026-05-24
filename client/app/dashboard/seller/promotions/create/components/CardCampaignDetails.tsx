import { usePromotionFormStore } from '../store';
import { SectionCard } from './SectionCard';
import { Tag } from 'lucide-react';

const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35";

const GOAL_CHIPS = ["Product Launch", "Seasonal Sale", "Boost Visibility", "Flash Offer", "New Release"];

export function CardCampaignDetails({ locked }: { locked: boolean }) {
  const { 
    promotionGoal, goalChipSelected, requestedDuration, customDuration, adminNotes, 
    setCampaignDetails 
  } = usePromotionFormStore();

  const handleChipSelect = (chip: string) => {
    setCampaignDetails({ goalChipSelected: chip, promotionGoal: chip });
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
      <div className="space-y-8">
        
        {/* Promotion Goal */}
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            What is the primary goal of this promotion?
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
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
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Requested Duration
          </label>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
            {[3, 7, 14, 30, 'custom'].map(val => {
              const isActive = val === 'custom' ? requestedDuration === -1 : requestedDuration === val;
              return (
                <button
                  key={val}
                  onClick={() => handleDurationSelect(val as any)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
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
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
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
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1.5">
            Notes for Admin (Optional)
          </label>
          <textarea 
            value={adminNotes}
            onChange={(e) => setCampaignDetails({ adminNotes: e.target.value })}
            placeholder="Any additional context for the review team..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

      </div>
    </SectionCard>
  );
}
