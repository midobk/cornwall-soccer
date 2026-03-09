import React, { useState } from 'react';
import {
  ChevronLeft, Users, Layers, Clock, Mail, DollarSign,
  UserPlus, Lock, Unlock, Trash2, ChevronRight, X, Check, LogOut, FileText,
} from 'lucide-react';
import {
  useAppStore, computeCostPerPlayer, formatCost, formatTime,
  PaymentStatus, Player,
} from '../context/AppStore';
import { ImportMatchModal } from './ImportMatchModal';

const STATUS_CONFIG: Record<PaymentStatus, { icon: string; label: string; bg: string; color: string }> = {
  paid:   { icon: '✅', label: 'Paid',   bg: '#F0FAF4', color: '#15803d' },
  unpaid: { icon: '⏳', label: 'Unpaid', bg: '#FEF9C3', color: '#854d0e' },
  cash:   { icon: '💵', label: 'Cash',   bg: '#EFF6FF', color: '#1d4ed8' },
};

interface PlayerCardProps {
  player: Player;
  matchId: string;
  expandedPlayerId: string | null;
  onToggleExpand: (id: string | null) => void;
  onUpdateStatus: (matchId: string, playerId: string, status: PaymentStatus) => void;
  onRemove: (matchId: string, playerId: string) => void;
}

