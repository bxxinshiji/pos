<template>
    <el-form :inline=true :model="ruleForm" ref="ruleForm" label-width="100px">
        <el-form-item label="开关" prop="switch">
          <el-switch v-model="ruleForm.switch"></el-switch>
        </el-form-item>
        <el-form-item label="类型" prop="device">
          <el-select v-model="ruleForm.device" placeholder="请选择">
            <el-option
              label="USB"
              value="USB">
            </el-option>
            <el-option
              label="Serial"
              value="serial">
            </el-option>
            <!-- <el-option
              label="Bluetooth"
              value="Bluetooth">
            </el-option> -->
            <el-option
              label="Network"
              value="Network">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="打印模板" prop="data">
            <el-input 
            v-model="ruleForm.template"
            type="textarea"
            :autosize="{ minRows: 12, maxRows: 18}"
            style="width:362px"
            ></el-input>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="submitPrint()">测试打印</el-button>
            <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
            <el-button @click="resetForm('ruleForm')">重置</el-button>
        </el-form-item>
        <el-collapse  accordion>
          <el-collapse-item title="默认文本 text " name="1">
            <div>变量:</div>
            <div>销售状态 {<span>{</span>stuats}} </div>
            <div>订单金额 {<span>{</span>total}} </div>
            <div>收款员ID {<span>{</span>userId}} </div>
            <div>终端ID {<span>{</span>terminal}} </div>
            <div>订单编号 {<span>{</span>orderNo}} </div>
            <div>订单时间 {<span>{</span>createdAt}} </div>
            <div>打印次数 {<span>{</span>print}} </div>
          </el-collapse-item>
          <el-collapse-item title="居中大号文本 centerText" name="2">
            <div>例:{<span>{</span>centerText(XXX)}}</div>
            <div>centerText 使用居中大号文本, XXX 显示内容</div>
          </el-collapse-item>
          <el-collapse-item title="条码 barcode" name="3">
            <div>例:{<span>{</span>barcode(orderNo)}}</div>
            <div>barcode 使用条码显示内容,默认 code39 格式 高度 50</div>
            <div>orderNo 显示变量,如变量不存在直接显示内容</div>
            <div>只支持显示数字</div>
          </el-collapse-item>
          <el-collapse-item title="商品模块 goods" name="4">
            <div>例:{<span>{</span>goods(pluCode|7,name|10,price|5,number|5,total|7)}}</div>
            <div>goods 使用商品模块</div>
            <div>|后面数字为最短长度,不足自动空格补齐。其中 name| 后面数字会限定长度</div>
            <div>pluCode 商品PLU码</div>
            <div>name 商品名称</div>
            <div>price 商品单价</div>
            <div>number 商品数量</div>
            <div>total 商品小计</div>
          </el-collapse-item>
          <el-collapse-item title="支付模块 pays" name="5">
            <div>例:{<span>{</span>pays(name|12,amount|9,getAmount|9)}}</div>
            <div>pays 使用支付模块</div>
            <div>|后面数字为最短长度,不足自动空格补齐。其中 name| 后面数字会限定长度</div>
            <div>name 收款方式名称</div>
            <div>amount 应收金额</div>
            <div>getAmount 实收金额</div>
          </el-collapse-item>
        </el-collapse>
        <el-form-item label="结账模板" prop="data">
            <el-input 
            v-model="ruleForm.accountsTemplate"
            type="textarea"
            :autosize="{ minRows: 12, maxRows: 18}"
            style="width:362px"
            ></el-input>
        </el-form-item>
         <el-form-item>
            <el-button type="primary" @click="submitAccounts()">测试打印</el-button>
            <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
            <el-button @click="resetForm('ruleForm')">重置</el-button>
        </el-form-item>
        <el-collapse  accordion>
          <el-collapse-item title="默认文本 text " name="1">
            <div>变量:</div>
            <div>商户账号 {<span>{</span>storeId}} </div>
            <div>收款员ID {<span>{</span>userId}} </div>
            <div>终端ID {<span>{</span>terminal}} </div>
            <div>订单 {<span>{</span>count}} </div>
            <div>退款 {<span>{</span>returns}} </div>
            <div>未发布 {<span>{</span>publish}} </div>
            <div>时间 {<span>{</span>createdAt}} </div>
          </el-collapse-item>
          <el-collapse-item title="支付模块 pays" name="5">
            <div>例:{<span>{</span>pays(name|12,amount|9)}}</div>
            <div>pays 使用支付模块</div>
            <div>|后面数字为最短长度,不足自动空格补齐。其中 name| 后面数字会限定长度</div>
            <div>name 收款方式名称</div>
            <div>amount 金额</div>
          </el-collapse-item>
        </el-collapse>
    </el-form>
</template>

<script>
import store from '@/store'
const printer = store.state.settings.printer
import { parseTime } from '@/utils/index'
import print from '@/utils/print'
export default {
  name: 'printer',
  data() {
    return {
      ruleForm: printer,
      order: {
        userId: '0012',
        terminal: '0066',
        orderNo: '0066202001160001',
        total: 18245,
        getAmount: 20000,
        type: true, // 销售类型 销货 退货
        createdAt: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'), // 销售日期
        print: 0,
        goods: [
          {
            pluCode: '1011147',
            barCode: '6903148026724',
            price: 2350,
            name: '飘柔洗发水400ml',
            unit: '0007',
            spec: '400ml',
            number: 1651,
            total: 115275
          },
          {
            pluCode: '1231379',
            barCode: '6924427010357',
            price: 180,
            name: '巧巧洋葱卷海鲜贝750g',
            unit: '0004',
            spec: '750g',
            number: 165,
            total: 2970
          }
        ],
        pays: [
          {
            name: '支付宝',
            amount: 10000,
            getAmount: 10000
          },
          {
            name: '现金',
            amount: 182.45,
            getAmount: 20000
          }
        ]
      }
    }
  },
  computed: {
  },
  created() {
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$store.dispatch('settings/changeSetting', { key: 'printer', value: this[formName] })
          this.$message({
            type: 'success',
            message: '保存成功'
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    resetForm(formName) {
      this.$refs[formName].resetFields()
    },
    submitPrint() {
      print.hander(this.order).then(response => {
        this.$message({
          type: 'success',
          message: '打印成功'
        })
      }).catch(err => {
        this.$message({
          type: 'error',
          message: '打印失败: ' + err.message
        })
      })
    },
    submitAccounts() {
      print.accounts().then(response => {
        this.$message({
          type: 'success',
          message: '结账打印成功'
        })
      }).catch(err => {
        this.$message({
          type: 'error',
          message: '结账打印失败: ' + err.message
        })
      })
    }
  }
}
</script>

<style lang="less" scoped>
</style>
