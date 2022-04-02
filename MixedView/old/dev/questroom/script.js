const Peer = window.Peer;

(async function main() {
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const sphereVideo = document.getElementById('js-sphere-stream');
  const roomId = document.getElementById('js-room-id');
  const videobps = document.getElementById('js-bitrate-text');
  const join2Trigger = document.getElementById('js-join2-trigger');
  const leave2Trigger = document.getElementById('js-leave2-trigger');
  const flatVideo = document.getElementById('js-flat-stream');
  const room2Id = document.getElementById('js-room2-id');
  const video2bps = document.getElementById('js-bitrate2-text');
  const localText = document.getElementById('js-local-text');
  const messages = document.getElementById('js-messages');
  const ctll = document.getElementById("ctlL");
  const ctlr = document.getElementById("ctlR");
  const vrMonitor = document.getElementById('vr-monitor');
  const shpereScreen = document.getElementById('sphere-screen')
  let vWidth = 192.0;
  let vHeight = 108.0;
  let vposx = 0.0;
  let vposy = 0.0;
  let vposz = -200.0;
  let vrotz = 0;
  const txt = document.getElementById("txt");  // for dubug


  const peer2 = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  // flat screen
  peer2.on('open', () => {
    document.getElementById('peer2id').textContent = `  (${peer2.id})`;
  });

  // default room id to 'room1'
  room2Id.value = 'room2';
  video2bps.value = 1000;

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

  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  // 360deg screen
  peer.on('open', () => {
    document.getElementById('peerid').textContent = `  (${peer.id})`;
  });

  // default room id to 'room1'
  roomId.value = 'room1';
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

    // controller
    ctlr.addEventListener('triggerdown', onRTriggerDown);
    var show_flat = 1;
    function onRTriggerDown() {
      if (show_flat > 0) {
        vrMonitor.setAttribute('visible', false);
        show_flat = 0;
      } else {
        vrMonitor.setAttribute('visible', true);
        show_flat = 1;
      }
    }
    ctll.addEventListener('triggerdown', onLTriggerDown);
    var show_sphere;
    function onLTriggerDown() {
      if (show_sphere > 0) {
        shpereScreen.setAttribute('visible', false);
        show_sphere = 0;
      } else {
        shpereScreen.setAttribute('visible', true);
        show_sphere = 1;
      }
    }
    ctlr.addEventListener('abuttondown', function (event) {
      document.querySelector('a-scene').exitVR()
    });
    ctlr.addEventListener('axismove', function (event) {
      const x = Number(event.detail.axis[0]);
      const y = Number(event.detail.axis[1]);
      const r = 1 + (0.005 * x);
      vWidth  *= r;
      vHeight *= r;
      const s = 0.05 * y;
      vrotz += s;
      vrMonitor.setAttribute('geometry', `width: ${vWidth}; height: ${vHeight};`);
      vrMonitor.setAttribute('position', `${vposx} ${vposy} ${vposz}`);
      vrMonitor.setAttribute('rotation', `0 0 ${vrotz}`);
      txt.setAttribute("value", `W:${vWidth.toFixed(2)} H:${vHeight.toFixed(2)} X:${vposx.toFixed(2)} Y:${vposy.toFixed(2)} Z:${vposz.toFixed(2)} rotate:0 0 ${vrotz.toFixed(4)}`);
    });
    ctll.addEventListener('axismove', function (event) {
      const x = Number(event.detail.axis[0]);
      const y = Number(event.detail.axis[1]);
      vposx += x;
      vposy += y;
      vrMonitor.setAttribute('position', `${vposx} ${vposy} ${vposz}`);
      txt.setAttribute("value", `W:${vWidth.toFixed(2)} H:${vHeight.toFixed(2)} X:${vposx.toFixed(2)} Y:${vposy.toFixed(2)} Z:${vposz.toFixed(2)} rotate:0 0 ${vrotz.toFixed(4)}`);
    });

  });

  peer.on('error', console.error);

})();
