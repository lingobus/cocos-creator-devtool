<template lang="pug">
.main(@mouseup.capture="onMouseUp", @mousedown.capture="onMouseDown")
  .root-container.clear-fix
    el-header
      img.logo(:src="LogImg")
      h1 Cocos Creator Devtool
      //- el-checkbox(v-model="isShowDebugLayer") Debug Layer
      | &nbsp;
      el-checkbox(v-model="isShowFps") FPS Panel
      | &nbsp;
      el-checkbox(v-model="isShowErudaBtn") Eruda Button
      | &nbsp;
      | &nbsp;
      el-button#refresh-btn(type="primary", size="mini", @click="refreshTree", icon="el-icon-refresh") Refresh
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
          node-key="uuid",
          :default-expanded-keys="[1]",
          :expand-on-click-node="false",
          :filter-node-method="filterNode",
          @node-click="onClickTreeNode")
      el-main
        span
          i.el-icon-setting(style="font-size:24px;margin-right: 1em;vertical-align:middle;color:gray;")
          el-button(type="primary", @click="inspectNode()", icon="el-icon-view") Inspect
        el-table(:data="nodeComps", stripe)
          el-table-column(prop="key", label="Component", :width="200")
          el-table-column(prop="value", label="Value", :width="300")
            template(slot-scope="scope")
              el-button(size="mini", type="normal", @click="inspectComponent(scope.row)", icon="el-icon-view") Inspect
        el-table(:data="nodeProps", stripe)
          el-table-column(prop="key", label="Property", :width="200")
          el-table-column(prop="value", label="Value", :width="300")
            template(slot-scope="scope")
              span(v-if="shouldDisplayText(scope.row)") {{scope.row.value}}
              el-checkbox(v-else-if="shouldDisplayCheckbox(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input-number(v-else-if="shouldDispalyInputNumber(scope.row)", size="mini", :step="inputNumberStep",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-color-picker(v-else-if="shouldDisplayColorPicker(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input(v-else, size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
</template>

<style lang="styl">
.logo
  width: 24px
  height: 24px
  vertical-align: top
  margin-right: 1em
h1
  font-size: 14px
  display: inline
  margin: 0 1em 0 0
.el-table td
  padding: 2px

.main
  input, button
    border-radius: 2px

.el-input--mini .el-input__inner
  height: 24px
  line-height: 24px

.el-input-number--mini
  line-height: 22px
</style>

<script>
import log from '../utils/logger.js'
import injectedScript from '../injectedScript.js'
import LogImg from '../../img/icon-default.png'
// element-ui
import 'element-ui/lib/theme-chalk/index.css'
import { Message } from 'element-ui'
import { Notification } from 'element-ui'
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

const app = {
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
      filterText: '',
      LogImg,
      inputNumberStep: 1
    }
  },
  mounted () {
    if (localStorage.getItem('showTip') !== 'true') {
      Notification.info({
        duration: 0,
        message: 'Tip: You can use Cmd/Ctrl/Shift to alter step when click +/- buttons',
        onClose () {
          localStorage.setItem('showTip', true)
        }
      })
    }
    window.app = this;
    this.inspectedWindow = chrome.devtools.inspectedWindow;
    const tabId = chrome.devtools.inspectedWindow.tabId
    const conn = chrome.extension.connect({
      name: '' + tabId
    });

    conn.postMessage({
      name: 'panelPageCreated',
      tabId
    });

    log(`Connecting to window #${tabId}`);

    conn.onMessage.addListener(message => {
      if (!message) return;
      log(message);
      if (message.type === 'inspectedWinReloaded') {
        this.init();
      }
    });

    this.init();
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
    init () {
      this.injectScript().then(_ => this.loadTreeNodes());
    },
    eval(code) {
      return new Promise((resolve, reject) => {
        try {
          this.inspectedWindow.eval(code, res => {
            if (res) log(res);
            resolve(res);
          });
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
        if (!treeNode) {
          console.error('Get Tree Nodes information failed!');
          Message.warning({
            message: 'You may need to click the refresh button to reload the node tree!'
          });
        } else {
          this.treeNode = [treeNode];
          this.nodeProps = treeNode.props;
          this.nodeComps = treeNode.comps;
        }
        if (!this.isShowDebugLayer) this.ccdevtool.hideDebugLayer();
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
    onMouseDown (e) {
      var step = 1;
      if (e.metaKey || e.ctrlKey) {
        step = 10;
      }
      if (e.altKey) {
        step = 100;
      }
      if (e.shiftKey) {
        step = 0.1;
      }
      this.inputNumberStep = step
    },
    onMouseUp (e) {
      this.inputNumberStep = 1;
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


export default app;
</script>
