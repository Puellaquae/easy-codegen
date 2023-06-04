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

const genDSLFromCfg = (cfg) => {
    let ds = [];
    let fs = [];
    if (cfg.userMod !== "empty") {
        cfg.authModForUserTableName = "User"
        cfg.orderModForUserTableName = "User"
    }
    if (cfg.goodMod !== "empty") {
        cfg.orderModForGoodTableName = "Goods"
    }
    if (cfg.authMod === "level") {
        ds.push(`
entity Permission {
    User: ${cfg.authModForUserTableName}
    Level: Int
}
        `)
        fs.push(`
fn permissionCheck(uid: ${cfg.authModForUserTableName}.Id, requireLevel: Int) -> Bool {
    return Permission.filter(u => u.User.Id.eq(uid)).first().Level.ge(requireLevel)
}

fn setPermissLevel(uid: ${cfg.authModForUserTableName}.Id, level: Int) {
    let p = Permission.filter(p => p.User.Id.eq(uid))
    let cnt = p.count()
    cnt.eq(0).cond(() => {
        Permission.append(Permission.new({
            User: uid.${cfg.authModForUserTableName},
            Level: level
        }))
    }, () => {
        p.first().Level.set(level)
    })
}        
        `)
    } else if (cfg.authMod === "permiss") {
        ds.push(`
entity Permission {
    User: ${cfg.authModForUserTableName}
    Permissions: [@String]
}
        `)

        fs.push(`
fn permissionCheck(uid: ${cfg.authModForUserTableName}.Id, requirePermission: String) -> Bool {
    return Permission
            .filter(u => u.User.Id.eq(uid))
            .first()
            .Permissions
            .filter(p => p.eq(requirePermission))
            .count()
            .neq(0)
}

fn userPermissions(uid: ${cfg.authModForUserTableName}.Id) -> [String] {
    return Permission
            .filter(u => u.User.Id.eq(uid))
            .first()
            .Permissions
}

fn addPermission(uid: ${cfg.authModForUserTableName}.Id, permission: String) {
    Permission.filter(u => u.User.Id.eq(uid)).count().eq(0).cond(() => {  
        Permission.append(Permission.new({
            User: uid.User
        }))
    }, () => { })
    Permission.filter(u => u.User.Id.eq(uid)).first().Permissions.append(permission)
}

fn removePermission(uid: ${cfg.authModForUserTableName}.Id, permission: String) {
    Permission
            .filter(u => u.User.Id.eq(uid))
            .first()
            .Permissions
            .remove(u => u.eq(permission))
}
        `)
    }
    if (cfg.userMod === "simple") {
        ds.push(`
entity User {
    UserName: @String
    PassWord: String
    ${cfg.userOtherField.join("\n    ")}
}

entity Token {
    ForUser: User
    Token: @String
} 
        `)
        fs.push(`
fn signup(u: User) {
    User.append(u)
}

fn signdown(uid: User.Id) {
    User.remove(u => u.Id.eq(uid))
}

fn uuid() -> String

fn login(name: User.UserName, pw: User.PassWord) -> Token.Token {
    name.User.PassWord.eq(pw).assert("用户名或密码不正确")

    let newTok = uuid().pin()
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
        `)
    }
    if (cfg.goodMod === "simple") {
        ds.push(`
entity Goods {
    Owner: User
    Name: String
    Price: Int
    Stock: Int      
    ${cfg.goodOtherField.join("\n    ")}
}
        `)
        fs.push(`   
fn getAllGoods() -> [Goods] {
    return Goods
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
        `)
    }
    if (cfg.orderMod === "single") {
        ds.push(`
entity Order {
    Buyer: ${cfg.orderModForUserTableName}
    Good: ${cfg.orderModForGoodTableName}
    Count: Int
    TotalPrice: Int
}
        `)
        fs.push(`
fn newOrder(buyerId: ${cfg.orderModForUserTableName}.Id, gid: ${cfg.orderModForGoodTableName}.Id, count: Int) {
    Order.append(Order.new({
        Buyer: buyerId.${cfg.orderModForUserTableName},
        Good: gid.${cfg.orderModForGoodTableName},
        Count: count,
        TotalPrice: gid.${cfg.orderModForGoodTableName}.Price.mul(count).pin()
    }))
}

fn removeOrder(oid: Order.Id) {
    Order.remove(o => o.Id.eq(oid))
}

fn getAllOrder() -> [Order] {
    return Order
}

fn getOnesOrder(uid: ${cfg.orderModForUserTableName}.Id) -> [Order] {
    return Order.filter(o => o.Buyer.Id.eq(uid))
}
        `)
    } else {
        ds.push(`
entity OrderItem {
    Goods: ${cfg.orderModForGoodTableName}
    Count: Int
}

entity Order {
    Buyer: ${cfg.orderModForUserTableName}
    Items: [OrderItem]
    TotalPrice: Int
}
        `)
        fs.push(`
fn newOrder(buyerId: User.Id) {
    Order.append(Order.new({
        Buyer: buyerId.User,
        TotalPrice: 0
    }))
}

fn removeOrder(oid: Order.Id) {
    Order.remove(o => o.Id.eq(oid))
}

fn getAllOrder() -> [Order] {
    return Order
}

fn getOrderItems(oid: Order.Id) -> [OrderItem] {
    return oid.Order.Items
}

fn getOnesOrder(uid: User.Id) -> [Order] {
    return Order.filter(o => o.Buyer.Id.eq(uid))
}
        `)
    }
    return `${ds.join("")}\n${fs.join("")}`.trim();
}

export {
    DEFAULT_SETTING, SETTING_FORM, genDSLFromCfg
}