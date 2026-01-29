'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoTileProps {
    stream: MediaStream | null;
    userId: string;
    isMuted?: boolean;
    isLocal?: boolean;
    isForceVideoEnabled?: boolean; // Prop to force video state (useful for local user)
    isForceAudioEnabled?: boolean; // Prop to force audio state (useful for local user)
}

export const VideoTile = ({
    stream,
    userId,
    isMuted = false,
    isLocal = false,
    isForceVideoEnabled,
    isForceAudioEnabled
}: VideoTileProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [isAudioActive, setIsAudioActive] = useState(true);

    // Handle stream attachment
    useEffect(() => {
        if (videoRef.current && stream && isVideoActive) {
            videoRef.current.srcObject = stream;
        } else if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream, isVideoActive]);

    // Handle track state changes (for local override)
    useEffect(() => {
        if (isForceVideoEnabled !== undefined) {
            setIsVideoActive(isForceVideoEnabled);
        }
        if (isForceAudioEnabled !== undefined) {
            setIsAudioActive(isForceAudioEnabled);
        }
    }, [isForceVideoEnabled, isForceAudioEnabled]);

    // Listen for stream track changes (remote peers)
    useEffect(() => {
        if (!stream) {
            if (isForceVideoEnabled === undefined) setIsVideoActive(false);
            if (isForceAudioEnabled === undefined) setIsAudioActive(false);
            return;
        }

        const checkTracks = () => {
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            if (isForceVideoEnabled === undefined) {
                setIsVideoActive(videoTrack?.enabled ?? false);
            }
            if (isForceAudioEnabled === undefined) {
                setIsAudioActive(audioTrack?.enabled ?? false);
            }

            return { videoTrack, audioTrack };
        };

        // ... (rest of the effect logic)

        const { videoTrack: initialVideo, audioTrack: initialAudio } = checkTracks();

        const handleTrackChange = () => {
            checkTracks();
        };

        // Listen to stream events (tracks added/removed)
        stream.addEventListener('addtrack', handleTrackChange);
        stream.addEventListener('removetrack', handleTrackChange);

        // Listen to track events (mute/unmute/ended)
        const attachTrackListeners = (track: MediaStreamTrack | undefined) => {
            if (!track) return;
            track.addEventListener('mute', handleTrackChange);
            track.addEventListener('unmute', handleTrackChange);
            track.addEventListener('ended', handleTrackChange);
        };

        const detachTrackListeners = (track: MediaStreamTrack | undefined) => {
            if (!track) return;
            track.removeEventListener('mute', handleTrackChange);
            track.removeEventListener('unmute', handleTrackChange);
            track.removeEventListener('ended', handleTrackChange);
        };

        attachTrackListeners(initialVideo);
        attachTrackListeners(initialAudio);

        return () => {
            stream.removeEventListener('addtrack', handleTrackChange);
            stream.removeEventListener('removetrack', handleTrackChange);
            detachTrackListeners(initialVideo);
            detachTrackListeners(initialAudio);
        };
    }, [stream, isForceVideoEnabled, isForceAudioEnabled]);

    return (
        <div className="video-tile">
            {/* Always render video to keep audio playing */}
            {stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className={`video-element ${isVideoActive ? 'visible' : 'hidden'} ${isLocal ? 'local' : 'remote'}`}
                />
            )}

            {/* Show placeholder if video is not active */}
            {(!isVideoActive || !stream) && (
                <div className="video-placeholder">
                    <div className="avatar">
                        {userId.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            <div className="video-label">
                <span className="user-name">{isLocal ? 'You' : userId}</span>
                {!isAudioActive && (
                    <svg className="muted-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                )}
            </div>

            <style jsx>{`
                .video-tile {
                    position: relative;
                    background: #1a1a1a;
                    border-radius: 12px;
                    overflow: hidden;
                    width: 100%;
                    height: 100%;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .video-element {
                    width: 100%;
                    height: 100%;
                    object-fit: contain; /* Ensure no cropping */
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .video-element.local {
                    transform: scaleX(-1);
                }

                .video-element.hidden {
                    opacity: 0; /* Hide visually but keep processing audio */
                    z-index: 0;
                }

                /* Ensure placeholder sits on top when video is hidden */
                .video-placeholder {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10;
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
                    background: rgba(0, 0, 0, 0.7);
                    padding: 6px 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    z-index: 20; /* Keep label above everything */
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
