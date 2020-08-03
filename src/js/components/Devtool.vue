<template lang="pug">
.main(@mouseup.capture="onMouseUp", @mousedown.capture="onMouseDown")
  .root-container.clear-fix
    el-header
      img.logo(:src="LogImg")
      h1
        a(style="color:black;text-decoration:none;"
          target="_blank" href="https://chrome.google.com/webstore/detail/cocos-creator-devtool/cnmkiolbnmjlhdkabcgobbgdomhhdnho") Cocos Creator Devtool
      //- el-checkbox(v-model="isShowDebugLayer") Debug Layer
      | &nbsp;
      el-checkbox(v-model="isShowFps") FPS Panel
      | &nbsp;
      el-checkbox(v-show="hasEruda" v-model="isShowErudaBtn") Eruda Button
      | &nbsp;
      | &nbsp;
      el-button#refresh-btn(type="primary", size="mini", @click="refreshTree", icon="el-icon-refresh") Refresh Tree
      | &nbsp;
      el-button(type="primary", @click="reloadScene()", icon="el-icon-refresh", size="mini") Reload Scene
      | &nbsp;
      el-button#compile-btn(type="primary", size="mini", @click="compile", icon="el-icon-setting") Compile
      | &nbsp;
      el-button#compile-btn(type="primary", size="mini", @click="reload", icon="el-icon-refresh") Reload Extension
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
          node-key="id",
          :highlight-current="true",
          :default-expanded-keys="[1, 2]",
          :expand-on-click-node="false",
          :filter-node-method="filterNode",
          @node-click="onClickTreeNode")
      el-main
        div(style="margin-bottom:1em;")
          i.el-icon-setting(style="font-size:24px;margin-right: 1em;vertical-align:middle;color:gray;")
          el-button(type="primary", @click="inspectNode()", icon="el-icon-view", size="mini") Inspect
        //- el-table(:data="nodeComps", stripe, empty-text="No Data")
        //-   el-table-column(prop="key", label="Component", :width="200")
        //-   el-table-column(prop="value", label="", :width="300")
        //-     template(slot-scope="scope")
        //-       el-button(size="mini", type="normal", @click="inspectComponent(scope.row)", icon="el-icon-view") Inspect

        h2 Properties
        el-table(:data="nodeProps", stripe)
          el-table-column(prop="key", label="Property", :width="200")
          el-table-column(prop="value", label="Value", :width="300")
            template(slot-scope="scope")
              span(v-if="shouldDisplayText(scope.row)") {{scope.row.value}}
              el-switch(v-else-if="shouldDisplayCheckbox(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input-number(v-else-if="shouldDispalyInputNumber(scope.row)", size="mini", :step="inputNumberStep",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-color-picker(v-else-if="shouldDisplayColorPicker(scope.row)", size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")
              el-input(v-else, size="mini",
                v-model="scope.row.value", @change="onPropChange(scope.row)")

        h2 Components
        el-collapse(style="display:inline-block")
          el-collapse-item(v-for="(comp, index) in nodeComps" v-if="nodeComps" :key="index" :title="comp.key" style="width:500px")
            table.el-table.comp-table.el-table__body-wrapper.is-scrolling-none
              colgroup
                col(width="200")
                col(width="300")
              thead
                tr.el-table__row
                  th
                  th.inspect-btn
                    el-button(size="mini", type="normal", @click="inspectComponent(comp)", icon="el-icon-view") Inspect
              tbody
                tr.el-table__row(v-for="prop in comp.props")
                  td(v-text="prop.name")
                  td
                    component(v-if="prop.type" :is="prop.type" :readonly="true" :disabled="true" :data-raw-type="prop.rawType" v-model="prop.value" size="mini")
                    span(v-else-if="!prop.value") -
                    span(v-else v-text="prop.value")

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

.comp-table
  border-collapse: collapse
  .inspect-btn
    text-align: right
  th, td
    padding: .5em 1em !important

.el-table
  margin-bottom: 1em
  &:before
    display: none
  td
    padding: 2px
  th
    background-color: #efefef

.main
  input, button
    border-radius: 2px

.el-button--primary, .el-checkbox__inner
  background-color: #4285F4
  border-color: #4285F4


.el-input--mini .el-input__inner
  height: 24px
  line-height: 24px

.el-input-number--mini
  line-height: 22px

