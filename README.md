# SGSO Teamplaner

Ersatz für SpielerPlus zur Mannschaftsverwaltung der SGSO (Männer, Alte Herren, A-, B-, C-Jugend).

## Funktionen
- **Spielerliste:** Vorname, Name, Geburtstag, mehrere Mannschaften, Telefon, E-Mail, Rolle, Rückennummer, Erziehungsberechtigte, CSV-Import aus Excel
- **Jahrgangsprüfung:** Warnung bei falschem Jahrgang, Hinweis „spielt hoch“ (Saisonwechsel 1.7.)
- **Termine:** Training, Spiele, Sonstiges – manuell, als Trainingsserie oder per Import, mehreren Mannschaften zuordenbar; automatische Treffzeit
- **fussball.de-Import:** kopierten Spielplan einfügen oder .ics-Datei laden; erkennt Duplikate und Spielverlegungen
- **Persönliche Ansicht „Meine“:** jeder sieht nur die Termine seiner Mannschaften; persönlicher Link `#p-<id>`
- **Zu-/Absagen, Dienste, Pinnwand, Trainingsbeteiligung, Geburtstage, CSV-Export**

## Betrieb (Firebase, kostenlos im Spark-Tarif)
`index.html` ist eine einzelne Datei ohne Build-Schritt. Daten, Anmeldung und Rechte laufen über Firebase (Projekt `sgso-teamplaner-dcf68`, Firestore in Frankfurt).

**Einmalige Einrichtung**
1. Firebase → Firestore Database → **Regeln**: Inhalt von `firestore.rules` einfügen → *Veröffentlichen*.
2. Firebase → Authentication → Anmeldemethode: **Google** und **E-Mail/Passwort** aktivieren.
3. Authentication → Einstellungen → Autorisierte Domains: `mexer91.github.io` eintragen.
4. Authentication → Vorlagen: Sprache **Deutsch** wählen.
5. GitHub → Settings → Pages → Branch `main`, Ordner `/` → App unter `https://mexer91.github.io/SGSO/`.
6. App öffnen, anmelden → **„Als Admin einrichten“** (nur beim allerersten Login möglich).

**Rollen**
- **Admin:** alles, plus Trainer/Admins freischalten (Mehr → Zugänge verwalten)
- **Trainer:** alle Mannschaften bearbeiten, Kontaktdaten sehen, Zu-/Absagen für alle setzen
- **Spieler/Eltern:** Zugang über „Login-E-Mails“ im Spielerprofil; sehen nur Termine ihrer Mannschaften und sagen nur für sich zu/ab

**Gratis-Grenzen (Spark):** 50.000 Lesevorgänge und 20.000 Schreibvorgänge pro Tag, 1 GiB Speicher. Trainer laden Termine der letzten 120 Tage und alle künftigen, Spieler nur die ihrer Mannschaften.

## Termin-Erinnerungen (Push aufs Handy)
Jeder Termin hat einen Erinnerungszeitpunkt. Standard: Spiele am Vortag 18:00 Uhr, Training 3 Stunden vor Beginn, Sonstiges am Vortag 18:00 Uhr (änderbar unter Mehr → Einstellungen). Trainer/Admins können ihn pro Termin im Formular ändern oder abschalten.

Empfänger: alle Login-E-Mails von Spielern **und** Trainern/Betreuern im Kader der Termin-Mannschaften, die auf ihrem Gerät „Erinnerungen aktivieren“ getippt haben. iPhone: App vorher über Safari → Teilen → „Zum Home-Bildschirm“ installieren (iOS 16.4+).

Versand: GitHub Actions (`.github/workflows/erinnerungen.yml`) prüft alle 10 Minuten, was fällig ist, und verschickt über Firebase Cloud Messaging – kostenlos, ohne Blaze-Tarif. Je nach GitHub-Auslastung kommt die Mitteilung einige Minuten nach der eingestellten Zeit.

**Einrichtung**
1. Firebase → Projekteinstellungen → Cloud Messaging → Web-Push-Zertifikate → „Schlüsselpaar generieren“. Den Schlüssel in der App unter Mehr → Einstellungen → „Web-Push-Schlüssel“ eintragen (nur Admin).
2. Firebase → Projekteinstellungen → Dienstkonten → „Neuen privaten Schlüssel generieren“ (JSON-Datei).
3. GitHub → Settings → Secrets and variables → Actions → „New repository secret“: Name `FIREBASE_SERVICE_ACCOUNT`, Inhalt = komplette JSON-Datei. **Diese Datei niemals ins Repo hochladen oder weitergeben.**
4. GitHub → Actions → „Termin-Erinnerungen“ → „Run workflow“ zum Testen.
5. Neue `firestore.rules` in Firebase veröffentlichen.

## Dateien
- `index.html` – Teamplaner (Firebase)
- `firestore.rules` – Sicherheitsregeln für Firestore
- `rem.js` – Erinnerungslogik (App und Versand)
- `scripts/send-reminders.mjs`, `.github/workflows/erinnerungen.yml` – Versand der Erinnerungen
- `firebase-messaging-sw.js`, `manifest.webmanifest`, Icons – Push und Installation aufs Handy
- `football_club_app.html` – frühere Version (React)
