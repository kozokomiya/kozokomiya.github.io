const Peer = window.Peer;

(async function main() {
  const join2Trigger = document.getElementById('js-join2-trigger');
  const leave2Trigger = document.getElementById('js-leave2-trigger');
  const flatVideo = document.getElementById('js-flat-stream');
  const room2Id = document.getElementById('js-room2-id');
  const video2bps = document.getElementById('js-bitrate2-text');
  const localText = document.getElementById('js-local-text');
  const messages = document.getElementById('js-messages');

  const peer2 = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  peer2.on('open', () => {
    document.getElementById('peer2id').textContent = `  (${peer2.id})`;
  });

  // default room id to 'room1'
  room2Id.value = 'room2';
  video2bps.value = 1000;

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .catch(console.error);

  // Register join handler
  join2Trigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer2.open) {
      return;
    }

    const bps2 = parseInt(video2bps.value)
    const room2 = peer2.joinRoom(room2Id.value, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      stream: localStream,
      videoBandwidth: bps2,
      videoCodec: 'H264'
    });

    room2.once('open', () => {
      messages.textContent += `=== (${room2Id.value}) You joined ===\n`;
      join2Trigger.disabled = "disabled";
      room2Id.disabled = "disabled";
      video2bps.disabled = "disabled";
      leave2Trigger.disabled = "";
    });
    room2.on('peerJoin', peer2Id => {
      messages.textContent += `=== (${room2Id.value}) ${peer2Id} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room2.on('stream', async stream => {
      messages.textContent += `=== (${room2Id.value}) new stream ${stream.peerId} ===\n`;
      flatVideo.srcObject = stream;
      await flatVideo.play().catch(console.error);
    });

    room2.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room2.on('peerLeave', peer2Id => {
      if (flatVideo.srcObject != null) {
        flatVideo.srcObject.getTracks().forEach(track => track.stop());
        flatVideo.srcObject = null;
        //flatVideo.remove();
      }
      messages.textContent += `=== (${room2Id.value}) ${peer2Id} left ===\n`;
    });

    // for closing myself
    room2.once('close', () => {
      messages.textContent += `=== (${room2Id.value}) You left ===\n`;
      if (flatVideo.srcObject != null) {
        flatVideo.srcObject.getTracks().forEach(track => track.stop());
        flatVideo.srcObject = null;
        //flatVideo.remove();
      }
      join2Trigger.disabled = "";  // enable joinButtun
      room2Id.disabled = "";
      video2bps.disabled = "";
      leave2Trigger.disabled = "disabled";
    });

    leave2Trigger.addEventListener('click', () => room2.close(), { once: true });
  });

  peer2.on('error', console.error);
})();
