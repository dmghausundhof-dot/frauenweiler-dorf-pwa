# Frauenweiler DorfApp – Web PWA

Die moderne Progressive Web App für **Frauenweiler bei Wiesloch** (69168).

## ✨ Features (Vollständig erweitert)

- **Echte Supabase Authentifizierung** (Login + Registrierung mit E-Mail/Passwort)
- **Realtime-Updates** für Umfragen (live bei neuen Stimmen)
- **Admin-Bereich** zum Erstellen von:
  - News
  - Terminen / Veranstaltungen
  - Mitbring- & Helfer-Aufgaben
- **Service Worker** für besseren Offline-Support (PWA)
- Bilder-Upload vorbereitet (Supabase Storage Bucket `event-images`)
- Schönes modernes Dorf-Design (Grün-Thema)
- Vollständig als **PWA installierbar**
- 6 Tabs + interaktive Mitmach-Funktionen

## 🚀 Schnellstart

```bash
cd frauenweiler-dorf-pwa
npm install
npm run dev
```

Öffne **http://localhost:3000**

## 🔧 Für Produktion (Supabase + Vercel)

1. Supabase Projekt anlegen (EU-Region empfohlen)
2. `supabase/schema.sql` im SQL Editor ausführen
3. Storage Bucket `event-images` (public) anlegen + Policies
4. `.env.local` anlegen (siehe `.env.example`) mit:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. `npm run build && npm start` oder auf Vercel deployen

**Wichtig:** Für echte Push-Benachrichtigungen später Supabase Edge Functions hinzufügen.

## 📱 PWA Installation

- Auf dem Smartphone: Menü → "Zum Home-Bildschirm hinzufügen"
- Die App startet dann ohne Browser-Leiste wie eine echte App

## GitHub & Flutter-Version

Die mobile Flutter-App findest du hier:  
https://github.com/dmghausundhof-dot/frauenweiler-dorf-app

---

**Entwickelt für die Dorfgemeinschaft Frauenweiler**  
Walldorf / Wiesloch Region
