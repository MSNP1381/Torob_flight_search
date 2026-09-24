import React from 'react';
import { KeyRound, ShieldCheck, Copy, Check, Info, Code, Layers } from 'lucide-react';

interface GroupingKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightCard: {
    id: string;
    groupingKey: string;
    airline: { name: string; nameFa: string; code: string; iata: string };
    flightNumber: string;
    origin: string;
    destination: string;
    departureAt: string;
    cabin: string;
    providers: Array<{ provider: string; totalPrice: number }>;
  } | null;
}

export const GroupingKeyModal: React.FC<GroupingKeyModalProps> = ({
  isOpen,
  onClose,
  flightCard,
}) => {
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [copiedHash, setCopiedHash] = React.useState(false);

  if (!isOpen || !flightCard) return null;

  const copyToClipboard = (text: string, isKey: boolean) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Flight Grouping Key & Identity</h3>
              <p className="text-xs text-slate-400">Deterministic deduplication and multi-provider grouping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Grouping Key Explanation */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-400" /> Canonical Grouping Key
            </span>
            <button
              onClick={() => copyToClipboard(flightCard.groupingKey, true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-xs bg-slate-900 px-3 py-2 rounded-lg text-emerald-400 border border-slate-800 break-all select-all">
            {flightCard.groupingKey}
          </div>
        </div>

        {/* Generated Hash / ID */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Flight ID (Card Unique Key)
            </span>
            <button
              onClick={() => copyToClipboard(flightCard.id, false)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedHash ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-xs bg-slate-900 px-3 py-2 rounded-lg text-amber-300 border border-slate-800 select-all">
            {flightCard.id}
          </div>
        </div>

        {/* Algorithm Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Formula & Key Components:
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Airline IATA</span>
              <span className="font-bold text-white font-mono">{flightCard.airline.iata} ({flightCard.airline.name})</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Flight Number</span>
              <span className="font-bold text-white font-mono">{flightCard.flightNumber}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Route (Origin → Destination)</span>
              <span className="font-bold text-white font-mono">{flightCard.origin} → {flightCard.destination}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-500 block text-[10px]">Normalized Departure Time</span>
              <span className="font-bold text-white font-mono">
                {new Date(flightCard.departureAt).toISOString().slice(0, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Providers matched */}
        <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs text-blue-200 space-y-1">
          <div className="font-semibold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Multi-Provider Aggregation Match
          </div>
          <p className="text-slate-300 text-[11px]">
            {flightCard.providers.length} crawler feeds (Alibaba, FlyToday, SafarMarket) returned the exact same physical flight schedule and were merged under this unified card.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
