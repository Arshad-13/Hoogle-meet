'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { rtcConfiguration } from '@/config/iceServers';

interface Peer {
    connection: RTCPeerConnection;
    stream: MediaStream | null;
    userId: string;
}

export const useWebRTC = (
    socket: Socket | null,
    roomId: string,
    userId: string,
    initialState: { mic: boolean; cam: boolean } = { mic: true, cam: true }
) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
    const [isMicOn, setIsMicOn] = useState(initialState.mic);
    const [isCameraOn, setIsCameraOn] = useState(initialState.cam);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const peersRef = useRef<Map<string, Peer>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    // Queue candidates arriving before a peer's remote description is set
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    // Strict Mode guard — prevent double-initialization in React dev mode
    const streamInitialized = useRef(false);
    // Keep a ref to socket so cleanup effects can access the latest value
    const socketRef = useRef<Socket | null>(null);

    // Keep socketRef in sync with the prop
    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    // ─── Initialize local media stream ────────────────────────────────────
    const initLocalStream = useCallback(async () => {
        // Guard against React Strict Mode double-invocation
        if (streamInitialized.current) {
            console.log('⚠️ Stream already initialized, skipping duplicate call');
            return localStreamRef.current!;
        }
        streamInitialized.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // Apply initial mic/cam state from lobby settings
            if (!initialState.mic) {
                stream.getAudioTracks().forEach(track => (track.enabled = false));
            }
            if (!initialState.cam) {
                stream.getVideoTracks().forEach(track => (track.enabled = false));
            }

            setLocalStream(stream);
            localStreamRef.current = stream;
            console.log('✅ Local stream initialized');
            return stream;
        } catch (error) {
            // Reset guard so the user can retry
            streamInitialized.current = false;
            console.error('❌ Error accessing media devices:', error);
            throw error;
        }
    }, [initialState.mic, initialState.cam]);

    // ─── Create peer connection ────────────────────────────────────────────
    const createPeerConnection = useCallback((targetSocketId: string, targetUserId: string): RTCPeerConnection => {
        console.log(`Creating peer connection for ${targetUserId} (${targetSocketId})`);
        const peerConnection = new RTCPeerConnection(rtcConfiguration);

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current!);
            });
        }

        // Send ICE candidates through the signaling server
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    target: targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        // Log & handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`Connection state with ${targetUserId}: ${state}`);

            if (state === 'failed') {
                console.warn(`❌ P2P connection failed with ${targetUserId} — attempting ICE restart`);
                peerConnection.restartIce();
            }
        };

        // Handle incoming remote tracks
        peerConnection.ontrack = (event) => {
            console.log(`Received remote track from ${targetUserId}`);
            const [remoteStream] = event.streams;

            setPeers(prev => {
                const newPeers = new Map(prev);
                const peer = newPeers.get(targetSocketId);
                if (peer) {
                    peer.stream = remoteStream;
                }
                return newPeers;
            });

            const peerObj = peersRef.current.get(targetSocketId);
            if (peerObj) {
                peerObj.stream = remoteStream;
            }
        };

        return peerConnection;
    }, []);

    // ─── Create offer to a peer ───────────────────────────────────────────
    const createOffer = useCallback(async (targetSocketId: string, targetUserId: string) => {
        const peerConnection = createPeerConnection(targetSocketId, targetUserId);
        const peer: Peer = { connection: peerConnection, stream: null, userId: targetUserId };

        setPeers(prev => new Map(prev).set(targetSocketId, peer));
        peersRef.current.set(targetSocketId, peer);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socketRef.current?.emit('offer', { target: targetSocketId, sdp: offer });
            console.log(`Sent offer to ${targetUserId}`);
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }, [createPeerConnection]);

    // ─── Handle incoming offer ────────────────────────────────────────────
    const handleOffer = useCallback(async (
        senderSocketId: string,
        senderId: string,
        sdp: RTCSessionDescriptionInit
    ) => {
        console.log(`Received offer from ${senderId}`);
        const peerConnection = createPeerConnection(senderSocketId, senderId);
        const peer: Peer = { connection: peerConnection, stream: null, userId: senderId };

        setPeers(prev => new Map(prev).set(senderSocketId, peer));
        peersRef.current.set(senderSocketId, peer);

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socketRef.current?.emit('answer', { target: senderSocketId, sdp: answer });
            console.log(`Sent answer to ${senderId}`);

            // Flush any queued ICE candidates
            const queued = pendingCandidates.current.get(senderSocketId);
            if (queued?.length) {
                console.log(`Processing ${queued.length} pending ICE candidates for ${senderId}`);
                for (const c of queued) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(e =>
                        console.error('Error adding pending candidate:', e)
                    );
                }
                pendingCandidates.current.delete(senderSocketId);
            }
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }, [createPeerConnection]);

    // ─── Handle incoming answer ───────────────────────────────────────────
    const handleAnswer = useCallback(async (
        senderSocketId: string,
        sdp: RTCSessionDescriptionInit
    ) => {
        const peer = peersRef.current.get(senderSocketId);
        if (!peer) return;

        try {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log(`Answer set for ${peer.userId}`);

            // Flush queued candidates
            const queued = pendingCandidates.current.get(senderSocketId);
            if (queued?.length) {
                console.log(`Processing ${queued.length} pending ICE candidates for ${peer.userId}`);
                for (const c of queued) {
                    await peer.connection.addIceCandidate(new RTCIceCandidate(c)).catch(e =>
                        console.error('Error adding pending candidate:', e)
                    );
                }
                pendingCandidates.current.delete(senderSocketId);
            }
        } catch (error) {
            console.error('Error setting remote description:', error);
        }
    }, []);

    // ─── Handle incoming ICE candidate ────────────────────────────────────
    const handleIceCandidate = useCallback(async (
        senderSocketId: string,
        candidate: RTCIceCandidateInit
    ) => {
        const peer = peersRef.current.get(senderSocketId);

        if (peer && peer.connection.remoteDescription) {
            // Remote description is ready — add immediately
            try {
                await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        } else {
            // Queue for later — handles BOTH "peer exists but no remoteDesc yet"
            // AND "peer doesn't exist yet" race conditions
            console.log(`Queueing ICE candidate for ${senderSocketId}`);
            const current = pendingCandidates.current.get(senderSocketId) ?? [];
            pendingCandidates.current.set(senderSocketId, [...current, candidate]);
        }
    }, []);

    // ─── Remove peer ──────────────────────────────────────────────────────
    const removePeer = useCallback((socketId: string) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
            peer.connection.close();
            peersRef.current.delete(socketId);
            pendingCandidates.current.delete(socketId);
            setPeers(prev => {
                const next = new Map(prev);
                next.delete(socketId);
                return next;
            });
            console.log(`Removed peer ${peer.userId}`);
        }
    }, []);

    // ─── Toggle microphone ────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    }, []);

    // ─── Toggle camera ────────────────────────────────────────────────────
    const toggleCamera = useCallback(() => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    }, []);

    // ─── Start screen sharing ─────────────────────────────────────────────
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            } as DisplayMediaStreamOptions);

            const screenTrack = screenStream.getVideoTracks()[0];
            screenStreamRef.current = screenStream;

            // Save original camera track for restoration
            originalVideoTrackRef.current = localStreamRef.current?.getVideoTracks()[0] ?? null;

            // Replace camera track with screen track in all peer connections
            peersRef.current.forEach(peer => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });

            // Update local stream so VideoTile shows screen share preview
            if (localStreamRef.current) {
                const oldTrack = localStreamRef.current.getVideoTracks()[0];
                if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
                localStreamRef.current.addTrack(screenTrack);
                // Trigger React state update for local preview
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            }

            // Auto-stop when the user clicks browser "Stop sharing"
            screenTrack.onended = () => stopScreenShare();

            setIsScreenSharing(true);
            setIsCameraOn(false);
            console.log('✅ Screen sharing started');
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }, []);

    // ─── Stop screen sharing ──────────────────────────────────────────────
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        const originalTrack = originalVideoTrackRef.current;
        if (originalTrack && localStreamRef.current) {
            // Remove screen track, re-add camera track
            localStreamRef.current.getVideoTracks().forEach(t => localStreamRef.current!.removeTrack(t));
            localStreamRef.current.addTrack(originalTrack);
            originalTrack.enabled = true;

            // Replace track in all peer connections
            peersRef.current.forEach(peer => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(originalTrack);
            });

            // Trigger React state update for local preview
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            originalVideoTrackRef.current = null;
        }

        setIsScreenSharing(false);
        setIsCameraOn(true);
        console.log('✅ Screen sharing stopped');
    }, []);

    // ─── Join room ────────────────────────────────────────────────────────
    const joinRoom = useCallback(() => {
        if (socketRef.current) {
            console.log(`Joining room ${roomId} as ${userId}`);
            socketRef.current.emit('join-room', roomId, userId);
        }
    }, [roomId, userId]);

    // ─── Socket event listeners ───────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        socket.on('existing-users', (users: Array<{ socketId: string; userId: string }>) => {
            console.log(`Existing users in room:`, users);
            // We are the newcomer — create an offer to each already-present user
            users.forEach(user => createOffer(user.socketId, user.userId));
        });

        socket.on('user-joined', (data: { socketId: string; userId: string }) => {
            console.log(`User joined: ${data.userId} — waiting for their offer`);
            // The new user will send us an offer; nothing to do here except log
        });

        socket.on('offer', (data: { sender: string; senderId: string; sdp: RTCSessionDescriptionInit }) => {
            handleOffer(data.sender, data.senderId, data.sdp);
        });

        socket.on('answer', (data: { sender: string; sdp: RTCSessionDescriptionInit }) => {
            handleAnswer(data.sender, data.sdp);
        });

        socket.on('ice-candidate', (data: { sender: string; candidate: RTCIceCandidateInit }) => {
            handleIceCandidate(data.sender, data.candidate);
        });

        socket.on('user-disconnected', (data: { socketId: string; userId: string }) => {
            console.log(`User disconnected: ${data.userId}`);
            removePeer(data.socketId);
        });

        return () => {
            socket.off('existing-users');
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('user-disconnected');
        };
    }, [socket, createOffer, handleOffer, handleAnswer, handleIceCandidate, removePeer]);

    // ─── Cleanup on unmount ONLY (dep array = []) ────────────────────────
    useEffect(() => {
        return () => {
            console.log('🛑 Unmounting useWebRTC — closing all peer connections');
            peersRef.current.forEach(peer => peer.connection.close());
            peersRef.current.clear();
            pendingCandidates.current.clear();
            setPeers(new Map());

            // Leave room via signaling server
            socketRef.current?.emit('leave-room');

            // Stop all media tracks
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            streamInitialized.current = false;
        };
    }, []); // Empty deps — runs only on unmount

    return {
        localStream,
        peers,
        isMicOn,
        isCameraOn,
        isScreenSharing,
        initLocalStream,
        joinRoom,
        toggleMic,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
    };
};
