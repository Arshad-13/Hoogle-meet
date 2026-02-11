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
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    // Initialize local media stream
    const initLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            // Apply initial state
            if (!initialState.mic) {
                stream.getAudioTracks().forEach(track => track.enabled = false);
            }
            if (!initialState.cam) {
                stream.getVideoTracks().forEach(track => track.enabled = false);
            }

            setLocalStream(stream);
            localStreamRef.current = stream;
            console.log('✅ Local stream initialized');

            return stream;
        } catch (error) {
            console.error('❌ Error accessing media devices:', error);
            throw error;
        }
    }, [initialState.mic, initialState.cam]);

    // Create peer connection
    const createPeerConnection = useCallback((targetSocketId: string, targetUserId: string): RTCPeerConnection => {
        console.log(`Creating peer connection for ${targetUserId} (${targetSocketId})`);

        const peerConnection = new RTCPeerConnection(rtcConfiguration);

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket) {
                console.log(`Sending ICE candidate to ${targetSocketId}`);
                socket.emit('ice-candidate', {
                    target: targetSocketId,
                    candidate: event.candidate,
                });
            }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetUserId}: ${peerConnection.connectionState}`);

            if (peerConnection.connectionState === 'failed' ||
                peerConnection.connectionState === 'disconnected') {
                console.log(`Connection lost with ${targetUserId}`);
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

            peersRef.current.get(targetSocketId)!.stream = remoteStream;
        };

        return peerConnection;
    }, [socket]);

    // Create offer to a peer
    const createOffer = useCallback(async (targetSocketId: string, targetUserId: string) => {
        const peerConnection = createPeerConnection(targetSocketId, targetUserId);

        const peer: Peer = {
            connection: peerConnection,
            stream: null,
            userId: targetUserId,
        };

        setPeers(prev => new Map(prev).set(targetSocketId, peer));
        peersRef.current.set(targetSocketId, peer);

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            console.log(`Sending offer to ${targetUserId}`);
            socket?.emit('offer', {
                target: targetSocketId,
                sdp: offer,
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }, [socket, createPeerConnection]);

    // Handle incoming offer
    const handleOffer = useCallback(async (
        senderSocketId: string,
        senderId: string,
        sdp: RTCSessionDescriptionInit
    ) => {
        console.log(`Received offer from ${senderId}`);

        const peerConnection = createPeerConnection(senderSocketId, senderId);

        const peer: Peer = {
            connection: peerConnection,
            stream: null,
            userId: senderId,
        };

        setPeers(prev => new Map(prev).set(senderSocketId, peer));
        peersRef.current.set(senderSocketId, peer);

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            console.log(`Sending answer to ${senderId}`);
            socket?.emit('answer', {
                target: senderSocketId,
                sdp: answer,
            });

            // Process any pending ICE candidates
            const candidates = pendingCandidates.current.get(senderSocketId);
            if (candidates) {
                console.log(`Processing ${candidates.length} pending candidates for ${senderId}`);
                candidates.forEach(candidate => {
                    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(e => console.error('Error adding pending candidate:', e));
                });
                pendingCandidates.current.delete(senderSocketId);
            }
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }, [socket, createPeerConnection]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (
        senderSocketId: string,
        sdp: RTCSessionDescriptionInit
    ) => {
        const peer = peersRef.current.get(senderSocketId);
        if (peer) {
            try {
                await peer.connection.setRemoteDescription(new RTCSessionDescription(sdp));
                console.log(`Answer set for ${peer.userId}`);

                // Process any pending ICE candidates
                const candidates = pendingCandidates.current.get(senderSocketId);
                if (candidates) {
                    console.log(`Processing ${candidates.length} pending candidates for ${peer.userId}`);
                    candidates.forEach(candidate => {
                        peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
                            .catch(e => console.error('Error adding pending candidate:', e));
                    });
                    pendingCandidates.current.delete(senderSocketId);
                }
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        }
    }, []);

    // Handle ICE candidate
    const handleIceCandidate = useCallback(async (
        senderSocketId: string,
        candidate: RTCIceCandidateInit
    ) => {
        const peer = peersRef.current.get(senderSocketId);
        if (peer) {
            if (peer.connection.remoteDescription) {
                try {
                    await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            } else {
                // Queue candidate if remote description is not set yet
                console.log(`Queueing ICE candidate for ${peer.userId}`);
                const current = pendingCandidates.current.get(senderSocketId) || [];
                pendingCandidates.current.set(senderSocketId, [...current, candidate]);
            }
        }
    }, []);

    // Remove peer
    const removePeer = useCallback((socketId: string) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
            peer.connection.close();
            peersRef.current.delete(socketId);
            setPeers(prev => {
                const newPeers = new Map(prev);
                newPeers.delete(socketId);
                return newPeers;
            });
            console.log(`Removed peer ${peer.userId}`);
        }
    }, []);

    // Toggle microphone
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    }, []);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            } as DisplayMediaStreamOptions);

            const screenTrack = screenStream.getVideoTracks()[0];
            screenStreamRef.current = screenStream;

            // Store original video track
            if (localStreamRef.current) {
                originalVideoTrackRef.current = localStreamRef.current.getVideoTracks()[0];
            }

            // Replace video track in all peer connections
            peersRef.current.forEach(peer => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Handle screen share stop
            screenTrack.onended = () => {
                stopScreenShare();
            };

            setIsScreenSharing(true);
            setIsCameraOn(false);
            console.log('✅ Screen sharing started');
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }, []);

    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Restore camera track
        if (originalVideoTrackRef.current) {
            peersRef.current.forEach(peer => {
                const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
                if (sender && originalVideoTrackRef.current) {
                    sender.replaceTrack(originalVideoTrackRef.current);
                }
            });
            originalVideoTrackRef.current.enabled = true;
            setIsCameraOn(true);
        }

        setIsScreenSharing(false);
        console.log('✅ Screen sharing stopped');
    }, []);

    // Join room
    const joinRoom = useCallback(() => {
        if (socket) {
            console.log(`Joining room ${roomId} as ${userId}`);
            socket.emit('join-room', roomId, userId);
        }
    }, [socket, roomId, userId]);

    // Setup socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('existing-users', (users: Array<{ socketId: string; userId: string }>) => {
            console.log(`Existing users in room:`, users);
            users.forEach(user => {
                createOffer(user.socketId, user.userId);
            });
        });

        socket.on('user-joined', (data: { socketId: string; userId: string }) => {
            console.log(`User joined: ${data.userId}`);
            // The new user will send us an offer, so we just wait
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

    // Cleanup peers/socket listeners
    useEffect(() => {
        return () => {
            // Close all peer connections on socket change/unmount
            peersRef.current.forEach(peer => {
                peer.connection.close();
            });
            peersRef.current.clear();
            setPeers(new Map());

            // Leave room
            if (socket) {
                socket.emit('leave-room');
            }
        };
    }, [socket]);

    // Cleanup media tracks ONLY on component unmount
    useEffect(() => {
        return () => {
            console.log('🛑 Cleaning up media tracks');
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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
