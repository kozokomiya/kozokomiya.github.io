const Peer = window.Peer;

(async function main() {
  const sphereVideo = document.getElementById('js-sphere-stream');
  const remoteVideo = document.getElementById('js-remote-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');

  // default room id to 'room1'
  roomId.value = 'room1'

  // const localStream = await navigator.mediaDevices
  //   .getUserMedia({
  //     audio: true,
  //     video: true,
  //   })
  //   .catch(console.error);

  // Render local stream
  // localVideo.muted = true;
  // localVideo.srcObject = localStream;
  // await localVideo.play().catch(console.error);

  const peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  });

  sphereVideo.srcObject = null;
  remoteVideo.srcObject = null;

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: location.hash === '#mesh' ? 'mesh' : 'sfu',
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      if (sphereVideo.srcObject == undefined || sphereVideo.srcObject == null) {
          sphereVideo.srcObject = stream;
          await sphereVideo.play().catch(console.error);
          console.log(" *************** add sphereVideo");
      } else if (remoteVideo.srcObject == undefined || remoteVideo.srcObject == null) {
          remoteVideo.srcObject = stream;
          await remoteVideo.play().catch(console.error);
          console.log(" *************** add remoteVideo");
      } else {
          const newVideo = document.createElement('video');
          newVideo.srcObject = stream;
          // mark peerId to find it later at peerLeave event
          newVideo.setAttribute('data-peer-id', stream.peerId);
          remoteVideos.append(newVideo);
          await newVideo.play().catch(console.error);
          console.log("add remoteVideos");
      }
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
      sphereVideo.srcObject.getTracks().forEach(track => track.stop());
      sphereVideo.srcObject = null;
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });


    var monitor_mode = 1;
    const vrMonitor = document.getElementById('vr-monitor');
    function onClickSend() {
        monitor_mode ++;
        if (monitor_mode > 2) {
            monitor_mode = 0;
        }
        console.log("click mouse" + monitor_mode)

        switch(monitor_mode) {
          case 1:
            vrMonitor.setAttribute('position', "0 0 -150");
            vrMonitor.setAttribute('rotation', "0 0 0");
            vrMonitor.setAttribute('visible', true);
            break;
          case 2:
            vrMonitor.setAttribute('position', "200 200 -250");
            vrMonitor.setAttribute('rotation', "10 -5 0");
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


AFRAME.registerComponent('cursor-listener', {
    init: function () {
        var monitor_mode = 1;
        const vrMonitor = document.getElementById('vr-monitor');
        console.log("cursor-listener init");
        this.el.addEventListener('click', function (evt) {
            monitor_mode ++;
            if (monitor_mode > 2) {
                monitor_mode = 0;
            }
            console.log("mouse clicked(" + monitor_mode + ")");

            switch(monitor_mode) {
              case 1:
                vrMonitor.setAttribute('position', "0 0 -150");
                vrMonitor.setAttribute('rotation', "0 0 0");
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
        });
    }
});
