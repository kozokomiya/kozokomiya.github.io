const Peer = window.Peer;

(async function main() {
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const sphereVideo = document.getElementById('js-sphere-stream');
  const videobps = document.getElementById('js-bitrate-text');
  const flatVideo = document.getElementById('js-flat-stream');
  const messages = document.getElementById('js-messages');
  const ctl = document.getElementById("ctl");
  const flatMonitor = document.getElementById('flat-monitor');
  const sphereMonitor = document.getElementById('sphere-monitor');
  const flipBtn = document.getElementById('js-flip-btn');

  const room1name = window.__ROOM1_NAME__;
  const room2name = window.__ROOM2_NAME__;

  const peer1 = new Peer({   // sphere view peer
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });
  const peer2 = new Peer({   // flat view peer
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  var flatMonitorShow = true;   // Show flat video on VR mode
  var flatDisplayShow = false;  // Show flat video on PC display mode

  // flat screen
  peer1.on('open', () => {
    joinTrigger.disabled = "";  // enable joinButtun
    leaveTrigger.disabled = "disabled";  // disable leavebutton
    // document.getElementById('peer2id').textContent = `  (${peer2.id})`;
  });


  // ------------------------------------------------------
  // mouse event handler (not for VR mode)
  // ------------------------------------------------------
  AFRAME.registerComponent('cursor-listener', {
      init: function () {
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
          this.el.addEventListener('mouseup', function(evt) {
            if(evt.isTrusted && isStatic) {
              flipDisplay();
            }
          });
      }
  });

  document.getElementById("pcroom2-flat-video").onclick = function() {
    console.log("pcroom2-flat-video click");
    flipDisplay();
  }

  function flipDisplay() {
    console.log("flipDisplay");
    if (flatMonitor.getAttribute('visible')) {
      flatDisplayShow = !flatDisplayShow;
      if (flatDisplayShow) {
        document.getElementById("pcroom2-flat-video").style.display = "block";
        document.getElementById("pcroom2-sphere-video").style.display = "none";
      } else {
        document.getElementById("pcroom2-flat-video").style.display = "none";
        document.getElementById("pcroom2-sphere-video").style.display = "block";
      }
    }
  }

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,      // camera permission assumed to be disabled
    })
    .catch(console.error);


  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer1.open || !peer2.open) {
      return;
    }

    const room1 = peer1.joinRoom(room1name, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      stream: localStream,
      videoBandwidth: 3000,
      videoCodec: 'H264'
    });

    const room2 = peer2.joinRoom(room2name, {
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
      stream: localStream,
      videoBandwidth: 3000,
      videoCodec: 'H264'
    });

    room1.once('open', () => {
      messages.textContent += `=== (${room1name}) You joined ===\n`;
      joinTrigger.disabled = "disabled";
      leaveTrigger.disabled = "";
    });

    room2.once('open', () => {
      messages.textContent += `=== (${room2name}) You joined ===\n`;
    });

    room1.on('peerJoin', peer1Id => {
      messages.textContent += `=== (${room1name}) ${peer1Id} joined ===\n`;
    });

    room2.on('peerJoin', peer2Id => {
      messages.textContent += `=== (${room2name}) ${peer2Id} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room1.on('stream', async stream => {
      messages.textContent += `=== (${room1name}) new stream ${stream.peerId} ===\n`;
      sphereVideo.srcObject = stream;
      await sphereVideo.play().catch(console.error);
      sphereMonitor.setAttribute('color', "#FFF");
      sphereMonitor.setAttribute('src', "#js-sphere-stream");
    });

    room2.on('stream', async stream => {
      messages.textContent += `=== (${room2name}) new stream ${stream.peerId} ===\n`;
      flatVideo.srcObject = stream;
      await flatVideo.play().catch(console.error);
      flatMonitor.setAttribute('visible', flatMonitorShow);
      flatMonitor.setAttribute('material', "color: #FFF; src: #js-flat-stream");
    });

    room1.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    room2.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room1.on('peerLeave', peerId => {
      sphereVideo.srcObject.getTracks().forEach(track => track.stop());
      sphereVideo.srcObject = null;
  //    sphereVideo.remove();
      sphereMonitor.setAttribute('color', "#999");
      sphereMonitor.removeAttribute('src');
      messages.textContent += `=== (${room1name}) ${peerId} left ===\n`;
    });

    room2.on('peerLeave', peer2Id => {
      if (flatVideo.srcObject != null) {
        flatVideo.srcObject.getTracks().forEach(track => track.stop());
        flatVideo.srcObject = null;
        //flatVideo.remove();
        flatMonitor.setAttribute('material', "color: #666");
        flatMonitor.removeAttribute('material', 'src');
        flatMonitor.setAttribute('visible', false);
      }
      messages.textContent += `=== (${room2name}) ${peer2Id} left ===\n`;
    });

    room1.once('close', () => {
      messages.textContent += `=== (${room1name}) You left ===\n`;
      messages.textContent += `=== (${room2name}) You left ===\n`;
      if (sphereVideo.srcObject != null) {
        sphereVideo.srcObject.getTracks().forEach(track => track.stop());
        sphereVideo.srcObject = null;
        //sphereVideo.remove();
        sphereMonitor.setAttribute('color', "#999");
        sphereMonitor.removeAttribute('src');
      }
      if (flatVideo.srcObject != null) {
        flatVideo.srcObject.getTracks().forEach(track => track.stop());
        flatVideo.srcObject = null;
        //flatVideo.remove();
        flatMonitor.setAttribute('material', "color: #666");
        flatMonitor.removeAttribute('material', 'src');
        flatMonitor.setAttribute('visible', false);
      }
      joinTrigger.disabled = "";  // enable joinButtun
      leaveTrigger.disabled = "disabled";
    });

    leaveTrigger.addEventListener('click', () => room1.close(), { once: true });

    peer1.on('error', console.error);
    peer2.on('error', console.error);

    // Controller
    ctl.addEventListener('triggerdown', () => {
      flatMonitorShow = !flatMonitorShow;
      flatMonitor.setAttribute('visible', flatMonitorShow);
    });

    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        console.log("flipBtn");
        flipDisplay();
      });
    }
  });  // joinTrigger.addEventListener('click', ())
})();  // main()
