export default function () {
  const SerializeProps = [
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
    'skewX', 'skewY'
  ];

  const DebugLayerCss = `
    .debug-layer.show-all .debug-box,
    .debug-box:hover,
    .debug-box.selected {
      outline: 1px dashed rgba(255,0,0,.8);
    }`;

  const NodesCache = {};
  const DebugLayerId = 'cc-devtool-debug'

  const ccdevtool = window.ccdevtool = {
    NodesCache,
    getTreeNodes () {
      const scene = cc.director.getScene();
      var ret = [];
      try {
        ret = this.serialize(scene);
      } catch (e) {
        log(e)
      }
      return ret;
    },
    postMessage (type, data) {
      window.postMessage({type, data}, '*');
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
      const style = document.createElement('style');
      style.innerHTML = DebugLayerCss;
      document.body.appendChild(style);

    },
    createDebugBox (n, zIndex) {
      const nodeInfo = NodesCache[n.uuid];
      if (!nodeInfo || !nodeInfo.box) return;
      var div = document.getElementById(n.uuid);
      if (div) {
        div.parentNode.removeChild(div);
      }

      const box = nodeInfo.box;
      div = document.createElement('div');
      n.debugBox = div;
      div.id = n.uuid;
      div.classList.add('cc-devtool')
      div.classList.add('debug-box')

      const s = div.style;
      s.position = 'absolute';
      s.width = box.width + 'px';
      s.height = box.height + 'px'
      s.bottom = box.bottom + 'px';
      s.left = box.left + 'px';
      // s.outline = '1px solid #eee';
      s.outlineOffset = '0px';
      s.zIndex = zIndex;
      s.innerText = nodeInfo.label
      div.dataset.name = nodeInfo.label;

      const debugLayer = document.getElementById(DebugLayerId)
      debugLayer.appendChild(div);
      div.onclick = function () {
        console.log(n);
      };
    },
    selectNode (uuid) {
      const prevBox = document.querySelector(`#${DebugLayerId} .debug-box.selected`);
      if (prevBox) {
        prevBox.classList.remove('selected');
      }
      const box = document.getElementById(uuid);
      box.classList.add('selected');
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

      const ret = NodesCache[n.uuid] = {
        uuid: n.uuid,
        label: n.name,
        props: kv,
        box,
        children: n.children.map(it => ccdevtool.serialize(it, zIndex + 1))
      }
      if (n.parent !== cc.director.getScene()) this.createDebugBox(n, zIndex);
      return ret;
    }
  };
}
