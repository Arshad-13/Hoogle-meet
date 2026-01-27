'use client';

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
}

export const VideoGrid = ({ localStream, peers, currentUserId }: VideoGridProps) => {
    const totalParticipants = peers.size + 1; // +1 for local user

    const getGridClass = () => {
        if (totalParticipants === 1) return 'grid-single';
        if (totalParticipants === 2) return 'grid-two';
        if (totalParticipants <= 4) return 'grid-four';
        if (totalParticipants <= 9) return 'grid-nine';
        return 'grid-many';
    };

    return (
        <div className={`video-grid ${getGridClass()}`}>
            {/* Local video */}
            <VideoTile
                stream={localStream}
                userId={currentUserId}
                isMuted={true}
                isLocal={true}
            />

            {/* Remote videos */}
            {Array.from(peers.entries()).map(([socketId, peer]) => (
                <VideoTile
                    key={socketId}
                    stream={peer.stream}
                    userId={peer.userId}
                    isMuted={false}
                    isLocal={false}
                />
            ))}

            <style jsx>{`
                .video-grid {
                    display: grid;
                    gap: 16px;
                    width: 100%;
                    height: calc(100vh - 80px);
                    padding: 16px;
                    padding-bottom: 96px;
                }

                .grid-single {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr;
                }

                .grid-two {
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: 1fr;
                }

                .grid-four {
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                }

                .grid-nine {
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: repeat(3, 1fr);
                }

                .grid-many {
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    grid-auto-rows: minmax(200px, 1fr);
                }

                @media (max-width: 768px) {
                    .video-grid {
                        padding: 8px;
                        gap: 8px;
                    }

                    .grid-two,
                    .grid-four,
                    .grid-nine {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};
