const Peer = window.Peer;

(async function main() {
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const sphereVideo = document.getElementById('js-sphere-stream');
  const roomId = document.getElementById('js-room-id');
  const videobps = document.getElementById('js-bitrate-text');
  const localText = document.getElementById('js-local-text');
  const messages = document.getElementById('js-messages');

  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  peer.on('open', () => {
    document.getElementById('peerid').textContent = `  (${peer.id})`;
  });

  // default room id to 'room1'
  roomId.value = window.__ROOM1_NAME__;
  videobps.value = 3000;

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const bps = parseInt(videobps.value)
    const room = peer.joinRoom(roomId.value, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      videoBandwidth: bps,
      videoCodec: 'H264'
    });

    room.once('open', () => {
      messages.textContent += `=== (${roomId.value}) You joined ===\n`;
      joinTrigger.disabled = "disabled";
      roomId.disabled = "disabled";
      videobps.disabled = "disabled";
      leaveTrigger.disabled = "";
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== (${roomId.value}) ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      messages.textContent += `=== (${roomId.value}) new stream ${stream.peerId} ===\n`;
      sphereVideo.srcObject = stream;
      await sphereVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      sphereVideo.srcObject.getTracks().forEach(track => track.stop());
      sphereVideo.srcObject = null;
      sphereVideo.remove();
      messages.textContent += `=== (${roomId.value}) ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      messages.textContent += `=== (${roomId.value}) You left ===\n`;
      if (sphereVideo.srcObject != null) {
        sphereVideo.srcObject.getTracks().forEach(track => track.stop());
        sphereVideo.srcObject = null;
        sphereVideo.remove();
      }
      joinTrigger.disabled = "";  // enable joinButtun
      roomId.disabled = "";
      videobps.disabled = "";
      leaveTrigger.disabled = "disabled";
    });

    leaveTrigger.addEventListener('click', () => room.close(), { once: true });
  });

  peer.on('error', console.error);
})();
