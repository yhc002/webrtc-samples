/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';
let stream;

const videoblock = document.querySelector('#videoblock');
const dimensions = document.querySelector('#dimensions');

const vgaButton = document.querySelector('#vga');
const qvgaButton = document.querySelector('#qvga');
const hdButton = document.querySelector('#hd');
const fullHdButton = document.querySelector('#full-hd');
const cinemaFourKButton = document.querySelector('#cinemaFourK');
const televisionFourKButton = document.querySelector('#televisionFourK');
const eightKButton = document.querySelector('#eightK');

const widthInput = document.querySelector('div#width input');
const widthOutput = document.querySelector('div#width span');
const aspectLock = document.querySelector('#aspectlock');
const sizeLock = document.querySelector('#sizelock');

let currentWidth = 0;
let currentHeight = 0;

const connectionsText = document.getElementById('connectionsText')
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const addButton = document.getElementById('addButton');
const subtractButton = document.getElementById('subtractButton');

const MAX_CON=10;
const MIN_CON=1;
let connections = 2;
connectionsText.textContent=`${connections} peer connections Test`;

callButton.disabled = true;
hangupButton.disabled = true;
addButton.disabled = connections > 5;
subtractButton.disabled = connections < 2;

callButton.onclick = call;
hangupButton.onclick = hangup;
addButton.onclick = ()=>increment(1);
subtractButton.onclick = ()=>increment(-1);

const codecPreferences = document.querySelector('#codecPreferences');
const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
  'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

let videos = [];
let pcs = [];


for(let i=0;i<=MAX_CON;i++) {
  let vid = document.querySelector(`video#video${i+1}`);
  let pc = { local: null, remote: null };
  videos.push(vid);
  pcs.push(pc);
}

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function increment(n) {
  connections+=n;
  if(connections>=MAX_CON) {
    addButton.disabled=true;
  }
  else {
    addButton.disabled=false;
  }
  if(connections<=MIN_CON) {
    subtractButton.disabled = true;
  }
  else {
    subtractButton.disabled = false;
  }
  connectionsText.textContent=`${connections} peer connections Test`;
}

function gotStream(mediaStream) {
  console.log('Received local stream');
  videos[0].srcObject = mediaStream;
  stream = window.localStream = mediaStream;

  videoblock.style.display = 'block';

  callButton.disabled = false;

  const track = mediaStream.getVideoTracks()[0];
  const constraints = track.getConstraints();
  console.log('Result constraints: ' + JSON.stringify(constraints));
  if (constraints && constraints.width && constraints.width.exact) {
    widthInput.value = constraints.width.exact;
    widthOutput.textContent = constraints.width.exact;
  } else if (constraints && constraints.width && constraints.width.min) {
    widthInput.value = constraints.width.min;
    widthOutput.textContent = constraints.width.min;
  }

  if (supportsSetCodecPreferences) {
    const {codecs} = RTCRtpSender.getCapabilities('video');
    codecs.forEach(codec => {
      if (['video/red', 'video/ulpfec', 'video/rtx'].includes(codec.mimeType)) {
        return;
      }
      const option = document.createElement('option');
      option.value = (codec.mimeType + ' ' + (codec.sdpFmtpLine || '')).trim();
      option.innerText = option.value;
      codecPreferences.appendChild(option);
    });
    codecPreferences.disabled = false;
  }
}

function displayVideoDimensions() {
  if (videos[0].videoWidth) {
    dimensions.innerText = 'Actual video dimensions: ' + videos[0].videoWidth +
      'x' + videos[0].videoHeight + 'px.';
    if (currentWidth !== videos[0].videoWidth ||
      currentHeight !== videos[0].videoHeight) {
      currentWidth = videos[0].videoWidth;
      currentHeight = videos[0].videoHeight;
    }
  } else {
    dimensions.innerText = 'Video not ready';
  }
}

videos[0].onloadedmetadata = () => {
  displayVideoDimensions();
};

videos[0].onresize = () => {
  displayVideoDimensions();
};

function constraintChange(e) {
  
  const track = window.localStream.getVideoTracks()[0];
  let constraints;
  if (aspectLock.checked) {
    constraints = {
      width: {exact: e.target.value},
      aspectRatio: {
        exact: videos[0].videoWidth / videos[0].videoHeight
      }
    };
  } else {
    constraints = {width: {exact: e.target.value}};
  }
  console.log('applying ' + JSON.stringify(constraints));
  track.applyConstraints(constraints)
      .then(() => {
        console.log('applyConstraint success');
        widthOutput.textContent = e.target.value;
        displayVideoDimensions('applyConstraints');
      })
      .catch(err => {
        alert(err.name);
      });
}

widthInput.onchange = constraintChange;

sizeLock.onchange = () => {
  if (sizeLock.checked) {
    console.log('Setting fixed size');
    videos[0].style.width = '100%';
  } else {
    console.log('Setting auto size');
    videos[0].style.width = 'auto';
  }
};

vgaButton.onclick = () => {
  getMedia(vgaConstraints);
};

qvgaButton.onclick = () => {
  getMedia(qvgaConstraints);
};

hdButton.onclick = () => {
  getMedia(hdConstraints);
};

fullHdButton.onclick = () => {
  getMedia(fullHdConstraints);
};

televisionFourKButton.onclick = () => {
  getMedia(televisionFourKConstraints);
};

cinemaFourKButton.onclick = () => {
  getMedia(cinemaFourKConstraints);
};

eightKButton.onclick = () => {
  getMedia(eightKConstraints);
};