function PlayerCard({ player, matchId, expandedPlayerId, onToggleExpand, onUpdateStatus, onRemove }: PlayerCardProps) {
  const cfg = STATUS_CONFIG[player.status];
  const isExpanded = expandedPlayerId === player.id;
  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center px-4 py-3 cursor-pointer" onClick={() => onToggleExpand(isExpanded ? null : player.id)}>
        <div className="rounded-full flex items-center justify-center mr-3 shrink-0" style={{ width: 38, height: 38, background: '#0F5132', color: '#fff', fontWeight: 800, fontSize: 14 }}>
          {player.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{player.name}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full px-3 py-1 mr-2" style={{ background: cfg.bg }}>
          <span style={{ fontSize: 13 }}>{cfg.icon}</span>
          <span style={{ color: cfg.color, fontWeight: 600, fontSize: 12 }}>{cfg.label}</span>
        </div>
        <ChevronRight size={16} color="#ccc" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: '#EAEAEA' }}>
          <p style={{ color: '#888', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Update Status</p>
          <div className="flex gap-2 flex-wrap">
            {(['paid', 'unpaid', 'cash'] as PaymentStatus[]).map(s => (
              <button key={s} onClick={() => { onUpdateStatus(matchId, player.id, s); onToggleExpand(null); }}
                className="rounded-lg px-3 py-1.5 transition-all active:scale-95"
                style={{ background: player.status === s ? STATUS_CONFIG[s].bg : '#F5F5F5', color: player.status === s ? STATUS_CONFIG[s].color : '#555', fontWeight: 600, fontSize: 13, border: player.status === s ? `1.5px solid ${STATUS_CONFIG[s].color}` : '1.5px solid #EAEAEA' }}>
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </button>
            ))}
            <button onClick={() => { onRemove(matchId, player.id); onToggleExpand(null); }}
              className="rounded-lg px-3 py-1.5 flex items-center gap-1 transition-all active:scale-95"
              style={{ background: '#FEF2F2', color: '#dc2626', fontWeight: 600, fontSize: 13, border: '1.5px solid #fecaca' }}>
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  emoji: string;
  players: Player[];
  matchId: string;
  expandedPlayerId: string | null;
  onToggleExpand: (id: string | null) => void;
  onUpdateStatus: (matchId: string, playerId: string, status: PaymentStatus) => void;
  onRemove: (matchId: string, playerId: string) => void;
}

function Section({ title, emoji, players, matchId, expandedPlayerId, onToggleExpand, onUpdateStatus, onRemove }: SectionProps) {
  if (players.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{title}</h3>
        <span className="rounded-full px-2 py-0.5 ml-1" style={{ background: '#EAEAEA', color: '#555', fontSize: 12, fontWeight: 700 }}>{players.length}</span>
      </div>
      {players.map(p => (
        <PlayerCard key={p.id} player={p} matchId={matchId} expandedPlayerId={expandedPlayerId} onToggleExpand={onToggleExpand} onUpdateStatus={onUpdateStatus} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface Props { id: string; }

export function MatchDetails({ id }: Props) {
  const { navigate, getMatch, addPlayer, updatePlayerStatus, removePlayer, closeRegistration, openRegistration } = useAppStore();
  const match = getMatch(id);

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Leave Match flow
  const [showLeave, setShowLeave]         = useState(false);
  const [leaveName, setLeaveName]         = useState('');
  const [leaveConfirmPlayer, setLeaveConfirmPlayer] = useState<Player | null>(null);
  const [leaveError, setLeaveError]       = useState('');
  const [leaveSuccess, setLeaveSuccess]   = useState('');

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [registrationPinInput, setRegistrationPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAction, setPinAction] = useState<'open' | 'close' | null>(null);

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F7F7F7' }}>
        <p style={{ color: '#888' }}>Match not found</p>
      </div>
    );
  }

  const costPerPlayer = computeCostPerPlayer(match);
  const paidPlayers   = match.players.filter(p => p.status === 'paid');
  const unpaidPlayers = match.players.filter(p => p.status === 'unpaid');
  const cashPlayers   = match.players.filter(p => p.status === 'cash');
  const isFull        = match.players.length >= match.maxPlayers;

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    addPlayer(match.id, newPlayerName);
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  const handleJoin = () => {
    if (!joinName.trim()) return;
    addPlayer(match.id, joinName);
    setJoinName('');
    setShowJoin(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const sectionProps = { matchId: match.id, expandedPlayerId, onToggleExpand: setExpandedPlayerId, onUpdateStatus: updatePlayerStatus, onRemove: removePlayer };

  const handleLeaveSearch = () => {
    if (!leaveName.trim()) return;
    const found = match!.players.find(
      p => p.name.toLowerCase() === leaveName.trim().toLowerCase()
    );
    if (!found) {
      // Try partial match
      const partial = match!.players.find(
        p => p.name.toLowerCase().includes(leaveName.trim().toLowerCase())
      );
      if (partial) {
        setLeaveConfirmPlayer(partial);
        setLeaveError('');
      } else {
        setLeaveError(`No player named "${leaveName.trim()}" found in this match.`);
        setLeaveConfirmPlayer(null);
      }
    } else {
      setLeaveConfirmPlayer(found);
      setLeaveError('');
    }
  };

  const handleLeaveConfirm = () => {
    if (!leaveConfirmPlayer) return;
    removePlayer(match!.id, leaveConfirmPlayer.id);
    setLeaveSuccess(`${leaveConfirmPlayer.name} has left the match.`);
    setLeaveConfirmPlayer(null);
    setLeaveName('');
    setTimeout(() => {
      setLeaveSuccess('');
      setShowLeave(false);
    }, 2000);
  };

  const resetLeave = () => {
    setShowLeave(false);
    setLeaveName('');
    setLeaveConfirmPlayer(null);
    setLeaveError('');
    setLeaveSuccess('');
  };

  const resetPinPrompt = () => {
    setShowPinPrompt(false);
    setRegistrationPinInput('');
    setPinError('');
    setPinAction(null);
  };

  const handleToggleRegistration = () => {
    setPinAction(match.registrationClosed ? 'open' : 'close');
    setShowPinPrompt(true);
    setRegistrationPinInput('');
    setPinError('');
  };

  const handlePinConfirm = () => {
    if (!pinAction) return;
    if (!/^\d{4}$/.test(registrationPinInput)) {
      setPinError('PIN must be exactly 4 digits.');
      return;
    }
    const success =
      pinAction === 'open'
        ? openRegistration(match.id, registrationPinInput)
        : closeRegistration(match.id, registrationPinInput);
    if (!success) {
      setPinError('Incorrect PIN.');
      return;
    }
    resetPinPrompt();
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
        <button onClick={() => navigate({ name: 'list' })} className="flex items-center gap-1 mb-4 opacity-80 active:opacity-60 transition-opacity">
          <ChevronLeft size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Matches</span>
        </button>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>{match.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>{formatDate(match.date)}</p>
            </div>
            {match.registrationClosed && (
              <span className="rounded-full px-3 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}>CLOSED</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><Clock size={15} color="rgba(255,255,255,0.7)" /><span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{formatTime(match.time)}</span></div>
            <div className="flex items-center gap-2"><Layers size={15} color="rgba(255,255,255,0.7)" /><span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{match.fields} {match.fields === 1 ? 'field' : 'fields'}</span></div>
            <div className="flex items-center gap-2"><Users size={15} color="rgba(255,255,255,0.7)" /><span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{match.players.length}/{match.maxPlayers} players</span></div>
            <div className="flex items-center gap-2"><DollarSign size={15} color="rgba(255,255,255,0.7)" /><span style={{ color: '#1DB954', fontWeight: 800, fontSize: 15 }}>{formatCost(costPerPlayer)}/player</span></div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Mail size={14} color="rgba(255,255,255,0.6)" />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Pay to: <span style={{ color: '#fff', fontWeight: 600 }}>{match.paymentEmail}</span></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-0 px-4 py-3" style={{ background: '#fff', borderBottom: '1px solid #EAEAEA' }}>
        {[
          { label: '💳 Payment', screen: { name: 'payment', id } as const },
          { label: '👥 Teams',   screen: { name: 'teams',   id } as const },
          { label: '📤 Share',   screen: { name: 'share',   id } as const },
        ].map(tab => (
          <button key={tab.label} onClick={() => navigate(tab.screen)}
            className="flex-1 py-2 rounded-lg text-sm transition-all active:scale-95"
            style={{ color: '#0F5132', fontWeight: 600, fontSize: 13 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Players Section */}
      <div className="flex-1 px-4 pt-5 pb-40">
        {match.players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">👥</span>
            <p style={{ color: '#888', fontWeight: 500 }}>No players yet</p>
            <p style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>Add players below</p>
          </div>
        ) : (
          <>
            <Section title="Paid Players"   emoji="✅" players={paidPlayers}   {...sectionProps} />
            <Section title="Unpaid Players" emoji="⏳" players={unpaidPlayers} {...sectionProps} />
            <Section title="Cash Players"   emoji="💵" players={cashPlayers}   {...sectionProps} />
          </>
        )}
      </div>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3" style={{ background: 'rgba(247,247,247,0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #EAEAEA' }}>
        {showAddPlayer && (
          <div className="flex gap-2 mb-3">
            <input className="flex-1 rounded-xl px-4 py-3 outline-none" style={{ background: '#fff', border: '1.5px solid #0F5132', color: '#111', fontWeight: 500 }} placeholder="Player name" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPlayer()} autoFocus />
            <button onClick={handleAddPlayer} className="rounded-xl px-4 flex items-center justify-center" style={{ background: '#0F5132', color: '#fff' }}><Check size={20} /></button>
            <button onClick={() => { setShowAddPlayer(false); setNewPlayerName(''); }} className="rounded-xl px-4 flex items-center justify-center" style={{ background: '#EAEAEA', color: '#555' }}><X size={20} /></button>
          </div>
        )}
        {showJoin && (
          <div className="flex gap-2 mb-3">
            <input className="flex-1 rounded-xl px-4 py-3 outline-none" style={{ background: '#fff', border: '1.5px solid #1DB954', color: '#111', fontWeight: 500 }} placeholder="Your name" value={joinName} onChange={e => setJoinName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()} autoFocus />
            <button onClick={handleJoin} className="rounded-xl px-4 flex items-center justify-center" style={{ background: '#1DB954', color: '#fff' }}><Check size={20} /></button>
            <button onClick={() => { setShowJoin(false); setJoinName(''); }} className="rounded-xl px-4 flex items-center justify-center" style={{ background: '#EAEAEA', color: '#555' }}><X size={20} /></button>
          </div>
        )}

        {/* Leave Match flow */}
        {showLeave && (
          <div className="mb-3 rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1.5px solid #fecaca' }}>
            <div className="px-4 py-2.5" style={{ background: '#FEF2F2', borderBottom: '1px solid #fecaca' }}>
              <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>👋 Leave Match</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {leaveSuccess ? (
                <p style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>✅ {leaveSuccess}</p>
              ) : leaveConfirmPlayer ? (
                <>
                  <p style={{ fontSize: 13, color: '#555' }}>
                    Remove <span style={{ fontWeight: 700, color: '#111' }}>{leaveConfirmPlayer.name}</span> from this match?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={handleLeaveConfirm}
                      className="flex-1 rounded-xl py-2.5 transition-all active:scale-95"
                      style={{ background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      Yes, Leave
                    </button>
                    <button onClick={() => { setLeaveConfirmPlayer(null); setLeaveName(''); }}
                      className="rounded-xl px-4 py-2.5 transition-all active:scale-95"
                      style={{ background: '#EAEAEA', color: '#555', fontWeight: 600, fontSize: 14 }}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: '#555' }}>Enter your name to leave:</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                      style={{ background: '#F9F9F9', border: '1.5px solid #EAEAEA', color: '#111', fontWeight: 500, fontSize: 14 }}
                      placeholder="Your name"
                      value={leaveName}
                      onChange={e => { setLeaveName(e.target.value); setLeaveError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLeaveSearch()}
                      autoFocus
                    />
                    <button onClick={handleLeaveSearch}
                      className="rounded-xl px-4 flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#dc2626', color: '#fff' }}>
                      <Check size={18} />
                    </button>
                    <button onClick={resetLeave}
                      className="rounded-xl px-4 flex items-center justify-center transition-all active:scale-95"
                      style={{ background: '#EAEAEA', color: '#555' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {leaveError && (
                    <p style={{ color: '#dc2626', fontSize: 12, fontWeight: 500 }}>{leaveError}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={() => { setShowJoin(!showJoin); setShowAddPlayer(false); setShowLeave(false); }} disabled={match.registrationClosed || isFull}
            className="rounded-xl py-3 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ background: match.registrationClosed || isFull ? '#EAEAEA' : '#1DB954', color: match.registrationClosed || isFull ? '#aaa' : '#fff', fontWeight: 700, fontSize: 14 }}>
            Join Match
          </button>
          <button onClick={() => { setShowAddPlayer(!showAddPlayer); setShowJoin(false); setShowLeave(false); }}
            className="rounded-xl py-3 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ background: '#F0FAF4', color: '#0F5132', fontWeight: 700, fontSize: 14, border: '1.5px solid #0F5132' }}>
            <UserPlus size={16} /> Add Player
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleToggleRegistration}
            className="rounded-xl py-3 flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{ background: '#EAEAEA', color: '#333', fontWeight: 700, fontSize: 12 }}>
            {match.registrationClosed ? <><Unlock size={13} /><span>Open Reg</span></> : <><Lock size={13} /><span>Close Reg</span></>}
          </button>
          <button
            onClick={() => { setShowImport(true); }}
            className="rounded-xl py-3 flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{ background: '#EFF6FF', color: '#1d4ed8', fontWeight: 700, fontSize: 12, border: '1.5px solid #bfdbfe' }}>
            <FileText size={13} /> Import
          </button>
          <button
            onClick={() => { setShowLeave(!showLeave); setShowJoin(false); setShowAddPlayer(false); }}
            className="rounded-xl py-3 flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{ background: '#FEF2F2', color: '#dc2626', fontWeight: 700, fontSize: 12, border: '1px solid #fecaca' }}>
            <LogOut size={13} /> Leave
          </button>
        </div>
      </div>

      {showImport && (
        <ImportMatchModal onClose={() => setShowImport(false)} preselectedMatchId={id} />
      )}

      {showPinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: '#fff' }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: '#111' }}>
              {pinAction === 'open' ? 'Open Registration' : 'Close Registration'}
            </h3>
            <p style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Enter the 4-digit match PIN.</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              className="w-full rounded-xl px-4 py-3 mt-3 outline-none"
              style={{ background: '#fff', border: '1.5px solid #EAEAEA', color: '#111', fontWeight: 600, letterSpacing: 2 }}
              value={registrationPinInput}
              onChange={e => {
                setRegistrationPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                if (pinError) setPinError('');
              }}
              onKeyDown={e => e.key === 'Enter' && handlePinConfirm()}
              placeholder="••••"
            />
            {pinError && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{pinError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handlePinConfirm}
                className="flex-1 rounded-xl py-2.5 transition-all active:scale-95"
                style={{ background: '#0F5132', color: '#fff', fontWeight: 700 }}>
                Confirm
              </button>
              <button
                onClick={resetPinPrompt}
                className="flex-1 rounded-xl py-2.5 transition-all active:scale-95"
                style={{ background: '#EAEAEA', color: '#555', fontWeight: 700 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
