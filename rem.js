// Erinnerungslogik – wird von der App (Browser) und vom Versandskript (GitHub Actions) gemeinsam genutzt.
// Alle Zeitpunkte sind deutsche Ortszeit im Format "YYYY-MM-DDTHH:MM".

export const REM_DEFAULTS = {
  remSpielTage: 1,        // Spiele: so viele Tage vorher …
  remSpielZeit: '18:00',  // … um diese Uhrzeit
  remTrainingStd: 3,      // Training: so viele Stunden vor Beginn
  remEventTage: 1,        // Sonstige Termine: Tage vorher …
  remEventZeit: '18:00',  // … um diese Uhrzeit
};

const pad = n => String(n).padStart(2, '0');

/** Addiert Minuten auf einen lokalen Zeitstempel "YYYY-MM-DDTHH:MM" (kalendarisch, ohne Zeitzonenrechnung). */
export function addMinutesStr(ts, min) {
  const [d, t = '00:00'] = ts.split('T');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const x = new Date(Date.UTC(y, m - 1, dd, h, mi) + min * 60000);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
}

function validTime(t) { return /^\d{2}:\d{2}$/.test(t || ''); }

/** Standard-Erinnerung für einen Termin nach den Vereinseinstellungen. */
export function defaultRem(e, club) {
  if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.datum || '')) return '';
  const c = { ...REM_DEFAULTS, ...(club || {}) };
  const dayBefore = (tage, zeit) => addMinutesStr(`${e.datum}T${validTime(zeit) ? zeit : '18:00'}`, -Math.max(0, Number(tage) || 0) * 1440);
  if (e.typ === 'training') {
    if (validTime(e.zeit)) return addMinutesStr(`${e.datum}T${e.zeit}`, -Math.max(0, Number(c.remTrainingStd) || 0) * 60);
    return dayBefore(1, '18:00');
  }
  if (e.typ === 'spiel') return dayBefore(c.remSpielTage, c.remSpielZeit);
  return dayBefore(c.remEventTage, c.remEventZeit);
}

/** Gültiger Erinnerungszeitpunkt eines Termins ('' = keine Erinnerung). */
export function effectiveRem(e, club) {
  if (!e || e.remOff || e.status === 'abgesagt') return '';
  if (e.remManual && e.rem) return e.rem;
  return defaultRem(e, club);
}

/** Aktuelle Zeit in Deutschland als "YYYY-MM-DDTHH:MM". */
export function berlinNowStr(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
