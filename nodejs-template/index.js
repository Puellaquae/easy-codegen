import koa from "koa"
import koaRouter from "koa-router"

let app = new koa();
let router = new koaRouter();

router.get("/cate/:cid/goods", (ctx, next) => {
    let cid = ctx.params.cid;
    let params = ctx.query
    let ret = func(cid)
});