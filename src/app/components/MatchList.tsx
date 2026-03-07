import React, { useState } from 'react';
import { Users, Layers, DollarSign, Clock, Plus, ChevronRight, Calendar, FileText } from 'lucide-react';
import { useAppStore, computeCostPerPlayer, formatCost, formatTime, Match } from '../context/AppStore';
import { ImportMatchModal } from './ImportMatchModal';

export function MatchList() {
  const { matches, navigate } = useAppStore();
  const [showImport, setShowImport] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getSpotsFilled = (match: Match) => `${match.players.length}/${match.maxPlayers}`;
  const isFull = (match: Match) => match.players.length >= match.maxPlayers;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F7' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 rounded-full" style={{ width: 160, height: 160, background: '#1DB954' }} />
          <div className="absolute -bottom-16 -left-8 rounded-full" style={{ width: 200, height: 200, background: '#1DB954' }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚽</span>
            <span className="text-white/70 text-sm tracking-wider uppercase">Organizer</span>
          </div>
          <h1 className="text-white" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>Football Matches</h1>
          <p className="text-white/60 text-sm mt-1">{matches.length} upcoming matches</p>
        </div>
      </div>

      {/* Match Cards */}
      <div className="flex-1 px-4 py-5 pb-28 space-y-4">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">⚽</span>
            <p style={{ color: '#111111', fontWeight: 600 }} className="text-lg">No matches yet</p>
            <p style={{ color: '#888' }} className="text-sm mt-1">Create your first match below</p>
          </div>
        ) : (
          matches.map(match => {
            const costPerPlayer = computeCostPerPlayer(match);
            return (
              <div
                key={match.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Card Top Bar */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#0F5132' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚽</span>
                    <span className="text-white" style={{ fontWeight: 700, fontSize: 16 }}>{match.name}</span>
                  </div>
                  {match.registrationClosed ? (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}>CLOSED</span>
                  ) : isFull(match) ? (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1DB954', color: '#fff', fontWeight: 600 }}>FULL</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#1DB954', color: '#fff', fontWeight: 600 }}>OPEN</span>
                  )}
                </div>

                {/* Card Body */}
                <div className="px-4 py-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: '#F0FAF4' }}>
                        <Clock size={15} color="#0F5132" />
                      </div>
                      <div>
                        <p style={{ color: '#888', fontSize: 11, fontWeight: 500 }}>TIME</p>
                        <p style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>{formatTime(match.time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: '#F0FAF4' }}>
                        <Calendar size={15} color="#0F5132" />
                      </div>
                      <div>
                        <p style={{ color: '#888', fontSize: 11, fontWeight: 500 }}>DATE</p>
                        <p style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>{formatDate(match.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: '#F0FAF4' }}>
                        <Users size={15} color="#0F5132" />
                      </div>
                      <div>
                        <p style={{ color: '#888', fontSize: 11, fontWeight: 500 }}>PLAYERS</p>
                        <p style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>{getSpotsFilled(match)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: '#F0FAF4' }}>
                        <Layers size={15} color="#0F5132" />
                      </div>
                      <div>
                        <p style={{ color: '#888', fontSize: 11, fontWeight: 500 }}>FIELDS</p>
                        <p style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>{match.fields} {match.fields === 1 ? 'field' : 'fields'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Banner */}
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between mb-4" style={{ background: '#F0FAF4' }}>
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} color="#0F5132" />
                      <span style={{ color: '#0F5132', fontWeight: 600, fontSize: 14 }}>Cost per player</span>
                    </div>
                    <span style={{ color: '#0F5132', fontWeight: 800, fontSize: 20 }}>{formatCost(costPerPlayer)}</span>
                  </div>

                  <button
                    onClick={() => navigate({ name: 'match', id: match.id })}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all active:scale-95"
                    style={{ background: '#0F5132', color: '#fff', fontWeight: 700, fontSize: 16 }}
                  >
                    View Match <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl py-4 shadow-xl transition-all active:scale-95"
            style={{ background: '#fff', color: '#0F5132', fontWeight: 700, fontSize: 15, border: '2px solid #0F5132', paddingLeft: 20, paddingRight: 20 }}
          >
            <FileText size={18} /> Import
          </button>
          <button
            onClick={() => navigate({ name: 'create' })}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 shadow-xl transition-all active:scale-95"
            style={{ background: '#1DB954', color: '#fff', fontWeight: 800, fontSize: 17 }}
          >
            <Plus size={22} /> Create Match
          </button>
        </div>
      </div>

      {showImport && <ImportMatchModal onClose={() => setShowImport(false)} />}
    </div>
  );
}