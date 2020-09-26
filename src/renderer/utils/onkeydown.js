
const onkeydown = {
  key: '',
  keyCode: 0,
  string: '',
  register(reg, onkey, hander) {
    document.onkeydown = (event) => {
      onkeydown.key = event.key
      onkeydown.keyCode = event.keyCode
      // 记忆字符串 只能记录长度为1的按键
      if (onkeydown.key.length === 1 && reg.test(onkeydown.key)) {
        onkeydown.string = onkeydown.string + onkeydown.key
      }
      // 执行并清空记忆
      if (onkeydown.key === onkey) {
        hander()
        onkeydown.string = ''
      }
    }
  },
  unregister() {
    document.onkeydown = undefined
  },
  isScanner(onkey, hander) { // 判断指定按键是否是扫码输入
    let timeStamp = 0
    document.onkeydown = (event) => {
      timeStamp = event.timeStamp
    }
    document.onkeyup = (event) => {
      if (event.key === onkey) {
        hander(event.timeStamp - timeStamp < 30)
      }
    }
  }
}
export default onkeydown
