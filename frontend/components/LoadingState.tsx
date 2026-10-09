export default function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse mt-6">
      <div className="h-[120px] bg-slate-200 rounded-2xl w-full border border-slate-100"></div>
      <div className="h-[120px] bg-slate-200 rounded-2xl w-full border border-slate-100"></div>
      <div className="h-[120px] bg-slate-200 rounded-2xl w-full border border-slate-100"></div>
      <div className="flex justify-center pt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Modeling estimated exposure...</p>
      </div>
    </div>
  );
}
