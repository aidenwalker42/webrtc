const HOST = window.location.href.replace(/^http/, "ws");
const webSocket = new WebSocket(HOST);
console.log(HOST);
let localStream;
let peerConn;
webSocket.onmessage = (e) => {
  handleSignallingData(JSON.parse(e.data)); //7 get the data (conn and username) from the server and pass. goes to the handler but doesnt pass the switch case yet
};

function handleSignallingData(data) {
  console.log("HANDLE " + data.type);
  console.log("answer " + data.answer);
  console.log("wubdiw " + window.location.href);
  switch (data.type) {
    case "answer":
      peerConn.setRemoteDescription(data.answer);
      break;
    case "candidate":
      peerConn.addIceCandidate(data.candidate);
      break;
  }
}

let username;
function sendUsername() {
  username = document.getElementById("username-input").value; //1 get username value
  sendData({
    type: "store_user", //2 pass this
  });
  if (username) {
    document.querySelector("p").innerHTML = "Room name set, click start call";
  }
}

function sendData(data) {
  data.username = username; //2.1 add username to data (why this way?)
  webSocket.send(JSON.stringify(data)); //3 send data to webSocket "message"
}

function startCall() {
  //8
  navigator.getUserMedia(
    //8 start webcam
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
      //8.1 something with setting the stream to local-video html
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

      //8.2 still in the callback when init the webcam
      peerConn = new RTCPeerConnection(config); //9 start magic RTC Connection with stun servers
      peerConn.addStream(localStream); //add the local-video's stream to RTC Connection
      //maybe the event doesnt go through until the remote user has loaded??
      peerConn.onaddstream = (e) => {
        //10 when user joins room and addStreams
        console.log(
          "onaddstream stream: " + e.stream + " localStream: " + localStream
        );
        document.getElementById("remote-video").srcObject = e.stream; //10.1 set the remote webcam stream
      };
      createAndSendOffer(); //11
      peerConn.onicecandidate = (e) => {
        //13
        console.log(e);
        if (e.candidate == null) {
          return; //if no candidate stop
        }
        sendData({
          //13 send candidate to server
          type: "store_candidate",
          candidate: e.candidate,
        });
      };
    },
    (error) => {
      console.log(error);
    }
  );
}

function createAndSendOffer() {
  console.log("CASO START");
  peerConn.createOffer(
    //11 initiates the creation of an SDP offer for the purpose of starting a new WebRTC connection to a remote peer
    //The SDP offer includes information about any candidates already gathered by the ICE agent, for the purpose of
    //being sent over the signaling channel to a POTENTIAL peer to request a connection
    (offer) => {
      console.log("CASO");
      sendData({
        //11.1 send store_offer to server
        type: "store_offer",
        offer: offer, //unique offer code
      });

      peerConn.setLocalDescription(offer);
      console.log("SLD"); //sends offer with candidates to onicecandidate function
      //should transmit the candidate to the remote peer over the signaling channel so the remote peer can add it
      //to its set of remote candidates.
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
