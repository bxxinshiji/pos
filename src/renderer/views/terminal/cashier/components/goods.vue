<template>
  <tr v-bind:class="{ active: active }">
    <td>{{goods.no}}</td>
    <td>{{goods.pluCode}}</td>
    <td>{{goods.name}}</td>
    <td>{{goods.number.toFixed(2)}}</td>
    <td>{{(goods.price / 100).toFixed(2)}}</td>
    <td>{{(goods.total / 100).toFixed(2)}}</td>
  </tr>
</template>
<script>
export default {
  name: 'goods',
  props: {
    goods: {
      type: Object,
      default: ''
    },
    active: {
      ype: Boolean,
      default: true
    }
  },
  mounted() {
  }
}
</script>
<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
td{
  padding: 6px 0 6px 10px;
  text-align:left;
  line-height:3vh;
  border-bottom: 1px solid #ebeef5;
  font-size:2.5vh;
  color: @el-success;
}
.active{
  td{
    color: @el-danger;
    font-size:3vh;
    font-weight:900;
  }
}
</style>