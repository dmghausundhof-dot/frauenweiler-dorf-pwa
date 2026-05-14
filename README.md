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
4. `.env.local` anlegen (siehe `.env.example`)
5. `npm run build && npm start` oder auf Vercel deployen

**Wichtig:** Für echte Push-Benachrichtigungen später Supabase Edge Functions hinzufügen.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. `npm run build`
5. Auf **Vercel** deployen (Repository verbinden → Automatic Deploy)

## 📱 PWA Installation

- Auf dem Smartphone: Menü → "Zum Home-Bildschirm hinzufügen"
- Die App startet dann ohne Browser-Leiste wie eine echte App

## GitHub & Flutter-Version

Die mobile Flutter-App findest du hier:  
https://github.com/dmghausundhof-dot/frauenweiler-dorf-app

---

**Entwickelt für die Dorfgemeinschaft Frauenweiler**  
Walldorf / Wiesloch Region

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
