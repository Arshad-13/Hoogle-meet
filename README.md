# Hoogle Meet - Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Modern browser (Chrome, Edge, Firefox, or Safari)
- Camera and microphone permissions

### Installation

1. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install && cd ..
   ```

2. **Set up environment variables:**
   ```bash
   # Copy example env file
   cp .env.local.example .env.local
   ```

3. **Run the application:**
   ```bash
   # Runs both frontend (port 3000) and backend (port 3001)
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1: Frontend
   npm run dev:client
   
   # Terminal 2: Backend
   npm run dev:server
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Create New Meeting" to generate a room
3. Allow camera/microphone permissions in the lobby
4. Click "Join Meeting" to enter the room
5. Share the room code with others to join

### Testing with Multiple Participants

- Open the app in multiple browser windows (use Incognito/Private mode)
- Or use different devices on the same network
- All participants use the same room code

## Features

✅ **1-on-1 video calls** - Direct P2P connection  
✅ **Multi-participant support** - Up to 4-5 users efficiently  
✅ **Screen sharing** - Share your screen or application window  
✅ **Audio/Video controls** - Mute/unmute, camera on/off  
✅ **Responsive UI** - Works on desktop and mobile  
✅ **End-to-end encrypted** - All media uses SRTP/DTLS  

## Architecture

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Signaling**: Socket.io (WebSocket)
- **WebRTC**: Native browser APIs
- **STUN Server**: Google's public STUN servers

## Troubleshooting

### Camera/Mic not working
- Ensure you're using HTTPS or localhost
- Check browser permissions for camera/microphone
- Try refreshing the page

### Connection fails
- Check that both frontend and backend are running
- Verify firewall isn't blocking WebSocket connections
- Try using a different browser

### Video quality issues
- Check your internet connection
- Close other bandwidth-intensive applications
- Reduce number of participants (mesh topology limitation)

## Project Structure

```
s:/HM/
├── server/               # Socket.io signaling server
│   ├── index.js         # Main server file
│   └── package.json
├── src/
│   ├── app/
│   │   ├── lobby/       # Pre-call device testing
│   │   ├── room/        # Main meeting room
│   │   └── page.tsx     # Home page
│   ├── components/
│   │   ├── ControlBar.tsx
│   │   ├── VideoGrid.tsx
│   │   └── VideoTile.tsx
│   ├── hooks/
│   │   ├── useSocket.ts  # Socket.io connection
│   │   └── useWebRTC.ts  # WebRTC peer management
│   └── config/
│       └── iceServers.ts # STUN/TURN configuration
└── package.json
```

## Next Steps

For production deployment:
1. Deploy frontend to Vercel/Netlify
2. Deploy signaling server to Railway/Render
3. Configure TURN server for corporate networks
4. Add authentication (Clerk/Firebase)
5. Migrate to SFU for >5 participants (Mediasoup/Janus)
