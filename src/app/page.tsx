'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
        <div className="home-container">
            <div className="content fade-in">
                <div className="hero">
                    <h1 className="title">
                        Hoogle <span className="gradient-text">Meet</span>
                    </h1>
                    <p className="subtitle">
                        Premium video conferencing powered by WebRTC
                    </p>
                </div>

                <div className="actions glass">
                    <button className="btn btn-primary" onClick={createMeeting}>
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

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <div className="join-section">
                        <input
                            type="text"
                            placeholder="Enter meeting code"
                            className="input"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && joinMeeting()}
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

                <div className="features">
                    <div className="feature">
                        <div className="feature-icon">🔒</div>
                        <h3>End-to-End Encrypted</h3>
                        <p>Your calls are secured with SRTP/DTLS</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">⚡</div>
                        <h3>Low Latency</h3>
                        <p>Direct P2P connection for minimal delay</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">🎯</div>
                        <h3>No Installation</h3>
                        <p>Works directly in your browser</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .home-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: radial-gradient(
            ellipse at top,
            rgba(59, 130, 246, 0.1) 0%,
            transparent 50%
          );
        }

        .content {
          max-width: 600px;
          width: 100%;
        }

        .hero {
          text-align: center;
          margin-bottom: 48px;
        }

        .title {
          font-size: 72px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff 0%, #a1a8c3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gradient-text {
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .actions {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .divider {
          position: relative;
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: var(--border-color);
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .join-section {
          display: flex;
          gap: 12px;
        }

        .input {
          flex: 1;
          padding: 12px 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .input::placeholder {
          color: var(--text-secondary);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 24px;
          margin-top: 64px;
        }

        .feature {
          text-align: center;
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .feature h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .feature p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:disabled:hover {
          transform: none;
        }
      `}</style>
        </div>
    );
}
