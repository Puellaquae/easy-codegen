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

router.get("/api", async (ctx, next) => {
    ctx.body = {};
});

app.use(router.routes()).use(router.allowedMethods()).listen(8877);
