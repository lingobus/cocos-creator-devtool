<template lang="pug">
.cc-devtool-popup
  p(v-if="isCocosGame") Cocos Creator game is detected on this page. Open DevTools and look for the 'Cocos Creator Devtool'.
  p(v-else) Cocos Creator game not detected!
</template>

<style lang="styl">
p
  margin: 1em
  min-width: 20em
  text-align: center
</style>

<script>
  export default {
    name: 'CocosCreatorDevtollPopup',
    components: {},
    data () {
      return {
        isCocosGame: false
      }
    },
    mounted () {

    },
    methods: {
    }
  }
</script>
