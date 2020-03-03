<template>
    <el-form :inline=true :model="ruleForm"  ref="ruleForm" label-width="100px">
                <el-form-item v-for="(item,index) in ruleForm.key" :label="item.name" :key="index" :prop="item.id">
                    <el-input v-model="item.key">></el-input>
                </el-form-item>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
                    <el-button @click="resetForm('ruleForm')">重置</el-button>
                </el-form-item>
    </el-form>
</template>

<script>
import store from '@/store'
const payKeyboard = store.state.settings.payKeyboard
import sequelize from '@/model/pay'
const pay = sequelize.models.pay

export default {
  name: 'payKeyboard',
  data() {
    return {
      ruleForm: {
        key: []
      }
    }
  },
  computed: {
  },
  created() {
    this.getPay()
  },
  methods: {
    getPay() {
      pay.findAll().then(res => {
        res.forEach(item => {
          this.ruleForm.key.push({
            id: String(item.id ? item.id : '0'),
            name: item.name ? item.name : '',
            key: payKeyboard[item.id]
          })
        })
      })
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          var payKeyboard = {}
          this[formName].key.forEach(item => {
            payKeyboard[item.id] = item.key
          })
          this.$store.dispatch('settings/changeSetting', { key: 'payKeyboard', value: payKeyboard })
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
    }
  }
}
</script>

<style lang="less" scoped>
</style>
