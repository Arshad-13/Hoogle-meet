'use client';

import { useMemo } from 'react';
import { VideoTile } from './VideoTile';

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
            className="video-grid"
            style={{
                '--grid-cols': layout.cols,
                '--grid-rows': layout.rows,
            } as React.CSSProperties}
        >
            {/* Local video - Always first or based on sort? usually "You" is first or last. Let's keep it first for stability */}
            <div className="tile-wrapper">
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
                <div key={socketId} className="tile-wrapper">
                    <VideoTile
                        stream={peer.stream}
                        userId={peer.userId}
                        isMuted={false}
                        isLocal={false}
                    />
                </div>
            ))}

            <style jsx>{`
                .video-grid {
                    display: grid;
                    gap: 16px;
                    width: 100%;
                    height: calc(100vh - 80px); /* Minus header */
                    padding: 16px;
                    padding-bottom: 96px; /* Space for control bar */
                    
                    /* Dynamic Grid */
                    grid-template-columns: repeat(var(--grid-cols), 1fr);
                    grid-template-rows: repeat(var(--grid-rows), minmax(0, 1fr));
                    
                    /* Center content */
                    align-content: center;
                    justify-content: center;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .tile-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                @media (max-width: 768px) {
                    .video-grid {
                        gap: 8px;
                        padding: 8px;
                        padding-bottom: 80px;
                        
                        /* Mobile specific layouts */
                        grid-template-columns: ${totalCount <= 2 ? '1fr' : 'repeat(2, 1fr)'};
                        grid-template-rows: repeat(auto-fill, minmax(150px, 1fr));
                        align-content: start;
                        overflow-y: auto;
                    }
                }
            `}</style>
        </div>
    );
};
