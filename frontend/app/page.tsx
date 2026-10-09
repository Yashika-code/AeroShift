'use client';

import { useState } from 'react';
import RouteSelector from '@/components/RouteSelector';
import MapView from '@/components/MapView';
import RouteCards from '@/components/RouteCards';
import LoadingState from '@/components/LoadingState';
import Header from '@/components/Header';
import { fetchRoutes } from '@/lib/api';
import { RoutesResponse, Mode } from '@/lib/types';
import { ShieldCheck, Info } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<RoutesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const handleSearch = async (origin: [number, number], destination: [number, number], mode: Mode) => {
    setLoading(true);
    setError(null);
    setData(null);
    setIsDemo(false);
    setExplanation(null);
    try {
      const result = await fetchRoutes(origin, destination, mode) as RoutesResponse & { _demoMode?: boolean };
      if (result._demoMode) {
        setIsDemo(true);
      }
      setData(result);
      setSelectedRoute('balanced');
      
      // Fetch explanation asynchronously
      if (result.routes.fastest && result.routes.balanced) {
        setExplaining(true);
        fetch('/api/routes/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fastest: result.routes.fastest, balanced: result.routes.balanced })
        })
        .then(res => res.json())
        .then(data => {
            if (data.explanation) setExplanation(data.explanation);
        })
        .finally(() => setExplaining(false));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Route intelligence is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedData = data && selectedRoute ? data.routes[selectedRoute as keyof typeof data.routes] : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Header active="move" />
      <div className="pt-14 h-full w-full flex flex-col">
        {isDemo && <div className="bg-amber-100 text-amber-900 text-xs font-extrabold text-center py-1.5 uppercase tracking-widest shadow-sm flex-shrink-0 z-40">Demo Mode - Offline Data</div>}

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col md:h-full max-h-[50vh] md:max-h-none bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto">
          <div className="p-6 space-y-8">
            <RouteSelector onSearch={handleSearch} />
            
            {loading && <LoadingState />}
            
            {error && (
              <div className="p-5 bg-red-50 text-red-800 rounded-2xl border border-red-200 text-sm font-medium shadow-sm">
                {error}
              </div>
            )}
            
            {data && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <RouteCards 
                  data={data} 
                  selectedRoute={selectedRoute} 
                  onSelect={setSelectedRoute} 
                />
                
                {/* Bedrock Explanation */}
                {(explanation || explaining) && (
                  <div className="mt-6 p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Why This Route?
                      </h3>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-100/50 px-2 py-0.5 rounded-full">AI Summary</span>
                    </div>
                    {explaining ? (
                       <div className="space-y-2 animate-pulse mt-3">
                         <div className="h-3 bg-indigo-200/50 rounded w-full"></div>
                         <div className="h-3 bg-indigo-200/50 rounded w-4/5"></div>
                       </div>
                    ) : (
                       <p className="text-sm text-indigo-900 leading-relaxed font-medium">{explanation}</p>
                    )}
                  </div>
                )}

                {/* Calculation detail & disclaimer */}
                {selectedData && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-slate-400" />
                      How AeroShift calculates this
                    </h4>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                       <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                         <span>Modeled PM2.5</span>
                         <span>×</span>
                         <span>Ventilation Rate</span>
                         <span>×</span>
                         <span>Travel Time</span>
                       </div>
                       <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 mb-2">
                         <span>=</span>
                         <span className="text-emerald-600">Estimated Inhaled Mass</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Exposure values are <strong className="text-slate-700">modeled ambient estimates</strong> derived from nearby monitoring stations, not direct roadside measurements.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Modeled exposure is intended for route comparison, <strong className="text-slate-700">not medical advice.</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !data && !error && (
              <div className="text-center p-10 text-slate-400 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-sm font-medium">Select a preset above to model and compare routes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 w-full h-[50vh] md:h-full p-4 md:p-6 bg-slate-100 min-h-[300px]">
          <MapView data={data} selectedRoute={selectedRoute} />
        </div>
      </main>
      </div>
    </div>
  );
}
