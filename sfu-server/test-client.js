const io = require('socket.io-client');

const socket = io('http://localhost:4000');

socket.on('connect', () => {
    console.log('Connected to SFU Server:', socket.id);

    // 1. Get Router Capabilities
    socket.emit('getRouterRtpCapabilities', (data) => {
        console.log('Received Router RTP Capabilities:', data ? 'YES' : 'NO');
        if (!data) {
            console.error('Failed to get capabilities');
            process.exit(1);
        }

        // 2. Create Transport
        socket.emit('createWebRtcTransport', { sender: true }, (transportData) => {
             console.log('Created WebRTC Transport:', transportData.id ? 'YES' : 'NO');
             if (transportData.error) {
                 console.error('Error creating transport:', transportData.error);
                 process.exit(1);
             }
             
             console.log('Transport ID:', transportData.id);
             console.log('ICE Parameters:', transportData.iceParameters ? 'YES' : 'NO');
             
             // 3. Connect Transport (Mock)
             // Provide dummy fingerprint to satisfy Mediasoup validation
             socket.emit('connectTransport', { 
                 transportId: transportData.id, 
                 dtlsParameters: { 
                     role: 'client', 
                     fingerprints: [{
                         algorithm: 'sha-256',
                         value: '2D:18:19:D4:56:40:9F:80:CB:E4:9C:F5:2C:22:B5:7D:5B:BF:F6:17:F1:C9:03:68:5A:27:06:55:40:48:40:08'
                     }] 
                 }
             }, () => {
                 console.log('Transport Connected');

                 // 4. Produce
                 // Provide minimal valid RTP parameters for VP8
                 socket.emit('produce', { 
                     transportId: transportData.id, 
                     kind: 'video', 
                     rtpParameters: { 
                         codecs: [{
                             mimeType: 'video/VP8',
                             payloadType: 101,
                             clockRate: 90000,
                             parameters: { 'x-google-start-bitrate': 1000 }
                         }],
                         encodings: [{ ssrc: 11111111 }]
                     }
                 }, (produceData) => {
                     console.log('Produced ID:', produceData.id);
                 });
             });

             // Wait for broadcast event (which should come back to us since we joined the room)
             socket.on('newProducer', (data) => {
                 console.log('Received newProducer event via Redis/Mock:', data);
                 console.log('TEST PASSED (Full Flow)');
                 process.exit(0);
             });
        });
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err.message);
    process.exit(1);
});
