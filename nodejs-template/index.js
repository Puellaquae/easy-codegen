import koa from "koa"
import koaRouter from "koa-router"
import { dbPool } from "./db/pool.js";

let app = new koa();
let router = new koaRouter();

router.get("/cate/:cid/goods", (ctx, next) => {
    let cid = ctx.params.cid;
    let params = ctx.query
    let ret = func(cid)
});

let db = await dbPool.acquire();
let r = await db.query('SELECT SUM(Id) FROM (SELECT Test.Id FROM "Test" LIMIT 10 OFFSET 0)');
console.log(r);
