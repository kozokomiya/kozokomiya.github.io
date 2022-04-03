const Peer = window.Peer;

(async function main() {
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const sphereVideo = document.getElementById('js-sphere-stream');
  const flatVideo = document.getElementById('js-flat-stream');
  const messages = document.getElementById('js-messages');
  const ctl = document.getElementById("ctl");
  const flatMonitor = document.getElementById('flat-monitor');
  const sphereMonitor = document.getElementById('sphere-monitor');
  const flipBtn = document.getElementById('js-flip-btn');
  const flipTrigger = document.getElementById('js-flip-trigger');
  const pcroom2flatvideo = document.getElementById("pcroom2-flat-video");
  const flatFrame = document.getElementById("js-flat-frame");
  const muteOn = document.getElementById("js-mute-on-btn");
  const muteOff = document.getElementById("js-mute-off-btn");

  const room1name = window.__ROOM1_NAME__;
  const room2name = window.__ROOM2_NAME__;


  const sphere_peer_key = 'Sphere';
  const flat_peer_key = 'Flat';

  const peer1 = new Peer({   // sphere view peer
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });
  const peer2 = new Peer({   // flat view peer
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  const vrRoomMode = document.getElementById("myEmbeddedScene");

  var flatMonitorVisible = false;   // Show flat video on VR room
  var flatFrameVisible = false;     // Show flat frame on PC room
  var flatDisplayShow = false;      // Show flat video on PC room

  // flat screen
  peer1.on('open', () => {
    joinTrigger.disabled = "";  // enable joinButtun
    leaveTrigger.disabled = "disabled";  // disable leavebutton
    // document.getElementById('peer2id').textContent = `  (${peer2.id})`;
    messages.textContent += `peer1: connected (${peer1.id}) \n`;
  });

  peer2.on('open', () => {
    messages.textContent += `peer2: connected (${peer2.id}) \n`;
  });

  // ------------------------------------------------------
  // mouse event handler (PC room only)
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
              flatDisplayShow = !flatDisplayShow;
              flatDisplayUpdate(flatDisplayShow);
            }
          });
      }
  });

  if (pcroom2flatvideo) {
    pcroom2flatvideo.onclick = function() {
      flatDisplayShow = !flatDisplayShow;
      flatDisplayUpdate(flatDisplayShow);
    }
  }

  function flatDisplayUpdate() {
    if (flatFrame && flatFrameVisible) {
      if (flatDisplayShow) {
        document.getElementById("pcroom2-flat-video").style.display = "block";
        document.getElementById("pcroom2-sphere-video").style.display = "none";
      } else {
        document.getElementById("pcroom2-flat-video").style.display = "none";
        document.getElementById("pcroom2-sphere-video").style.display = "block";
      }
    }
  }

  const mediaType = (vrRoomMode ? { audio:true } :
    { audio: true, video: {width: 640, height: 480} });

  const localStream = await navigator.mediaDevices
    .getUserMedia(mediaType)
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
      if (stream.peerId.indexOf(sphere_peer_key) === 0) {
        sphereVideo.srcObject = stream;
        await sphereVideo.play().catch(console.error);
        sphereMonitor.setAttribute('color', "#FFF");
        sphereMonitor.setAttribute('src', "#js-sphere-stream");
      }
    });

    room2.on('stream', async stream => {
      messages.textContent += `=== (${room2name}) new stream ${stream.peerId} ===\n`;
      if (stream.peerId.indexOf(flat_peer_key) === 0) {
        flatVideo.srcObject = stream;
        if (flatMonitor) {
          flatMonitorVisible = true;
          flatMonitor.setAttribute('visible', flatMonitorVisible);
          flatMonitor.setAttribute('material', "color: #FFF; src: #js-flat-stream");
        }
        await flatVideo.play().catch(console.error);

        if (flatFrame) {
          flatFrameVisible = true;
          flatFrame.setAttribute('visible', flatFrameVisible);
        }
        if (flipTrigger) {
          flipTrigger.style.display = "";   // flipTriggerボタン表示
        }

        if (muteOn) {
          muteOn.style.display = "";
        }
        if (muteOff) {
          muteOff.style.display = "";
        }
      }
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
      if (peerId.indexOf(sphere_peer_key) === 0) {
        sphereVideo.srcObject.getTracks().forEach(track => track.stop());
        sphereVideo.srcObject = null;
    //    sphereVideo.remove();
        sphereMonitor.setAttribute('color', "#999");
        sphereMonitor.removeAttribute('src');
      }
      messages.textContent += `=== (${room1name}) ${peerId} left ===\n`;
    });

    room2.on('peerLeave', peerId => {
      if (peerId.indexOf(flat_peer_key) === 0) {
        if (flatVideo.srcObject != null) {
          flatVideo.srcObject.getTracks().forEach(track => track.stop());
          flatVideo.srcObject = null;
          //flatVideo.remove();
          if (flatMonitor) {
            flatMonitor.setAttribute('material', "color: #666");
            flatMonitor.removeAttribute('material', 'src');
            flatMonitorVisible = false;
            flatMonitor.setAttribute('visible', flatMonitorVisible);
          }
          if (flatFrame) {
            flatDisplayShow = false;
            flatDisplayUpdate(flatDisplayShow);
            flatFrameVisible = false;
            flatFrame.setAttribute('visible', flatFrameVisible);
          }
          if (flipTrigger) {
            flipTrigger.style.display = "none";   // flipTriggerボタン非表示
          }
          if (muteOn && muteOff) {
            muteOn.style.display = "none";
            muteOn.disabled = "";
            muteOff.style.display = "none";
            muteOff.disabled = "disabled";
            var audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = true;
          }
        }
      }
      messages.textContent += `=== (${room2name}) ${peerId} left ===\n`;
    });

    room1.once('close', () => {
      messages.textContent += `=== (${room1name}) You left ===\n`;
      if (sphereVideo.srcObject != null) {
        sphereVideo.srcObject.getTracks().forEach(track => track.stop());
        sphereVideo.srcObject = null;
        //sphereVideo.remove();
        sphereMonitor.setAttribute('color', "#999");
        sphereMonitor.removeAttribute('src');
      }
    });

    room2.once('close', () => {
      messages.textContent += `=== (${room2name}) You left ===\n`;
      if (flatVideo.srcObject != null) {
        flatVideo.srcObject.getTracks().forEach(track => track.stop());
        flatVideo.srcObject = null;
        //flatVideo.remove();
        if (flatMonitor) {
          flatMonitor.setAttribute('material', "color: #666");
          flatMonitor.removeAttribute('material', 'src');
          flatMonitorVisible = false;
          flatMonitor.setAttribute('visible', flatMonitorVisible);
        }
        if (flatFrame) {
          flatFrameVisible = false;
          flatFrame.setAttribute('visible', flatFrameVisible);
          flatDisplayShow = false;
          flatDisplayUpdate(flatDisplayShow);
        }
        if (muteOn && muteOff) {
          muteOn.style.display = "none";
          muteOn.disabled = "";
          muteOff.style.display = "none";
          muteOff.disabled = "disabled";
          var audioTrack = localStream.getAudioTracks()[0];
          audioTrack.enabled = true;
        }
      }
    });

    leaveTrigger.addEventListener('click', () => {
      room2.close();
      room1.close();
      joinTrigger.disabled = "";  // enable joinButtun
      leaveTrigger.disabled = "disabled";
      if (flipTrigger) {
        flipTrigger.style.display = "none";   // flipTriggerボタン非表示
      }
    }, { once: true });

    peer1.on('error', console.error);
    peer2.on('error', console.error);

    // Controller
    ctl.addEventListener('triggerdown', () => {
      if (flipTrigger) {
        if (flipTrigger.style.display != "none") {
          flatMonitorVisible = !flatMonitorVisible;
          flatMonitor.setAttribute('visible', flatMonitorVisible);
        }
      }
    });

    if (flipTrigger) {
      flipTrigger.addEventListener('click', () => {
        flatMonitorVisible = !flatMonitorVisible;
        flatMonitor.setAttribute('visible', flatMonitorVisible);
      });
    }

    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        flatDisplayShow = !flatDisplayShow;
        flatDisplayUpdate(flatDisplayShow);
      });
    }

    if (muteOn && muteOff) {
      muteOn.addEventListener('click', () => {
        var audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = false;
        muteOff.disabled = "";  // enable muteOff
        muteOn.disabled = "disabled";
      });
      muteOff.addEventListener('click', () => {
        var audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = true;
        muteOff.disabled = "disabled";  // disable muteOff
        muteOn.disabled = "";
      });
    }

  });  // joinTrigger.addEventListener('click', ())
})();  // main()
