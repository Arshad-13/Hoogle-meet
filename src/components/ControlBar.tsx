'use client';

import { useRouter } from 'next/navigation';
import styles from './ControlBar.module.css';

interface ControlBarProps {
    isMicOn: boolean;
    isCameraOn: boolean;
    isScreenSharing: boolean;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    onToggleScreenShare: () => void;
    participantCount: number;
}

export const ControlBar = ({
    isMicOn,
    isCameraOn,
    isScreenSharing,
    onToggleMic,
    onToggleCamera,
    onToggleScreenShare,
    participantCount,
}: ControlBarProps) => {
    const router = useRouter();

    const handleEndCall = () => {
        if (confirm('Are you sure you want to leave the meeting?')) {
            router.push('/');
        }
    };

    return (
        <div className={styles.controlBar}>
            <div className={styles.controlLeft}>
                <div className={styles.participantCount}>
                    {/* Fixed: fill="currentColor" (no leading space) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    <span>{participantCount}</span>
                </div>
            </div>

            <div className={styles.controlCenter}>
                {/* Microphone */}
                <button
                    className={`${styles.controlBtn} ${!isMicOn ? styles.inactive : ''}`}
                    onClick={onToggleMic}
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

                {/* Camera */}
                <button
                    className={`${styles.controlBtn} ${!isCameraOn ? styles.inactive : ''}`}
                    onClick={onToggleCamera}
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

                {/* Screen Share */}
                <button
                    className={`${styles.controlBtn} ${isScreenSharing ? styles.active : ''}`}
                    onClick={onToggleScreenShare}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                        {isScreenSharing && <circle cx="12" cy="10" r="3" fill="currentColor" />}
                    </svg>
                </button>

                {/* End Call */}
                <button
                    className={`${styles.controlBtn} ${styles.danger}`}
                    onClick={handleEndCall}
                    title="Leave meeting"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3.59 1.322l2.844-1.822 4.041 7.89-2.725 1.76c-.538 1.259 2.159 6.289 3.297 6.372.09-.058 2.671-1.328 2.671-1.328l4.11 7.932s-2.764 1.658-2.793 1.658c-1.813.29-5.211-1.072-7.994-4.308C4.777 16.246 1.45 12.52 1.45 10.707c0-.065.312-9.385.312-9.385z" />
                    </svg>
                </button>
            </div>

            <div className={styles.controlRight}>
                {/* Placeholder for future controls (chat, raise hand, etc.) */}
            </div>
        </div>
    );
};
