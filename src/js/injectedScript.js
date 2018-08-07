export default function () {
  const SerializeProps = [
    'active',
    //identity
    'uuid', 'name',
    //position, dimesion
    'x', 'y', 'width', 'height', 'zIndex',
    //prepresentation
    'color', 'opacity',
    //transformation
    'anchorX', 'anchorY',
    'rotation', 'rotationX', 'rotationY',
    'scale', 'scaleX', 'scaleY',
    // 'skewX', 'skewY'
  ];

  const DebugLayerCss = `
    .debug-layer.show-all .debug-box,
    .debug-box:hover,
    .debug-box.selected {
      outline: 1px dashed rgba(255,0,0,.8);
    }
    #cc-devtool-debug {
      background-color: rgba(0,0,0,0.1);
    }`;

  const noop = new Function();
  const NodesCache = {};
  const NodesCacheData = {}
  const DebugLayerId = 'cc-devtool-debug';
  const DebugLayerStyleId = 'cc-devtool-style';

  const ccdevtool = window.ccdevtool = {
    NodesCacheData,
    getTreeNodes () {
      const scene = cc.director.getScene();
      var ret = [];
      const bak = cc.error;
      try {
        cc.error = noop; // suppress deprecation error
        ret = this.serialize(scene);
      } catch (e) {
        log(e)
      } finally {
        cc.error = bak;
      }
      return ret;
    },
    postMessage (type, data) {
      window.postMessage({type, data}, '*');
    },
    toggleElement (selector, val) {
      var ele = document.querySelector(selector);
      if (!ele) return false;
      ele.style.display = val ? '' : 'none';
    },
    hideDebugLayer () {
      this.toggleElement(`#${DebugLayerId}`, false);
    },
    createDebugLayer () {
      var debugLayer = document.getElementById(DebugLayerId);
      if (debugLayer) {
        debugLayer.parentNode.removeChild(debugLayer);
      }
      debugLayer = document.createElement('div');
      debugLayer.id = DebugLayerId;
      debugLayer.classList.add('cc-devtool');
      debugLayer.classList.add('debug-layer');
      const s = debugLayer.style;
      s.position = 'absolute';
      s.top = s.bottom = s.left = s.right = 0;

      const ctn = document.querySelector('#Cocos2dGameContainer');
      ctn.position = 'relative';
      ctn.appendChild(debugLayer);

      // style
      var style = document.getElementById(DebugLayerStyleId);
      if (!style) style = document.createElement('style');
      style.id = DebugLayerStyleId
      style.innerHTML = DebugLayerCss;
      document.body.appendChild(style);
    },
    createDebugBox (n, zIndex) {
      const nodeInfo = NodesCacheData[n.uuid];
      if (!nodeInfo || !nodeInfo.box) return;
      var div = document.getElementById(n.uuid);
      if (div) {
        div.parentNode.removeChild(div);
      }

      // const canvas = document.getElementById('#GameCanvas');
      // const rect = canvas.getBoundingClientRect();
      // const ccCanvas = cc.find('Canvas').getComponnet(cc.Canvas);
      // const resolution = ccCanvas.designResolution;
      // const hratio = resolution.width / 2 / rect.width;
      // const vratio = resolution.height / 2 / rect.height;
      const hratio = 1, vratio = 1;

      const box = nodeInfo.box;
      div = document.createElement('div');
      n.debugBox = div;
      div.id = n.uuid;
      div.classList.add('cc-devtool')
      div.classList.add('debug-box')

      const s = div.style;
      s.position = 'absolute';
      s.width = (box.width / hratio) + 'px';
      s.height = (box.height / vratio) + 'px'
      s.bottom = (box.bottom / vratio) + 'px';
      s.left = (box.left / hratio) + 'px';
      // s.outline = '1px solid #eee';
      s.outlineOffset = '0px';
      s.zIndex = zIndex;
      s.innerText = nodeInfo.label
      div.dataset.name = nodeInfo.label;

      const debugLayer = document.getElementById(DebugLayerId)
      debugLayer.appendChild(div);
    },
    selectNode (uuid) {
      const prevBoxes = document.querySelectorAll(`#${DebugLayerId} .debug-box.selected`);
      if (prevBoxes.length) {
        prevBoxes.forEach(it => it.classList.remove('selected'));
      }
      const box = document.getElementById(uuid);
      box.classList.add('selected');
    },
    updateNode (uuid, key, value) {
      const node = NodesCache[uuid];
      const nodeInfo = NodesCacheData[uuid];
      if (!node || !nodeInfo) return;
      const prop = nodeInfo.props.find(p => p.key === key);
      if (prop) prop.value = value;
      if (key === 'color') {
        let comp = hexToRgb(value);
        if (comp) {
          return node[key] = new cc.Color(comp.r, comp.g, comp.b);
        }
      }
      node[key] = value;
    },
    inspectComponent (uuid, index) {
      console.log(NodesCache[uuid]._components[index]);
    },
    inspectNode (uuid) {
      console.log(NodesCache[uuid]);
    },
    serialize: function (n, zIndex = 0) {
      const kv = SerializeProps.reduce((result, key) => {
        var value = n[key];
        if (key === 'color') value = value.toCSS();
        result.push({key, value});
        return result;
      }, []);

      // box for make debugging div box
      var box = null;
      if (n.parent) {
        box = n.getBoundingBoxToWorld();
        box.left = box.x / 2;
        box.bottom = box.y / 2;
        box.width = n.width / 2;
        box.height = n.height / 2;
      }
      /**
       * cache node in some place other than NodesCacheData
       * pass node reference to devtool will cause `Object reference chain is too long` error
       */
      NodesCache[n.uuid] = n;

      const ret = NodesCacheData[n.uuid] = {
        // node: n,
        uuid: n.uuid,
        label: n.name,
        props: kv,
        comps: getComponentsData(n),
        box,
        children: n.children.map(it => ccdevtool.serialize(it, zIndex + 1))
      }
      if (n.parent !== cc.director.getScene()) this.createDebugBox(n, zIndex);
      return ret;
    }
  };

  function getComponentsData (n) {
    const comps = n._components;
    return comps.reduce((result, comp, i) => {
      result.push({
        key: comp.constructor.name,
        index: i,
        uuid: n.uuid,
        value: '<<inspect>>'
      })
      return result;
    }, [])
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  }
}
