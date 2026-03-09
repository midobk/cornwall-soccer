import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { firestoreDb, isFirebaseConfigured } from '../lib/firebase';
import { ParsedMatch } from '../utils/parseMatchText';

export type PaymentStatus = 'paid' | 'unpaid' | 'cash';
export type TeamId = 'A' | 'B' | null;

export interface MatchAuditEntry {
  id: string;
  at: number;
  action: string;
  actor: string;
  details: string;
}

export interface Player {
  id: string;
  name: string;
  status: PaymentStatus;
  team: TeamId;
  joinPin: string | null;
}

export interface Match {
  id: string;
  name: string;
  date: string;
  time: string;
  pricingMode: 'field' | 'player';
  fieldCost: number;
  pricePerPlayer: number;
  paymentEmail: string;
  maxPlayers: number;
  fields: number;
  players: Player[];
  registrationPin: string;
  registrationClosed: boolean;
  auditLog: MatchAuditEntry[];
}

interface MatchDocument {
  name: string;
  date: string;
  time: string;
  pricingMode: 'field' | 'player';
  fieldCost: number;
  pricePerPlayer: number;
  paymentEmail: string;
  maxPlayers: number;
  fields: number;
  players: Player[];
  registrationPin: string;
  registrationClosed: boolean;
  auditLog: MatchAuditEntry[];
  createdAt?: number;
  updatedAt?: number;
}

export function computeCostPerPlayer(match: Match): number {
  if (match.pricingMode === 'field') {
    if (match.players.length === 0) return 0;
    return (match.fieldCost * match.fields) / match.players.length;
  }
  return match.pricePerPlayer;
}

export function formatCost(value: number): string {
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}

