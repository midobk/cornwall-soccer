import React, { useState } from 'react';
import { ChevronLeft, Copy, Check, MessageCircle } from 'lucide-react';
import { useAppStore, computeCostPerPlayer, formatCost, formatTime } from '../context/AppStore';

interface Props { id: string; }

export function ShareSummary({ id }: Props) {
  const { navigate, getMatch } = useAppStore();
  const [copied, setCopied] = useState(false);
  const match = getMatch(id);

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F7F7F7' }}>
        <p style={{ color: '#888' }}>Match not found</p>
      </div>
    );
  }

  const costPerPlayer = computeCostPerPlayer(match);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const generateSummary = () => {
    const lines: string[] = [];
    lines.push(`⚽ ${match.name} – ${formatTime(match.time)}`);
    lines.push(`📅 ${formatDate(match.date)}`);
    lines.push(`🏟️ ${match.fields} field${match.fields > 1 ? 's' : ''}`);
    lines.push('');
    lines.push(`Players (${match.players.length}/${match.maxPlayers})`);
    lines.push('');
    match.players.forEach((p, i) => {
      const statusIcon = p.status === 'paid' ? '✅' : p.status === 'cash' ? '💵' : '';
      lines.push(`${i + 1}. ${p.name} ${statusIcon}`.trim());
    });
    lines.push('');
    if (match.registrationClosed) {
      const perSide = Math.floor(match.players.length / 2);
      lines.push(`🔒 REGISTRATION CLOSED – ${perSide}v${perSide}`);
    }
    lines.push('');
    lines.push(`💰 ${formatCost(costPerPlayer)} per player`);
    lines.push(`📧 Send payment to:`);
    lines.push(`${match.paymentEmail}`);
    return lines.join('\n');
  };

  const summaryText = generateSummary();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch {
      const el = document.createElement('textarea');
      el.value = summaryText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
        <button onClick={() => navigate({ name: 'match', id })} className="flex items-center gap-1 mb-4 opacity-80 active:opacity-60 transition-opacity">
          <ChevronLeft size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Back</span>
        </button>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 26 }}>📤 Share Summary</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Ready to share on WhatsApp</p>
      </div>

      {/* Preview Box */}
      <div className="flex-1 px-4 py-5">
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontWeight: 700, fontSize: 14, color: '#555' }}>Message Preview</p>
            <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all active:scale-95"
              style={{ background: copied ? '#F0FAF4' : '#F5F5F5', color: copied ? '#0F5132' : '#555', fontWeight: 600, fontSize: 13 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="rounded-xl p-4 whitespace-pre-wrap" style={{ background: '#F0FAF4', fontFamily: 'monospace', fontSize: 13, color: '#111', lineHeight: 1.7, border: '1px solid #EAEAEA' }}>
            {summaryText}
          </div>
        </div>

        {/* Status Legend */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 10 }}>Status Legend</p>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2"><span style={{ fontSize: 16 }}>✅</span><span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Paid online</span></div>
            <div className="flex items-center gap-2"><span style={{ fontSize: 16 }}>💵</span><span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Paying cash</span></div>
            <div className="flex items-center gap-2"><span style={{ fontSize: 16 }}>⬜</span><span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Unpaid</span></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Players', value: `${match.players.length}`,                                  emoji: '👥', bg: '#F0FAF4', color: '#0F5132' },
            { label: 'Paid',          value: `${match.players.filter(p => p.status === 'paid').length}`, emoji: '✅', bg: '#F0FAF4', color: '#15803d' },
            { label: 'Per Player',    value: formatCost(costPerPlayer),                                   emoji: '💰', bg: '#FFF7ED', color: '#ea580c' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: stat.bg }}>
              <span style={{ fontSize: 20 }}>{stat.emoji}</span>
              <p style={{ fontWeight: 800, fontSize: 18, color: stat.color, marginTop: 2 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp Button */}
        <button onClick={handleWhatsApp} className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95"
          style={{ background: '#25D366', color: '#fff', fontWeight: 800, fontSize: 17 }}>
          <MessageCircle size={22} /> Share to WhatsApp
        </button>
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 12 }}>Opens WhatsApp with the match summary pre-filled</p>
      </div>
    </div>
  );
}
