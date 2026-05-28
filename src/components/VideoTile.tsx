'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './VideoTile.module.css';

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

    // Handle stream attachment — always attach stream so audio keeps playing
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream ?? null;
        }
    }, [stream]);

    // Handle forced track state override (for local user driven by control bar)
    useEffect(() => {
        if (isForceVideoEnabled !== undefined) {
            setIsVideoActive(isForceVideoEnabled);
        }
    }, [isForceVideoEnabled]);

    useEffect(() => {
        if (isForceAudioEnabled !== undefined) {
            setIsAudioActive(isForceAudioEnabled);
        }
    }, [isForceAudioEnabled]);

    // Listen for track state changes on remote streams
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

        const { videoTrack: initialVideo, audioTrack: initialAudio } = checkTracks();

        const handleTrackChange = () => checkTracks();

        stream.addEventListener('addtrack', handleTrackChange);
        stream.addEventListener('removetrack', handleTrackChange);

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
        <div className={styles.videoTile}>
            {/* Always render video element so audio keeps playing for remote peers */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted}
                className={[
                    styles.videoElement,
                    isVideoActive && stream ? styles.visible : styles.hidden,
                    isLocal ? styles.local : '',
                ].join(' ')}
            />

            {/* Show avatar placeholder if video is off or stream not ready */}
            {(!isVideoActive || !stream) && (
                <div className={styles.videoPlaceholder}>
                    <div className={styles.avatar}>
                        {userId.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}

            <div className={styles.videoLabel}>
                <span className={styles.userName}>{isLocal ? 'You' : userId}</span>
                {!isAudioActive && (
                    <svg className={styles.mutedIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                )}
            </div>
        </div>
    );
};
