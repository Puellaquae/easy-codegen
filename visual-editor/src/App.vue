<template>
  <div style="padding: 2rem;">
    <n-config-provider :locale="zhCN">
      <n-message-provider>
        <n-card :hoverable="true" header-style="text-align: center;" title="">
          <n-h1 style="text-align: center;">可视化编辑工具</n-h1>
        </n-card>
      </n-message-provider>
    </n-config-provider>
  </div>
</template>

<script>
import { NConfigProvider, NMessageProvider, NCard, NH1 } from "naive-ui"

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NMessageProvider,
    NCard,
    NH1
  }
}
</script>

<style></style>
