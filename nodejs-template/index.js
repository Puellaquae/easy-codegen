import koa from 'koa';
import koaRouter from 'koa-router';
import { dbPool } from './db/pool.js';
import * as utils from "./utils/utils.js";

let app = new koa();
let router = new koaRouter();

router.get('/:cid', (ctx, next) => {
    let cid = ctx.params.cid;
    let params = ctx.query;
    try {
        let ret = test2(cid, {
            "Id": params["p-Id"],
            "Name": params["p-Id"],
            "City.Id": params["p-City-Id"],
            "Age": params["p-Age"],
        });
        ctx.response.body = JSON.stringify(ret);
    } catch(err) {
        ctx.response.body = JSON.stringify(err);
    }
});

console.log(await test());
