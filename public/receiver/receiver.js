const HOST = window.location.href.replace(/^http/, "ws");
const webSocket = new WebSocket(HOST);
console.log(HOST);

webSocket.onmessage = (e) => {
  handleSignallingData(JSON.parse(e.data));
};

function handleSignallingData(data) {
  console.log("data offer " + data.offer);
  switch (data.type) {
    case "offer":
      peerConn.setRemoteDescription(data.offer);
      createAndSendAnswer();
      break;
    case "candidate":
      peerConn.addIceCandidate(data.candidate);
  }
}

function createAndSendAnswer() {
  peerConn.createAnswer(
    (answer) => {
      peerConn.setLocalDescription(answer);
      sendData({
        type: "send_answer",
        answer: answer,
      });
    },
    (error) => {
      console.log(error);
    }
  );
}

function sendData(data) {
  data.username = username;
  webSocket.send(JSON.stringify(data));
}

let localStream;
let peerConn;
let username;

function joinCall() {
  username = document.getElementById("username-input").value; //15

  navigator.getUserMedia(
    //set local webcam
    {
      video: {
        frameRate: 24,
        width: {
          max: 300,
        },
        aspectRatio: 1.33333,
      },
      audio: true,
    },
    (stream) => {
      localStream = stream;
      document.getElementById("local-video").srcObject = localStream;

      let config = {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      };

      peerConn = new RTCPeerConnection(config);
      peerConn.addStream(localStream); //send localstream to host

      peerConn.onaddstream = (e) => {
        document.getElementById("remote-video").srcObject = e.stream; //set host video
      };
      peerConn.onicecandidate = (e) => {
        if (e.candidate == null) {
          return;
        }
        sendData({
          type: "send_candidate",
          candidate: e.candidate,
        });
      };

      sendData({
        type: "join_call",
      });
    },
    (error) => {
      console.log(error);
    }
  );
}
let isAudio = true;
function muteAudio() {
  isAudio = !isAudio;
  localStream.getAudioTracks()[0].enabled = isAudio;
}

let isVideo = true;
function muteVideo() {
  isVideo = !isVideo;
  localStream.getVideoTracks()[0].enabled = isVideo;
}
