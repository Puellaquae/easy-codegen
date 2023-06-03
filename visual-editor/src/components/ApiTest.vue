<template>
    <n-input v-model:value="rootUrl"></n-input>
    <n-button @click="load">加载</n-button>
    <n-list>
        <n-list-item v-for="(v, k) in WebApis" :key="k">
            <n-thing :title="v.name">
                <one-api :setting-form="v" :url-root="rootUrl"></one-api>
            </n-thing>
        </n-list-item>
    </n-list>
</template>

<script>
import { defineComponent } from "vue";
import { useMessage, NList, NListItem, NThing, NInput, NButton } from "naive-ui";
import OneApi from "./OneApi.vue"

export default defineComponent({
    components: {
        OneApi,
        NList,
        NListItem,
        NThing,
        NInput,
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
            WebApis: {},
            rootUrl: "http://127.0.0.1:8877"
        };
    },
    methods: {
        load() {
            fetch(`${this.rootUrl}/api`).then(f => f.json()).then(f => this.WebApis = f);
        }
    }
});
</script>