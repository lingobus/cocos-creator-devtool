<template lang="pug">
.main
  .root-container.clear-fix
    el-container
      el-aside
        el-input(
          clearable,
          placeholder="Node name",
          v-model="filterText")
        el-tree(
          ref="tree",
          :data="treeNode",
          node-key="$index",
          :default-expanded-keys="[0]",
          :expand-on-click-node="false",
          :filter-node-method="filterNode",
          @node-click="onClickTreeNode")
      el-main
        el-table(:data="nodeProps", stripe)
          el-table-column(prop="key", label="Property")
          el-table-column(prop="value", label="Value")
</template>

<style lang="styl">
.el-table td
  padding: 2px
</style>

<script>
import log from './utils/logger.js'
import injectedScript from './injectedScript.js'

// element-ui
import 'element-ui/lib/theme-chalk/index.css'
import ElButton from 'element-ui/lib/button'
import ElInput from 'element-ui/lib/input'
import ElTree from 'element-ui/lib/tree'
import ElContainer from 'element-ui/lib/container'
import ElHeader from 'element-ui/lib/header'
import ElAside from 'element-ui/lib/aside'
import ElMain from 'element-ui/lib/main'
import ElFooter from 'element-ui/lib/footer'
import ElTable from 'element-ui/lib/table'
import ElTableColumn from 'element-ui/lib/table-column'

export default {
  name: 'app',
  mixins: [],
  components: {
    ElInput,
    ElButton,
    ElTree,
    ElContainer,
    ElHeader,
    ElAside,
    ElMain,
    ElFooter,
    ElTable,
    ElTableColumn
  },
  data () {
    return {
      treeNode: [],
      nodeProps: [],
      filterText: ''
    }
  },
  mounted () {
    window.app = this;
    this.inspectedWindow = chrome.devtools.inspectedWindow;
    const tabId = chrome.devtools.inspectedWindow.tabId
    const conn = chrome.extension.connect({
      name: '' + tabId
    });

    log(`Connecting to window #${tabId}`);

    conn.onMessage.addListener(message => {
      if (!message) return;
      log(message);
    });

    this.injectScript().then(_ => this.loadTreeNodes());
  },
  watch: {
    filterText (val) {
      this.$refs.tree.filter(val);
    }
  },
  methods: {
    eval(code) {
      return new Promise((resolve, reject) => {
        try {
          this.inspectedWindow.eval(code, resolve);
        } catch (e) {
          log(e);
          reject(e);
        }
      });
    },
    loadTreeNodes () {
      return this.ccdevtool.getTreeNodes().then(treeNode => {
        this.treeNode = [treeNode];
        this.nodeProps = treeNode.props;
      });
    },
    filterNode (value, data) {
      if (!value) return true;
      return data.label.toLowerCase().indexOf(value) >= 0;
    },
    onClickTreeNode (node) {
      this.nodeProps = node.props;
    },
    RefreshTree () {

    },
    injectScript () {
      // inject ccdevtool
      const fn = injectedScript.toString();
      const js = `(${fn})();`
      this.eval(js).then(_ => log('ccdevtool injected!'));

      return this.eval('ccdevtool').then(ccdevtool => {
        this.ccdevtool = {};
        const self = this;
        for (let name in ccdevtool) {
          this.ccdevtool[name] = function (...args) {
            args = JSON.stringify(args).slice(1,-1);
            return self.eval(`ccdevtool.${name}(${args})`);
          }
        }
      })
    }
  }
}
</script>
