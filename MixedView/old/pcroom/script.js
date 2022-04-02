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
  const ctl = document.getElementById("ctl");
  const vrMonitor = document.getElementById('vr-monitor');

  const peer2 = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  AFRAME.registerComponent('cursor-listener', {
      init: function () {
          var vrMonitorVisible = true;
          var isStatic = true;
          this.el.addEventListener('mousedown', function(evt) {
            if (evt.isTrusted) {
              isStatic = true;
            }
          });
          this.el.addEventListener('mousemove', function(evt) {
            if (evt.isTrusted) {
              isStatic = false;
            }
          });
          this.el.addEventListener('mouseup',function(evt) {
            if(evt.isTrusted && isStatic) {
              vrMonitorVisible = !vrMonitorVisible;
              vrMonitor.setAttribute('visible', vrMonitorVisible);
            }
          });
      }
  });

  // flat screen
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
    ctl.addEventListener('triggerdown', onClickSend);
    var monitor_mode = 1;
    function onClickSend() {
      monitor_mode ++;
      if (monitor_mode > 1) {
          monitor_mode = 0;
      }
      switch(monitor_mode) {
        case 1:
          vrMonitor.setAttribute('visible', true);
          break;
        case 2:
          vrMonitor.setAttribute('position', "200 200 -250");
          vrMonitor.setAttribute('rotation', "10 5 0");
          vrMonitor.setAttribute('visible', true);
          break;
        default:
          vrMonitor.setAttribute('visible', false);
          break;
      }
    }
  });

  peer.on('error', console.error);

})();
