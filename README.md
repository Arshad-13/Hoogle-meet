# Hoogle Meet - WebRTC Video Conferencing

A fully functional Google Meet clone built with Next.js, Socket.io, and WebRTC. Features peer-to-peer video calls, screen sharing, and real-time communication with automatic SSL/TLS encryption.

## 🎯 Features

- ✅ **1-on-1 & Multi-participant video calls** (up to 4-5 users efficiently)
- ✅ **Screen sharing** with seamless switching
- ✅ **Audio/Video controls** (mute/unmute, camera on/off)
- ✅ **Responsive UI** - Works on desktop and mobile
- ✅ **End-to-end encrypted** - All media uses SRTP/DTLS
- ✅ **Real-time signaling** - WebSocket-based peer coordination
- ✅ **Modern UI** - Glassmorphism design with smooth animations

## 🚀 Live Demo

- **App**: https://hoogle-meet.vercel.app
- **Backend**: https://hoogle-meet-backend-production.up.railway.app

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: CSS (Glassmorphism design)
- **WebRTC**: Native browser APIs
- **Deployment**: Vercel (automatic SSL)

### Backend
- **Server**: Node.js + Express
- **Real-time**: Socket.io (WebSocket)
- **CORS**: Configured for frontend
- **Deployment**: Railway (automatic SSL)

### Infrastructure
- **STUN Servers**: Google's public STUN servers
- **SSL/TLS**: Automatic via Vercel & Railway
- **Encryption**: DTLS (key exchange) + SRTP (media)

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- Modern browser (Chrome, Edge, Firefox, Safari)
- Camera and microphone

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Arshad-13/Hoogle-meet.git
   cd Hoogle-meet
   ```

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server && npm install && cd ..
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
   ```

4. **Run the application**:
   ```bash
   # Run both frontend and backend (from root)
   npm run dev
   
   # Or run separately:
   # Terminal 1: Frontend
   npm run dev:client
   
   # Terminal 2: Backend
   npm run dev:server
   ```

5. **Open in browser**: http://localhost:3000

## 🎮 Usage

1. Open the app in your browser
2. Click **"Create New Meeting"** to generate a room
3. Allow camera/microphone permissions in the lobby
4. Click **"Join Meeting"** to enter the room
5. Share the room code with others to join
6. Use controls to mute/unmute, toggle camera, or share screen

### Testing Multi-User

- Open the app in multiple browser windows (use Incognito/Private mode)
- Or use different devices on the same network
- All participants use the same room code

## 📁 Project Structure

```
Hoogle-meet/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── lobby/[roomId]/       # Pre-call device testing
│   │   └── room/[roomId]/        # Main meeting room
│   ├── components/
│   │   ├── ControlBar.tsx        # Meeting controls
│   │   ├── VideoGrid.tsx         # Responsive video layout
│   │   └── VideoTile.tsx         # Individual video tile
│   ├── hooks/
│   │   ├── useSocket.ts          # Socket.io connection
│   │   └── useWebRTC.ts          # WebRTC peer management
│   └── config/
│       └── iceServers.ts         # STUN/TURN configuration
├── server/
│   ├── index.js                  # Socket.io signaling server
│   └── package.json
├── package.json
├── tsconfig.json
├── next.config.ts
├── railway.json                  # Railway deployment config
├── nixpacks.json                 # Build configuration
└── README.md
```

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variable:
   - `NEXT_PUBLIC_SIGNALING_URL` = Your Railway backend URL
4. Deploy automatically

### Backend (Railway)

1. Connect GitHub repository
2. Set root directory or use `railway.json`
3. Add environment variable:
   - `CLIENT_URL` = Your Vercel frontend URL
4. Auto-deploys on every push

Both platforms provide **automatic SSL/TLS certificates**.

## 🔒 Security

- ✅ **HTTPS enforced** on frontend and backend
- ✅ **WebSocket Secure (WSS)** for signaling
- ✅ **DTLS** for secure key exchange
- ✅ **SRTP** for encrypted media streams
- ✅ **CORS** properly configured
- ⚠️ Add room passwords for production use
- ⚠️ Implement rate limiting on signaling server

## 🏗️ Architecture

### WebRTC Flow

```
┌─────────────┐                           ┌─────────────┐
│  Browser A  │                           │  Browser B  │
└──────┬──────┘                           └──────┬──────┘
       │                                          │
       │  1. Join Room (WebSocket)                │
       ├──────────────►┌────────────────┐◄────────┤
       │               │ Signaling Server│         │
       │               │   (Socket.io)   │         │
       │  2. Offer/    └────────────────┘ 3. Answer│
       │   Answer (SDP)          │                  │
       ├─────────────────────────┴──────────────────┤
       │                                            │
       │  4. ICE Candidates (NAT Traversal)         │
       ├────────────────────────────────────────────┤
       │                                            │
       │  5. Direct P2P Media (SRTP)                │
       ◄────────────────────────────────────────────►
```

### Mesh Topology (Current)
- Direct P2P connections between all participants
- Efficient for 2-4 users
- Each user uploads N-1 streams

### Scaling Beyond 5 Users
For larger meetings, migrate to an SFU (Selective Forwarding Unit):
- **MediaSoup** - Node.js SFU
- **Janus** - C-based media server
- **Jitsi** - Complete solution

## 🐛 Troubleshooting

**Camera/mic not working**:
- Ensure using HTTPS or `localhost`
- Check browser permissions
- Try refreshing the page

**Connection fails**:
- Verify both frontend and backend are running
- Check firewall isn't blocking WebSocket
- Try different browser

**Video quality issues**:
- Check internet connection
- Reduce number of participants (mesh topology limitation)
- Close bandwidth-intensive applications

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 🙏 Acknowledgments

- WebRTC APIs and standards
- Socket.io for real-time communication
- Vercel and Railway for free hosting
- Google for public STUN servers

## 🤝 Contributing

This is a learning project. Feel free to fork and experiment!

## 📧 Contact

Created by Arshad - [GitHub](https://github.com/Arshad-13)
