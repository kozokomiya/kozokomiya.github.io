<template>
  <div id='app'>
    <audio></audio>
    <div id="vrRoom">
      <a-scene embedded cursor-listener>
        <a-entity id="aCtl" laser-controls="hand: right"></a-entity>
        <a-entity id="aCamera"
          camera look-controls="hmdEnabled: false; reverseMouseDrag: true; touchEnabled: true"
          position="0 1.6 0"></a-entity>
        <a-assets>
          <video id="videoSphere" autoplay loop playsinline crossorigin="anonymous"></video>
        </a-assets>
        <a-videosphere id="aScreenSphere" color="#999" rotation="0 270 0"></a-videosphere>
      </a-scene>
    </div>
    <div v-show="showMessage" class="debug-messages" >
      <template v-for="message in messages">
        <p>{{message}}</p>
      </template>
    </div>
  </div>
</template>

<script>
module.exports = {

  data: function() {
    return {
      showMessage:    true,
      messages:       [],
      who:            'User',
      skywayKey:      '',
      roomName:       '',
      roomMode:       '',       // mesh or sfu
    }
  },

  methods: {
    window:onload = function() {
      console.log("******* window: onload *******")
    },

    connectLocalMedia: async function(){
      const audioConstraints = {
        audio: true,
        video: false
      }
      const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      this.localAudioStream = audioStream
    },

    joinRoom: function() {
      console.log("******* joinRoom *******")
      this.room = this.peer.joinRoom(this.roomName, {
        mode: this.roomMode,
        stream: this.localAudioStream
      })

      this.room.on('open', () => {
        this.messages.push(`enter room (${this.room.name})`)
      })

      this.room.on('peerJoin', peerId => {
        this.messages.push(`${peerId} joined to room ${this.room.name}`)
      })

      this.room.on('peerLeave', peerId => {
        this.messages.push(`${peerId} leaved from room ${this.room.name}`)
        videoSphere.srcObject.getTracks().forEach(track => track.stop())
        videoSphere.srcObject = null
        aScreenSphere.setAttribute('color', '#999')
        aScreenSphere.removeAttribute('src')
      })

      this.room.on('stream', async stream => {
        this.messages.push(`new STREAM from ${stream.peerId}`)
        videoSphere.srcObject = stream
        await videoSphere.play().catch(console.error)
        aScreenSphere.setAttribute('color', '#FFF')
        aScreenSphere.setAttribute('src', '#videoSphere')

      })

      this.room.on('close', () => {
        this.messages.push(`leave room from (${this.room.name})`)
      })
    },

    // get URL query parameter
    getParam: function(name, url) {
      if (!url) url = window.location.href
      name = name.replace(/[\[\]]/g, "\\$&")
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url)
      if (!results) return null
      if (!results[2]) return ''
      return decodeURIComponent(results[2].replace(/\+/g, " "))
    }
  }, // methods

  mounted: function() {
    var self = this       // save this as self

    // get query paramter
    const param = location.search
    this.skywayKey = this.getParam('key')
    this.roomName = this.getParam('room')
    this.roomMode = this.getParam('mode')
    if (null == this.roomMode || 'sfu' != this.roomMode) this.roomMode = 'mesh'
    console.log(`APIKEY=${this.skywayKey}`)
    console.log(`ROOM=${this.roomName}`)
    console.log(`MODE=${this.roomMode}`)

    // Start Local Media Stream
    this.connectLocalMedia()

    // Peer Open
    this.peer = new Peer({key: this.skywayKey, debug: 3})

    // Event listener for peer
    this.peer.on('open', id => {
      this.messages.push(`peer opened (${id})`)
      this.joinRoom()
    })
  },
}

</script>

<style>
p {
  background-color: #eee;
  font-size: 1em;
  margin-top: 0;
  margin-bottom: 0;
  line-height: 110%;
}

#vrRoom {
  height: 100%;
  margin: 0 0;
  padding: 0 0;
}

video {
  background-color: #111;
  width: 100%;
  height: 100%;
}

#vrRoom .debug-messages {
  background-color: #eee;
  min-height: 100px;
  margin-top: 0;
  line-height: 50%;
}

@media screen and (min-width:480px) {
  /*　画面サイズが480pxからはここを読み込む　*/
  #vrRoom {
    height: 270px;
  }
}
@media screen and (min-width:640px) and ( max-width:720px) {
  /*　画面サイズが768pxから1024pxまではここを読み込む　*/
  #vrRoom {
    height: 360px;
  }
}
@media screen and (min-width:720px) and ( max-width:960px) {
  /*　画面サイズが768pxから1024pxまではここを読み込む　*/
  #vrRoom {
    height: 405px;
  }
}
@media screen and (min-width:960px) and ( max-width:1280px){
  #vrRoom {
    height: 540px;
  }
}
@media screen and (min-width:1280px) and ( max-width:1440px){
  #vrRoom {
    height: 720px;
  }
}
@media screen and (min-width:1440px) and ( max-width:1920px){
  #vrRoom {
    height: 810px;
  }
}
@media screen and (min-width:1920px) and ( max-width:2560px){
  #vrRoom {
    height: 1080px;
  }
}
@media screen and (min-width:2560px) and ( max-width:2880px){
  #vrRoom {
    height: 1440px;
  }
}
@media screen and (min-width:2880px) and ( max-width:3480px){
  #vrRoom {
    height: 1620px;
  }
}
@media screen and (min-width:3480px) {
  #vrRoom {
    height: 2160px;
  }
}
</style>
