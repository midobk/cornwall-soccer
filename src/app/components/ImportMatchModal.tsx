import React, { useState } from 'react';
import { X, Wand2, ChevronLeft, CheckCircle, Plus, RefreshCw, Users } from 'lucide-react';
import { useAppStore } from '../context/AppStore';
import { parseMatchText, summariseParsed, ParsedMatch } from '../utils/parseMatchText';

interface Props {
  onClose: () => void;
  preselectedMatchId?: string; // if opened from MatchDetails, pre-select "update" mode
}

type Step = 'input' | 'preview';
type Action = 'create' | 'update';
type MergeMode = 'merge' | 'replace';

const PLACEHOLDER = `Paste any match text here — the app will parse it automatically.

Examples accepted:

⚽ Soccer Friday – 10:00 PM
📅 Friday, March 13, 2026
🏟️ 2 fields

Players (16/16)

1. Sachin ✅
2. Lama ✅
3. Raj ⏳
4. Mehdi 💵

💰 $9 per player
📧 adisabiola2@gmail.com

──────────────────
Or a simple list:

Match: Thursday Kickabout
Date: 2026-03-19
Time: 7:00 PM
Max players: 12
Price per player: $8
Payment: coach@club.com

Players:
- Alex ✅
- Jordan
- Taylor 💵`;