.el-tree-node.is-current
  position: relative
  &:before
    content: '$n0'
    position: absolute
    top: 0.5em
    right: 4px
    color: #b7b7b7
</style>

<script>
import log from '../utils/logger.js'
import injectedScript from '../injectedScript.js'
import LogImg from '../../img/48.png'
// element-ui
import 'element-ui/lib/theme-chalk/index.css'
import { Message } from 'element-ui'
import { Notification } from 'element-ui'
import ElButton from 'element-ui/lib/button'
import ElCheckbox from 'element-ui/lib/checkbox'
import ElSwitch from 'element-ui/lib/switch'
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
import ElCollapse from 'element-ui/lib/collapse'
import ElCollapseItem from 'element-ui/lib/collapse-item'

// locale
import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
locale.use(lang)

const app = {
  name: 'app',
  mixins: [],
  components: {
    ElInput,
    ElInputNumber,
    ElColorPicker,
    ElButton,
    ElCheckbox,
    ElSwitch,
    ElTree,
    ElContainer,
    ElHeader,
    ElAside,
    ElMain,
    ElFooter,
    ElTable,
    ElTableColumn,
    ElCollapse,
    ElCollapseItem
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

    const self = this;
    function setSelectedNodeProp(newProps) {
      for (let k in newProps) {
        if (k === 'uuid') continue;
        const kv = self.selectedNode.props.find(prop => prop.key === k);
        if (kv) kv.value = newProps[k];
      }
    }
    let lastMessage;
    function checkMessage(message) {
      if (!lastMessage || !message.data.uuid) return true;
      if (message.type !== lastMessage.type) return true;
      for (var key in message.data) {
        if (message.data[key] !== lastMessage.data[key]) return true;
      }
      return false;
    }
    conn.onMessage.addListener(message => {
      if (!message || !checkMessage(message)) return;
      log(message);
      switch (message.type) {
        case ':inspectedWinReloaded':
          location.reload();
          break;
        case 'game_on_show':
        case ':loadScene':
          this.init();
          break;
        case 'position-changed':
        case 'size-changed':
        case 'scale-changed':
        case 'rotation-changed':
        case 'anchor-changed':
        case 'active-in-hierarchy-changed':
        case 'sibling-order-changed':
        case 'opacity-changed':
          if (self.selectedNode && message.data.uuid ===  self.selectedNode.uuid) {
            setSelectedNodeProp(message.data);
          }
          break;
        case 'color-changed':
          if (self.selectedNode && message.data.uuid ===  self.selectedNode.uuid) {
              const color = message.data.color;
              const r = color._val & 0x000000ff;
              const g = (color._val & 0x0000ff00) >> 8;
              const b = (color._val & 0x00ff0000) >> 16;
              const a = (color._val & 0xff000000) >>> 24;
              setSelectedNodeProp({
                color: `rgba(${r},${g},${b},${a})`
              });
            }
          break;
      }
      lastMessage = message;
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
      this.ccdevtool.toggleNode('PROFILER-NODE', val);
    },
    hasEruda () {
      return this.ccdevtool.hasElement('.eruda-entry-btn');
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
          log(code);
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
    reload() {
      location.reload();
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
    compile() {
      this.ccdevtool.compile();
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
    reloadScene () {
      this.ccdevtool.reloadScene()
    },
    inspectComponent (row) {
      this.ccdevtool.inspectComponent(row.uuid, row.index);
    },
    injectScript () {
      // inject ccdevtool
      const fn = injectedScript.toString();
      const js = `(${fn})();`
      this.eval(js).then(_ => log('ccdevtool injected!'));

      var tryTimes = 60;
      const vm = this;
      const doEval = function () {
        vm.eval('ccdevtool').then(ccdevtool => {
          vm.ccdevtool = {};
          for (let name in ccdevtool) {
            vm.ccdevtool[name] = function (...args) {
              args = JSON.stringify(args).slice(1,-1);
              return vm.eval(`ccdevtool.${name}(${args})`);
            }
          }
        });
      };

      return new Promise((rs,rj) => {
        var timer = setInterval(() => {
          doEval();
          tryTimes -= 1;
          if (tryTimes <= 0 || (vm.ccdevtool && Object.keys(vm.ccdevtool).length > 0)) {
            clearInterval(timer);
            rs();
          }
        }, 1000);
      });
    }
  }
}


export default app;
</script>
