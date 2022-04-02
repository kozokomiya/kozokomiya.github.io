var lookControls = AFRAME.components['look-controls'],
    lookControlsComponent = lookControls.Component;

lookControlsComponent.prototype.onTouchMove = function(evt) {
  // Replace the TouchMove event handler...
  var direction;
  var canvas = this.el.sceneEl.canvas;
  var deltaX;                           // Kozo
  var deltaY;
  var yawObject = this.yawObject;
  var pitchObject = this.pitchObject;   // Kozo

  if (!this.touchStarted || !this.data.touchEnabled) { return; }

  deltaY = 2 * Math.PI * (evt.touches[0].pageX - this.touchStart.x) / canvas.clientWidth;
  deltaX = 2 * Math.PI * (evt.touches[0].pageY - this.touchStart.y) / canvas.clientHeight;  // Kozo

  direction = this.data.reverseTouchDrag ? 1 : -1;
  // Limit touch orientaion to to yaw (y axis).
  yawObject.rotation.y -= deltaY * 0.5 * direction;
  pitchObject.rotation.x -= deltaX * 0.5 * direction;   // Kozo
  this.touchStart = {
    x: evt.touches[0].pageX,
    y: evt.touches[0].pageY
  };
};
