<template>
    <el-row :gutter="20" class="heads">
        <el-col class="user" :span="7">
          <el-row> 账号: {{ name }} </el-row> 
          <el-row> 名称: {{ username }} </el-row> 
        </el-col>
        <el-col class="logo" :span="10">
          <svg-icon icon-class="xinshiji" />  
          <span>新世纪超市</span>
          <span>盘点</span>
        </el-col>
        <el-col class="status" :span="7">
            <el-row> 
              <svg-icon v-bind:class="{ active: onLine }" icon-class="router" />  
              <svg-icon v-bind:class="{ active: isInternet }" icon-class="internet" />  
              <svg-icon v-bind:class="{ active: isServer }" icon-class="server" />
              <svg-icon v-bind:class="{ active: isPrinter }" icon-class="printer" /> 
              <svg-icon v-bind:class="{ active: isSql2000 }" icon-class="sql" /> 
            </el-row>
            <el-row>
            {{ date | parseTime('{y}-{m}-{d} {h}:{i}:{s} 星期{a}') }}
            </el-row>
        </el-col>
    </el-row>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
export default {
  name: 'heads',
  data() {
    return {}
  },
  computed: {
    ...mapGetters([
      'name',
      'username'
    ]),
    ...mapState({
      isPrinter: state => state.settings.printer.switch,
      date: state => state.healthy.date,
      onLine: state => state.healthy.onLine,
      isInternet: state => state.healthy.isInternet,
      isServer: state => state.healthy.isServer,
      isSql2000: state => state.healthy.isSql2000
    })
  },
  created() {
  },
  mounted() {
  },
  methods: {
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.heads{
  height: 8vh;
}
.user{
  height: 8vh;
  display: -webkit-flex; /* Safari */
  display: flex;
  flex-direction:column;
  justify-content: flex-end;
  color: #ffffff;
}
.logo{
  display: -webkit-flex; /* Safari */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 9vh;
  span{
    margin-left: 2vh;
    font-size: 5vh;
  }
  color: #ffffff;
}
.status{
  height: 8vh;
  display: -webkit-flex; /* Safari */
  display: flex;
  flex-direction:column;
  justify-content: flex-end;
  color: #ffffff;
  .el-row{
    display: -webkit-flex; /* Safari */
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  svg{
    font-size: 3vw;
  }
  .active{
    color: @el-success
  }
}
</style>
