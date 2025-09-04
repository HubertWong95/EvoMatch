# EvoMatch

> A playful matchmaking app with quiz-based pairing, real-time chat, and AI-generated pixel avatars.

EvoMatch pairs people through a short Q&A round; if both participants score high enough, they match and can chat instantly. New users can snap a webcam photo during signup and get a **cartoon/pixel avatar** generated via OpenAI Images.

<p align="center">
  <img alt="EvoMatch preview" src="docs/screenshot.png" width="700">
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Key Endpoints](#key-endpoints)
- [Socket Events](#socket-events)
- [Project Structure](#project-structure)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Discover & Match**

  - Enter a queue, answer 10 lightweight questions.
  - If both users score ≥ **6**, a match is created automatically.

- **Live Messaging**

  - Real-time chat over Socket.IO.
  - Optimistic sending + client-side de-duplication (no double messages).

- **AI Avatars**

  - Capture a webcam photo during registration.
  - Image is transformed into a **pixel/cartoon avatar** via OpenAI (`gpt-image-1`).
  - Avatar is uploaded and **persisted to the user** for future sessions.

- **Profiles**
  - Edit display name, bio, location, and hobbies.
  - Live-styled card preview in a retro “game UI” look.

---

## Tech Stack

**Frontend**

- React (TypeScript) + Vite
- Tailwind CSS (pixel/retro UI)
- Socket.IO Client
- Webcam capture component
- Lightweight auth & state hooks

**Backend**

- Node.js + Express
- Socket.IO (server)
- Prisma ORM (PostgreSQL or SQLite)
- JWT authentication
- Multer + Sharp (image upload/resize) with static hosting under `/uploads`

**AI / Media**

- OpenAI Images (`gpt-image-1`) for avatar generation
- Client-side downscaling before calling OpenAI to avoid large payloads

---

## Architecture

- **Quiz flow** (Socket): `session:ready → session:question → session:answer → session:complete`
- **Match** (DB): Created/upserted when both users pass (score ≥ 6)
- **Messaging** (Socket): `chat:send` saves message → server emits `chat:message` and `message:new` to both users
- **Avatars**:
  - Frontend captures photo, calls OpenAI to cartoonize, then uploads result.
  - Backend writes `avatarUrl` to the user; `/api/me` always includes `avatarUrl`.

---
