import Link from 'next/link';
import { Wind } from 'lucide-react';

export default function Header({ active }: { active: 'move' | 'shield' }) {
  return (
    <header className="flex items-center px-8 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 justify-between fixed top-0 w-full z-50 shadow-sm">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center group">
          <Wind className="w-7 h-7 text-emerald-600 mr-2 group-hover:rotate-12 transition-transform duration-500" />
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">AeroShift</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Air-aware mobility</span>
          </div>
        </Link>
      </div>

      <nav className="flex space-x-1 border border-slate-200 rounded-full p-1 bg-slate-50">
        <Link href="/" className={`flex items-center px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${active === 'move' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
           Move
        </Link>
        <Link href="/shield" className={`flex items-center px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${active === 'shield' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}`}>
           Shield
        </Link>
      </nav>

      <div className="flex items-center">
        <div className="flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
          <span className="text-xs font-bold text-emerald-700 tracking-wide">Network Connected</span>
        </div>
      </div>
    </header>
  );
}
