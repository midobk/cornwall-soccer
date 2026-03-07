import React from 'react';
import { ChevronLeft, DollarSign, Users, Layers, CheckCircle, Banknote, AlertCircle } from 'lucide-react';
import { useAppStore, computeCostPerPlayer, formatCost, formatTime, Player } from '../context/AppStore';

interface StatCardProps {
  iconName: 'users' | 'layers' | 'dollar';
  label: string;
  value: string;
  sublabel?: string;
  bg: string;
  iconColor: string;
  valueColor: string;
}

function StatCard({ iconName, label, value, sublabel, bg, iconColor, valueColor }: StatCardProps) {
  const icons = {
    users:  <Users size={22} color={iconColor} />,
    layers: <Layers size={22} color={iconColor} />,
    dollar: <DollarSign size={22} color={iconColor} />,
  };
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
      <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 48, height: 48, background: bg }}>{icons[iconName]}</div>
      <div className="flex-1">
        <p style={{ color: '#888', fontSize: 12, fontWeight: 500 }}>{label}</p>
        <p style={{ color: valueColor, fontWeight: 800, fontSize: 22 }}>{value}</p>
        {sublabel && <p style={{ color: '#aaa', fontSize: 11, marginTop: 1 }}>{sublabel}</p>}
      </div>
    </div>
  );
}

interface PlayerRowProps { player: Player; index: number; costPerPlayer: number; total: number; }

function PlayerRow({ player, index, costPerPlayer, total }: PlayerRowProps) {
  const cfg =
    player.status === 'paid'  ? { icon: '✅', color: '#15803d', bg: '#F0FAF4' } :
    player.status === 'cash'  ? { icon: '💵', color: '#1d4ed8', bg: '#EFF6FF' } :
                                { icon: '⏳', color: '#854d0e', bg: '#FEF9C3' };
  return (
    <div className="flex items-center gap-3 py-2" style={{ borderBottom: index < total - 1 ? '1px solid #F5F5F5' : 'none' }}>
      <span style={{ color: '#aaa', fontWeight: 600, fontSize: 13, width: 20 }}>{index + 1}</span>
      <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: '#0F5132', color: '#fff', fontWeight: 700, fontSize: 11 }}>{player.name[0].toUpperCase()}</div>
      <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#111' }}>{player.name}</span>
      <div className="rounded-full px-3 py-1 flex items-center gap-1" style={{ background: cfg.bg }}>
        <span style={{ fontSize: 12 }}>{cfg.icon}</span>
        <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{formatCost(costPerPlayer)}</span>
      </div>
    </div>
  );
}

interface Props { id: string; }

export function PaymentSummary({ id }: Props) {
  const { navigate, getMatch } = useAppStore();
  const match = getMatch(id);

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F7F7F7' }}>
        <p style={{ color: '#888' }}>Match not found</p>
      </div>
    );
  }

  const costPerPlayer  = computeCostPerPlayer(match);
  const totalPlayers   = match.players.length;
  const totalFieldCost = match.pricingMode === 'field' ? match.fieldCost * match.fields : match.pricePerPlayer * totalPlayers;

  const paidPlayers   = match.players.filter(p => p.status === 'paid');
  const cashPlayers   = match.players.filter(p => p.status === 'cash');
  const unpaidPlayers = match.players.filter(p => p.status === 'unpaid');

  const collected      = paidPlayers.length * costPerPlayer;
  const cashExpected   = cashPlayers.length * costPerPlayer;
  const remaining      = unpaidPlayers.length * costPerPlayer;

  const collectedPercent = totalPlayers > 0 ? (paidPlayers.length / totalPlayers) * 100 : 0;
  const cashPercent      = totalPlayers > 0 ? (cashPlayers.length / totalPlayers) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
        <button onClick={() => navigate({ name: 'match', id })} className="flex items-center gap-1 mb-4 opacity-80 active:opacity-60 transition-opacity">
          <ChevronLeft size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Back</span>
        </button>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 26 }}>💳 Payment Summary</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{match.name} · {formatTime(match.time)}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-3">
        <div className="space-y-3">
          <StatCard iconName="users" label="Total Players" value={`${totalPlayers} / ${match.maxPlayers}`} sublabel={`${match.maxPlayers - totalPlayers} spots remaining`} bg="#F0FAF4" iconColor="#0F5132" valueColor="#0F5132" />
          <StatCard iconName="layers" label="Total Field Cost" value={formatCost(totalFieldCost)} sublabel={match.pricingMode === 'field' ? `${match.fields} field${match.fields > 1 ? 's' : ''} × ${formatCost(match.fieldCost)}` : 'Fixed per player rate'} bg="#F0FAF4" iconColor="#0F5132" valueColor="#111" />
          <StatCard iconName="dollar" label="Cost per Player" value={formatCost(costPerPlayer)} sublabel="Per person split" bg="#FFF7ED" iconColor="#ea580c" valueColor="#ea580c" />
        </div>

        {/* Progress Section */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 12 }}>Collection Progress</p>
          <div className="rounded-full overflow-hidden mb-3" style={{ height: 10, background: '#EAEAEA' }}>
            <div className="flex h-full rounded-full overflow-hidden">
              <div style={{ width: `${collectedPercent}%`, background: '#1DB954', transition: 'width 0.5s' }} />
              <div style={{ width: `${cashPercent}%`, background: '#3b82f6', transition: 'width 0.5s' }} />
            </div>
          </div>
          <div className="flex justify-between text-xs mb-4" style={{ color: '#888', fontWeight: 500 }}>
            <span>0%</span>
            <span>{Math.round(collectedPercent + cashPercent)}% covered</span>
            <span>100%</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><CheckCircle size={18} color="#1DB954" /><span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Collected ({paidPlayers.length} players)</span></div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#1DB954' }}>{formatCost(collected)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Banknote size={18} color="#3b82f6" /><span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Cash Expected ({cashPlayers.length} players)</span></div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#3b82f6' }}>{formatCost(cashExpected)}</span>
            </div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #EAEAEA' }}>
              <div className="flex items-center gap-2"><AlertCircle size={18} color="#f59e0b" /><span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>Remaining Unpaid ({unpaidPlayers.length} players)</span></div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#f59e0b' }}>{formatCost(remaining)}</span>
            </div>
          </div>
        </div>

        {/* Player Breakdown */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 12 }}>Player Breakdown</p>
          {match.players.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center' }}>No players yet</p>
          ) : (
            <div>
              {match.players.map((p, i) => (
                <PlayerRow key={p.id} player={p} index={i} costPerPlayer={costPerPlayer} total={match.players.length} />
              ))}
            </div>
          )}
        </div>

        {/* Total Summary */}
        <div className="rounded-2xl p-4" style={{ background: '#0F5132' }}>
          <div className="flex justify-between items-center">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>Total Expected</p>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>{formatCost(totalFieldCost)}</p>
            </div>
            <div className="text-right">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500 }}>Covered</p>
              <p style={{ color: '#1DB954', fontWeight: 800, fontSize: 28 }}>{formatCost(collected + cashExpected)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="flex justify-between">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Still needed</p>
              <p style={{ color: remaining > 0 ? '#fbbf24' : '#1DB954', fontWeight: 700, fontSize: 15 }}>{remaining > 0 ? formatCost(remaining) : '🎉 Fully covered!'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
