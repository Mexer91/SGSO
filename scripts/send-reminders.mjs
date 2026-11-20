// Verschickt fällige Termin-Erinnerungen als Push-Mitteilung (Firebase Cloud Messaging).
// Läuft alle 10 Minuten über GitHub Actions. Benötigt das Secret FIREBASE_SERVICE_ACCOUNT.
import admin from 'firebase-admin';
import { REM_DEFAULTS, defaultRem, effectiveRem, berlinNowStr, addMinutesStr } from '../rem.js';

const APP_URL = process.env.APP_URL || 'https://mexer91.github.io/SGSO/';
const LOOKBACK_MIN = 360;          // Erinnerungen, die bis zu 6 Std. überfällig sind, werden noch verschickt
const DRY = process.env.DRY_RUN === '1';
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.error('Secret FIREBASE_SERVICE_ACCOUNT fehlt oder ist ungültig.'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const fcm = admin.messaging();

const now = berlinNowStr();
const today = now.slice(0, 10);
const clubSnap = await db.doc('config/club').get();
const club = { ...REM_DEFAULTS, name: 'SGSO', ...(clubSnap.exists ? clubSnap.data() : {}) };
console.log(`Jetzt (Berlin): ${now}`);

// 1) Einmal täglich (und nach Änderung der Vereinsstandards): Erinnerungszeit bei allen künftigen Terminen setzen
const marker = db.doc('config/remBackfill');
const mk = await marker.get();
if (!mk.exists || mk.data().date !== today) {
  const fut = await db.collection('events').where('datum', '>=', today).get();
  let n = 0; let batch = db.batch(); let inBatch = 0;
  for (const d of fut.docs) {
    const e = d.data();
    if (e.remManual && e.rem) continue;
    const r = defaultRem(e, club);
    if (r && r !== e.rem) { batch.update(d.ref, { rem: r, remManual: false }); n++; inBatch++; }
    if (inBatch >= 400) { if (!DRY) await batch.commit(); batch = db.batch(); inBatch = 0; }
  }
  if (inBatch && !DRY) await batch.commit();
  if (!DRY) await marker.set({ date: today, at: Date.now(), updated: n });
  console.log(`Erinnerungszeiten aktualisiert: ${n} von ${fut.size} künftigen Terminen`);
}

// 2) Fällige Erinnerungen suchen
const from = addMinutesStr(now, -LOOKBACK_MIN);
const dueSnap = await db.collection('events').where('rem', '<=', now).where('rem', '>', from).get();
const due = dueSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }))
  .filter(e => { const r = effectiveRem(e, club); return r && r === e.rem && r <= now && e.remSent !== r; });
console.log(`Fällige Erinnerungen: ${due.length}`);
if (!due.length) process.exit(0);

// 3) Empfänger ermitteln: Login-E-Mails der Spieler/Trainer im Kader der Termin-Mannschaften
const [playersSnap, loginsSnap, tokensSnap, teamsSnap] = await Promise.all([
  db.collection('players').get(), db.collection('logins').get(), db.collection('tokens').get(), db.collection('teams').get(),
]);
const players = Object.fromEntries(playersSnap.docs.map(d => [d.id, d.data()]));
const teams = Object.fromEntries(teamsSnap.docs.map(d => [d.id, d.data()]));
const loginToPlayers = Object.fromEntries(loginsSnap.docs.map(d => [d.id, d.data().playerIds || []]));
const tokensByMail = {};
tokensSnap.docs.forEach(d => { const m = (d.data().email || '').toLowerCase(); (tokensByMail[m] = tokensByMail[m] || []).push(d.id); });

const fmtDay = ds => { const [y, m, d] = ds.split('-').map(Number); const x = new Date(Date.UTC(y, m - 1, d)); return `${WD[x.getUTCDay()]}, ${d}.${m}.`; };
const relDay = ds => ds === today ? 'Heute' : ds === addMinutesStr(`${today}T12:00`, 1440).slice(0, 10) ? 'Morgen' : fmtDay(ds);
const teamLabel = e => (e.teams || []).map(t => teams[t]?.kurz || teams[t]?.name || t).join('/');
function title(e) {
  const t = teamLabel(e);
  if (e.typ === 'spiel') return `${t ? t + ': ' : ''}${e.heim ? 'Heimspiel gegen ' : 'Auswärts bei '}${e.gegner || 'Gegner'}`;
  if (e.typ === 'training') return `${t ? t + ': ' : ''}${e.titel || 'Training'}`;
  return `${t ? t + ': ' : ''}${e.titel || 'Termin'}`;
}

const invalid = new Set();
for (const e of due) {
  const att = (await db.doc(`att/${e.id}`).get()).data()?.a || {};
  const kader = Object.entries(players).filter(([, p]) => p.status !== 'inaktiv' && (p.teams || []).some(t => (e.teams || []).includes(t))).map(([id]) => id);
  const messages = [];
  for (const [mail, pids] of Object.entries(loginToPlayers)) {
    const mine = pids.filter(id => kader.includes(id));
    if (!mine.length) continue;
    const toks = tokensByMail[mail] || [];
    if (!toks.length) continue;
    const offen = mine.filter(id => !['y', 'n', 'm'].includes(att[id]?.s));
    const names = mine.length > 1 ? ` (${mine.map(id => players[id]?.vorname).join(', ')})` : '';
    const zeit = [relDay(e.datum) + (e.zeit ? ` ${e.zeit} Uhr` : ''), e.treff ? `Treff ${e.treff}` : '', e.ort].filter(Boolean).join(' · ');
    const status = offen.length ? 'Bitte zu- oder absagen.' : (mine.every(id => att[id]?.s === 'n') ? 'Du hast abgesagt.' : 'Du bist dabei.');
    const body = `${zeit}\n${status}${names}`;
    for (const token of toks) {
      messages.push({
        token,
        notification: { title: title(e), body },
        data: { eventId: e.id, link: APP_URL + '#termine' },
        webpush: {
          notification: { icon: APP_URL + 'icon-192.png', badge: APP_URL + 'icon-192.png', tag: 'rem-' + e.id, lang: 'de' },
          fcmOptions: { link: APP_URL + '#termine' },
        },
      });
    }
  }
  console.log(`${e.datum} ${e.zeit || ''} ${title(e)}: ${messages.length} Mitteilungen`);
  if (messages.length && !DRY) {
    for (let i = 0; i < messages.length; i += 500) {
      const res = await fcm.sendEach(messages.slice(i, i + 500));
      res.responses.forEach((r, j) => {
        if (!r.success) {
          const code = r.error?.code || '';
          console.warn('  Fehler:', code);
          if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token') || code.includes('invalid-argument')) invalid.add(messages[i + j].token);
        }
      });
      console.log(`  gesendet: ${res.successCount}, fehlgeschlagen: ${res.failureCount}`);
    }
  }
  if (!DRY) await e.ref.update({ remSent: e.rem, remSentAt: Date.now() });
}
if (invalid.size && !DRY) {
  const b = db.batch(); invalid.forEach(t => b.delete(db.doc(`tokens/${t}`))); await b.commit();
  console.log(`Ungültige Geräte entfernt: ${invalid.size}`);
}
