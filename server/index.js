const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for the frontend
app.use(cors());

// Initialize Socket.io with CORS
const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
// Events emitted: 'existing-users', 'user-joined', 'user-disconnected', 'offer', 'answer', 'ice-candidate', 'room-full', 'server-busy'

// In-memory storage for rooms and participants
const rooms = new Map(); // Map<roomId, Set<socketId>>
const socketToRoom = new Map(); // Map<socketId, roomId>
const socketToUserId = new Map(); // Map<socketId, userId>

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        rooms: rooms.size,
        connections: io.sockets.sockets.size
    });
});

io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] New connection: ${socket.id}`);

    // Handle room join
    socket.on('join-room', (roomId, userId) => {
        console.log(`[${new Date().toISOString()}] User ${userId} (${socket.id}) joining room ${roomId}`);

        // Leave any previous room
        const previousRoom = socketToRoom.get(socket.id);
        if (previousRoom) {
            socket.leave(previousRoom);
            const roomSet = rooms.get(previousRoom);
            if (roomSet) {
                roomSet.delete(socket.id);
                if (roomSet.size === 0) {
                    rooms.delete(previousRoom);
                }
            }
        }

        // Check global room limit (Max 1 active room)
        if (rooms.size > 0 && !rooms.has(roomId)) {
            socket.emit('server-busy');
            console.log(`[${new Date().toISOString()}] Server busy: Rejecting new room ${roomId} from ${socket.id}`);
            return;
        }

        // Check room capacity
        const existingRoom = rooms.get(roomId);
        if (existingRoom && existingRoom.size >= 4) {
            socket.emit('room-full');
            console.log(`[${new Date().toISOString()}] Room ${roomId} is full, rejecting connection from ${socket.id}`);
            return;
        }

        // Join the new room
        socket.join(roomId);
        socketToRoom.set(socket.id, roomId);
        socketToUserId.set(socket.id, userId);

        // Add to room set
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(socket.id);

        // Get list of other users in the room
        const roomUsers = Array.from(rooms.get(roomId))
            .filter(id => id !== socket.id)
            .map(id => ({
                socketId: id,
                userId: socketToUserId.get(id)
            }));

        // Send existing users to the new user
        socket.emit('existing-users', roomUsers);

        // Notify other users that a new user joined
        socket.to(roomId).emit('user-joined', {
            socketId: socket.id,
            userId: userId
        });

        console.log(`[${new Date().toISOString()}] Room ${roomId} now has ${rooms.get(roomId).size} users`);
    });

    // Handle WebRTC offer
    socket.on('offer', (data) => {
        console.log(`[${new Date().toISOString()}] Offer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('offer', {
            sdp: data.sdp,
            sender: socket.id,
            senderId: socketToUserId.get(socket.id)
        });
    });

    // Handle WebRTC answer
    socket.on('answer', (data) => {
        console.log(`[${new Date().toISOString()}] Answer from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('answer', {
            sdp: data.sdp,
            sender: socket.id,
            senderId: socketToUserId.get(socket.id)
        });
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
        console.log(`[${new Date().toISOString()}] ICE candidate from ${socket.id} to ${data.target}`);
        io.to(data.target).emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id,
            senderId: socketToUserId.get(socket.id)
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] User disconnected: ${socket.id}`);

        const roomId = socketToRoom.get(socket.id);
        const userId = socketToUserId.get(socket.id);

        if (roomId) {
            // Remove from room
            const roomSet = rooms.get(roomId);
            if (roomSet) {
                roomSet.delete(socket.id);
                if (roomSet.size === 0) {
                    rooms.delete(roomId);
                    console.log(`[${new Date().toISOString()}] Room ${roomId} is now empty and deleted`);
                } else {
                    console.log(`[${new Date().toISOString()}] Room ${roomId} now has ${roomSet.size} users`);
                }
            }

            // Notify other users in the room
            socket.to(roomId).emit('user-disconnected', {
                socketId: socket.id,
                userId: userId
            });
        }

        // Cleanup
        socketToRoom.delete(socket.id);
        socketToUserId.delete(socket.id);
    });

    // Handle manual leave
    socket.on('leave-room', () => {
        const roomId = socketToRoom.get(socket.id);
        const userId = socketToUserId.get(socket.id);

        if (roomId) {
            console.log(`[${new Date().toISOString()}] User ${userId} (${socket.id}) leaving room ${roomId}`);

            socket.leave(roomId);

            const roomSet = rooms.get(roomId);
            if (roomSet) {
                roomSet.delete(socket.id);
                if (roomSet.size === 0) {
                    rooms.delete(roomId);
                }
            }

            socket.to(roomId).emit('user-disconnected', {
                socketId: socket.id,
                userId: userId
            });

            socketToRoom.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all interfaces for Railway

server.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║   Hoogle Meet Signaling Server                     ║
║   Running on port ${PORT}                            ║
║   Health check: https://your-domain.railway.app/health ║
╚════════════════════════════════════════════════════╝
    `);
});
