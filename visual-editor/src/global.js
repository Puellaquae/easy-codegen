const DEFAULT_SETTING = {
    authMod: "level",
    authModForUserTableName: "User",
    userMod: "simple",
    userOtherField: [
        "Age: Int"
    ],
    goodMod: "simple",
    goodOtherField: [
        "Description: String"
    ],
    orderMod: "single",
    orderModForUserTableName: "User",
    orderModForGoodTableName: "Goods",
};

const SETTING_FORM = {
    authMod: {
        label: "选择权限管理模块模板",
        type: "selections",
        selections: [
            {
                label: "基于等级",
                value: "level"
            },
            {
                label: "基于权限标识",
                value: "permiss"
            }
        ]
    },
    authModForUserTableName: {
        enable_if: {
            key: "userMod",
            value: "empty",
        },
        label: "权限管理对应的用户数据表名",
        type: "text"
    },
    userMod: {
        label: "选择用户管理模块模板",
        type: "selections",
        selections: [
            {
                label: "基础用户信息",
                value: "simple"
            },
            {
                label: "不使用模板",
                value: "empty"
            },
        ]
    },
    userOtherField: {
        enable_if: {
            key: "userMod",
            value: "simple"
        },
        label: "用户信息额外自定义字段",
        type: "list"
    },
    goodMod: {
        label: "选择商品管理模块模板",
        type: "selections",
        selections: [
            {
                label: "基础商品信息",
                value: "simple"
            },
            {
                label: "不使用模板",
                value: "empty"
            },
        ]
    },
    goodOtherField: {
        enable_if: {
            key: "goodMod",
            value: "simple"
        },
        label: "商品信息额外自定义字段",
        type: "list"
    },
    orderMod: {
        label: "选择订单管理模块模板",
        type: "selections",
        selections: [
            {
                label: "仅支持单种商品",
                value: "single"
            },
            {
                label: "支持多种商品",
                value: "multi"
            },
        ]
    },
    orderModForUserTableName: {
        enable_if: {
            key: "userMod",
            value: "empty",
        },
        label: "订单管理对应的用户数据表名",
        type: "text"
    },
    orderModForGoodTableName: {
        enable_if: {
            key: "goodMod",
            value: "empty",
        },
        label: "订单管理对应的商品数据表名",
        type: "text"
    },
}

const WebApis = {
    login: {
        url: "/login",
        name: "login",
        method: "POST",
        params: {
            name: {
                label: "name",
                type: "String",
            },
            pw: {
                label: "pw",
                type: "String",
            },
        },
    },
    logout: {
        url: "/logout",
        name: "logout",
        method: "GET",
        params: {
            tok: {
                label: "tok",
                type: "String",
            },
        },
    },
    getAllGoods: {
        url: "/goods",
        name: "getAllGoods",
        method: "GET",
        params: {},
    },
    newGoods: {
        url: "/goods/new",
        name: "newGoods",
        method: "POST",
        params: {
            g_Owner_Id: {
                lable: "g.'Owner.Id'",
                type: "Int",
                own: "g",
                key: "Owner.Id",
            },
            g_Name: {
                label: "g.Name",
                type: "String",
                own: "g",
                key: "Name",
            },
            g_Price: {
                label: "g.Price",
                type: "Int",
                own: "g",
                key: "Price",
            },
            g_Stock: {
                label: "g.Stock",
                type: "Int",
                own: "g",
                key: "Stock",
            },
        },
    },
    updateGoods: {
        url: "/goods/:gid/update",
        name: "updateGoods",
        method: "POST",
        params: {
            g_Owner_Id: {
                lable: "g.'Owner.Id'",
                type: "Int",
                own: "g",
                key: "Owner.Id",
            },
            g_Name: {
                label: "g.Name",
                type: "String",
                own: "g",
                key: "Name",
            },
            g_Price: {
                label: "g.Price",
                type: "Int",
                own: "g",
                key: "Price",
            },
            g_Stock: {
                label: "g.Stock",
                type: "Int",
                own: "g",
                key: "Stock",
            },
        },
    },
    newOrder: {
        url: "/order/new",
        name: "newOrder",
        method: "POST",
        params: {
            buyerId: {
                label: "buyerId",
                type: "Int",
            },
            gid: {
                label: "gid",
                type: "Int",
            },
            count: {
                label: "count",
                type: "Int",
            },
        },
    },
    removeOrder: {
        url: "/order/:oid/remove",
        name: "removeOrder",
        method: "POST",
        params: {},
    },
}

export {
    DEFAULT_SETTING, SETTING_FORM, WebApis
}