'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ShieldAlert, TrendingUp, Download, Loader2, Activity } from 'lucide-react';

export default function ShieldPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState('Central School District');

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/shield/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_name: facility })
      });
      
      if (!response.ok) {
         throw new Error("Operational advisory is temporarily unavailable. Please try again.");
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header active="shield" />
      <div className="pt-14 w-full">
      {data && data._demoMode && <div className="bg-amber-100 text-amber-900 text-xs font-extrabold text-center py-1.5 uppercase tracking-widest shadow-sm z-40 relative">Demo Mode - Offline Data</div>}

      <main className="flex-1 max-w-5xl mx-auto w-full p-8 pb-20">
        <div className="mb-10 text-center max-w-2xl mx-auto mt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-5 shadow-sm ring-1 ring-indigo-200">
             <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">AeroShift Shield</h2>
          <p className="text-slate-500 font-medium">Operational air-quality guidance for schools and facilities based on modeled ambient PM2.5 monitoring.</p>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-12 flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-3 max-w-2xl mx-auto relative z-10">
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2 pt-1">Facility Name</label>
            <input 
              type="text" 
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold text-slate-700 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleFetch}
            disabled={loading || !facility}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 shadow-sm md:mb-0 h-[50px] flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Advisory"}
          </button>
        </div>

        {error && (
          <div className="p-5 bg-red-50 text-red-800 rounded-2xl border border-red-200 mb-8 max-w-2xl mx-auto text-center font-medium shadow-sm animate-in fade-in">
            {error}
          </div>
        )}

        {loading && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
             <div className="md:col-span-1 h-[300px] bg-slate-200/50 rounded-3xl border border-slate-100"></div>
             <div className="md:col-span-2 h-[300px] bg-slate-200/50 rounded-3xl border border-slate-100"></div>
          </div>
        )}

        {data && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            
            {/* Raw Monitoring Data Side */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5" /> Monitoring Data
                 </h3>
                 
                 <div className="mb-6 relative z-10">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Latest Observed PM2.5</p>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">{data.latest_pm25} <span className="text-lg font-semibold text-slate-400 tracking-normal">µg/m³</span></div>
                 </div>

                 <div className="mb-6 relative z-10">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Recent Peak</p>
                    <div className="text-2xl font-bold text-slate-700">{data.max_pm25} <span className="text-sm text-slate-400">µg/m³</span></div>
                 </div>

                 <div className="relative z-10">
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Trend Direction</p>
                    <div className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg font-bold capitalize text-sm border border-orange-100">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {data.trend_direction}
                    </div>
                 </div>
              </div>
            </div>

            {/* AI Advisory Side */}
            <div className="md:col-span-2">
              <div className="bg-indigo-50/80 p-8 rounded-3xl border border-indigo-100/80 h-full flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-indigo-100/50">
                  <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Operational Advisory
                  </h3>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide shadow-sm ${data.advisory.risk_level === 'High' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {data.advisory.risk_level} RISK
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">OBSERVED</h4>
                    <p className="text-sm text-indigo-900 font-semibold mb-2">{data.advisory.observed_window}</p>
                    <p className="text-sm text-indigo-800 leading-relaxed">{data.advisory.basis}</p>
                  </div>
                  
                  <div className="bg-white/60 p-5 rounded-2xl border border-indigo-100/50">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">RECOMMENDED ACTIONS</h4>
                    <ul className="space-y-3">
                      {data.advisory.recommended_actions.map((action: string, idx: number) => (
                        <li key={idx} className="flex items-start text-indigo-900 text-sm font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 mr-3 flex-shrink-0"></span>
                          <span className="leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-indigo-100/50">
                   <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">AI-Generated • Not Medical Advice</p>
                   <button className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100 hover:shadow">
                      <Download className="w-4 h-4 mr-2" />
                      Export Summary
                   </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
      </div>
    </div>
  );
}
