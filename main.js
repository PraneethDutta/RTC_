 let divSelectRoom = document.getElementById('selectRoom');
let divConsultingRoom = document.getElementById('consultingRoom');
const buttonGoRoom = document.getElementById('goRoom');
const inputRoomNumber = document.getElementById('roomNumber');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const iceServers = {
  'iceServer': [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' }
  ]
};

const streamConstraints = {
  audio: true,
  video: true
}

const socket = io();
let name=prompt("enter your name :")
socket.on('sending_socket_id',function(data){
  document.getElementById("h1").innerHTML="your name and socket id:"+name+"<br>"+(data.description)+"<br>";
})
setTimeout(function(){
  socket.emit('sending_name_to_server',{description:name});
},1)
socket.on('new_client_name',function(data){
  document.getElementById('connected_people').innerHTML+='<br><h5><i>'+(data.description)+"</i>joined<h5/> !";
})
function send_click(){
  var tosend=name+":"+document.getElementById("send").value;
  socket.emit('sending_message',{description:tosend});
  document.getElementById('message_container').innerHTML+='<center><br><h3>'+"YOU :"+document.getElementById("send").value+"</h3><br></center>";
  document.getElementById("send").value="";

}
socket.on('broadcasting_sent_message',function(data){
  document.getElementById('message_container').innerHTML+='<center><br><h4>'+(data.description)+"</h4><br></center>";
})

buttonGoRoom.onclick = async function() {
  if (!inputRoomNumber.value) {
    alert('please enter room name');
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit('create or join', roomNumber);
    divSelectRoom.style = 'display: none !important';

  }
}

socket.on('created', async function (room) {
  localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
  localVideo.srcObject = localStream;
  isCaller = true;
});

socket.on('joined', async function (room) {
  localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
  localVideo.srcObject = localStream;
  socket.emit('ready', roomNumber);
});

socket.on('ready', async function (room) {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    const sdp = await rtcPeerConnection.createOffer();
    rtcPeerConnection.setLocalDescription(sdp);
    socket.emit('offer', {
      type: 'offer',
      sdp: sdp,
      room: roomNumber,
    });
  }
});


socket.on('offer', async function (event) {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    const sdp = await rtcPeerConnection.createAnswer();
    rtcPeerConnection.setLocalDescription(sdp);
    socket.emit('answer', {
      type: 'answer',
      sdp: sdp,
      room: roomNumber,
    });
  }
});

socket.on('candidate',  function (event) {
  console.log('received candidate event', event)
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.lable,
    candidate: event.candidate.candidate,
    sdpMid: event.id,
  });

  rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('answer', async function (event) {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];

}

function onicecandidate(event) {
  if(event.candidate) {
    console.log(`sending ice candidate`, event.candidate);
    const outgoing = {
      type: 'candidate',
      lable: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate,
      room: roomNumber
    }
    console.log(outgoing)
    socket.emit('candidate', outgoing);
  }
}
