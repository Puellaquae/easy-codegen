import { dbPool } from "./db.js";

export const PermissionArray_SQLGetTable_K4L4WHptXdEM = async () => {
    let db = await dbPool.acquire();
    let ret = await db.query(`SELECT * FROM "Permission"`);
    dbPool.release(db);
    return ret;
};

export const PermissionArray_SQLGetTable_LWFLzDNkeXqN = async () => {
    let db = await dbPool.acquire();
    let ret = await db.query(`SELECT * FROM "Permission"`);
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_DigJFzzr7j8U = async (uid) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."Id" == ($uid)`;
    let ret = await db.queryOne(sql, { $uid: uid });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_BpWipE9FjKTt = async (level, Fx7eYeCfemGz) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Permission" ("Level", "User.Id")
                 VALUES
                     (($level), ($Fx7eYeCfemGz))`;
    let ret = await db.run(sql, { $level: level, $Fx7eYeCfemGz: Fx7eYeCfemGz });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_CJkbxwrjCwYM = async (level, uid) => {
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
    let ret = await db.run(sql, { $level: level, $uid: uid });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_eFdaxknMVCGn = async (
    Kkgiw7H7rDWt,
    YUFeqhzbHrdP,
    v4cHHrwFkUd6F
) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "User" ("UserName", "PassWord", "Age")
                 VALUES
                     (
                         ($Kkgiw7H7rDWt),
                         ($YUFeqhzbHrdP),
                         ($v4cHHrwFkUd6F)
                     )`;
    let ret = await db.run(sql, {
        $Kkgiw7H7rDWt: Kkgiw7H7rDWt,
        $YUFeqhzbHrdP: YUFeqhzbHrdP,
        $v4cHHrwFkUd6F: v4cHHrwFkUd6F,
    });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_kkMLFccpxqgr = async (uid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "User"
                 WHERE
                     (("User"."Id") == ($uid))`;
    let ret = await db.run(sql, { $uid: uid });
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_bDnaRThM3bAg = async (name) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."UserName" == ($name)`;
    let ret = await db.queryOne(sql, { $name: name });
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_kn7QWWiK7nC3 = async (name) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."UserName" == ($name)`;
    let ret = await db.queryOne(sql, { $name: name });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_Ew4n8xpQxf4w = async (iFbfznPXdMxK, UW8NqRFxJBeY) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Token" ("Token", "ForUser.Id")
                 VALUES
                     (($iFbfznPXdMxK), ($UW8NqRFxJBeY))`;
    let ret = await db.run(sql, {
        $iFbfznPXdMxK: iFbfznPXdMxK,
        $UW8NqRFxJBeY: UW8NqRFxJBeY,
    });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_UJJPNfBHeXfV = async (tok) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Token"
                 WHERE
                     (("Token"."Token") == ($tok))`;
    let ret = await db.run(sql, { $tok: tok });
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_KGUGXwKEg8A4 = async (tok) => {
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
    let ret = await db.queryOne(sql, { $tok: tok });
    dbPool.release(db);
    return ret;
};

export const GoodsArray_SQLGetTable_XkMhrqgQGJhC = async () => {
    let db = await dbPool.acquire();
    let ret = await db.query(`SELECT * FROM "Goods"`);
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_Bd7kHUi4Twmz = async (ttnX9yihE78G) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."Id" == ($ttnX9yihE78G)`;
    let ret = await db.queryOne(sql, { $ttnX9yihE78G: ttnX9yihE78G });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_bTF8CdxVihHB = async (
    FGyq4nA3L7XD,
    v4G6miGn4CgWg,
    hmFqHT7CdMiA,
    aepwyPJitFiw,
    qVdDnpcVdiWq
) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Goods" (
                         "Name",
                         "Price",
                         "Stock",
                         "Description",
                         "Owner.Id"
                     )
                 VALUES
                     (
                         ($FGyq4nA3L7XD),
                         ($v4G6miGn4CgWg),
                         ($hmFqHT7CdMiA),
                         ($aepwyPJitFiw),
                         ($qVdDnpcVdiWq)
                     )`;
    let ret = await db.run(sql, {
        $FGyq4nA3L7XD: FGyq4nA3L7XD,
        $v4G6miGn4CgWg: v4G6miGn4CgWg,
        $hmFqHT7CdMiA: hmFqHT7CdMiA,
        $aepwyPJitFiw: aepwyPJitFiw,
        $qVdDnpcVdiWq: qVdDnpcVdiWq,
    });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_L7WrHngziLf6 = async (gid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Goods"
                 WHERE
                     (("Goods"."Id") == ($gid))`;
    let ret = await db.run(sql, { $gid: gid });
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_KY9LLnJ3xqaG = async (xmYF9HdApm9b) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."Id" == ($xmYF9HdApm9b)`;
    let ret = await db.queryOne(sql, { $xmYF9HdApm9b: xmYF9HdApm9b });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_chcqbDBeC6Ei = async (
    Edat6G48XxaL,
    GTBe4pcXRq4g,
    NrAVjebMWGLp,
    bakznm63pKBg,
    k9wxBDEgFeDt,
    gid
) => {
    const db = await dbPool.acquire();
    const sql = `UPDATE Goods
                 SET
                     "Name" = ($Edat6G48XxaL),
                     "Price" = ($GTBe4pcXRq4g),
                     "Stock" = ($NrAVjebMWGLp),
                     "Description" = ($bakznm63pKBg),
                     "Owner.Id" = ($k9wxBDEgFeDt)
                 WHERE
                     "Goods"."Id" == (
                         SELECT
                             "Id"
                         FROM
                             "Goods"
                         WHERE
                             "Goods"."Id" == ($gid)
                     )`;
    let ret = await db.run(sql, {
        $Edat6G48XxaL: Edat6G48XxaL,
        $GTBe4pcXRq4g: GTBe4pcXRq4g,
        $NrAVjebMWGLp: NrAVjebMWGLp,
        $bakznm63pKBg: bakznm63pKBg,
        $k9wxBDEgFeDt: k9wxBDEgFeDt,
        $gid: gid,
    });
    dbPool.release(db);
    return ret;
};

export const User_SQLGet_bdKUJtY8Nmzn = async (buyerId) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."Id" == ($buyerId)`;
    let ret = await db.queryOne(sql, { $buyerId: buyerId });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_EatQ6NWzdnpJ = async (DdjeFVcmmHgB) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Order" ("TotalPrice", "Buyer.Id")
                 VALUES
                     ((0), ($DdjeFVcmmHgB))`;
    let ret = await db.run(sql, { $DdjeFVcmmHgB: DdjeFVcmmHgB });
    dbPool.release(db);
    return ret;
};

export const Void_SQLGet_ziMwmdwqyUxJ = async (oid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Order"
                 WHERE
                     (("Order"."Id") == ($oid))`;
    let ret = await db.run(sql, { $oid: oid });
    dbPool.release(db);
    return ret;
};

export const OrderArray_SQLGetTable_EwKw76GbNLhp = async () => {
    let db = await dbPool.acquire();
    let ret = await db.query(`SELECT * FROM "Order"`);
    dbPool.release(db);
    return ret;
};

export const OrderItemArray_SQLGet_YMxTmLrqUMbq = async () => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     "OrderItem"
                 FROM
                     "Order-Items-OrderItem",
                     "OrderItem"
                 WHERE
                     "OrderItem"."Id" == "Order-Items-OrderItem"."R.OrderItem.Id"
                     AND "Order-Items-OrderItem"."L.Order.Id" == (
                         SELECT
                             "Id"
                         FROM
                             "Order"
                         WHERE
                             "Order"."Id" == ($oid)
                     )`;
    let ret = await db.query(sql);
    dbPool.release(db);
    return ret;
};

export const OrderArray_SQLGetTable_eb8VinP4PHry = async () => {
    let db = await dbPool.acquire();
    let ret = await db.query(`SELECT * FROM "Order"`);
    dbPool.release(db);
    return ret;
};
