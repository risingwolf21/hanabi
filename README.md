# Hanabi — Multiplayer Web App

A real-time multiplayer implementation of the cooperative card game Hanabi, built with React, TypeScript, shadcn/ui, and Firebase Firestore.

## Features

- **2–5 players** — join via a 6-character room code, no account required
- **Real-time** — all players see moves instantly via Firestore `onSnapshot`
- **All 4 multicolor variants** configurable at room creation
- **Complete rules** — clue tokens, fuse tokens, last-round countdown, scoring, score ratings

## Firebase Setup (required before first run)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (disable Analytics if prompted)
2. **Firestore:** Build → Firestore Database → Create database → start in **test mode** → choose a region
3. **Auth:** Authentication → Get started → Sign-in method → **Anonymous** → Enable → Save
4. **App config:** Project Settings → Your apps → Add app (Web) → register → copy the `firebaseConfig` values
5. Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
# Edit .env with your Firebase config values
```

6. (Optional, for production) Deploy the Firestore security rules:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, use firestore.rules
firebase deploy --only firestore:rules
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

## Game Rules Summary

Players cooperate to build 5 (or 6) fireworks in ascending order (1→5). The catch: you **cannot see your own hand** — only your teammates can.

Each turn, a player must do exactly one of:
- **Give a clue** — spend a hint token to tell one teammate about all their cards of one specific color **or** one specific value
- **Discard** — regain a hint token, draw a new card
- **Play a card** — if it legally extends a firework (sequential 1–5), it's placed; otherwise a fuse burns

The game ends when all fireworks are complete (perfect win!), 3 fuses burn (loss), or the draw pile runs out (score the highest card of each firework).

## Variant Options

| Option | Description |
|--------|-------------|
| **None** | Standard 5-color, 50-card game |
| **Variant 1** | 6th multicolor suit as a normal firework (60 cards) |
| **Variant 2** | 6th suit with only one of each value (55 cards) |
| **Variant 3** | Multicolor tiles are wild — respond to any color clue, cannot be clued as "multicolor" |
| **Variant 4** | Perfectionist — game never ends on time limit; only loss (3 fuses / indispensable tile discarded) or perfect win |
