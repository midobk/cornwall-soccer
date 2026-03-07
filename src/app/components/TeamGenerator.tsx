import React, { useState, useRef } from 'react';
import { ChevronLeft, Shuffle, RotateCcw, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppStore, Player, TeamId } from '../context/AppStore';

interface PlayerCardProps {
  player: Player;
  currentTeam: 'A' | 'B';
  onMove: (playerId: string, team: 'A' | 'B') => void;
  onDragStart: (e: React.DragEvent, playerId: string) => void;
  onDragEnd: () => void;
}

function PlayerCard({ player, currentTeam, onMove, onDragStart, onDragEnd }: PlayerCardProps) {
  const otherTeam: 'A' | 'B' = currentTeam === 'A' ? 'B' : 'A';
  const avatarBg = currentTeam === 'A' ? '#0F5132' : '#1a3a6b';
  const btnBg    = currentTeam === 'A' ? '#EFF6FF' : '#F0FAF4';
  const btnColor = currentTeam === 'A' ? '#1a3a6b' : '#0F5132';
  return (
    <div draggable onDragStart={e => onDragStart(e, player.id)} onDragEnd={onDragEnd}
      className="rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2"
      style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'grab', userSelect: 'none' }}>
      <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 30, height: 30, background: avatarBg, color: '#fff', fontWeight: 800, fontSize: 12 }}>
        {player.name[0].toUpperCase()}
      </div>
      <span style={{ fontWeight: 600, fontSize: 13, color: '#111', flex: 1 }}>{player.name}</span>
      <button onClick={() => onMove(player.id, otherTeam)} className="rounded-lg p-1.5 transition-all active:scale-90" style={{ background: btnBg, color: btnColor }} title={`Move to Team ${otherTeam}`}>
        {currentTeam === 'A' ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
      </button>
    </div>
  );
}

interface TeamColumnProps {
  team: 'A' | 'B';
  players: Player[];
  isOver: boolean;
  onMove: (playerId: string, team: 'A' | 'B') => void;
  onDragStart: (e: React.DragEvent, playerId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, team: 'A' | 'B') => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, team: 'A' | 'B') => void;
}

