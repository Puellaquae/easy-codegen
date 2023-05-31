import koa from 'koa';
import koaRouter from 'koa-router';
import { dbPool } from './db.js';
import * as utils from './utils.js';

let app = new koa();
let router = new koaRouter();

const void_SQLGet_KyJ7LY9PXfHX = async (uid, level) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     Permission ("User", "Level")
                 VALUES
                     (
                         (
                             SELECT
                                 *
                             FROM
                                 "User"
                             WHERE
                                 "User"."Id" == ($uid)
                         ),
                         ($level)
                     )`;
    return db.run(sql, { $uid: uid, $level: level });
};

const void_SQLGet_cMp3XWCnzpDY = async (level, uid) => {
    const db = await dbPool.acquire();
    const sql = `UPDATE "Permission"
                 SET
                     "Level" = ($level)
                 WHERE
                     "Permission"."Id" == (
                         SELECT
                             "Id"
                         FROM
                             "Permission"
                         WHERE
                             (("Permission"."User.Id") == ($uid))
                         LIMIT
                             1
                     )`;
    return db.run(sql, { $level: level, $uid: uid });
};

const setPermissLevel = async (uid, level) => {
    (async () => {
        if (
            (await PermissionArray_SQLGetTable_NBTWRKt6whk4()).filter(
                async (filter_qgG98bf7fFt7) => {
                    filter_qgG98bf7fFt7["User.Id"] === uid;
                }
            ).length === 0
        ) {
            return (async () => {
                await void_SQLGet_KyJ7LY9PXfHX(uid, level);
            })();
        } else {
            return (async () => {
                await void_SQLGet_cMp3XWCnzpDY(level, uid);
            })();
        }
    })();
};