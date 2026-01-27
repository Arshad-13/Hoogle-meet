'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoGrid } from '@/components/VideoGrid';
import { ControlBar } from '@/components/ControlBar';

export default function Room() {
    const params = useParams();
    const roomId = params.roomId as string;
    const [userId] = useState(() => `User-${Math.random().toString(36).substring(2, 8)}`);
    const [isInitialized, setIsInitialized] = useState(false);

    const { socket, isConnected } = useSocket(roomId);
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
    } = useWebRTC(socket, roomId, userId);

    // Initialize media and join room
    useEffect(() => {
        const setup = async () => {
            if (isConnected && !isInitialized) {
                try {
                    await initLocalStream();
                    joinRoom();
                    setIsInitialized(true);
                } catch (error) {
                    console.error('Failed to initialize:', error);
                }
            }
        };

        setup();
    }, [isConnected, isInitialized, initLocalStream, joinRoom]);

    const handleToggleScreenShare = () => {
        if (isScreenSharing) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    if (!isConnected) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Connecting to meeting...</p>

                <style jsx>{`
                    .loading-container {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 24px;
                        color: var(--text-secondary);
                    }

                    .spinner {
                        width: 64px;
                        height: 64px;
                        border: 4px solid var(--border-color);
                        border-top-color: var(--accent-blue);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="room-container">
            <div className="room-header">
                <h2 className="room-title">Hoogle Meet</h2>
                <div className="room-code">
                    <span>Room:</span>
                    <code>{roomId}</code>
                </div>
            </div>

            <VideoGrid
                localStream={localStream}
                peers={peers}
                currentUserId={userId}
            />

            <ControlBar
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                isScreenSharing={isScreenSharing}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={handleToggleScreenShare}
                participantCount={peers.size + 1}
            />

            <style jsx>{`
                .room-container {
                    height: 100vh;
                    background: var(--bg-primary);
                }

                .room-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: var(--bg-glass);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    z-index: 90;
                }

                .room-title {
                    font-size: 20px;
                    font-weight: 600;
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .room-code {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                .room-code code {
                    background: var(--bg-secondary);
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }

                @media (max-width: 768px) {
                    .room-header {
                        flex-direction: column;
                        height: auto;
                        padding: 12px;
                        gap: 8px;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
}