// ─── Simple state-based router ────────────────────────────────────────────────
export type Screen =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'match'; id: string }
  | { name: 'teams'; id: string }
  | { name: 'payment'; id: string }
  | { name: 'share'; id: string };

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextType {
  // navigation
  screen: Screen;
  navigate: (s: Screen) => void;
  // data
  matches: Match[];
  addMatch: (match: Omit<Match, 'id' | 'players' | 'registrationClosed' | 'auditLog'>) => void;
  updateMatch: (match: Match) => void;
  addPlayer: (matchId: string, name: string, joinPin?: string | null) => void;
  updatePlayerStatus: (matchId: string, playerId: string, status: PaymentStatus, pin: string) => boolean;
  removePlayer: (matchId: string, playerId: string, pin: string) => boolean;
  closeRegistration: (matchId: string, pin: string) => boolean;
  openRegistration: (matchId: string, pin: string) => boolean;
  deleteMatch: (matchId: string, pin: string) => boolean;
  setTeams: (matchId: string, players: Player[]) => void;
  getMatch: (matchId: string) => Match | undefined;
  // import helpers
  importNewMatch: (data: ParsedMatch) => string;
  applyImportToMatch: (matchId: string, data: ParsedMatch, replacePlayers: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Seed data ────────────────────────────────────────────────────────────────
const mockPlayers: Player[] = [
  { id: 'p1',  name: 'Sachin',   status: 'paid',   team: 'A', joinPin: null },
  { id: 'p2',  name: 'Lama',     status: 'paid',   team: 'A', joinPin: null },
  { id: 'p3',  name: 'Raj',      status: 'unpaid', team: 'B', joinPin: null },
  { id: 'p4',  name: 'Mehdi',    status: 'cash',   team: 'A', joinPin: null },
  { id: 'p5',  name: 'Wesley',   status: 'paid',   team: 'B', joinPin: null },
  { id: 'p6',  name: 'Saad',     status: 'unpaid', team: 'B', joinPin: null },
  { id: 'p7',  name: 'Mahad',    status: 'unpaid', team: 'A', joinPin: null },
  { id: 'p8',  name: 'Emmanuel', status: 'paid',   team: 'B', joinPin: null },
  { id: 'p9',  name: 'Patrick',  status: 'unpaid', team: 'A', joinPin: null },
  { id: 'p10', name: 'Ganesh',   status: 'paid',   team: 'B', joinPin: null },
  { id: 'p11', name: 'Abiola',   status: 'unpaid', team: 'A', joinPin: null },
  { id: 'p12', name: 'Mathias',  status: 'cash',   team: 'B', joinPin: null },
  { id: 'p13', name: 'Romodan',  status: 'paid',   team: 'A', joinPin: null },
  { id: 'p14', name: 'Mustafa',  status: 'unpaid', team: 'B', joinPin: null },
  { id: 'p15', name: 'Soundgag', status: 'unpaid', team: 'A', joinPin: null },
  { id: 'p16', name: 'Tobi',     status: 'paid',   team: 'B', joinPin: null },
];

const initialMatches: Match[] = [
  {
    id: '1',
    name: 'Soccer Friday',
    date: '2026-03-13',
    time: '22:00',
    pricingMode: 'field',
    fieldCost: 66,
    pricePerPlayer: 0,
    paymentEmail: 'adisabiola2@gmail.com',
    maxPlayers: 16,
    fields: 2,
    players: mockPlayers,
    registrationPin: '1234',
    registrationClosed: false,
    auditLog: [],
  },
  {
    id: '2',
    name: 'Weekend Warriors',
    date: '2026-03-15',
    time: '18:00',
    pricingMode: 'player',
    fieldCost: 0,
    pricePerPlayer: 10,
    paymentEmail: 'payments@example.com',
    maxPlayers: 12,
    fields: 1,
    players: [
      { id: 'q1', name: 'Alex',   status: 'paid',   team: 'A', joinPin: null },
      { id: 'q2', name: 'Jordan', status: 'unpaid', team: 'B', joinPin: null },
      { id: 'q3', name: 'Taylor', status: 'cash',   team: null, joinPin: null },
    ],
    registrationPin: '1234',
    registrationClosed: false,
    auditLog: [],
  },
];

let idCounter = 100;

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const stringOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const statusOr = (value: unknown): PaymentStatus =>
  value === 'paid' || value === 'unpaid' || value === 'cash' ? value : 'unpaid';

const teamOr = (value: unknown): TeamId =>
  value === 'A' || value === 'B' || value === null ? value : null;

const pinOr = (value: unknown): string =>
  typeof value === 'string' && /^\d{4}$/.test(value) ? value : '0000';

const optionalPinOr = (value: unknown): string | null =>
  typeof value === 'string' && /^\d{4}$/.test(value) ? value : null;

function normalizeAuditEntry(raw: unknown, fallbackId: string): MatchAuditEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  return {
    id: stringOr(value.id, fallbackId),
    at: numberOr(value.at, Date.now()),
    action: stringOr(value.action, 'Update'),
    actor: stringOr(value.actor, 'Unknown'),
    details: stringOr(value.details, ''),
  };
}

function normalizePlayer(raw: unknown, fallbackId: string): Player {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId, name: 'Player', status: 'unpaid', team: null, joinPin: null };
  }
  const value = raw as Record<string, unknown>;
  return {
    id: stringOr(value.id, fallbackId),
    name: stringOr(value.name, 'Player'),
    status: statusOr(value.status),
    team: teamOr(value.team),
    joinPin: optionalPinOr(value.joinPin),
  };
}

