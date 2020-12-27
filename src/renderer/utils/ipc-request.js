import axios from 'axios'
// create an axios instance
const service = axios.create({
  baseURL: 'http://localhost:3000/', // url = base url + request url
  timeout: 5 * 60 * 1000, // request timeout
  error: false // 默认开启错误提示
})

export default service
