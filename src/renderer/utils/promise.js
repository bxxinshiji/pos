
export function promise(promise) {
  let cancel = false
  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(val => {
      cancel ? reject({ cancel }) : resolve(val)
    }).catch(error => {
      cancel ? reject({ cancel }) : reject(error)
    })
  })
  wrappedPromise.cancel = () => {
    cancel = true
  }
  return wrappedPromise
}

