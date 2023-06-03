<template>
    <n-form label-placement="top" label-width="auto">
        <n-form-item label="method">
            <n-input type="text" :disabled="true" :value="settingForm.method" />
        </n-form-item>
        <n-form-item label="url">
            <n-input type="text" v-model:value="reqUrl" />
        </n-form-item>
        <template v-for="(item, key) in settingForm.params" :key="key">
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
                <n-input v-if="item.type === 'String' && item.own === undefined" type="text" v-model:value="setting[key]" />
                <n-input v-if="item.type === 'String' && item.own !== undefined" type="text"
                    v-model:value="setting[item.own][item.key]" />
                <n-input-number v-if="item.type === 'Int' && item.own === undefined"
                    v-model:value="setting[key]" clearable />
                <n-input-number v-if="item.type === 'Int' && item.own !== undefined"
                    v-model:value="setting[item.own][item.key]" clearable />
            </n-form-item>
        </template>
    </n-form>
    <div style="display: flex; justify-content: flex-end">
        <n-button type="primary" @click="req"> 发送请求 </n-button>
    </div>
    <pre style="font-family: 'Cascadia Code', monospace">{{ JSON.stringify(setting, null, 2) }}</pre>
    <pre style="font-family: 'Cascadia Code', monospace">{{ JSON.stringify(res, null, 2) }}</pre>
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
    NButton,
    NInputNumber
} from "naive-ui";

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
        NButton,
        NInputNumber
    },
    setup() {
        const message = useMessage();
        return {
            message,
        };
    },
    props: [
        "urlRoot",
        "settingForm"
    ],
    data() {
        let setting = {};
        for (const m of Object.keys(this.settingForm.params)) {
            if (this.settingForm.params[m].own === undefined) {
                setting[m] = null;
            } else {
                setting[this.settingForm.params[m].own] = setting[this.settingForm.params[m].own] ?? {};
                setting[this.settingForm.params[m].own][this.settingForm.params[m].key] = null;
            }
        }
        return {
            showModal: false,
            saving: false,
            setting: setting,
            reqUrl: this.settingForm.url,
            reqMethod: this.settingForm.method,
            res: {}
        };
    },
    methods: {
        req() {
            this.res = '发送请求中'
            let f;
            if (this.reqMethod === 'GET') {
                let q = Object.keys(this.setting).map(k => `${k}=${this.setting[k]}`)
                f = fetch(`${this.urlRoot}${this.reqUrl}?${q}`, {
                    method: this.reqMethod,
                    mode: 'cors',
                });
            } else {
                f = fetch(`${this.urlRoot}${this.reqUrl}`, {
                    method: this.reqMethod,
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.setting)
                })
            }
            f.then(r => {
                if (!r.ok) {
                    this.res = r.statusText
                } else {
                    r.text().then(f => {
                        try {
                            this.res = JSON.parse(f)
                        } catch {
                            this.res = f;
                        }
                    })
                }
            }).catch(() => {
                this.res = '发送请求失败'
            })
        }
    },
});
</script>