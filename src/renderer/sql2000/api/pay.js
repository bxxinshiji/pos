import paySQL2000 from '@/sql2000/model/pay'
import sequelize from '@/model/pay'
const pay = sequelize.models.pay

export function SyncPay() {
  return new Promise((resolve, reject) => {
    paySQL2000.All().then(async response => {
      if (response) {
        const pays = []
        response.forEach(item => {
          var type = 'pay'
          switch (item.type) {
            case '0':
              type = 'cashPay'
              break
            case '1':
              type = 'cardPay'
              break
            case '4':
              type = 'remoteCardPay'
              break
            case '6':
              type = 'scanPay'
              break
          }
          pays.push({
            id: parseInt(item.code),
            name: item.name,
            type: type
          })
        })
        if (pays.length > 0) {
          // 重新构建数据库文件
          await sequelize.sync({
            force: true
          })
          pay.bulkCreate(pays).then(() => {
            resolve()
          }).catch(error => {
            console.log(error)
            reject(new Error('插入支付方式失败'))
          })
        }
      }
    }).catch(error => {
      console.log(error)
      reject(new Error('查询支付方式失败'))
    })
  })
}
