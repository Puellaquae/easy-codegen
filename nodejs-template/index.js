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

const Person_SQLGet_wwGpVNDWitRh = async (pid) => {
    let db = await dbPool.acquire();
    return db.queryOne(`SELECT * FROM "Person" WHERE "Person"."Id" == ($pid)`, {
        $pid: pid,
    });
};

const City_SQLGet_bW8rN9tjHeXK = async () => {
    let db = await dbPool.acquire();
    return db.queryOne(
        `SELECT * FROM "City" WHERE "City"."Id" == (SELECT "City.Id" FROM "Person" WHERE "Person"."Id" == ($pid))`
    );
};

const Person_SQLGet_jMrp9cb4V7aM = async (pid) => {
    let db = await dbPool.acquire();
    return db.queryOne(`SELECT * FROM "Person" WHERE "Person"."Id" == ($pid)`, {
        $pid: pid,
    });
};

const PersonArray_SQLGet_dp43QYi4MRCU = async () => {
    let db = await dbPool.acquire();
    return db.query(
        `SELECT "Person" FROM "Person-Friends-Person", "Person" WHERE "Person"."Id" == "Person-Friends-Person"."R.Person.Id" AND "Person-Friends-Person"."L.Person.Id" == (SELECT "Id" FROM "Person" WHERE "Person"."Id" == ($pid))`
    );
};

const PersonArray_SQLGetTable_JaLaMjit9Jxn = async () => {
    let db = await dbPool.acquire();
    return db.query(`SELECT * FROM "Person"`);
};

const test = async (pid) => {
    await (async () => {
        if (!((await Person_SQLGet_wwGpVNDWitRh(pid)).Age >= 8)) {
            throw new Error("年龄未满8岁");
        }
    })();
    return Promise.all(
        (async () => {
            if (!((await City_SQLGet_bW8rN9tjHeXK()) === null)) {
                return (async () => {
                    return (await PersonArray_SQLGet_dp43QYi4MRCU()).filter(
                        async (filter_6R9ypnDGBAdb) => {
                            return (
                                filter_6R9ypnDGBAdb.Age ===
                                (await Person_SQLGet_jMrp9cb4V7aM(pid)).Age
                            );
                        }
                    );
                })();
            } else {
                return (async () => {
                    return (await PersonArray_SQLGetTable_JaLaMjit9Jxn()).slice(
                        0,
                        0 + 10
                    );
                })();
            }
        })().map(async (map_xCkGMiL47qRb) => {
            return map_xCkGMiL47qRb.Name;
        })
    );
};

console.log(await test());
