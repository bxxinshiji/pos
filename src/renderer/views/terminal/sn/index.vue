<template>
    <span
        class="sn"
    >
            <h3>云MIS POS机SN绑定</h3>
            <el-form ref="form" :model="form" label-width="100px">
              <el-form-item label="当前绑定SN">
                <span :class="boundSn ? 'bound' : 'unbound'">{{ boundSn ? boundSn : '未绑定' }}</span>
              </el-form-item>
              <el-form-item label="绑定SN">
                <el-input
                    ref="sn"
                    v-model.trim="form.sn"
                    @keyup.enter.native="hander"
                    @focus="$event.target.select()"
                    placeholder="聚焦后扫码枪扫描SN条码自动录入,再扫自动更换"
                    />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" style="width:18vw" @click="hander">保存</el-button>
              </el-form-item>
            </el-form>
    </span>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'sn',
  props: {
  },
  data() {
    return {
      form: {
        sn: this.$store.state.settings.cloudMisSn || ''
      }
    }
  },
  computed: {
    ...mapState({
      boundSn: state => state.settings.cloudMisSn
    })
  },
  created() {
  },
  mounted() {
    this.$refs.sn.focus() // 聚焦后扫码枪直接扫码录入
    document.addEventListener('keydown', this.keydown)
  },
  methods: {
    hander() {
      if (this.form.sn === '' && this.boundSn) { // 清空保存即解绑
        this.$confirm('将解绑当前POS机SN, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.save('')
        }).catch(() => {})
        return
      }
      this.save(this.form.sn)
    },
    save(sn) {
      this.$store.dispatch('settings/changeSetting', { key: 'cloudMisSn', value: sn })
      this.form.sn = sn
      this.$message({
        type: 'success',
        message: sn === '' ? '解绑成功' : 'SN绑定成功: ' + sn
      })
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc返回主页
        this.$router.push({ path: '/dashboard' })
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  }
}
</script>

<style lang="less" scoped>
.sn{
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
.bound{
    color: #67C23A;
    font-weight: 900;
}
.unbound{
    color: #F56C6C;
}
</style>
