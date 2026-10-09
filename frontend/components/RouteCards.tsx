import { RoutesResponse, RouteData } from '@/lib/types';
import { Zap, ShieldCheck, Leaf } from 'lucide-react';

export default function RouteCards({ data, selectedRoute, onSelect }: { data: RoutesResponse, selectedRoute: string | null, onSelect: (id: string) => void }) {
  const { fastest, balanced, cleanest } = data.routes;

  const calculateReduction = (base: number, value: number) => {
    if (base === 0) return 0;
    return Math.max(0, ((base - value) / base) * 100).toFixed(1);
  };

  const renderCard = (id: string, title: string, route: RouteData, icon: React.ReactNode, colorClass: string, isFastest: boolean) => {
    const isSelected = selectedRoute === id;
    const extraTime = Math.max(0, Math.round(route.duration_min - fastest.duration_min));
    const reduction = isFastest ? '0' : calculateReduction(fastest.inhaled_mass_ug, route.inhaled_mass_ug);

    const isBalanced = id === 'balanced';

    const colorStyles: Record<string, any> = {
      coral: { border: 'border-coral-500', bg: 'bg-coral-50/60', text: 'text-coral-700' },
      emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50/60', text: 'text-emerald-700' },
      teal: { border: 'border-teal-500', bg: 'bg-teal-50/60', text: 'text-teal-700' }
    };

    const c = colorStyles[colorClass];

    return (
      <button 
        aria-label={`Select ${title} route`}
        onClick={() => onSelect(id)}
        className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden
          ${isSelected ? `${c.border} ${c.bg} shadow-md scale-[1.02]` : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
      >
        {isBalanced && isSelected && (
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
            Best Trade-off
          </div>
        )}

        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-2 rounded-full ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-100'} transition-colors`}>
             {icon}
          </div>
          <h3 className={`font-extrabold text-lg tracking-tight ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{title}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-2">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{Math.round(route.duration_min)} <span className="text-sm font-semibold text-slate-500 tracking-normal">min</span></div>
            {!isFastest && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">+{extraTime} min</div>}
            {isFastest && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Fastest</div>}
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{route.inhaled_mass_ug.toFixed(1)} <span className="text-sm font-semibold text-slate-500 tracking-normal">µg</span></div>
            {!isFastest && <div className={`text-xs font-bold ${c.text} mt-1 uppercase tracking-widest`}>{reduction}% lower</div>}
            {isFastest && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Est. Inhaled</div>}
          </div>
        </div>

        {/* Tradeoff Visualization */}
        {!isFastest && isSelected && (
          <div className="mt-6 pt-5 border-t border-slate-200/60">
             <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
               <span>Time vs Exposure Trade-off</span>
             </div>
             
             <div className="space-y-4">
                {/* Time row */}
                <div className="flex items-center text-xs font-semibold">
                   <div className="w-12 text-slate-400">TIME</div>
                   <div className="flex-1 flex items-center px-3">
                     <span className="text-coral-600">{Math.round(fastest.duration_min)}m</span>
                     <div className="flex-1 h-px bg-slate-300 mx-3 relative">
                       <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-slate-400 rotate-45"></div>
                     </div>
                     <span className="text-slate-800">{Math.round(route.duration_min)}m</span>
                   </div>
                </div>

                {/* Exposure row */}
                <div className="flex items-center text-xs font-semibold">
                   <div className="w-12 text-slate-400">PM2.5</div>
                   <div className="flex-1 flex items-center px-3">
                     <span className="text-coral-600">{fastest.inhaled_mass_ug.toFixed(1)}µg</span>
                     <div className="flex-1 h-px bg-emerald-300 mx-3 relative">
                        <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-emerald-500 rotate-45"></div>
                     </div>
                     <span className={c.text}>{route.inhaled_mass_ug.toFixed(1)}µg</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {renderCard('fastest', 'Fastest', fastest, <Zap className="w-5 h-5 text-coral-500" />, 'coral', true)}
      {renderCard('balanced', 'Balanced', balanced, <ShieldCheck className="w-5 h-5 text-emerald-500" />, 'emerald', false)}
      {renderCard('cleanest', 'Cleanest', cleanest, <Leaf className="w-5 h-5 text-teal-500" />, 'teal', false)}
    </div>
  );
}