const qvgaConstraints = {
  video: {width: {exact: 320}, height: {exact: 240}}
};

const vgaConstraints = {
  video: {width: {exact: 640}, height: {exact: 480}}
};

const hdConstraints = {
  video: {width: {exact: 1280}, height: {exact: 720}}
};

const fullHdConstraints = {
  video: {width: {exact: 1920}, height: {exact: 1080}}
};

const televisionFourKConstraints = {
  video: {width: {exact: 3840}, height: {exact: 2160}}
};

const cinemaFourKConstraints = {
  video: {width: {exact: 4096}, height: {exact: 2160}}
};

const eightKConstraints = {
  video: {width: {exact: 7680}, height: {exact: 4320}}
};

function getMedia(constraints) {
  console.log('Requesting local stream');
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  navigator.mediaDevices
      .getUserMedia(constraints)
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ', e));
}

function call() {
  vgaButton.disabled = true;
  qvgaButton.disabled = true;
  hdButton.disabled = true;
  fullHdButton.disabled = true;
  televisionFourKButton.disabled = true;
  cinemaFourKButton.disabled = true;
  eightKButton.disabled = true;

  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting calls');
  const audioTracks = window.localStream.getAudioTracks();
  const videoTracks = window.localStream.getVideoTracks();
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  // Create an RTCPeerConnection via the polyfill.
  const servers = null;

  for(let i=0;i<connections;i++) {
    pcs[i].local = new RTCPeerConnection(servers);
    pcs[i].remote = new RTCPeerConnection(servers);
    pcs[i].remote.ontrack = (event)=>gotRemoteStream(event, i);
    pcs[i].local.onicecandidate = (event)=>iceCallbackLocal(event, i);
    pcs[i].remote.onicecandidate = (event)=>iceCallbackRemote(event, i);
    console.log(`pc${i+1}: created local and remote peer connection objects`);

    window.localStream.getTracks().forEach(track => pcs[i].local.addTrack(track, window.localStream));
    console.log(`Adding local stream to pc${i}Local`);
    if (supportsSetCodecPreferences) {
      const preferredCodec = codecPreferences.options[codecPreferences.selectedIndex];
      if (preferredCodec.value !== '') {
        const [mimeType, sdpFmtpLine] = preferredCodec.value.split(' ');
        const {codecs} = RTCRtpSender.getCapabilities('video');
        const selectedCodecIndex = codecs.findIndex(c => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine);
        const selectedCodec = codecs[selectedCodecIndex];
        codecs.splice(selectedCodecIndex, 1);
        codecs.unshift(selectedCodec);
        console.log(codecs);
        const transceiver = pcs[i].local.getTransceivers().find(t => t.sender && t.sender.track === localStream.getVideoTracks()[0]);
        transceiver.setCodecPreferences(codecs);
        console.log('Preferred video codec', selectedCodec);
      }
    }
    codecPreferences.disabled = true;
    pcs[i].local
      .createOffer(offerOptions)
      .then((event)=>gotDescriptionLocal(event,i), onCreateSessionDescriptionError);
  }
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function gotDescriptionLocal(desc, idx) {
  pcs[idx].local.setLocalDescription(desc);
  console.log(`Offer from pc${idx}Local\n${desc.sdp}`);
  pcs[idx].remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pcs[idx].remote.createAnswer().then((event)=>gotDescriptionRemote(event, idx), onCreateSessionDescriptionError);
}

function gotDescriptionRemote(desc, idx) {
  pcs[idx].remote.setLocalDescription(desc);
  console.log(`Answer from pc${idx}Remote\n${desc.sdp}`);
  pcs[idx].local.setRemoteDescription(desc);

  // Display the video codec that is actually used.
  setTimeout(async () => {
    const stats = await pcs[idx].local.getStats();
    stats.forEach(stat => {
      if (!(stat.type === 'outbound-rtp' && stat.kind === 'video')) {
        return;
      }
      const codec = stats.get(stat.codecId);
      document.getElementById('actualCodec').innerText = 'Using ' + codec.mimeType +
          ' ' + (codec.sdpFmtpLine ? codec.sdpFmtpLine + ' ' : '') +
          ', payloadType=' + codec.payloadType + '.';
    });
  }, 1000);
}

function hangup() {
  console.log('Ending calls');
  
  for(let i=0;i<connections;i++) {
    if(pcs[i].local)
      pcs[i].local.close();
    if(pcs[i].remote)
      pcs[i].remote.close();
    pcs[i].local = null;
    pcs[i].remote = null;
  }
  hangupButton.disabled = true;
  callButton.disabled = false;
  codecPreferences.disabled = false;

  vgaButton.disabled = false;
  qvgaButton.disabled = false;
  hdButton.disabled = false;
  fullHdButton.disabled = false;
  televisionFourKButton.disabled = false;
  cinemaFourKButton.disabled = false;
  eightKButton.disabled = false;
}

function gotRemoteStream(e, idx) {
  if (videos[idx+1].srcObject !== e.streams[0]) {
    videos[idx+1].srcObject = e.streams[0];
    console.log(`pc${idx}: received remote stream`);
  } else {
    console.log("test failed!")
  }
}

function iceCallbackLocal(event, idx) {
  console.log("iceCallback",event, idx)
  handleCandidate(event.candidate, pcs[idx].remote, `pc${idx}: `, 'local');
}

function iceCallbackRemote(event, idx) {
  handleCandidate(event.candidate, pcs[idx].local, `pc${idx}: `, 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
  dest.addIceCandidate(candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add ICE candidate: ${error.toString()}`);
}