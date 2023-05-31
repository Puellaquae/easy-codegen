let infileData = `
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
`;

let line = infileData.split("\n").map(l => l.trim()).filter(l => l != "");

let entities = [];
let apis = [];
let route = [];

let inEntity = false;
let inApi = false;
let inRoute = false;

let tmpGroup = [];
let breaket = 0;

for (const l of line) {
    tmpGroup.push(l);
    if (l.startsWith("entity")) {
        inEntity = true;
    } else if (l.startsWith("fn")) {
        if (!l.endsWith("{")) {
            apis.push(tmpGroup);
            tmpGroup = [];
        } else {
            inApi = true;
        }
    } else if (l.startsWith("route")) {
        inRoute = true;
    } else if (l == "}" && breaket == 0) {
        if (inEntity) {
            entities.push(tmpGroup);
            tmpGroup = [];
        } else if (inApi) {
            apis.push(tmpGroup);
            tmpGroup = [];
        } else if (inRoute) {
            route = tmpGroup;
            tmpGroup = [];
        }
        inEntity = false;
        inApi = false;
        inRoute = false;
    } else if (l == "{") {
        breaket++;
    } else if (l == "}") {
        breaket--;
    }
}

let newRoot = [];
let root = [""];
for (let i = 1; i < route.length - 1; i++) {
    if (route[i].trim().startsWith('"')) {
        let [_a, url, _b] = route[i].split('"');
        root.push(url);
    } else if (route[i].trim() == "}") {
        root.pop();
    } else {
        newRoot.push(`"${root.join("/")}", ${route[i]};`);
    }
}

console.dir(fns, {
    depth: 7
})
