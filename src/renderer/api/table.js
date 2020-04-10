import request from '@/utils/request'

export function getList(params) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/table/list',
    method: 'get',
    params
  })
}
