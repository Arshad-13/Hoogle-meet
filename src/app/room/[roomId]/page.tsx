'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoGrid } from '@/components/VideoGrid';
import { ControlBar } from '@/components/ControlBar';
import styles from './room.module.css';

export default function Room() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.roomId as string;

    const initialMic = searchParams.get('mic') !== 'false';
    const initialCam = searchParams.get('cam') !== 'false';
    const userName = searchParams.get('name') || 'Guest';

    const [userId] = useState(() => `User-${Math.random().toString(36).substring(2, 8)}`);
    const [isInitialized, setIsInitialized] = useState(false);

    const { socket, isConnected, error } = useSocket(roomId);
    const {
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
    } = useWebRTC(socket, roomId, userId, userName, { mic: initialMic, cam: initialCam });

    // 1. Initialize media stream once on mount/setup
    useEffect(() => {
        const setupMedia = async () => {
            if (!isInitialized) {
                try {
                    await initLocalStream();
                    setIsInitialized(true);
                } catch (error) {
                    console.error('Failed to initialize media:', error);
                }
            }
        };

        setupMedia();
    }, [isInitialized, initLocalStream]);

    // 2. Join/rejoin room whenever socket connects AND media is ready
    useEffect(() => {
        if (isConnected && isInitialized) {
            console.log('🔗 Socket connected and media initialized. Joining room...');
            joinRoom();
        }
    }, [isConnected, isInitialized, joinRoom]);

    const handleToggleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h3>Unable to join meeting</h3>
                    <p>{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.href = '/'}
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Connecting to meeting...</p>
            </div>
        );
    }

    return (
        <div className={styles.roomLayout}>
            {/* Header */}
            <header className={styles.roomHeader}>
                <div className="logo-section">
                    <h2 className={styles.roomTitle}>Hoogle Meet</h2>
                </div>
                <div className={styles.roomCode}>
                    <span>Room:</span>
                    <code>{roomId}</code>
                </div>
            </header>

            <main className={styles.videoArea}>
                <VideoGrid
                    localStream={localStream}
                    peers={peers}
                    currentUserId={userName}
                    isLocalVideoEnabled={isCameraOn}
                    isLocalAudioEnabled={isMicOn}
                />
            </main>

            {/* Footer Controls */}
            <div className={styles.controlsWrapper}>
                <ControlBar
                    isMicOn={isMicOn}
                    isCameraOn={isCameraOn}
                    isScreenSharing={isScreenSharing}
                    onToggleMic={toggleMic}
                    onToggleCamera={toggleCamera}
                    onToggleScreenShare={handleToggleScreenShare}
                    participantCount={peers.size + 1}
                />
            </div>
        </div>
    );
}
