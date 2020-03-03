<template>
  <div class="install-container">
    <el-steps :active="active" finish-status="success">
      <el-step title="服务器API"></el-step>
      <el-step title="终端设置"></el-step>
      <el-step title="初始化数据"></el-step>
    </el-steps>
    <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="120px" class="demo-ruleForm">
      <span v-if="active==0">
        <el-form-item label="服务器API" prop="api">
          <el-input 
            v-model="ruleForm.api" 
            :autosize="{ minRows: 2, maxRows: 8}"
            placeholder="负载均衡服务器,一行一个"
            type="textarea"
          >
          </el-input>
        </el-form-item>
      </span>
      <span v-if="active==1">
        <el-form-item label="启动终端" prop="isTerminal">
          <el-switch v-model="ruleForm.isTerminal"></el-switch>
        </el-form-item>
        <span v-if="ruleForm.isTerminal">
          <el-form-item label="终端编号" prop="terminal">
            <el-input v-model="ruleForm.terminal"></el-input>
          </el-form-item>
          <el-form-item label="数据库地址" prop="sql2000_host">
            <el-input v-model="ruleForm.sql2000_host"></el-input>
          </el-form-item>
          <el-form-item label="数据库端口" prop="sql2000_port">
            <el-input v-model="ruleForm.sql2000_port"></el-input>
          </el-form-item>
          <el-form-item label="数据库账号" prop="sql2000_username">
            <el-input v-model="ruleForm.sql2000_username"></el-input>
          </el-form-item>
          <el-form-item label="数据库密码" prop="sql2000_password">
            <el-input v-model="ruleForm.sql2000_password"></el-input>
          </el-form-item>
          <el-form-item label="数据库名" prop="sql2000_database">
            <el-input v-model="ruleForm.sql2000_database"></el-input>
          </el-form-item>
        </span>
      </span>
      <el-timeline v-if="ruleForm.isTerminal && active==2" >
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :color="activity.color"
          :timestamp="activity.timestamp">
          {{activity.content}}
        </el-timeline-item>
      </el-timeline>
      <el-form-item class="foot">
          <el-button @click="previous('ruleForm')">上一步</el-button>
          <el-button v-if="active==2" type="primary" @click="complete()">完成</el-button>
          <el-button v-else type="primary" @click="next('ruleForm')">下一步</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { Message } from 'element-ui'
import { isServer } from '@/utils/healthy'
import { isSql2000 } from '@/sql2000/utils/healthy'
import { SyncPlu } from '@/sql2000/api/goods'
import { SyncUser } from '@/sql2000/api/user'
import { SyncPay } from '@/sql2000/api/pay'
import { parseTime } from '@/utils'
// 安装页面
export default {
  name: 'Install',
  data() {
    return {
      active: 0,
      ruleForm: {
        api: 'http://rpc1.binzhou.vip/rpc',
        isTerminal: false,
        terminal: '0001',
        sql2000_host: '192.168.20.10',
        sql2000_port: '1433',
        sql2000_username: 'sa',
        sql2000_password: '123456',
        sql2000_database: 'stmis1'
      },
      rules: {
        api: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (value) {
                value.split(/[\n]/).forEach(async url => {
                  if (await isServer(url)) {
                    callback()
                  } else {
                    callback()
                    callback(url + ':请求失败,请检查服务器地址')
                  }
                })
              } else {
                callback('请输入服务器API地址')
              }
            },
            trigger: 'blur'
          }
        ],
        terminal: [
          { required: true, message: '请输入终端编号', trigger: 'blur' }
        ],
        sql2000_host: [
          { required: true, message: '请输入数据库地址', trigger: 'blur' }
        ],
        sql2000_port: [
          { required: true, message: '请输入数据库端口', trigger: 'blur' }
        ],
        sql2000_username: [
          { required: true, message: '请输入数据库账号', trigger: 'blur' }
        ],
        sql2000_password: [
          { required: true, message: '请输入数据库密码', trigger: 'blur' }
        ],
        sql2000_database: [
          { required: true, message: '请输入数据库名称', trigger: 'blur' }
        ]
      },
      activities: [
      ]
    }
  },
  mounted() {
  },
  methods: {
    next(formName) {
      this.$refs[formName].validate(async(valid) => {
        if (valid) {
          if (this.active === 1) {
            this.activities = []
            this.initConfig()
            if (this.ruleForm.isTerminal) {
              if (await this.isSql2000()) {
                this.syncInfo()
              } else {
                return
              }
            }
          }
          if (this.active++ > 2) this.active = 2
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    previous(formName) {
      if (this.active-- === 0) this.active = 0
    },
    initConfig() {
      this.activities.push({
        content: '初始化配置',
        timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
        color: '#409EFF'
      })
      Object.keys(this.ruleForm).forEach(key => {
        this.$store.dispatch('settings/changeSetting', { key, value: this.ruleForm[key] })
      })
    },
    async isSql2000() {
      // 检测数据库连接
      if (!await isSql2000({
        database: this.ruleForm.sql2000_database,
        username: this.ruleForm.sql2000_username,
        password: this.ruleForm.sql2000_password,
        host: this.ruleForm.sql2000_host,
        port: this.ruleForm.sql2000_port
      })) {
        Message({
          message: '数据库连接失败,请检查配置.',
          type: 'error',
          duration: 5 * 1000
        })
        return false
      } else {
        return true
      }
    },
    // 同步数据
    syncInfo() {
      // 初始化商品
      this.activities.push({
        content: '开始同步商品信息...',
        timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
        color: '#909399'
      })
      SyncPlu().then(() => {
        this.activities.push({
          content: '同步商品信息完成!',
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#67C23A'
        })
      }).catch((error) => {
        this.activities.push({
          content: '同步商品信息失败! Error:' + error,
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#F56C6C'
        })
      })
      // 初始化终端用户
      this.activities.push({
        content: '开始同步终端用户信息...',
        timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
        color: '#909399'
      })
      SyncUser().then(() => {
        this.activities.push({
          content: '同步终端用户信息完成!',
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#67C23A'
        })
      }).catch((error) => {
        this.activities.push({
          content: '同步终端用户信息失败! Error:' + error,
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#F56C6C'
        })
      })
      // 初始化终端支付
      this.activities.push({
        content: '开始同步终端支付信息...',
        timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
        color: '#909399'
      })
      SyncPay().then(() => {
        this.activities.push({
          content: '同步终端支付信息完成!',
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#67C23A'
        })
      }).catch((error) => {
        this.activities.push({
          content: '同步终端支付信息失败! Error:' + error,
          timestamp: parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}'),
          color: '#F56C6C'
        })
      })
    },
    // 完成
    complete() {
      Object.keys(this.ruleForm).forEach(key => {
        this.$store.dispatch('settings/changeSetting', { key: 'install', value: true })
      })
      this.$router.push(`/login`)
    }
  }
}
</script>


<style lang="scss" scoped>
.install-container{
  padding: 10vw;
}
.foot{
  margin-top:3vh;
}
.el-steps{
  margin-bottom: 3vh;
}
</style>
