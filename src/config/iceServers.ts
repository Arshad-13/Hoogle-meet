export const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Metered.ca Open Relay Project TURN/STUN Servers (Free 20GB/month bandwidth for NAT traversal)
    { urls: 'stun:openrelay.metered.ca:80' },
    {
        urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turns:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

export const rtcConfiguration: RTCConfiguration = {
    iceServers,
    iceCandidatePoolSize: 10,
};
