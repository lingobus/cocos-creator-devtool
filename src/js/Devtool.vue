<template lang="pug">
.main
  .root-container.clear-fix
    p
      center
        h1 Cocos Creator Devtool
</template>
<style lang="styl">
div h1
  color: gray
  margin: 5em auto
</style>
<script>
  export default {
    name: 'app',
    mixins: [],
    components: {},
    mounted () {
      this.conn = chrome.extension.connect({
        name: '' + chrome.devtools.inspectedWindow.tabId
      });
      this.conn.onMessage.addListener(message => {
        if (!message) return;
        console.log('[cc-devtool]:', message);
      });
    },
    methods: {
    }
  }
</script>
