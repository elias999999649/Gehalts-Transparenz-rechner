# Gehalts-Transparenz-Rechner

Ein moderner, clientseitiger Web-Rechner zur Ermittlung des **effektiven Netto-Stundenlohns** unter Berücksichtigung von Arbeitszeit, unbezahlten Pausen, Arbeitsweg, Fahrtkosten und Modell-Abgaben.

---

## 🚀 Funktionen & Highlights

- **Echtzeit-Berechnung:** Sofortige Aktualisierung aller Kennzahlen und Diagramme bei jeder Werteänderung.
- **Effektiver vs. Klassischer Stundenlohn:** Gegenüberstellung von klassischem Netto-Stundenlohn und dem realen, um Pendelzeit und Fahrtkosten bereinigten effektiven Wert.
- **Schnell-Vorlagen (Presets):** Ein-Klick-Wechsel zwischen verschiedenen Szenarien (Standard, Einsteiger, Senior / Full-Remote, Langstrecken-Pendler).
- **Interaktive Visualisierungen:** Detaillierte Diagramme (Gehaltsaufteilung, Zeitaufwand, Stundenlohn-Vergleich) via Chart.js.
- **Ergebnis-Aktionen:** Direktes Kopieren der Zusammenfassung in die Zwischenablage sowie Druck-/PDF-Export.
- **100% Datenschutz:** Alle Berechnungen und Speichervorgänge erfolgen ausschließlich lokal im Browser (LocalStorage). Keine Server-Übertragung sensibler Daten.
- **Barrierefreiheit & Responsive Design:** Optimiert für mobile Geräte, Tablets und Desktops mit Sticky Sidebar und vollständiger Screenreader-Unterstützung.

---

## 🛠️ Technologie-Stack

- **HTML5 & CSS3** (mit modernen CSS-Variablen und Grid-Layouts)
- **Tailwind CSS** (via CDN für schnelle und responsive UI-Komponenten)
- **Vanilla JavaScript (ES6+ Modules)** für zustandsbasiertes UI-Rendering und Berechnungslogik
- **Chart.js (v4)** für interaktive Datenvisualisierungen

---

## 📂 Projektstruktur

```tree
├── index.html          # Hauptseite & Benutzeroberfläche
├── css/
│   └── styles.css      # Projektweite und ergänzende Styles
├── js/
│   ├── main.js         # App-Initialisierung & Event-Listener
│   ├── calculations.js # Reine Berechnungs- und Validierungslogik
│   ├── charts.js       # Chart.js Integration & Visualisierungen
│   ├── ui.js           # DOM-Rendering & UI-Helfer
│   ├── state.js        # Zentraler Anwendungszustand
│   └── storage.js      # LocalStorage-Persistenz
├── favicon.svg         # App-Icon
├── manifest.json       # PWA Manifest
└── sitemap.xml         # SEO Sitemap
```

---

## 💻 Lokale Entwicklung & Start

Da es sich um eine rein clientseitige Webanwendung handelt, ist kein Build-Prozess oder Backend erforderlich.

1. Repository klonen oder herunterladen.
2. `index.html` direkt im Browser öffnen **oder** einen lokalen Entwicklungsserver starten (z. B. mit VS Code *Live Server* oder Python):
   ```bash
   python -m http.server 8000
   ```
3. Im Browser `http://localhost:8000` aufrufen.

---

## 📄 Lizenz

Dieses Projekt ist als Open-Source-Orientierungshilfe konzipiert.
