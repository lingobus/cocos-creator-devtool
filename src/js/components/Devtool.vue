<template lang="pug">
.main
  .root-container.clear-fix
    el-header
      //- el-checkbox(v-model="isShowDebugLayer") Debug Layer
      | &nbsp;
      el-checkbox(v-model="isShowFps") FPS Panel
      | &nbsp;
      el-checkbox(v-model="isShowErudaBtn") Eruda Button
      | &nbsp;
      | &nbsp;
      el-button(type="primary", size="mini", @click="refreshTree") Refresh
    el-container
      el-aside
        el-input(
          size="mini",
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
        el-button(type="primary", @click="inspectNode()") Inspect
        el-table(:data="nodeComps", stripe)
          el-table-column(prop="key", label="Component", :width="200")
          el-table-column(prop="value", label="Value", :width="300")
            template(slot-scope="scope")
              el-button(size="mini", type="normal", @click="inspectComponent(scope.row)") Inspect
        el-table(:data="nodeProps", stripe)
          el-table-column(prop="key", label="Property", :width="200")
          el-table-column(prop="value", label="Value", :width="300")
            template(slot-scope="scope")
              span(v-if="shouldDisplayText(scope.row)") {{scope.row.value}}
              el-checkbox(v-else-if="shouldDisplayCheckbox(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input-number(v-else-if="shouldDispalyInputNumber(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-color-picker(v-else-if="shouldDisplayColorPicker(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input(v-else, size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
</template>

<style lang="styl">
.el-table td
  padding: 2px

.el-input--mini .el-input__inner
  height: 24px
  line-height: 24px

.el-input-number--mini
  line-height: 22px
</style>

<script>
import log from '../utils/logger.js'
import injectedScript from '../injectedScript.js'

// element-ui
import 'element-ui/lib/theme-chalk/index.css'
import ElButton from 'element-ui/lib/button'
import ElCheckbox from 'element-ui/lib/checkbox'
import ElInput from 'element-ui/lib/input'
import ElInputNumber from 'element-ui/lib/input-number'
import ElColorPicker from 'element-ui/lib/color-picker'
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
    ElInputNumber,
    ElColorPicker,
    ElButton,
    ElCheckbox,
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
      isShowDebugLayer: false,
      isShowFps: true,
      isShowErudaBtn: true,
      treeNode: [],
      nodeProps: [],
      nodeComps: [],
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
    },
    isShowDebugLayer (val) {
      this.ccdevtool.toggleElement('#cc-devtool-debug', val);
      if (val) this.ccdevtool.getTreeNodes();
    },
    isShowFps (val) {
      this.ccdevtool.toggleElement('#fps', val);
    },
    isShowErudaBtn (val) {
      this.ccdevtool.toggleElement('.eruda-entry-btn', val);
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
    shouldDisplayText (row) {
      return ['uuid', 'name'].indexOf(row.key) >= 0;
    },
    shouldDisplayCheckbox (row) {
      return row.key === 'active'
    },
    shouldDispalyInputNumber (row) {
      return [
        'x','y','width','height',
        'zIndex','opacity',
        'anchorX','anchorY',
        'rotation', 'rotationX','rotationY',
        'scale','scaleX','scaleY',
        'skewX', 'skewY'].indexOf(row.key) >= 0;
    },
    shouldDisplayColorPicker (row) {
      return row.key === 'color';
    },
    loadTreeNodes () {
      return this.ccdevtool.getTreeNodes().then(treeNode => {
        this.ccdevtool.createDebugLayer();
        if (!this.isShowDebugLayer) this.ccdevtool.hideDebugLayer();
        if (!treeNode) {
          throw new Error('Get Tree Nodes information failed!');
        } else {
          this.treeNode = [treeNode];
          this.nodeProps = treeNode.props;
          this.nodeComps = treeNode.comps;
        }
      });
    },
    filterNode (value, data) {
      if (!value) return true;
      return data.label.toLowerCase().indexOf(value) >= 0;
    },
    onClickTreeNode (node) {
      this.selectedNode = node;
      this.nodeProps = node.props;
      this.nodeComps = node.comps;
      this.ccdevtool.selectNode(node.uuid);
    },
    onPropChange (row) {
      if (!this.selectedNode) return;
      this.ccdevtool.updateNode(this.selectedNode.uuid, row.key, row.value);
    },
    onHidden () {
      this.ccdevtool.hideDebugLayer();
    },
    refreshTree () {
      this.loadTreeNodes();
    },
    inspectNode () {
      if (this.selectedNode) this.ccdevtool.inspectNode(this.selectedNode.uuid)
    },
    inspectComponent (row) {
      this.ccdevtool.inspectComponent(row.uuid, row.index);
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
