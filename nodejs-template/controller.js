import koa from "koa";
import koaRouter from "koa-router";
import { koaBody } from "koa-body";
import * as service from "./service.js";

let app = new koa();
let router = new koaRouter();

app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    ctx.set(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,Upgrade-Insecure-Requests"
    );
    await next();
});
app.use(koaBody());

router.post("/login", async (ctx, next) => {
    try {
        let res = await service.login(
            ctx.request.body["name"],
            ctx.request.body["pw"]
        );
        ctx.body = {
            ok: true,
            processFn: "login",
            res,
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "login",
            err: err.message,
        };
    }
});

router.get("/logout", async (ctx, next) => {
    try {
        await service.logout(ctx.query["tok"]);
        ctx.body = {
            ok: true,
            processFn: "logout",
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "logout",
            err: err.message,
        };
    }
});

router.get("/goods", async (ctx, next) => {
    try {
        let res = await service.getAllGoods();
        ctx.body = {
            ok: true,
            processFn: "getAllGoods",
            res,
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "getAllGoods",
            err: err.message,
        };
    }
});

router.post("/goods/new", async (ctx, next) => {
    try {
        await service.newGoods(ctx.request.body["g"]);
        ctx.body = {
            ok: true,
            processFn: "newGoods",
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "newGoods",
            err: err.message,
        };
    }
});

router.post("/goods/:gid/update", async (ctx, next) => {
    try {
        await service.updateGoods(ctx.params["gid"], ctx.request.body["g"]);
        ctx.body = {
            ok: true,
            processFn: "updateGoods",
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "updateGoods",
            err: err.message,
        };
    }
});

router.get("/order", async (ctx, next) => {
    try {
        let res = await service.getAllOrder();
        ctx.body = {
            ok: true,
            processFn: "getAllOrder",
            res,
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "getAllOrder",
            err: err.message,
        };
    }
});

router.post("/order/new", async (ctx, next) => {
    try {
        await service.newOrder(
            ctx.request.body["buyerId"],
            ctx.request.body["gid"],
            ctx.request.body["count"]
        );
        ctx.body = {
            ok: true,
            processFn: "newOrder",
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "newOrder",
            err: err.message,
        };
    }
});

router.post("/order/:oid/remove", async (ctx, next) => {
    try {
        await service.removeOrder(ctx.params["oid"]);
        ctx.body = {
            ok: true,
            processFn: "removeOrder",
        };
    } catch (err) {
        ctx.body = {
            ok: false,
            processFn: "removeOrder",
            err: err.message,
        };
    }
});

router.get("/api", async (ctx, next) => {
    ctx.body = {
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
                    label: "g.'Owner.Id'",
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
                    label: "g.'Owner.Id'",
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
        getAllOrder: {
            url: "/order",
            name: "getAllOrder",
            method: "GET",
            params: {},
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
    };
});

app.use(router.routes()).use(router.allowedMethods()).listen(8877);
