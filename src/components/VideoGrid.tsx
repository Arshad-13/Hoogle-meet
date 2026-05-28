'use client';

import { useMemo } from 'react';
import { VideoTile } from './VideoTile';
import styles from './VideoGrid.module.css';

interface Peer {
    connection: RTCPeerConnection;
    stream: MediaStream | null;
    userId: string;
}

interface VideoGridProps {
    localStream: MediaStream | null;
    peers: Map<string, Peer>;
    currentUserId: string;
    isLocalVideoEnabled?: boolean;
    isLocalAudioEnabled?: boolean;
}

export const VideoGrid = ({ localStream, peers, currentUserId, isLocalVideoEnabled, isLocalAudioEnabled }: VideoGridProps) => {
    // Convert peers map to array and SORT it to ensure stability (prevent jumping)
    const sortedPeers = useMemo(() => {
        return Array.from(peers.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [peers]);

    const totalCount = sortedPeers.length + 1; // Peers + You

    // Calculate optimal grid layout
    const layout = useMemo(() => {
        if (totalCount === 1) return { cols: 1, rows: 1 };
        if (totalCount === 2) return { cols: 2, rows: 1 };
        if (totalCount <= 4) return { cols: 2, rows: 2 };
        if (totalCount <= 6) return { cols: 3, rows: 2 };
        if (totalCount <= 9) return { cols: 3, rows: 3 };
        if (totalCount <= 12) return { cols: 4, rows: 3 };
        return { cols: 4, rows: 4 }; // Max for now
    }, [totalCount]);

    return (
        <div
            id="video-grid-container"
            className={styles.videoGrid}
            style={{
                '--grid-cols': layout.cols,
                '--grid-rows': layout.rows,
                '--mobile-cols': totalCount <= 2 ? 1 : 2,
            } as React.CSSProperties}
        >
            {/* Local video - Always first or based on sort? usually "You" is first or last. Let's keep it first for stability */}
            <div className={styles.tileWrapper}>
                <VideoTile
                    stream={localStream}
                    userId={currentUserId}
                    isMuted={true} // Local user always muted locally to prevent echo
                    isLocal={true}
                    isForceVideoEnabled={isLocalVideoEnabled}
                    isForceAudioEnabled={isLocalAudioEnabled}
                />
            </div>

            {/* Remote videos */}
            {sortedPeers.map(([socketId, peer]) => (
                <div key={socketId} className={styles.tileWrapper}>
                    <VideoTile
                        stream={peer.stream}
                        userId={peer.userId}
                        isMuted={false}
                        isLocal={false}
                    />
                </div>
            ))}
        </div>
    );
};
