<template>
    <span 
        class="password"
    >
            <h3>修改密码</h3>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <el-form-item label="原密码" prop="password">
                <el-input 
                    ref="password"
                    v-model="form.password" 
                    @keyup.enter.native="handerPassword"
                    placeholder="请输入原密码"
                    />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input 
                    ref="newPassword"
                    v-model="form.newPassword" 
                    @keyup.enter.native="handerNewPassword"
                    placeholder="请输入新密码"
                    />
              </el-form-item>
              <el-form-item label="确认密码" prop="verifyPassword">
                <el-input 
                    ref="verifyPassword"
                    v-model="form.verifyPassword" 
                    @keyup.enter.native="hander"
                    placeholder="请输入确认密码"
                    />
              </el-form-item>
              <el-form-item >
                <el-button type="primary" style="width:18vw" @click="hander">确定</el-button>
                <el-button  style="width:18vw" @click="handleClose">取消</el-button>
              </el-form-item>
            </el-form>
    </span>
</template>

<script>
import { Login } from '@/api/terminal'
import { Password } from '@/api/user'
import { Password as terminalUserPassword } from '@/model/api/terminalUser'
export default {
  name: 'password',
  props: {
  },
  data() {
    return {
      username: this.$store.state.user.username,
      form: {
        password: '',
        newPassword: '',
        verifyPassword: ''
      },
      rules: {
        password: [
          {
            required: true,
            validator: (rule, value, callback) => {
              Login({ username: this.username, password: value }).then(response => {
                if (response.valid) {
                  callback()
                } else {
                  callback('密码验证错误')
                }
              }).catch(error => {
                callback('密码验证系统错误:' + error)
              })
            },
            trigger: 'blur'
          }
        ],
        newPassword: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (value === undefined) {
                callback()
              } else {
                if (this.form.verifyPassword !== '') {
                  this.$refs.form.validateField('verifyPassword')
                }
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        verifyPassword: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (value !== this.form.newPassword) {
                callback('两次输入密码不一致!')
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
  },
  created() {
  },
  mounted() {
    this.$refs.password.focus()
    document.addEventListener('keydown', this.keydown)
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
  },
  methods: {
    handerPassword() {
      this.$refs.newPassword.focus()
    },
    handerNewPassword() {
      this.$refs.verifyPassword.focus()
    },
    hander() {
      this.$refs.password.focus()
      this.$refs.form.validate(valid => {
        if (valid) {
          Password(this.username, this.form.newPassword).then(response => {
            this.$message({
              type: 'success',
              message: '修改密码成功'
            })
            terminalUserPassword(this.username, this.form.newPassword)
          }).catch(error => {
            this.$message({
              type: 'error',
              message: '修改密码失败:' + error.message
            })
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    handleClose() {
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc关闭消息
        this.handleClose()
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  }
}
</script>

<style lang="less" scoped>
.password{
    position:fixed;
    margin:auto;
    left:0;
    right:0;
    top:0;
    bottom:0;
    width: 50vw;
    max-width: 800px;
    height: 60vh;
    border-radius:4px;
    background-color: #ffffff;
    padding: 2vw;
}
.el-row {
    margin-bottom: 20px;
}
</style>
