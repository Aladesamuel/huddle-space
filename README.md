# 🏢 Huddle Space

A professional, zero-cost, audio-only virtual office for startups. No databases, no servers, no fuss.

## 🚀 Key Features

- **P2P Spontaneity**: Click a teammate to start an instant audio huddle.
- **Database-less**: The "Office" exists entirely in your browser and URL.
- **Zero-Cost**: Deploy for $0 on Vercel, Netlify, or any static host.
- **Privacy-First**: Audio-only (no cameras) and optional cryptographic office passwords.
- **Founders' Flow**: Create an office once, share the link, and you're set for life.

---

## 🏗️ How it Works (Database-less P2P)

Huddle Space uses **WebRTC (via PeerJS)** for all communication.
1. When you create an office, the settings (name, rules, password hash) are **Base64 encoded into the URL**.
2. Teammates join by clicking that URL. Their browsers "read" the settings from the link.
3. Peer discovery happens via a **Seed-Mesh topology**: The first person in the room acts as a "Seed" for discovery, allowing everyone to connect directly (P2P) without a central server.

---

## 🐋 Self-Hosting (Docker)

Startups can self-host Huddle Space with a single command:

```bash
docker-compose up -d
```

The app will be available at `http://localhost:8080`.

---

## ☁️ Deployment (Vercel / Netlify)

1. Create a new repository on GitHub.
2. Push this code to the repository.
3. Connect your Vercel account to the repository.
4. **Vercel will auto-detect the Vite project**—just click "Deploy".

---

## 🛠️ Tech Stack

- **React + Vite** (Frontend)
- **Zustand** (State Management)
- **PeerJS** (WebRTC Networking)
- **Lucide React** (Icons)
- **Vanilla CSS** (Google Meet Aesthetic)

---

## 📜 Usage Tips

- **Invite Links**: Your invite link contains your office data. **Do not lose it**, as there is no backend to recover it.
- **Huddle Expansion**: Anyone in a huddle can add more "Available" teammates by clicking the `+` icon in the huddle popup.
- **Status Sync**: Your status is shared instantly with everyone else in the office via P2P data channels.