function normalizeMatch(id: string, raw: Record<string, unknown>): Match {
  const playersRaw = Array.isArray(raw.players) ? raw.players : [];
  const auditLogRaw = Array.isArray(raw.auditLog) ? raw.auditLog : [];
  return {
    id,
    name: stringOr(raw.name, 'Untitled Match'),
    date: stringOr(raw.date, new Date().toISOString().split('T')[0]),
    time: stringOr(raw.time, '18:00'),
    pricingMode: raw.pricingMode === 'field' ? 'field' : 'player',
    fieldCost: numberOr(raw.fieldCost, 0),
    pricePerPlayer: numberOr(raw.pricePerPlayer, 0),
    paymentEmail: stringOr(raw.paymentEmail, ''),
    maxPlayers: numberOr(raw.maxPlayers, 16),
    fields: numberOr(raw.fields, 1),
    players: playersRaw.map((player, idx) => normalizePlayer(player, `player-${id}-${idx}`)),
    registrationPin: pinOr(raw.registrationPin),
    registrationClosed: Boolean(raw.registrationClosed),
    auditLog: auditLogRaw
      .map((entry, idx) => normalizeAuditEntry(entry, `audit-${id}-${idx}`))
      .filter((entry): entry is MatchAuditEntry => entry !== null),
  };
}

function toMatchDocument(match: Match): MatchDocument {
  return {
    name: match.name,
    date: match.date,
    time: match.time,
    pricingMode: match.pricingMode,
    fieldCost: match.fieldCost,
    pricePerPlayer: match.pricePerPlayer,
    paymentEmail: match.paymentEmail,
    maxPlayers: match.maxPlayers,
    fields: match.fields,
    players: match.players,
    registrationPin: match.registrationPin,
    registrationClosed: match.registrationClosed,
    auditLog: match.auditLog,
  };
}

const MAX_AUDIT_ENTRIES = 150;

function createAuditEntry(action: string, actor: string, details: string): MatchAuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    action,
    actor,
    details,
  };
}

function appendAudit(match: Match, entry: Omit<MatchAuditEntry, 'id' | 'at'>): Match {
  const nextAuditLog = [...match.auditLog, createAuditEntry(entry.action, entry.actor, entry.details)]
    .slice(-MAX_AUDIT_ENTRIES);
  return { ...match, auditLog: nextAuditLog };
}

