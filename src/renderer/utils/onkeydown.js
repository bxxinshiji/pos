
const onkeydown = {
  key: '',
  keyCode: 0,
  string: '',
  register(reg, onkey, hander) {
    const listener = (event) => {
      onkeydown.key = event.key
      onkeydown.keyCode = event.keyCode
      // 记忆字符串 只能记录长度为1的按键
      if (onkeydown.key.length === 1 && reg.test(onkeydown.key)) {
        onkeydown.string = onkeydown.string + onkeydown.key
      }
      // 执行并清空记忆
      if (onkeydown.key === onkey) {
        hander(event)
        onkeydown.string = ''
      }
    }
    document.onkeydown = listener
    // 只清理本次监听，旧支付页重复关闭不影响新支付页。
    return () => {
      if (document.onkeydown === listener) document.onkeydown = undefined
    }
  },
  unregister() {
    document.onkeydown = undefined
  },
  isScanner(onkey, hander) { // 判断指定按键是否是扫码输入
    let timeStamp = 0
    document.onkeyup = (event) => {
      if (event.key === onkey) {
        hander(event.timeStamp - timeStamp < 10)
      }
      timeStamp = event.timeStamp // 记录最后一次按键时间
    }
  }
}
export default onkeydown
