import koa from 'koa';
import koaRouter from 'koa-router';
import { dbPool } from './db/pool.js';
import * as utils from "./utils/utils.js";

let app = new koa();
let router = new koaRouter();

router.get('/cate/:cid/goods', (ctx, next) => {
    let cid = ctx.params.cid;
    let params = ctx.query;
    let ret = func(cid);
});

const User_NameArray_SQLGet_9YWqqPtDLegK = async () => {
    let db = await dbPool.acquire();
    return db.queryElem(
        `SELECT * FROM (SELECT ("User"."Name") FROM "User" WHERE (("User"."Id") == (1))) WHERE (("Name") LIKE ('%S%'))`
    );
};

const test = async () => await User_NameArray_SQLGet_9YWqqPtDLegK();

console.log(await test());