export function ImportMatchModal({ onClose, preselectedMatchId }: Props) {
  const { matches, navigate, importNewMatch, applyImportToMatch } = useAppStore();

  const [step, setStep]           = useState<Step>('input');
  const [rawText, setRawText]     = useState('');
  const [parsed, setParsed]       = useState<ParsedMatch | null>(null);
  const [action, setAction]       = useState<Action>(preselectedMatchId ? 'update' : 'create');
  const [selectedId, setSelectedId] = useState<string>(preselectedMatchId || (matches[0]?.id ?? ''));
  const [mergeMode, setMergeMode] = useState<MergeMode>('merge');
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) { setError('Please paste some text first.'); return; }
    const data = parseMatchText(rawText);
    const detected = summariseParsed(data);
    if (detected.length === 0) { setError('Could not detect any match info. Try a different format.'); return; }
    setParsed(data);
    setError('');
    setStep('preview');
  };

  const handleApply = () => {
    if (!parsed) return;
    if (action === 'create') {
      const newId = importNewMatch(parsed);
      setDone(true);
      setTimeout(() => { navigate({ name: 'match', id: newId }); onClose(); }, 1100);
    } else {
      if (!selectedId) { setError('Please select a match to update.'); return; }
      applyImportToMatch(selectedId, parsed, mergeMode === 'replace');
      setDone(true);
      setTimeout(() => { navigate({ name: 'match', id: selectedId }); onClose(); }, 1100);
    }
  };

  const summary = parsed ? summariseParsed(parsed) : [];
  const hasPlayers = (parsed?.players?.length ?? 0) > 0;

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="rounded-2xl p-8 flex flex-col items-center" style={{ background: '#fff', maxWidth: 320, width: '90%' }}>
          <CheckCircle size={52} color="#1DB954" />
          <p style={{ fontWeight: 800, fontSize: 20, color: '#111', marginTop: 16 }}>
            {action === 'create' ? 'Match Created!' : 'Match Updated!'}
          </p>
          <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>Opening match…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mt-auto flex flex-col rounded-t-3xl overflow-hidden"
        style={{ background: '#F7F7F7', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0F5132 0%, #1a7a4a 100%)' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {step === 'input' ? 'Smart Import' : 'Review & Apply'}
            </p>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 1 }}>
              📥 Import from Text
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.18)' }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

          {/* ── Step 1: Input ─────────────────────────────────────────────────── */}
          {step === 'input' && (
            <>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.5 }}>
                Paste a WhatsApp message, share summary, or any plain text with match details.
                The app will auto-detect the name, date, time, players, and payment info.
              </p>

              <textarea
                className="w-full rounded-2xl p-4 outline-none resize-none"
                style={{
                  background: '#fff',
                  border: '1.5px solid #EAEAEA',
                  color: '#111',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  minHeight: 240,
                }}
                placeholder={PLACEHOLDER}
                value={rawText}
                onChange={e => { setRawText(e.target.value); setError(''); }}
              />

              {error && (
                <p className="rounded-xl px-4 py-2" style={{ background: '#FEF2F2', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                  ⚠️ {error}
                </p>
              )}

              <button
                onClick={handleParse}
                className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: '#1DB954', color: '#fff', fontWeight: 800, fontSize: 16 }}
              >
                <Wand2 size={20} /> Parse Text
              </button>
            </>
          )}

          {/* ── Step 2: Preview ───────────────────────────────────────────────── */}
          {step === 'preview' && parsed && (
            <>
              {/* Detected fields */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
                <div className="px-4 py-3" style={{ background: '#F0FAF4', borderBottom: '1px solid #EAEAEA' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0F5132' }}>✅ Detected Info</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {summary.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: '#1DB954', fontSize: 14, marginTop: 1 }}>•</span>
                      <span style={{ color: '#333', fontSize: 14 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Player preview */}
              {hasPlayers && (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#F0FAF4', borderBottom: '1px solid #EAEAEA' }}>
                    <Users size={15} color="#0F5132" />
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0F5132' }}>
                      Players ({parsed.players!.length})
                    </p>
                  </div>
                  <div className="px-4 py-3 max-h-40 overflow-y-auto space-y-1.5">
                    {parsed.players!.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span style={{ color: '#aaa', fontSize: 12, minWidth: 18, fontWeight: 600 }}>{i + 1}.</span>
                        <span style={{ fontSize: 14, color: '#111', flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 13 }}>
                          {p.status === 'paid' ? '✅' : p.status === 'cash' ? '💵' : '⏳'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action selector */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #EAEAEA' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>What do you want to do?</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {/* Create new */}
                  <button
                    onClick={() => setAction('create')}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{
                      background: action === 'create' ? '#F0FAF4' : '#F9F9F9',
                      border: action === 'create' ? '2px solid #0F5132' : '2px solid #EAEAEA',
                    }}
                  >
                    <div className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 20, height: 20, border: `2px solid ${action === 'create' ? '#0F5132' : '#ccc'}`, background: action === 'create' ? '#0F5132' : 'transparent' }}>
                      {action === 'create' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div className="text-left">
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Create new match</p>
                      <p style={{ fontSize: 12, color: '#888' }}>Add this as a brand-new match</p>
                    </div>
                    <Plus size={16} color={action === 'create' ? '#0F5132' : '#ccc'} style={{ marginLeft: 'auto' }} />
                  </button>

                  {/* Update existing */}
                  <button
                    onClick={() => setAction('update')}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                    style={{
                      background: action === 'update' ? '#F0FAF4' : '#F9F9F9',
                      border: action === 'update' ? '2px solid #0F5132' : '2px solid #EAEAEA',
                    }}
                  >
                    <div className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 20, height: 20, border: `2px solid ${action === 'update' ? '#0F5132' : '#ccc'}`, background: action === 'update' ? '#0F5132' : 'transparent' }}>
                      {action === 'update' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div className="text-left">
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Update existing match</p>
                      <p style={{ fontSize: 12, color: '#888' }}>Merge into or overwrite a match</p>
                    </div>
                    <RefreshCw size={16} color={action === 'update' ? '#0F5132' : '#ccc'} style={{ marginLeft: 'auto' }} />
                  </button>
                </div>

                {/* Update sub-options */}
                {action === 'update' && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #EAEAEA', paddingTop: 12 }}>
                    {/* Match picker */}
                    <div>
                      <p style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6 }}>Which match?</p>
                      <select
                        className="w-full rounded-xl px-4 py-3 outline-none"
                        style={{ background: '#F5F5F5', border: '1.5px solid #EAEAEA', color: '#111', fontWeight: 600, fontSize: 14 }}
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                      >
                        {matches.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Merge mode (only shown when players detected) */}
                    {hasPlayers && (
                      <div>
                        <p style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6 }}>Player list import:</p>
                        <div className="grid grid-cols-2 rounded-xl p-1" style={{ background: '#EAEAEA' }}>
                          <button
                            onClick={() => setMergeMode('merge')}
                            className="rounded-lg py-2.5 text-sm transition-all"
                            style={{
                              background: mergeMode === 'merge' ? '#0F5132' : 'transparent',
                              color: mergeMode === 'merge' ? '#fff' : '#555',
                              fontWeight: 700, fontSize: 13,
                            }}
                          >
                            Merge
                          </button>
                          <button
                            onClick={() => setMergeMode('replace')}
                            className="rounded-lg py-2.5 text-sm transition-all"
                            style={{
                              background: mergeMode === 'replace' ? '#0F5132' : 'transparent',
                              color: mergeMode === 'replace' ? '#fff' : '#555',
                              fontWeight: 700, fontSize: 13,
                            }}
                          >
                            Replace All
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>
                          {mergeMode === 'merge'
                            ? 'Adds new players & updates payment status of existing ones.'
                            : 'Removes the current player list and uses the imported one.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-xl px-4 py-2" style={{ background: '#FEF2F2', color: '#dc2626', fontSize: 13, fontWeight: 500 }}>
                  ⚠️ {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="px-4 pb-8 pt-3 space-y-2" style={{ borderTop: '1px solid #EAEAEA', background: '#F7F7F7' }}>
          {step === 'preview' && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep('input')}
                className="rounded-2xl py-3.5 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                style={{ background: '#EAEAEA', color: '#555', fontWeight: 700, fontSize: 14, flex: '0 0 auto', paddingLeft: 16, paddingRight: 16 }}
              >
                <ChevronLeft size={18} /> Edit
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: '#1DB954', color: '#fff', fontWeight: 800, fontSize: 16 }}
              >
                {action === 'create' ? <><Plus size={18} /> Create Match</> : <><RefreshCw size={16} /> Update Match</>}
              </button>
            </div>
          )}
          {step === 'input' && (
            <button
              onClick={onClose}
              className="w-full rounded-2xl py-3 transition-all active:scale-95"
              style={{ background: '#EAEAEA', color: '#555', fontWeight: 700, fontSize: 15 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
