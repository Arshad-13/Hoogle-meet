'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoGrid } from '@/components/VideoGrid';
import { ControlBar } from '@/components/ControlBar';

export default function Room() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.roomId as string;

    // Parse initial state from URL
    const initialMic = searchParams.get('mic') !== 'false';
    const initialCam = searchParams.get('cam') !== 'false';

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
    } = useWebRTC(socket, roomId, userId, { mic: initialMic, cam: initialCam });

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
        <div className="room-layout">
            {/* Header */}
            <header className="room-header">
                <div className="logo-section">
                    <h2 className="room-title">Hoogle Meet</h2>
                </div>
                <div className="room-code">
                    <span>Room:</span>
                    <code>{roomId}</code>
                </div>
            </header>

            {/* Main Video Area */}
            <main className="video-area">
                <VideoGrid
                    localStream={localStream}
                    peers={peers}
                    currentUserId={userId}
                    isLocalVideoEnabled={isCameraOn}
                    isLocalAudioEnabled={isMicOn}
                />
            </main>

            {/* Footer Controls */}
            <div className="controls-wrapper">
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

            <style jsx>{`
                .room-layout {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-primary);
                    overflow: hidden;
                    position: relative;
                }

                .room-header {
                    width: 100%;
                    height: 48px;
                    flex-shrink: 0;
                    background: rgba(17, 24, 39, 0.98);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px;
                    z-index: 50;
                }

                .video-area {
                    flex: 1;
                    min-height: 0;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }

                .controls-wrapper {
                    width: 100%;
                    height: 64px;
                    flex-shrink: 0;
                    z-index: 50;
                    background: rgba(17, 24, 39, 0.98);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .room-title {
                    font-size: 16px;
                    font-weight: 600;
                    background: var(--accent-gradient);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .room-code {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-secondary);
                    font-size: 12px;
                }

                .room-code code {
                    background: rgba(26, 31, 58, 0.8);
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    color: var(--text-primary);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @media (max-width: 768px) {
                    .room-header {
                        height: 44px;
                        padding: 0 12px;
                    }
                    
                    .controls-wrapper {
                        height: 60px;
                    }
                    
                    .room-title {
                        font-size: 14px;
                    }
                }
            `}</style>
        </div >
    );
}
