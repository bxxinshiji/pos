<template>
    <div class="container">
        <el-tabs type="border-card"  @tab-click="handleClick">
        <el-tab-pane label="系统设置">
            <el-form v-if="tab===0" :inline=true :model="sysForm" :rules="sysRules" ref="sysForm"  label-width="100px">
                <el-form-item label="服务器API" prop="api">
                    <el-input 
                      v-model="sysForm.api" 
                      :autosize="{ minRows: 2, maxRows: 8}"
                      placeholder="负载均衡服务器,一行一个"
                      type="textarea"
                    >
                    </el-input>
                </el-form-item>
                <el-form-item label="终端模式" prop="isTerminal">
                    <el-switch v-model="sysForm.isTerminal"></el-switch>
                </el-form-item>
                <span v-if="sysForm.isTerminal">
                    <el-form-item label="终端编号" prop="terminal">
                        <el-input v-model="sysForm.terminal"></el-input>
                    </el-form-item>
                    <el-form-item label="条码规则" prop="barcodeReg">
                      <el-input v-model="sysForm.barcodeReg" placeholder="自定义条形码识别规则"></el-input> 
                    </el-form-item>
                    <el-form-item label="日志大小" prop="log">
                      <el-input v-model="sysForm.log" placeholder="系统报错日志大小" @input="handerOnInput"><template slot="append">MB</template></el-input> 
                    </el-form-item>
                    <el-form-item label="总金额汇总" prop="isTotal">
                      <el-switch v-model="sysForm.isTotal"></el-switch>
                    </el-form-item>

                </span>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submitForm('sysForm')">保存</el-button>
                    <el-button @click="resetForm('sysForm')">重置</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button :loading="loading"  type="primary" @click="syncTerminal()">强制更新终端数据</el-button>
                </el-form-item>
                <el-collapse  accordion>
                  <el-collapse-item title="条码规则:" name="1">
                            <div>[ F 自定义前缀(27必须前两位) ]</div>
                            <div><!-- [ A:货物 ] --></div>
                            <div>[ P:PLU号 ]</div>
                            <div>[ B:总价 ]</div>
                            <div><!-- [ Q:重量或数量 ] --></div>
                            <div><!-- [ U:单价 ] --></div>
                            <div>[ C:校验位 ]</div>
                  </el-collapse-item>
                </el-collapse>
            </el-form>
        </el-tab-pane>
        <el-tab-pane label="SQL数据库">
            <el-form v-if="tab===1" :inline=true :model="sqlForm" :rules="sqlRules" ref="sqlForm" label-width="100px">
                <el-form-item label="数据库地址" prop="sql2000_host">
                    <el-input v-model="sqlForm.sql2000_host"></el-input>
                </el-form-item>
                <el-form-item label="数据库端口" prop="sql2000_port">
                    <el-input v-model="sqlForm.sql2000_port"></el-input>
                </el-form-item>
                <el-form-item label="数据库账号" prop="sql2000_username">
                    <el-input v-model="sqlForm.sql2000_username"></el-input>
                </el-form-item>
                <el-form-item label="数据库密码" prop="sql2000_password">
                    <el-input v-model="sqlForm.sql2000_password"></el-input>
                </el-form-item>
                <el-form-item label="数据库名" prop="sql2000_database">
                    <el-input v-model="sqlForm.sql2000_database"></el-input>
                </el-form-item>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submitForm('sqlForm')">保存</el-button>
                    <el-button @click="resetForm('sqlForm')">重置</el-button>
                </el-form-item>
            </el-form>
        </el-tab-pane>
        <el-tab-pane label="打印机">
          <printer v-if="tab===2"/>
        </el-tab-pane>
        <el-tab-pane label="快捷键">
          <keyboard v-if="tab===3"/>
        </el-tab-pane>
        <el-tab-pane label="支付快捷键">
          <payKeyboard v-if="tab===4"/>
        </el-tab-pane>
        <el-tab-pane label="扫码支付">
          <pay v-if="tab===5"/>
        </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import store from '@/store'
const settings = store.state.settings
import { isServer } from '@/utils/healthy'
import Printer from './components/printer.vue'
import Keyboard from './components/keyboard.vue'
import payKeyboard from './components/payKeyboard.vue'
import pay from './components/pay.vue'
import { SyncTerminal } from '@/api/terminal'

export default {
  name: 'Config',
  components: { Printer, Keyboard, payKeyboard, pay },
  data() {
    return {
      loading: false,
      tab: 0,
      sqlForm: {
        sql2000_host: settings.sql2000_host,
        sql2000_port: settings.sql2000_port,
        sql2000_username: settings.sql2000_username,
        sql2000_password: settings.sql2000_password,
        sql2000_database: settings.sql2000_database
      },
      sqlRules: {
        host: [
          { required: true, message: '请输入数据库地址', trigger: 'blur' }
        ],
        port: [
          { required: true, message: '请输入数据库端口', trigger: 'blur' }
        ],
        username: [
          { required: true, message: '请输入数据库账号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入数据库密码', trigger: 'blur' }
        ],
        database: [
          { required: true, message: '请输入数据库名称', trigger: 'blur' }
        ]
      },
      sysForm: {
        api: settings.api,
        isTerminal: settings.isTerminal,
        terminal: settings.terminal,
        barcodeReg: settings.barcodeReg,
        log: settings.log,
        isTotal: settings.isTotal
      },
      sysRules: {
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
        barcodeReg: [
          { required: true, message: '请输入条码识别规则', trigger: 'blur' }
        ],
        log: [
          { required: true, message: '请输入日志大小', trigger: 'blur' }
        ]
      }

    }
  },
  computed: {
  },
  created() {
  },
  mounted() {
    this.$store.dispatch('terminal/unregisterGlobalShortcut') // 注销注册全局快捷键
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          Object.keys(this[formName]).forEach(key => {
            this.$store.dispatch('settings/changeSetting', { key, value: this[formName][key] })
          })
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
    handleClick(tab, event) {
      this.tab = Number(tab.index)
    },
    handerOnInput(value) {
      this.sysForm.log = value.replace(/[^0-9.]/g, '')
    },
    syncTerminal() {
      this.loading = true
      SyncTerminal(true).then(() => {
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    }
  },
  destroyed() {
    this.$store.dispatch('terminal/registerGlobalShortcut') // 注销注册全局快捷键
  }
}
</script>

<style lang="less" scoped>
    @import "~@/assets/less/atom/syntax-variables.less";
    .container {
        margin: 1vw;
    }
    .el-form-item__content{
        span{
            color: @el-info;
        }
    }
</style>
