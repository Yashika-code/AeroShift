import { useState } from 'react';
import { Mode } from '@/lib/types';
import { Navigation2, Bike, Car, Footprints } from 'lucide-react';

const PRESETS = [
  { name: 'DTU to Connaught Place', origin: [28.7499, 77.1165] as [number, number], destination: [28.6315, 77.2167] as [number, number] },
  { name: 'Rohini to India Gate', origin: [28.7383, 77.0822] as [number, number], destination: [28.6129, 77.2295] as [number, number] },
  { name: 'Delhi Airport to Red Fort', origin: [28.5562, 77.1000] as [number, number], destination: [28.6562, 77.2410] as [number, number] },
  { name: 'Noida City Center to Cyber Hub', origin: [28.5746, 77.3561] as [number, number], destination: [28.4950, 77.0895] as [number, number] },
  { name: 'South Ex to Vasant Kunj', origin: [28.5677, 77.2212] as [number, number], destination: [28.5293, 77.1541] as [number, number] }
];

interface RouteSelectorProps {
  onSearch: (origin: [number, number], destination: [number, number], mode: Mode) => void;
}

export default function RouteSelector({ onSearch }: RouteSelectorProps) {
  const [mode, setMode] = useState<Mode>('two_wheeler');
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleSelect = (idx: number, preset: typeof PRESETS[0]) => {
    setActivePreset(idx);
    onSearch(preset.origin, preset.destination, mode);
  };

  const originText = activePreset !== null ? PRESETS[activePreset].name.split(' to ')[0] : 'Choose a suggested route below';
  const destText = activePreset !== null ? PRESETS[activePreset].name.split(' to ')[1] : '...';

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Route Planner</h2>
        <p className="text-xs text-slate-500 font-medium">Choose a route based on time and estimated particulate exposure.</p>
      </div>

      {/* Modes */}
      <div className="flex p-1 bg-slate-100/80 rounded-xl mb-6">
        <button onClick={() => setMode('two_wheeler')} className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'two_wheeler' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
          <Bike className="w-4 h-4 mr-2" /> Two-wheeler
        </button>
        <button onClick={() => setMode('car')} className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'car' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
          <Car className="w-4 h-4 mr-2" /> Car
        </button>
        <button onClick={() => setMode('active')} className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'active' ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
          <Footprints className="w-4 h-4 mr-2" /> Active
        </button>
      </div>

      <div className="space-y-3 relative mb-8">
        <div className="absolute left-4 top-5 bottom-5 w-[2px] bg-slate-200 z-0 flex flex-col justify-between items-center py-1">
           <div className="w-2 h-2 rounded-full bg-slate-400 absolute top-0 -left-[3px]"></div>
           <div className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 -left-[3px]"></div>
        </div>

        <div className="relative z-10 pl-10">
           <input type="text" readOnly className={`w-full text-sm font-semibold px-4 py-3.5 bg-slate-50 border rounded-xl focus:outline-none cursor-not-allowed ${activePreset !== null ? 'border-emerald-200 text-slate-800' : 'border-slate-200 text-slate-500'} placeholder-slate-400 transition-colors`} value={originText} placeholder="Enter origin or pick a preset..." />
        </div>
        <div className="relative z-10 pl-10">
           <input type="text" readOnly className={`w-full text-sm font-semibold px-4 py-3.5 bg-slate-50 border rounded-xl focus:outline-none cursor-not-allowed ${activePreset !== null ? 'border-emerald-200 text-slate-800' : 'border-slate-200 text-slate-500'} placeholder-slate-400 transition-colors`} value={destText} placeholder="Enter destination or pick a preset..." />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Suggested Routes</p>
        {PRESETS.map((preset, idx) => {
          const isActive = activePreset === idx;
          return (
            <button
              key={idx}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center space-x-3 group ${isActive ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
              onClick={() => handleSelect(idx, preset)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                <Navigation2 className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`} />
              </div>
              <span className={`font-bold text-sm transition-colors ${isActive ? 'text-emerald-900' : 'text-slate-700 group-hover:text-emerald-900'}`}>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
