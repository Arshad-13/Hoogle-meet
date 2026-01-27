'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function Lobby() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });

                setLocalStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                setIsLoading(false);
            } catch (error: any) {
                console.error('Error accessing media devices:', error);
                setPermissionError(
                    error.name === 'NotAllowedError'
                        ? 'Camera and microphone access denied. Please grant permissions.'
                        : 'Unable to access camera or microphone. Please check your device.'
                );
                setIsLoading(false);
            }
        };

        initMedia();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    };

    const joinMeeting = () => {
        if (localStream) {
            router.push(`/room/${roomId}`);
        }
    };

    return (
        <div className="lobby-container">
            <div className="lobby-content fade-in">
                <h1 className="lobby-title">Ready to join?</h1>
                <p className="lobby-subtitle">Room: {roomId}</p>

                <div className="video-preview-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Accessing camera and microphone...</p>
                        </div>
                    ) : permissionError ? (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <p>{permissionError}</p>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="video-preview"
                            />
                            {!isCameraOn && (
                                <div className="video-off-overlay">
                                    <div className="video-off-icon">📷</div>
                                    <p>Camera is off</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!permissionError && !isLoading && (
                    <>
                        <div className="lobby-controls">
                            <button
                                className={`control-btn ${isMicOn ? 'active' : ''}`}
                                onClick={toggleMic}
                                title={isMicOn ? 'Mute' : 'Unmute'}
                            >
                                {isMicOn ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                )}
                            </button>

                            <button
                                className={`control-btn ${isCameraOn ? 'active' : ''}`}
                                onClick={toggleCamera}
                                title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                            >
                                {isCameraOn ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 7l-7 5 7 5V7z" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                        <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <button className="btn btn-primary join-btn" onClick={joinMeeting}>
                            Join Meeting
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                .lobby-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .lobby-content {
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                }

                .lobby-title {
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #fff 0%, #a1a8c3 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .lobby-subtitle {
                    font-size: 18px;
                    color: var(--text-secondary);
                    margin-bottom: 32px;
                    font-family: 'Courier New', monospace;
                }

                .video-preview-container {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16 / 9;
                    background: var(--bg-secondary);
                    border-radius: 16px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                }

                .video-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scaleX(-1);
                }

                .video-off-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--bg-secondary);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }

                .video-off-icon {
                    font-size: 64px;
                    opacity: 0.5;
                }

                .loading-state, .error-state {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    color: var(--text-secondary);
                }

                .spinner {
                    width: 48px;
                    height: 48px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--accent-blue);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-icon {
                    font-size: 64px;
                }

                .lobby-controls {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .join-btn {
                    width: 100%;
                    padding: 16px;
                    font-size: 18px;
                }
            `}</style>
        </div>
    );
}
