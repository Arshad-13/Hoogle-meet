'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');

    const createMeeting = () => {
        const newRoomId = Math.random().toString(36).substring(2, 10);
        router.push(`/lobby/${newRoomId}`);
    };

    const joinMeeting = () => {
        if (roomId.trim()) {
            router.push(`/lobby/${roomId.trim()}`);
        }
    };

    return (
        <div className={styles.homeContainer}>
            <div className={`${styles.content} fade-in`}>
                <div className={styles.hero}>
                    <h1 className={styles.title}>
                        Hoogle <span className={styles.gradientText}>Meet</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Premium video conferencing powered by WebRTC
                    </p>
                </div>

                <div className="actions glass">
                    <button className="btn btn-primary" onClick={createMeeting} style={{ width: '100%' }}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Create New Meeting
                    </button>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <div className={styles.joinSection}>
                        <input
                            type="text"
                            placeholder="Enter meeting code"
                            className={styles.input}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                        />
                        <button
                            className="btn btn-secondary"
                            onClick={joinMeeting}
                            disabled={!roomId.trim()}
                        >
                            Join Meeting
                        </button>
                    </div>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🔒</div>
                        <h3>End-to-End Encrypted</h3>
                        <p>Your calls are secured with SRTP/DTLS</p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>⚡</div>
                        <h3>Low Latency</h3>
                        <p>Direct P2P connection for minimal delay</p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🎯</div>
                        <h3>No Installation</h3>
                        <p>Works directly in your browser</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
