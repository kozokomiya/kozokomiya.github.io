const Peer = window.Peer;
const Peer2 = window.Peer;

(async function main() {
  const sphereVideo = document.getElementById('js-sphere-stream');  // room1
  const remoteVideo = document.getElementById('js-remote-stream');  // room2
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const join2Trigger = document.getElementById('js-join2-trigger');
  const leave2Trigger = document.getElementById('js-leave2-trigger');
  const roomId = document.getElementById('js-room-id');
  const room2Id = document.getElementById('js-room2-id');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');

  // default room id to 'room1'
  roomId.value = 'room1'
  room2Id.value = 'room2'

  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  const peer2 = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });


  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      videoBandwidth: 3000,
      videoCodec: 'H264'
    });

    room.once('open', () => {
      messages.textContent += '=== You joined (Sphere) ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined (Sphere) ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      // const newVideo = document.createElement('video');
      messages.textContent += `=== new stream ${stream.peerId} (Sphere) ===\n`;
      sphereVideo.srcObject = stream;
      // mark peerId to find it later at peerLeave event
      await sphereVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      messages.textContent += `=== ${peerId} left === (Sphere) \n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left (Sphere) === \n';
      sphereVideo.srcObject.getTracks().forEach(track => track.stop());
      sphereVideo.srcObject = null
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
  });

  peer.on('error', console.error);




  // Register join handler
  join2Trigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(room2Id.value, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      videoBandwidth: 3000,
      videoCodec: 'H264'
    });

    room.once('open', () => {
      messages.textContent += '=== You joined (Remote) ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined (Remote) ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      // const newVideo = document.createElement('video');
      messages.textContent += `=== new stream ${stream.peerId} (Remote) ===\n`;
      // newVideo.srcObject = stream;
      remoteVideo.srcObject = stream;
      // mark peerId to find it later at peerLeave event
      await remoteVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      messages.textContent += `=== ${peerId} left (Remote) ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      messages.textContent += '== You left (Remote) ===\n';
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null
    });

    leave2Trigger.addEventListener('click', () => room.close(), { once: true });
  });

  peer2.on('error', console.error);
})();
