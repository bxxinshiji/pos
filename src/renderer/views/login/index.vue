<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">

      <div class="title-container">
        <h3 class="title">用户登录</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          :readonly="leave"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
          @keyup.enter.native="passwordFocus"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="密码"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">登录</el-button>

      <el-row class="stauts"> 
         <el-col :span="3">
          <span class="version">终端: {{terminalId}} </span>
        </el-col> 
        <el-col :span="2">
          <svg-icon v-bind:class="{ active: onLine }" icon-class="router" />  
        </el-col> 
        <!-- <el-col :span="2">
          <svg-icon v-bind:class="{ active: isInternet }" icon-class="server" />  
        </el-col>  -->
        <el-col :span="2">
          <svg-icon v-bind:class="{ active: isServer }" icon-class="internet" />  
        </el-col> 
        <el-col :span="2">
          <svg-icon v-bind:class="{ active: isSql2000 }" icon-class="sql" />  
        </el-col> 
        <el-col :span="12">
          <span>{{ date | parseTime('{y}-{m}-{d} {h}:{i}:{s} 星期{a}') }} </span>
        </el-col> 
        <el-col :span="3">
          <span class="version">版本: {{version}} </span>
        </el-col> 
      </el-row>
    </el-form>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
const ipcRenderer = require('electron').ipcRenderer
import log from '@/utils/log'
export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', message: '请输入用户名' }]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined
    }
  },
  computed: {
    ...mapGetters([
      'isTerminal'
    ]),
    ...mapState({
      version: state => state.settings.version,
      terminalId: state => state.settings.terminal,
      date: state => state.healthy.date,
      onLine: state => state.healthy.onLine,
      isInternet: state => state.healthy.isInternet,
      isServer: state => state.healthy.isServer,
      isSql2000: state => state.healthy.isSql2000,
      leave: state => state.user.leave,
      username: state => state.user.username
    })
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  mounted() {
    this.usernameFocus()
    if (this.leave) {
      this.loginForm.username = this.username
    }
    ipcRenderer.on('main-process-home', (event, arg) => { // 主进程快捷键主页
      this.usernameFocus()
    })
  },
  methods: {
    usernameFocus() {
      if (this.$refs.username) {
        this.$refs.username.focus()
        this.$refs.username.select()
      }
    },
    passwordFocus() {
      this.$refs.password.focus()
      this.$refs.password.select()
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      this.usernameFocus()
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm).then(() => {
            log.h('info', 'user/login', '用户: ' + this.loginForm.username + ' 登录成功')
            this.$router.push({ path: this.redirect || '/' })
            this.$store.state.user.leave = false // 接触暂离锁定
            this.loading = false
          }).catch(error => {
            log.h('error', 'user/login', '用户: ' + this.loginForm.username + ' 登录失败,' + 'ERROR:' + error.message)
            this.loading = false
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }
  
}
</style>
<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.stauts{
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 22px;
  svg{
    font-size: 22px;
  }
  .active{
    color: @el-success
  }
  .version{
    font-size: 10px;
  }
}
</style>

