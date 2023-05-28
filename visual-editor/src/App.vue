<template>
  <div style="padding: 2rem;">
    <n-config-provider :locale="zhCN">
      <n-message-provider>
        <n-card :hoverable="true" header-style="text-align: center;" title="">
          <n-h1 style="text-align: center;">模板选择配置工具</n-h1>
          <my-setting />
        </n-card>
      </n-message-provider>
    </n-config-provider>
  </div>
</template>

<script>
import { NConfigProvider, NMessageProvider, NCard, NH1 } from "naive-ui"
import MySetting from "./components/MySetting.vue";

export default {
  name: 'App',
  components: {
    NConfigProvider,
    NMessageProvider,
    NCard,
    NH1,
    MySetting
  }
}
</script>

<style></style>
