function guessDuration(msg) {
  const len = String(msg).length
  if (len > 0 && len <= 10) {
    return 1000
  } else if (len > 10 && len <= 20) {
    return 2000
  } else if (len > 20 && len <= 35) {
    return 3000
  } else if (len > 35 && len <= 50) {
    return 4000
  } else if (len > 50) {
    return 5000
  }
}
import Message from 'element-ui/lib/message'
import Alert from 'components/alert/_index.js'
import MessageBox from 'element-ui/lib/message-box'

const noop = _ => {}

function makeMethod(Impl, type) {
  return function(msg, opt = {}) {
    const duration = opt.duration || guessDuration(msg)
    return new Promise((resolve, reject) => {
      opt.onClose = _ => resolve()
      return Impl(Object.assign({
        duration: duration,
        message: String(msg),
        type: type,
        showClose: true
      }, opt))
    })
  }
}
const mixin = {
  methods: {}
}
'Success,Warning,Error,Info'.split(',').forEach((type) => {
  mixin.methods[`$alert${type}`] = makeMethod(Alert, type = type.toLowerCase())
  if (type === 'info') return
  mixin.methods[`$${type}`] = makeMethod(Message, type)
})
mixin.methods.$confirm = (msg, type = 'info', opts = {}) => {
  opts.type = type
  return MessageBox.confirm(msg, opts)
}
export default mixin
