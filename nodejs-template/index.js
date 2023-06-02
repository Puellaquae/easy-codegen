import koa from 'koa';
import koaRouter from 'koa-router';
import { dbPool } from './db.js';
import * as utils from './utils.js';

import nanoidDictionary from 'nanoid-dictionary';
const { nolookalikes } = nanoidDictionary;
import { customAlphabet } from 'nanoid';
const uuid = customAlphabet(nolookalikes, 12);

let app = new koa();
let router = new koaRouter();

const User_SQLGet_PmrGjDg3mLEF = async (name) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."UserName" == ($name)`;
    return db.queryOne(sql, { $name: name });
};

const void_SQLGet_XKTzz3dYqcQX = async (EjaM4WdgnEPC, name) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     Token ("Token", "ForUser.Id")
                 VALUES
                     (
                         ($EjaM4WdgnEPC),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."UserName" == ($name)
                         )
                     )`;
    return db.run(sql, { $EjaM4WdgnEPC: EjaM4WdgnEPC, $name: name });
};

const login = async (name, pw) => {
    await (async () => {
        if (!((await User_SQLGet_PmrGjDg3mLEF(name)).PassWord === pw)) {
            throw new Error("用户名或密码不正确");
        }
    })();
    let EjaM4WdgnEPC = uuid();
    await void_SQLGet_XKTzz3dYqcQX(EjaM4WdgnEPC, name);
    return EjaM4WdgnEPC;
};

const void_SQLGet_YRmdqqLa7APn = async (tok) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Token"
                 WHERE
                     (("Token"."Token") == ($tok))`;
    return db.run(sql, { $tok: tok });
};

const logout = async (tok) => {
    await void_SQLGet_YRmdqqLa7APn(tok);
};

const User_SQLGet_ytNd9XWwK86k = async (tok) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."Id" == (
                         SELECT
                             "ForUser.Id"
                         FROM
                             "Token"
                         WHERE
                             "Token"."Token" == ($tok)
                     )`;
    return db.queryOne(sql, { $tok: tok });
};

const tokenToUser = async (tok) => {
    return await User_SQLGet_ytNd9XWwK86k(tok);
};

let tok = await login('aaa', 'bbb');
console.log(tok);
console.log(await tokenToUser(tok));
await logout(tok);
console.log(await tokenToUser(tok));

