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
  ]
  const ccdevtool = window.ccdevtool = {
    getTreeNodes () {
      const scene = cc.director.getScene();
      return this.serialize(scene);
    },
    postMessage (type, data) {
      window.postMessage({type, data}, '*');
    },
    serialize: function serialize (n) {
      const kv = SerializeProps.reduce((result, key) => {
        var value = n[key];
        if (key === 'color') value = value.toCSS();
        result.push({key, value});
        return result;
      }, []);
      return {
        label: n.name,
        props: kv,
        children: n.children.map(serialize)
      }
    }
  };
}