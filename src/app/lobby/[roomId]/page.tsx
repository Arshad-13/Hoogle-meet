'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import styles from './lobby.module.css';

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
    const streamRef = useRef<MediaStream | null>(null);

    // Attach stream to video element when loading finishes
    useEffect(() => {
        if (!isLoading && videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [isLoading, localStream]);

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
                streamRef.current = stream;
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
            if (streamRef.current) {
                console.log('🛑 Cleaning up lobby media tracks');
                streamRef.current.getTracks().forEach(track => track.stop());
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

    const joinMeeting = (forceMuteAll = false) => {
        router.push(`/room/${roomId}?mic=${forceMuteAll ? 'false' : String(isMicOn)}&cam=${forceMuteAll ? 'false' : String(isCameraOn)}`);
    };

    return (
        <div className={styles.lobbyContainer}>
            <div className={`${styles.lobbyContent} fade-in`}>
                <h1 className={styles.lobbyTitle}>Ready to join?</h1>
                <p className={styles.lobbySubtitle}>Room: {roomId}</p>

                <div className={styles.videoPreviewContainer}>
                    {isLoading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Accessing camera and microphone...</p>
                        </div>
                    ) : permissionError ? (
                        <div className={styles.errorState}>
                            <div className={styles.errorIcon}>⚠️</div>
                            <p>{permissionError}</p>
                            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => window.location.reload()}
                                >
                                    Try Again
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => joinMeeting(true)}
                                >
                                    Join without Media
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={styles.videoPreview}
                            />
                            {!isCameraOn && (
                                <div className={styles.videoOffOverlay}>
                                    <div className={styles.videoOffIcon}>📷</div>
                                    <p>Camera is off</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!permissionError && !isLoading && (
                    <>
                        <div className={styles.lobbyControls}>
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

                        <button className={`btn btn-primary ${styles.joinBtn}`} onClick={() => joinMeeting(false)}>
                            Join Meeting
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
