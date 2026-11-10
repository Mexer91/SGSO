# SGSO Teamplaner

Ersatz für SpielerPlus zur Mannschaftsverwaltung der SGSO (Männer, Alte Herren, A-, B-, C-Jugend).

## Funktionen
- **Spielerliste:** Vorname, Name, Geburtstag, mehrere Mannschaften, Telefon, E-Mail, Rolle, Rückennummer, Erziehungsberechtigte, CSV-Import aus Excel
- **Jahrgangsprüfung:** Warnung bei falschem Jahrgang, Hinweis „spielt hoch“ (Saisonwechsel 1.7.)
- **Termine:** Training, Spiele, Sonstiges – manuell, als Trainingsserie oder per Import, mehreren Mannschaften zuordenbar; automatische Treffzeit
- **fussball.de-Import:** kopierten Spielplan einfügen oder .ics-Datei laden; erkennt Duplikate und Spielverlegungen
- **Persönliche Ansicht „Meine“:** jeder sieht nur die Termine seiner Mannschaften; persönlicher Link `#p-<id>`
- **Zu-/Absagen, Dienste, Pinnwand, Trainingsbeteiligung, Geburtstage, CSV-Export**

## Betrieb
`index.html` ist eine einzelne Datei ohne Build-Schritt.

- **In claude.ai (Artifact):** Daten liegen in einer gemeinsamen Datenbank, Rechte über „Teilen“ (Editor = Trainer).
- **Als normale Webseite (z. B. GitHub Pages):** Die App läuft im *lokalen Modus* – Daten bleiben nur im jeweiligen Browser. Für gemeinsame Daten außerhalb von claude.ai braucht es ein Backend (z. B. Firebase/Supabase).

GitHub Pages aktivieren: *Settings → Pages → Branch `main`, Ordner `/`*. Danach ist die App unter `https://mexer91.github.io/SGSO/` erreichbar.

## Dateien
- `index.html` – aktueller Teamplaner
- `football_club_app.html` – frühere Version (React)
