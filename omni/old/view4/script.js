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
      mode: location.hash === '#sfu' ? 'sfu' : 'mesh',
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

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
  });

  peer.on('error', console.error);
})();
