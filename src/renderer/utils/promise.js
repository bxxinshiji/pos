
export function promise(promise, time = 0) {
  let cancel = false
  const wrappedPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (cancel) { // 取消直接返回错误
        reject({ cancel })
      }
      promise.then(val => {
        cancel ? reject({ cancel }) : resolve(val)
      }).catch(error => {
        cancel ? reject({ cancel }) : reject(error)
      })
    }, time) // 延时执行
  })
  wrappedPromise.cancel = () => {
    cancel = true
  }
  return wrappedPromise
}