function TeamColumn({ team, players, isOver, onMove, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop }: TeamColumnProps) {
  const teamColor = team === 'A' ? '#0F5132' : '#1a3a6b';
  const overBg    = team === 'A' ? '#e6f4ec' : '#dbeafe';
  return (
    <div className="flex-1 rounded-2xl flex flex-col"
      onDragOver={e => onDragOver(e, team)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, team)}
      style={{ background: isOver ? overBg : '#F7F7F7', border: `2px solid ${isOver ? teamColor : '#EAEAEA'}`, minHeight: 200, padding: 12, transition: 'background 0.15s, border-color 0.15s' }}>
      <div className="rounded-xl px-3 py-2 flex items-center justify-between mb-3" style={{ background: teamColor }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Team {team}</span>
        <span className="rounded-full px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 12 }}>{players.length}</span>
      </div>
      <div className="flex-1">
        {players.length === 0 ? (
          <div className="rounded-xl flex items-center justify-center py-6" style={{ border: `2px dashed ${isOver ? teamColor : '#EAEAEA'}` }}>
            <p style={{ color: isOver ? teamColor : '#ccc', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>{isOver ? 'Drop here!' : 'Drop players here'}</p>
          </div>
        ) : (
          players.map(p => (
            <PlayerCard key={p.id} player={p} currentTeam={team} onMove={onMove} onDragStart={onDragStart} onDragEnd={onDragEnd} />
          ))
        )}
      </div>
    </div>
  );
}

interface Props { id: string; }

export function TeamGenerator({ id }: Props) {
  const { navigate, getMatch, setTeams } = useAppStore();
  const match = getMatch(id);

  const [localPlayers, setLocalPlayers] = useState<Player[]>(match ? [...match.players] : []);
  const [saved, setSaved] = useState(false);
  const [dragOverTeam, setDragOverTeam] = useState<TeamId>(null);
  const draggingId = useRef<string | null>(null);

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F7F7F7' }}>
        <p style={{ color: '#888' }}>Match not found</p>
      </div>
    );
  }

  const teamA      = localPlayers.filter(p => p.team === 'A');
  const teamB      = localPlayers.filter(p => p.team === 'B');
  const unassigned = localPlayers.filter(p => !p.team);

  const moveToTeam = (playerId: string, team: TeamId) => {
    setLocalPlayers(prev => prev.map(p => (p.id === playerId ? { ...p, team } : p)));
    setSaved(false);
  };

  const handleRandomize = () => {
    const shuffled = [...localPlayers]
      .map(v => ({ ...v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ sort: _sort, ...p }, i): Player => ({ ...p, team: (i < Math.ceil(localPlayers.length / 2) ? 'A' : 'B') as 'A' | 'B' }));
    setLocalPlayers(shuffled);
    setSaved(false);
  };

  const handleReset = () => { setLocalPlayers(prev => prev.map(p => ({ ...p, team: null }))); setSaved(false); };
  const handleSave  = () => { setTeams(match.id, localPlayers); setSaved(true); };

  const handleDragStart = (e: React.DragEvent, playerId: string) => { draggingId.current = playerId; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver  = (e: React.DragEvent, team: 'A' | 'B') => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverTeam(team); };
  const handleDragLeave = () => setDragOverTeam(null);
  const handleDrop = (e: React.DragEvent, team: 'A' | 'B') => { e.preventDefault(); setDragOverTeam(null); if (draggingId.current) { moveToTeam(draggingId.current, team); draggingId.current = null; } };
  const handleDragEnd = () => { draggingId.current = null; setDragOverTeam(null); };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
        <button onClick={() => navigate({ name: 'match', id })} className="flex items-center gap-1 mb-4 opacity-80 active:opacity-60 transition-opacity">
          <ChevronLeft size={20} color="white" />
          <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Back</span>
        </button>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>👥 Team Generator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{match.name} · Drag or tap arrows to move players</p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 flex gap-2" style={{ background: '#fff', borderBottom: '1px solid #EAEAEA' }}>
        <button onClick={handleRandomize} className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: '#1DB954', color: '#fff', fontWeight: 700, fontSize: 13 }}>
          <Shuffle size={15} /> Randomize
        </button>
        <button onClick={handleReset} className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95" style={{ background: '#EAEAEA', color: '#333', fontWeight: 700, fontSize: 13 }}>
          <RotateCcw size={15} /> Reset
        </button>
        <button onClick={handleSave} className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: saved ? '#F0FAF4' : '#0F5132', color: saved ? '#0F5132' : '#fff', fontWeight: 700, fontSize: 13, border: saved ? '1.5px solid #0F5132' : 'none' }}>
          <Save size={15} /> {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Team Columns */}
      <div className="flex-1 px-3 py-4">
        <div className="flex gap-3">
          <TeamColumn team="A" players={teamA} isOver={dragOverTeam === 'A'} onMove={moveToTeam} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} />
          <TeamColumn team="B" players={teamB} isOver={dragOverTeam === 'B'} onMove={moveToTeam} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} />
        </div>

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div className="mt-4">
            <p style={{ fontWeight: 700, fontSize: 14, color: '#555', marginBottom: 8 }}>Unassigned ({unassigned.length})</p>
            <div className="rounded-2xl p-3" style={{ background: '#fff', border: '1.5px dashed #EAEAEA' }}>
              {unassigned.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 py-2" style={{ borderBottom: i < unassigned.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: '#EAEAEA', color: '#555', fontWeight: 700, fontSize: 11 }}>{p.name[0]}</div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#111', flex: 1 }}>{p.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => moveToTeam(p.id, 'A')} className="rounded-lg px-3 py-1 transition-all active:scale-90" style={{ background: '#F0FAF4', color: '#0F5132', fontWeight: 700, fontSize: 12, border: '1px solid #0F5132' }}>Team A</button>
                    <button onClick={() => moveToTeam(p.id, 'B')} className="rounded-lg px-3 py-1 transition-all active:scale-90" style={{ background: '#EFF6FF', color: '#1a3a6b', fontWeight: 700, fontSize: 12, border: '1px solid #1a3a6b' }}>Team B</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Row */}
        <div className="rounded-2xl p-4 mt-4 flex justify-around" style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div className="text-center">
            <div className="rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1" style={{ background: '#0F5132' }}><span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{teamA.length}</span></div>
            <p style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Team A</p>
          </div>
          <div className="text-center">
            <div className="rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1" style={{ background: '#EAEAEA' }}><span style={{ color: '#555', fontWeight: 800, fontSize: 14 }}>{unassigned.length}</span></div>
            <p style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Unassigned</p>
          </div>
          <div className="text-center">
            <div className="rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-1" style={{ background: '#1a3a6b' }}><span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{teamB.length}</span></div>
            <p style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Team B</p>
          </div>
        </div>
      </div>
    </div>
  );
}
