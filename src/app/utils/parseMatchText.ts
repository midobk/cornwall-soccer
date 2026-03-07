export interface ParsedMatch {
  name?: string;
  date?: string;        // YYYY-MM-DD
  time?: string;        // HH:MM (24h)
  paymentEmail?: string;
  pricingMode?: 'field' | 'player';
  pricePerPlayer?: number;
  fieldCost?: number;
  fields?: number;
  maxPlayers?: number;
  players?: Array<{ name: string; status: 'paid' | 'unpaid' | 'cash' }>;
}

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

function parseTime(text: string): string | undefined {
  // "10:00 PM" or "10:00PM"
  const ampm = text.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    const suffix = ampm[3].toUpperCase();
    if (suffix === 'PM' && h < 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  // "10PM" or "10 PM"
  const ampmShort = text.match(/\b(\d{1,2})\s*(AM|PM)\b/i);
  if (ampmShort) {
    let h = parseInt(ampmShort[1]);
    const suffix = ampmShort[2].toUpperCase();
    if (suffix === 'PM' && h < 12) h += 12;
    if (suffix === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:00`;
  }
  // "time: 22:00"
  const explicit = text.match(/\btime[:\s]+(\d{1,2}):(\d{2})\b/i);
  if (explicit) {
    return `${explicit[1].padStart(2, '0')}:${explicit[2]}`;
  }
  return undefined;
}

function parseDate(text: string): string | undefined {
  // ISO "2026-03-13"
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  // "March 13, 2026" / "March 13 2026"
  const mdy = text.match(/\b(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
  if (mdy) {
    const mIdx = MONTHS.indexOf(mdy[1].toLowerCase());
    if (mIdx >= 0) {
      return `${mdy[3]}-${(mIdx + 1).toString().padStart(2, '0')}-${parseInt(mdy[2]).toString().padStart(2, '0')}`;
    }
  }

  // "March 13" (no year – current year assumed)
  const md = text.match(/\b(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (md) {
    const mIdx = MONTHS.indexOf(md[1].toLowerCase());
    if (mIdx >= 0) {
      const year = new Date().getFullYear();
      return `${year}-${(mIdx + 1).toString().padStart(2, '0')}-${parseInt(md[2]).toString().padStart(2, '0')}`;
    }
  }

  return undefined;
}

// Keywords that indicate a line is metadata, NOT a player name
const SKIP_RE = /^(players?|teams?|vote|registration|closed|send|payment|paid|unpaid|cash|fields?|cost|price|match|date|time|max|email|share|status|organizer|total|collected|remaining)\b/i;

export function parseMatchText(raw: string): ParsedMatch {
  const result: ParsedMatch = {};
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ── Match name ──────────────────────────────────────────────────────────────
  const matchLabel = raw.match(/^match[:\s]+(.+)/im);
  if (matchLabel) {
    result.name = matchLabel[1].trim().split(/\s*[–—-]\s*/)[0].trim();
  } else if (lines.length > 0) {
    // Strip leading emoji/symbols from first line, then take text before " – " or " - "
    const stripped = lines[0]
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
      .trim();
    const candidate = stripped.split(/\s*[–—-]\s*/)[0].trim();
    if (candidate && !SKIP_RE.test(candidate) && candidate.length > 1) {
      result.name = candidate;
    }
  }

  // ── Time ────────────────────────────────────────────────────────────────────
  result.time = parseTime(raw);

  // ── Date ────────────────────────────────────────────────────────────────────
  // Skip the first line (match name + time) to avoid false positives like "March" in a name
  result.date = parseDate(lines.slice(1).join('\n') || raw);

  // ── Email ───────────────────────────────────────────────────────────────────
  const emailMatch = raw.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) result.paymentEmail = emailMatch[0].toLowerCase();

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const ppp = raw.match(/\$(\d+(?:\.\d+)?)\s*per\s*player/i)
    || raw.match(/price\s*per\s*player[:\s]+\$?(\d+(?:\.\d+)?)/i)
    || raw.match(/cost\s*per\s*player[:\s]+\$?(\d+(?:\.\d+)?)/i);
  if (ppp) {
    result.pricingMode = 'player';
    result.pricePerPlayer = parseFloat(ppp[1]);
  }

  const fc = raw.match(/field\s*cost[:\s]+\$?(\d+(?:\.\d+)?)/i)
    || raw.match(/cost\s*per\s*field[:\s]+\$?(\d+(?:\.\d+)?)/i);
  if (fc) {
    result.pricingMode = 'field';
    result.fieldCost = parseFloat(fc[1]);
  }

  // ── Fields count ─────────────────────────────────────────────────────────────
  // e.g. "2 fields" or "fields: 2"
  const fieldsM = raw.match(/\b(\d+)\s+fields?\b/i) || raw.match(/\bfields?[:\s]+(\d+)/i);
  if (fieldsM) result.fields = parseInt(fieldsM[1]);

  // ── Max players ──────────────────────────────────────────────────────────────
  const maxRatio = raw.match(/players?\s*\(\s*\d+\s*\/\s*(\d+)\s*\)/i);
  const maxExp = raw.match(/max\s*players?[:\s]+(\d+)/i);
  if (maxRatio) result.maxPlayers = parseInt(maxRatio[1]);
  else if (maxExp) result.maxPlayers = parseInt(maxExp[1]);

  // ── Players ──────────────────────────────────────────────────────────────────
  const players: Array<{ name: string; status: 'paid' | 'unpaid' | 'cash' }> = [];

  for (const line of lines) {
    // Only process numbered ("1. Name") or bulleted ("- Name", "• Name", "* Name") lines
    const m = line.match(/^(?:\d+[.)]\s*|[-•*]\s*)(.+)$/);
    if (!m) continue;

    let text = m[1].trim();

    // Skip metadata / headers
    if (SKIP_RE.test(text)) continue;
    if (text.includes(':')) continue;                       // "Pay to: email"
    if (/^[A-Z0-9\s!–—-]{4,}$/.test(text)) continue;      // ALL-CAPS headers

    // Determine status from emoji or keyword
    let status: 'paid' | 'unpaid' | 'cash' = 'unpaid';
    if (text.includes('✅')) {
      status = 'paid';
      text = text.replace(/✅/g, '').trim();
    } else if (text.includes('💵')) {
      status = 'cash';
      text = text.replace(/💵/g, '').trim();
    } else if (text.includes('⏳')) {
      status = 'unpaid';
      text = text.replace(/⏳/g, '').trim();
    } else if (/\bpaid\b/i.test(text) && !/^paid$/i.test(text)) {
      status = 'paid';
      text = text.replace(/\s*\bpaid\b\s*/gi, '').trim();
    } else if (/\bcash\b/i.test(text) && !/^cash$/i.test(text)) {
      status = 'cash';
      text = text.replace(/\s*\bcash\b\s*/gi, '').trim();
    }

    // Strip any remaining unicode emoji
    text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    if (text && text.length > 0 && text.length < 60) {
      players.push({ name: text, status });
    }
  }

  if (players.length > 0) result.players = players;

  return result;
}

/** Human-readable summary of what was detected */
export function summariseParsed(p: ParsedMatch): string[] {
  const items: string[] = [];
  if (p.name)         items.push(`Match: ${p.name}`);
  if (p.date)         items.push(`Date: ${new Date(p.date + 'T00:00:00').toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric', year:'numeric' })}`);
  if (p.time)         items.push(`Time: ${formatParsedTime(p.time)}`);
  if (p.fields)       items.push(`Fields: ${p.fields}`);
  if (p.maxPlayers)   items.push(`Max players: ${p.maxPlayers}`);
  if (p.paymentEmail) items.push(`Payment email: ${p.paymentEmail}`);
  if (p.pricingMode === 'player' && p.pricePerPlayer)
    items.push(`Price per player: $${p.pricePerPlayer}`);
  if (p.pricingMode === 'field' && p.fieldCost)
    items.push(`Field cost: $${p.fieldCost}`);
  if (p.players)
    items.push(`Players detected: ${p.players.length}`);
  return items;
}

function formatParsedTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}
