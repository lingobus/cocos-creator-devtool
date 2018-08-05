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

  const NodesCache = {};

  const ccdevtool = window.ccdevtool = {
    NodesCache,
    getTreeNodes () {
      const scene = cc.director.getScene();
      return this.serialize(scene);
    },
    postMessage (type, data) {
      window.postMessage({type, data}, '*');
    },
    createDebugLayer () {
      const debugLayer = document.createElement('div');
      debugLayer.id = 'cc-devtool-debug';
      const s = debugLayer.style;
      s.position = 'absolute';
      s.top = s.bottom = s.left = s.right = 0;

      const ctn = document.querySelector('#Cocos2dGameContainer');
      ctn.position = 'relative';
      ctn.appendChild(debugLayer);
    },
    serialize: function serialize (n) {
      const kv = SerializeProps.reduce((result, key) => {
        var value = n[key];
        if (key === 'color') value = value.toCSS();
        result.push({key, value});
        return result;
      }, []);
      const box = n.convertToNodeSpaceAR(cc.v2(0, 0));
      box.width = n.width;
      box.height = n.height;
      kv.box = box;
      return NodesCache[n.uuid] = {
        label: n.name,
        props: kv,
        children: n.children.map(serialize)
      }
    }
  };
}
