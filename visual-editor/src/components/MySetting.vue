<template>
  <n-form label-placement="top" label-width="auto">
    <template v-for="(item, key) in SETTING_FORM" :key="key">
      <n-form-item v-if="(item.enable_if === undefined || setting[item.enable_if.key] === item.enable_if.value)"
        :label="item.label">
        <n-switch v-model:value="setting[key]" v-if="item.type === 'switch'" />
        <n-radio-group v-model:value="setting[key]" v-if="item.type === 'radio'" :name="key">
          <n-radio v-for="s in item.selections" :value="s.value" :name="key" :key="s.key">
            {{ s.label }}
          </n-radio>
        </n-radio-group>
        <n-select v-if="item.type === 'selections'" v-model:value="setting[key]" :options="item.selections" />
        <div v-if="item.type === 'list'">
          <div v-for="(_v, i) in setting[key]" :key="i">
            <div style="display: inline-flex;">
              <n-input type="text" v-model:value="setting[key][i]" />
              <n-button :on-click="() => { setting[key].splice(i, 1) }">
                -
              </n-button>
            </div>
          </div>
          <n-button :on-click="() => { setting[key].push('') }">
            +
          </n-button>
        </div>
        <n-checkbox-group v-if="item.type === 'select'" v-model:value="setting[key]">
          <n-checkbox v-for="(v, k) in item.selections" :key="k" :label="v.label" :value="k" />
        </n-checkbox-group>
        <n-input v-if="item.type === 'text'" type="text" v-model:value="setting[key]" />
      </n-form-item>
    </template>
  </n-form>
  <div style="display: flex; justify-content: flex-end">
    <n-button type="primary"> 导出 DSL 代码 </n-button>
  </div>
  <!--pre style="font-family: 'Cascadia Code', monospace">{{ JSON.stringify(setting, null, 2) }}</pre-->
</template>

<script>
import { defineComponent } from "vue";
import {
  NForm,
  NFormItem,
  NSwitch,
  NRadioGroup,
  NSelect,
  NRadio,
  NInput,
  NCheckboxGroup,
  NCheckbox,
  useMessage,
  NButton
} from "naive-ui";
import {
  SETTING_FORM,
  DEFAULT_SETTING,
} from "../global";

export default defineComponent({
  components: {
    NForm,
    NFormItem,
    NSwitch,
    NRadioGroup,
    NRadio,
    NInput,
    NCheckboxGroup,
    NCheckbox,
    NSelect,
    NButton
  },
  setup() {
    const message = useMessage();
    return {
      message,
    };
  },
  data() {
    return {
      saving: false,
      SETTING_FORM,
      setting: DEFAULT_SETTING,
    };
  }
});
</script>