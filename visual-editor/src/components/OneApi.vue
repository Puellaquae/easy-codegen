<template>
    <n-form label-placement="top" label-width="auto">
        <n-form-item label="method">
            <n-input type="text" :disabled="true" :value="settingForm.method" />
        </n-form-item>
        <n-form-item label="url">
            <n-input type="text" :disabled="true" :value="urlF" />
        </n-form-item>
        <template v-for="(item, key) in settingForm.params" :key="key">
            <n-form-item v-if="(item.enable_if === undefined || setting[item.enable_if.key] === item.enable_if.value)"
                :label="item.label">
                <template v-if="item.place === undefined">
                    <n-input v-if="item.type === 'String' && item.own === undefined" type="text"
                        v-model:value="setting[key]" />
                    <n-input v-if="item.type === 'String' && item.own !== undefined" type="text"
                        v-model:value="setting[item.own][item.key]" />
                    <n-input-number v-if="item.type === 'Int' && item.own === undefined" v-model:value="setting[key]"
                        clearable />
                    <n-input-number v-if="item.type === 'Int' && item.own !== undefined"
                        v-model:value="setting[item.own][item.key]" clearable />
                </template>
                <template v-if="item.place !== undefined">
                    <n-input v-if="item.type === 'String'" type="text" v-model:value="urlParams[key]" />
                    <n-input-number v-if="item.type === 'Int'" v-model:value="urlParams[key]" clearable />
                </template>
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
    NInput,
    useMessage,
    NButton,
    NInputNumber
} from "naive-ui";

export default defineComponent({
    components: {
        NForm,
        NFormItem,
        NInput,
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
            if (this.settingForm.params[m].place === undefined) {
                if (this.settingForm.params[m].own === undefined) {
                    setting[m] = null;
                } else {
                    setting[this.settingForm.params[m].own] = setting[this.settingForm.params[m].own] ?? {};
                    setting[this.settingForm.params[m].own][this.settingForm.params[m].key] = null;
                }
            }
        }
        return {
            showModal: false,
            saving: false,
            setting: setting,
            reqUrl: this.settingForm.url,
            reqMethod: this.settingForm.method,
            res: {},
            urlParams: {}
        };
    },
    methods: {
        req() {
            this.res = '发送请求中'
            let f;
            if (this.reqMethod === 'GET') {
                let q = Object.keys(this.setting).map(k => `${k}=${this.setting[k]}`)
                f = fetch(`${this.urlRoot}${this.urlF}?${q}`, {
                    method: this.reqMethod,
                    mode: 'cors',
                });
            } else {
                f = fetch(`${this.urlRoot}${this.urlF}`, {
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
    computed: {
        urlF() {
            let url = `${this.reqUrl}`;
            for (const p of Object.keys(this.urlParams)) {
                if (this.urlParams[p] !== null) {
                    url = url.replace(`:${p}`, `${this.urlParams[p]}`)
                }
            }
            return url;
        }
    }
});
</script>