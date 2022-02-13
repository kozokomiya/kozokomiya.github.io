<template>
  <div class="vc-main-1">
    <h1>Hello</h1>
    <p>{{message}}</p>
  </div>
</template>

<script>
module.exports = {
  data: function() {
    return {
      message: 'こんにちは'
    }
  }
}
</script>

<style>
.vc-main-1 h1{
    font-size: 3.5rem;
}
.vc-main-1 p{
    font-weight: bold;
}
</style>