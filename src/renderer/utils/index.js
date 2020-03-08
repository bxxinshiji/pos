/**
 * Created by PanJiaChen on 16/11/18.
 */

import path from 'path'
const fs = require('fs')
import { remote } from 'electron'

/**
 * Parse the time to string
 * @param {(Object|string|number)} time
 * @param {string} cFormat
 * @returns {string}
 */
export function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string') && (/^[0-9]+$/.test(time))) {
      time = parseInt(time)
    }
    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }

  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    n: date.getMilliseconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|n|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}

/**
 * @param {number} time
 * @param {string} option
 * @returns {string}
 */
export function formatTime(time, option) {
  if (('' + time).length === 10) {
    time = parseInt(time) * 1000
  } else {
    time = +time
  }
  const d = new Date(time)
  const now = Date.now()

  const diff = (now - d) / 1000

  if (diff < 30) {
    return '刚刚'
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前'
  } else if (diff < 3600 * 24 * 2) {
    return '1天前'
  }
  if (option) {
    return parseTime(time, option)
  } else {
    return (
      d.getMonth() +
      1 +
      '月' +
      d.getDate() +
      '日' +
      d.getHours() +
      '时' +
      d.getMinutes() +
      '分'
    )
  }
}

/**
 * @param {string} url
 * @returns {Object}
 */
export function param2Obj(url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  return JSON.parse(
    '{"' +
      decodeURIComponent(search)
        .replace(/"/g, '\\"')
        .replace(/&/g, '","')
        .replace(/=/g, '":"')
        .replace(/\+/g, ' ') +
      '"}'
  )
}
/**
 * 删除左右两端的空格
 * @param {string} url
 * @returns {Object}
 */
export function trim(str) {
  return str.replace(/(^\s*)|(\s*$)/g, '')
}

/**
 * 返回程序根目录
 * @param {string} paths 支持扩展目录 自动创建扩展目录
 * @returns {Object}
 */
export function exePath(paths = '') {
  // 递归创建目录 同步方法
  function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  }
  const dataPath = path.join(remote.app.getPath('exe'), '../', paths)
  mkdirsSync(dataPath, 777)
  return dataPath
}
/**
 * 数字前面自动补零
 * @param {int} num 数字
 * @param {int} length 总长度
 * @returns {string}
 */
export function addPreZero(num, length) {
  return (Array(length).join('0') + num).slice(-length)
}
/**
	 * 生成指定长度字符串，不足位右补空格
   * 支持中文 中文两个字符计算
	 * @param str
	 * @param length
	 * @return
	 */
export function formatStr(str, length, substr = true) {
  str = String(str)
  length = Number(length)
  const getBLen = function(str) { // 计算中文字符长度
    if (str == null) return 0
    if (typeof str !== 'string') {
      str += ''
    }
    return str.replace(/[\u4E00-\u9FA5]/g, '01').length
  }
  var strLen
  if (str == null) {
    strLen = 0
  } else {
    strLen = getBLen(str)
  }

  if (strLen === length) {
    return str
  } else if (strLen < length) {
    var temp = length - strLen
    var tem = ''
    for (var i = 0; i < temp; i++) {
      tem = tem + ' '
    }
    return str + tem
  } else {
    var sub = function(str, n) {
      if (substr) {
        var r = /[\u4E00-\u9FA5]/g
        if (str.replace(r, 'mm').length <= n) { return str }
        var m = Math.floor(n / 2)
        for (var i = m; i < str.length; i++) {
          if (str.substr(0, i).replace(r, 'mm').length >= n) {
            return str.substr(0, i)
          }
        }
      }
      return str
    }
    return sub(str, length)
  }
}

/**
 * 分页
 * @param {int} Limit 每页数量
 * @param {int} Page 页码
 * @returns {string}
 */
export function pagination(Limit, Page) {
  Limit = Number(Limit)
  Page = Number(Page)
  const pagination = {
    limit: 10,
    offset: -1
  }
  if (Limit > 0) {
    pagination.limit = Limit
  }
  if (Page > 1) {
    pagination.offset = (Page - 1) * pagination.limit
  }
  return pagination
}
