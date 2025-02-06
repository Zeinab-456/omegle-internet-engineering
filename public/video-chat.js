const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const peerConnection = new RTCPeerConnection();
let partnerId = null;

peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

navigator.mediaDevices.getUserMedia({ video: chatType === "video", audio: true }).then((stream) => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
});

socket.on("partner_found", async ({ partnerId: id }) => {
    partnerId = id;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("webrtc_offer", { offer, partnerId });
});

socket.on("webrtc_offer", async ({ offer, partnerId: id }) => {
    partnerId = id;
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("webrtc_answer", { answer, partnerId });
});

socket.on("webrtc_answer", ({ answer }) => {
    peerConnection.setRemoteDescription(answer);
});

socket.on("webrtc_ice_candidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit("webrtc_ice_candidate", { candidate: event.candidate, partnerId });
    }
};



