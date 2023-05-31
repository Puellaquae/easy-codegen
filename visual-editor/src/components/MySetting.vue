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
    <n-button type="primary" @click="showModal = true"> 导出 DSL 代码 </n-button>
  </div>
  <n-modal v-model:show="showModal">
    <n-card style="width: 1000px;" title="DSL 代码" :bordered="false" size="huge" role="dialog" aria-modal="true">
      <pre style="font-family: 'Cascadia Code', monospace; overflow-y: scroll; height: 70vh;">{{ content }}</pre>
      <div style="display: flex; justify-content: flex-end">
        <n-button>复制</n-button>
      </div>
    </n-card>
  </n-modal>
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
  NButton,
  NModal,
  NCard
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
    NButton,
    NModal,
    NCard
  },
  setup() {
    const message = useMessage();
    return {
      message,
    };
  },
  data() {
    return {
      showModal: false,
      saving: false,
      SETTING_FORM,
      setting: DEFAULT_SETTING,
      content: `
entity Permission {
    User: User,
    Level: Int
}

entity User {
    UserName: @String,
    PassWord: String
}

entity Token {
    ForUser: User,
    Token: @String
}

entity Goods {
    Owner: User
    Name: String,
    Price: Int,
    Stock: Int
}

entity Order {
    Buyer: User
    Good: Goods,
    Count: Int,
    TotalPrice: Int
}

fn permissionCheck(uid: User.Id, requireLevel: Int) -> Bool {
    return Permission.filter(u => u.User.Id.eq(uid)).first().Level.ge(requireLevel)
}

fn setPermissLevel(uid: User.Id, level: Int) {
    let p = Permission.filter(p => p.User.Id.eq(User.Id))
    let cnt = p.count()
    cnt.eq(0).cond(() => {
        Permission.append(Permission.new({
            User: uid.User,
            Level: level
        }))
    }, () => {
        p.first().Level.set(level)
    })
}

fn signup(u: User) {
    User.append(u)
}

fn signdown(uid: User.Id) {
    User.remove(u => u.Id.eq(uid))
}

fn uuid() -> String

fn login(name: User.UserName, pw: User.PassWord) -> Token.Token {
    name.User.PassWord.eq(pw).assert("用户名或密码不正确")

    let newTok = uuid()
    Token.append(Token.new({
        ForUser: name.User,
        Token: newTok
    }))
    return newTok
}

fn logout(tok: Token.Token) {
    Token.remove(t => t.Token.eq(tok))
}

fn tokenToUser(tok: Token.Token) -> User {
    return tok.Token.ForUser
}

fn newGoods(g: Goods) {
    Goods.append(g)
}

fn removeGoods(gid: Goods.Id) {
    Goods.remove(g => g.Id.eq(gid))
}

fn updateGoods(gid: Goods.Id, g: Goods) {
    gid.Goods.set(g)
}

fn newOrder(buyerId: User.Id, gid: Goods, count: Int) {
    Order.append(Order.new({
        Buyer: buyerId.User,
        Good: gid.Goods,
        Count: count,
        Price: gid.Goods.Price.mul(count)
    }))
}

fn removeOrder(oid: Order.Id) {
    Order.remove(o => o.Id.eq(oid))
}
      `
    };
  }
});
</script>