function resolveActorByPin(match: Match, pin: string): string {
  if (pin === match.registrationPin) return 'Match PIN holder';
  const player = match.players.find((value) => value.joinPin !== null && value.joinPin === pin);
  return player ? `${player.name} (player PIN)` : 'Unknown';
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children?: ReactNode }) {
  const [screen, setScreen] = useState<Screen>({ name: 'list' });
  const [matches, setMatches] = useState<Match[]>(isFirebaseConfigured ? [] : initialMatches);

  useEffect(() => {
    if (!firestoreDb) return;

    const matchesQuery = query(collection(firestoreDb, 'matches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      matchesQuery,
      (snapshot) => {
        const syncedMatches = snapshot.docs.map((matchDoc) =>
          normalizeMatch(matchDoc.id, matchDoc.data() as Record<string, unknown>)
        );
        setMatches(syncedMatches);
      },
      (error) => {
        console.error('Failed to sync Firestore matches:', error);
      }
    );

    return unsubscribe;
  }, []);

  const navigate = (s: Screen) => setScreen(s);

  const buildMatchId = (): string => {
    if (firestoreDb) {
      return doc(collection(firestoreDb, 'matches')).id;
    }
    return String(++idCounter);
  };

  const persistMatch = (match: Match, isNew = false) => {
    if (!firestoreDb) return;
    const now = Date.now();
    const payload: MatchDocument = {
      ...toMatchDocument(match),
      ...(isNew ? { createdAt: now } : {}),
      updatedAt: now,
    };
    void setDoc(doc(firestoreDb, 'matches', match.id), payload, { merge: true }).catch((error) => {
      console.error(`Failed to persist match ${match.id}:`, error);
    });
  };

  const addMatch = (data: Omit<Match, 'id' | 'players' | 'registrationClosed' | 'auditLog'>) => {
    const newMatch = appendAudit(
      { ...data, id: buildMatchId(), players: [], registrationClosed: false, auditLog: [] },
      { action: 'Match created', actor: 'Match creator', details: 'Created this match.' }
    );
    setMatches(prev => [newMatch, ...prev]);
    persistMatch(newMatch, true);
  };

  const importNewMatch = (data: ParsedMatch): string => {
    const id = buildMatchId();
    const newMatch: Match = {
      id,
      name: data.name || 'Imported Match',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '18:00',
      pricingMode: data.pricingMode || 'player',
      fieldCost: data.fieldCost ?? 0,
      pricePerPlayer: data.pricePerPlayer ?? 0,
      paymentEmail: data.paymentEmail || '',
      maxPlayers: data.maxPlayers || 16,
      fields: data.fields || 1,
      players: (data.players || []).map((p, i) => ({
        id: `imp-${id}-${i}-${Date.now()}`,
        name: p.name,
        status: p.status,
        team: null,
        joinPin: null,
      })),
      registrationPin: '0000',
      registrationClosed: false,
      auditLog: [],
    };
    const loggedMatch = appendAudit(
      newMatch,
      { action: 'Match imported', actor: 'Import tool', details: 'Created from imported text.' }
    );
    setMatches(prev => [loggedMatch, ...prev]);
    persistMatch(loggedMatch, true);
    return id;
  };

  const applyImportToMatch = (matchId: string, data: ParsedMatch, replacePlayers: boolean) => {
    const existingMatch = matches.find((match) => match.id === matchId);
    if (!existingMatch) return;

    let updatedPlayers = existingMatch.players;
    if (data.players && data.players.length > 0) {
      if (replacePlayers) {
        updatedPlayers = data.players.map((player, i) => ({
          id: `imp-${matchId}-${i}-${Date.now()}`,
          name: player.name,
          status: player.status as PaymentStatus,
          team: null,
          joinPin: null,
        }));
      } else {
        const importedByName = new Map(
          data.players.map((player) => [player.name.toLowerCase(), player.status as PaymentStatus])
        );
        const existingLower = new Set(existingMatch.players.map((player) => player.name.toLowerCase()));
        const newPlayers = data.players
          .filter((player) => !existingLower.has(player.name.toLowerCase()))
          .map((player, i) => ({
            id: `imp-${matchId}-n${i}-${Date.now()}`,
            name: player.name,
            status: player.status as PaymentStatus,
            team: null as null,
            joinPin: null,
          }));
        updatedPlayers = [
          ...existingMatch.players.map((player) => ({
            ...player,
            status: importedByName.get(player.name.toLowerCase()) ?? player.status,
          })),
          ...newPlayers,
        ];
      }
    }

    const updatedMatch: Match = {
      ...existingMatch,
      name: data.name ?? existingMatch.name,
      date: data.date ?? existingMatch.date,
      time: data.time ?? existingMatch.time,
      pricingMode: data.pricingMode ?? existingMatch.pricingMode,
      fieldCost: data.fieldCost ?? existingMatch.fieldCost,
      pricePerPlayer: data.pricePerPlayer ?? existingMatch.pricePerPlayer,
      paymentEmail: data.paymentEmail ?? existingMatch.paymentEmail,
      maxPlayers: data.maxPlayers ?? existingMatch.maxPlayers,
      fields: data.fields ?? existingMatch.fields,
      players: updatedPlayers,
    };

    const loggedMatch = appendAudit(
      updatedMatch,
      {
        action: 'Match imported',
        actor: 'Import tool',
        details: replacePlayers
          ? 'Imported details and replaced players.'
          : 'Imported details and merged players.',
      }
    );
    updateMatch(loggedMatch);
  };

  const updateMatch = (updated: Match) => {
    setMatches(prev => prev.map(match => (match.id === updated.id ? updated : match)));
    persistMatch(updated);
  };

  const addPlayer = (matchId: string, name: string, joinPin: string | null = null) => {
    const match = matches.find((value) => value.id === matchId);
    if (!match) return;
    const playerName = name.trim();
    if (!playerName) return;
    const updatedMatch = appendAudit({
      ...match,
      players: [
        ...match.players,
        { id: `player-${Date.now()}`, name: playerName, status: 'unpaid', team: null, joinPin },
      ],
    }, {
      action: joinPin ? 'Player joined' : 'Player added',
      actor: joinPin ? playerName : 'Match PIN holder',
      details: joinPin
        ? `${playerName} joined the match.`
        : `${playerName} was added by organizer.`,
    });
    updateMatch(updatedMatch);
  };

  const updatePlayerStatus = (matchId: string, playerId: string, status: PaymentStatus, pin: string): boolean => {
    const match = matches.find((value) => value.id === matchId);
    if (!match) return false;
    const targetPlayer = match.players.find((player) => player.id === playerId);
    if (!targetPlayer) return false;
    const canUpdate =
      pin === match.registrationPin ||
      (targetPlayer.joinPin !== null && targetPlayer.joinPin === pin);
    if (!canUpdate) return false;
    const updatedMatch = appendAudit({
      ...match,
      players: match.players.map((player) =>
        player.id === playerId ? { ...player, status } : player
      ),
    }, {
      action: 'Status updated',
      actor: resolveActorByPin(match, pin),
      details: `${targetPlayer.name}: ${targetPlayer.status} -> ${status}.`,
    });
    updateMatch(updatedMatch);
    return true;
  };

  const removePlayer = (matchId: string, playerId: string, pin: string): boolean => {
    const match = matches.find((value) => value.id === matchId);
    if (!match) return false;
    const targetPlayer = match.players.find((player) => player.id === playerId);
    if (!targetPlayer) return false;
    const canRemove =
      pin === match.registrationPin ||
      (targetPlayer.joinPin !== null && targetPlayer.joinPin === pin);
    if (!canRemove) return false;
    const updatedMatch = appendAudit({
      ...match,
      players: match.players.filter((player) => player.id !== playerId),
    }, {
      action: 'Player removed',
      actor: resolveActorByPin(match, pin),
      details: `${targetPlayer.name} was removed from the match.`,
    });
    updateMatch(updatedMatch);
    return true;
  };

  const closeRegistration = (matchId: string, pin: string): boolean => {
    const match = matches.find((value) => value.id === matchId);
    if (!match || match.registrationPin !== pin) return false;
    const updatedMatch = appendAudit(
      { ...match, registrationClosed: true },
      { action: 'Registration closed', actor: 'Match PIN holder', details: 'New registrations are blocked.' }
    );
    updateMatch(updatedMatch);
    return true;
  };

  const openRegistration = (matchId: string, pin: string): boolean => {
    const match = matches.find((value) => value.id === matchId);
    if (!match || match.registrationPin !== pin) return false;
    const updatedMatch = appendAudit(
      { ...match, registrationClosed: false },
      { action: 'Registration opened', actor: 'Match PIN holder', details: 'New registrations are allowed.' }
    );
    updateMatch(updatedMatch);
    return true;
  };

  const deleteMatch = (matchId: string, pin: string): boolean => {
    const match = matches.find((value) => value.id === matchId);
    if (!match || match.registrationPin !== pin) return false;
    setMatches(prev => prev.filter((value) => value.id !== matchId));
    if (firestoreDb) {
      void deleteDoc(doc(firestoreDb, 'matches', matchId)).catch((error) => {
        console.error(`Failed to delete match ${matchId}:`, error);
      });
    }
    return true;
  };

  const setTeams = (matchId: string, players: Player[]) => {
    const match = matches.find((value) => value.id === matchId);
    if (!match) return;
    const updatedMatch = appendAudit(
      { ...match, players },
      { action: 'Teams updated', actor: 'Organizer', details: 'Player team assignments changed.' }
    );
    updateMatch(updatedMatch);
  };

  const getMatch = (matchId: string) => matches.find(m => m.id === matchId);

  return (
    <AppContext.Provider
      value={{
        screen, navigate,
        matches, addMatch, updateMatch, addPlayer, updatePlayerStatus,
        removePlayer, closeRegistration, openRegistration, deleteMatch, setTeams, getMatch,
        importNewMatch, applyImportToMatch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
