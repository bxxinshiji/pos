<template>
    <span 
        class="returnOrder"
    >
        <h3>进入【退货】状态, 是否继续?</h3>
        <el-row>
            <el-col :span="24">
                <el-input 
                    ref="input"
                    v-model="input" 
                    @keyup.enter.native="handerInput"
                    @input="handerOnInput"
                    placeholder="请输入退货单号, 无单号请回车。"
                    />
            </el-col>
        </el-row>
         <el-row :gutter="20">
            <el-col :span="12">
                <el-button type="primary" style="width:100%" @click="handerInput">确定</el-button>
            </el-col>
            <el-col :span="12">
                <el-button style="width:100%" @click="handlerClose">取消</el-button>
            </el-col>
        </el-row>
    </span>
</template>

<script>
import { mapState } from 'vuex'
export default { // 暂未使用
  name: 'returnOrder',
  props: {
  },
  data() {
    return {
      input: ''
    }
  },
  computed: {
    ...mapState({
      visible: state => state.terminal.isReturnOrder,
      order: state => state.terminal.order
    })
  },
  created() {
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
  },
  watch: {
    visible: {
      handler: function(val, oldVal) {
        if (val) {
          this.focus()
        } else {
          this.blur()
          this.input = ''
        }
      },
      deep: true
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus()
    },
    blur() {
      this.$refs.input.blur()
    },
    handerInput() {
      console.log(this.input)
      this.order.type = false
      this.handlerClose()
    },
    handerOnInput(value) {
      this.input = value.replace(/[^0-9.]/g, '')
    },
    handlerClose() {
      this.$store.dispatch('terminal/changeIsReturnOrder', false)
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc关闭消息
        this.handlerClose()
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.returnOrder{
    position:fixed;
    margin:auto;
    left:0;
    right:0;
    top:0;
    bottom:0;
    width: 40vw;
    max-width: 800px;
    height: 200px;
    border-radius:4px;
    background-color: #ffffff;
    padding: 2vw;
    h3{
      color: #303133;
    }
}
.el-row {
    margin-bottom: 20px;
}
</style>
