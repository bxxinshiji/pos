const Sequelize = require('sequelize')
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import store from '@/store'
const posPD = {
  CreateTable() {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`
        DROP TABLE PosPDPOS0011
        CREATE TABLE PosPDPOS0011 ( XsDate datetime null,XsTime varchar (8) null,JzDate datetime null,HzDate datetime null,SaleItemNo varchar (14) null,UserCode varchar (8) null,CurrDate varchar (8) null,BcCode varchar (8) null,ClerkCode varchar (8) null,PageNo varchar (8) null,LnNo varchar (8) null,PluCode varchar (13) null,BarCode varchar (13) null,PluName varchar (40) null,PluAbbr varchar (20) null,DepCode varchar (8) null,ClsCode varchar (10) null,SupCode varchar (10) null,BrandCode varchar (8) null,Unit varchar (8) null,Spec varchar (20) null,TaxRate varchar (8) null,SPrice float null,XsCount float null,YsAmt float null,MgType varchar (1) null,IsDecimal varchar (1) null,Tag varchar (1) null,IsGenDno varchar (1) null,BakData1 varchar (20) null,BakData2 varchar (20) null,BakData3 varchar (20) null ) 
      `,
      { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        response.forEach(items => {
        })
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 上传盘点数据
  Upload(datas) {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`select ZfCode as code, ZfName as name, ZfType as type from tXsZfKind`,
        { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        response.forEach(items => {
        })
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default posPD
