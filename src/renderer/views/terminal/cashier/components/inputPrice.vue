<template>
    <span 
        class="inputPrice"
    >
        <el-row  v-if="Object.keys(cacheGoods).length>0">
            <el-col :span="12">名称: {{ cacheGoods.name }}</el-col>
            <el-col :span="12">单价: {{ cacheGoods.price?(cacheGoods.price/100).toFixed(2):'' }}</el-col>
            <el-col :span="12">编码: {{ cacheGoods.pluCode }}</el-col>
            <el-col :span="12">条码: {{ cacheGoods.barCode }}</el-col>
        </el-row>
        <el-row>
            <el-col :span="24">
                <el-input 
                    ref="input"
                    v-model="input" 
                    @keyup.enter.native="handerInput"
                    @input="handerOnInput"
                    placeholder="请输入价格"
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
export default {
  name: 'inputPrice',
  props: {
  },
  data() {
    return {
      input: ''
    }
  },
  computed: {
    ...mapState({
      visible: state => state.terminal.isInputPrice,
      cacheGoods: state => state.terminal.cacheGoods
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
      this.cacheGoods.dataValues.total = Math.round(this.input * 100) // 四舍五入取整【默认分为单位】
      this.$emit('cacheGoods', this.cacheGoods.dataValues)
      this.handlerClose()
    },
    handerOnInput(value) {
      this.input = value.replace(/[^0-9.]/g, '')
    },
    handlerClose() {
      this.$store.dispatch('terminal/changeIsInputPrice', false)
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
.inputPrice{
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
}
.el-row {
    margin-bottom: 20px;
}
</style>
