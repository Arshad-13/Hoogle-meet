'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoTileProps {
    stream: MediaStream | null;
    userId: string;
    isMuted?: boolean;
    isLocal?: boolean;
}

export const VideoTile = ({ stream, userId, isMuted = false, isLocal = false }: VideoTileProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);

    // Handle stream attachment
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Listen for track changes (mute/unmute/enabled)
    useEffect(() => {
        if (!stream) {
            setIsVideoEnabled(false);
            setIsAudioEnabled(false);
            return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const updateState = () => {
            setIsVideoEnabled(videoTrack?.enabled ?? false);
            setIsAudioEnabled(audioTrack?.enabled ?? false);
        };

        // Initial state
        updateState();

        // Listeners for remote track mute/unmute events
        // Note: For remote streams, 'mute' means source is unavailable (or network issue)
        // For local streams, we toggle 'enabled'

        const handleTrackChange = () => {
            // Force re-check
            updateState();
        };

        if (videoTrack) {
            videoTrack.addEventListener('mute', handleTrackChange);
            videoTrack.addEventListener('unmute', handleTrackChange);
            videoTrack.addEventListener('ended', handleTrackChange);
        }

        if (audioTrack) {
            audioTrack.addEventListener('mute', handleTrackChange);
            audioTrack.addEventListener('unmute', handleTrackChange);
            audioTrack.addEventListener('ended', handleTrackChange);
        }

        return () => {
            if (videoTrack) {
                videoTrack.removeEventListener('mute', handleTrackChange);
                videoTrack.removeEventListener('unmute', handleTrackChange);
                videoTrack.removeEventListener('ended', handleTrackChange);
            }
            if (audioTrack) {
                audioTrack.removeEventListener('mute', handleTrackChange);
                audioTrack.removeEventListener('unmute', handleTrackChange);
                audioTrack.removeEventListener('ended', handleTrackChange);
            }
        };
    }, [stream]);

    // For local user, we rely on props or direct track checks? 
    // Actually, usually app passes `enabled` prop or we just check the track.
    // Ideally use isVideoEnabled state.

    return (
        <div className="video-tile">
            {isVideoEnabled && stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className={isLocal ? 'video-local' : 'video-remote'}
                />
            ) : (
                <div className="video-placeholder">
                    <div className="avatar">
                        {userId.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            <div className="video-label">
                <span className="user-name">{isLocal ? 'You' : userId}</span>
                {!isAudioEnabled && (
                    <svg className="muted-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                )}
            </div>

            <style jsx>{`
                .video-tile {
                    position: relative;
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    overflow: hidden;
                    width: 100%;
                    height: 100%;
                    /* Use object-fit cover logic via CSS on video */
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                .video-local {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scaleX(-1);
                }

                .video-remote {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .video-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--bg-secondary) 0%, #1a2744 100%);
                }

                .avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--accent-gradient);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    font-weight: 600;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .video-label {
                    position: absolute;
                    bottom: 12px;
                    left: 12px;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(10px);
                    padding: 6px 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }

                .user-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .muted-icon {
                    color: #ef4444;
                }
            `}</style>
        </div>
    );
};
