<template>
  <div class="dashboard-container">
    <terminal v-if="isTerminal"/>
    <div v-else class="dashboard-text">name: {{ name }} {{ hello }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Terminal from './terminal/index.vue'
export default {
  name: 'Dashboard',
  components: { Terminal },
  data() {
    return {
      hello: 'hello'
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'isTerminal'
    ])
  },
  created() {
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 30px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}
</style>
