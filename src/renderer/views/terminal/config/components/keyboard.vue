<template>
    <el-form :inline=true :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px">
                <el-form-item label="关机" prop="shutDown">
                    <el-input v-model="ruleForm.shutDown" @focus="handerFocus('shutDown')" readonly></el-input>
                </el-form-item>
                <el-form-item label="主页" prop="index">
                    <el-input v-model="ruleForm.index" @focus="handerFocus('index')" readonly></el-input>
                </el-form-item>
                <el-form-item label="聚焦输入框" prop="inputFoots">
                    <el-input v-model="ruleForm.inputFoots" @focus="handerFocus('inputFoots')" readonly></el-input>
                </el-form-item>
                <el-form-item label="销售状态" prop="salesStatus">
                    <el-input v-model="ruleForm.salesStatus" @focus="handerFocus('salesStatus')" readonly></el-input>
                </el-form-item>
                <el-form-item label="向上" prop="currentRowUp">
                    <el-input v-model="ruleForm.currentRowUp" :disabled=true></el-input>
                </el-form-item>
                <el-form-item label="向下" prop="currentRowDown">
                    <el-input v-model="ruleForm.currentRowDown" :disabled=true></el-input>
                </el-form-item>
                <el-form-item label="删除" prop="deleteGoods">
                    <el-input v-model="ruleForm.deleteGoods" @focus="handerFocus('deleteGoods')" readonly></el-input>
                </el-form-item>
                <el-form-item label="总清" prop="emptyOrder">
                    <el-input v-model="ruleForm.emptyOrder" @focus="handerFocus('emptyOrder')" readonly></el-input>
                </el-form-item>
                <el-form-item label="商品数量" prop="goodsNumber">
                    <el-input v-model="ruleForm.goodsNumber" @focus="handerFocus('goodsNumber')" readonly></el-input>
                </el-form-item>
                <el-form-item label="挂单取单" prop="pushPullOrder">
                    <el-input v-model="ruleForm.pushPullOrder" @focus="handerFocus('pushPullOrder')" readonly></el-input>
                </el-form-item>
                <el-form-item label="支付" prop="pay">
                    <el-input v-model="ruleForm.pay" @focus="handerFocus('pay')" readonly></el-input>
                </el-form-item>
                <el-form-item label="开钱箱" prop="cashdraw">
                    <el-input v-model="ruleForm.cashdraw" @focus="handerFocus('cashdraw')" readonly></el-input>
                </el-form-item>
                <el-form-item label="添加商品" prop="addGoods">
                    <el-input v-model="ruleForm.addGoods" @focus="handerFocus('addGoods')" readonly></el-input>
                </el-form-item>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
                    <el-button @click="resetForm('ruleForm')">重置</el-button>
                </el-form-item>
    </el-form>
</template>

<script>
export default {
  name: 'Keyboard',
  data() {
    return {
      ruleForm: this.$store.state.settings.Keyboard,
      rules: {
        shutDown: [
          { required: true, message: '关机快捷键不允许为空', trigger: 'blur' }
        ],
        index: [
          { required: true, message: '主页快捷键不允许为空', trigger: 'blur' }
        ],
        inputFoots: [
          { required: true, message: '聚焦快捷键不允许为空', trigger: 'blur' }
        ],
        salesStatus: [
          { required: true, message: '销售状态快捷键不允许为空', trigger: 'blur' }
        ],
        currentRowUp: [
          { required: true, message: '向上快捷键不允许为空', trigger: 'blur' }
        ],
        currentRowDown: [
          { required: true, message: '向下快捷键不允许为空', trigger: 'blur' }
        ],
        deleteGoods: [
          { required: true, message: '删除商品快捷键不允许为空', trigger: 'blur' }
        ],
        emptyOrder: [
          { required: true, message: '总清快捷键不允许为空', trigger: 'blur' }
        ],
        goodsNumber: [
          { required: true, message: '商品数量快捷键不允许为空', trigger: 'blur' }
        ],
        pushPullOrder: [
          { required: true, message: '挂单取单快捷键不允许为空', trigger: 'blur' }
        ],
        pay: [
          { required: true, message: '支付快捷键不允许为空', trigger: 'blur' }
        ],
        addGoods: [
          { required: true, message: '添加商品可以条形码可以自编码', trigger: 'blur' }
        ],
        cashdraw: [
          { required: true, message: '开钱箱快捷键不允许为空', trigger: 'blur' }
        ]
      },
      focusItem: ''
    }
  },
  computed: {
  },
  created() {
    this.initKeyboard()
  },
  mounted() {
    this.onkeydown()
  },
  methods: {
    initKeyboard() {
      if (!this.ruleForm.currentRowUp) {
        this.ruleForm.currentRowUp = 'up'
      }
      if (!this.ruleForm.currentRowDown) {
        this.ruleForm.currentRowDown = 'down'
      }
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.$store.dispatch('settings/changeSetting', { key: 'Keyboard', value: this[formName] })
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
    handerFocus(item) {
      this.focusItem = item // 缓存聚焦项目
    },
    onkeydown() {
      document.onkeydown = (event) => {
        if (event.key === 'Backspace') {
          this.ruleForm[this.focusItem] = ''
        } else {
          this.ruleForm[this.focusItem] = event.key // 设置聚焦项目快捷键
        }
      }
    }
  },
  destroyed() {
    document.onkeydown = undefined // 注销快捷键
  }
}
</script>

<style lang="less" scoped>
</style>
