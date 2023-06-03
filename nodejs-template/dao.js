import { dbPool } from "./db.js";

export const PermissionArray_SQLGetTable_DVBQKLNnhVQn = async () => {
    let db = await dbPool.acquire();
    return db.query(`SELECT * FROM "Permission"`);
};

export const PermissionArray_SQLGetTable_btf6Cfgip9J4 = async () => {
    let db = await dbPool.acquire();
    return db.query(`SELECT * FROM "Permission"`);
};

export const void_SQLGet_MCC6Az8QFcw9 = async (level, uid) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Permission" ("Level", "User.Id")
                 VALUES
                     (
                         ($level),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."Id" == ($uid)
                         )
                     )`;
    return db.run(sql, { $level: level, $uid: uid });
};

export const void_SQLGet_LzpG8fcCMymm = async (level, uid) => {
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

export const void_SQLGet_DgbD9WctUrW9 = async (NQmqqpAcPLYy, v6CxFpJqqfMgi) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "User" ("UserName", "PassWord")
                 VALUES
                     (($NQmqqpAcPLYy), ($v6CxFpJqqfMgi))`;
    return db.run(sql, {
        $NQmqqpAcPLYy: NQmqqpAcPLYy,
        $v6CxFpJqqfMgi: v6CxFpJqqfMgi,
    });
};

export const void_SQLGet_qMWAGcyagKLr = async (uid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "User"
                 WHERE
                     (("User"."Id") == ($uid))`;
    return db.run(sql, { $uid: uid });
};

export const User_SQLGet_x4BmnByCgwrt = async (name) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "User"
                 WHERE
                     "User"."UserName" == ($name)`;
    return db.queryOne(sql, { $name: name });
};

export const void_SQLGet_v94ytFBr6XYxw = async (CTYttR4VQnm9, name) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Token" ("Token", "ForUser.Id")
                 VALUES
                     (
                         ($CTYttR4VQnm9),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."UserName" == ($name)
                         )
                     )`;
    return db.run(sql, { $CTYttR4VQnm9: CTYttR4VQnm9, $name: name });
};

export const void_SQLGet_mA36fPR4Kgit = async (tok) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Token"
                 WHERE
                     (("Token"."Token") == ($tok))`;
    return db.run(sql, { $tok: tok });
};

export const User_SQLGet_ViRjayBwa8XR = async (tok) => {
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

export const GoodsArray_SQLGetTable_bBxaWe7rXUmy = async () => {
    let db = await dbPool.acquire();
    return db.query(`SELECT * FROM "Goods"`);
};

export const void_SQLGet_keTaxMQq3hLg = async (
    qbc468NWTmrR,
    L4ncQXjcyNcm,
    wdnW4g7BMVMJ,
    RxKWCekhKaJr
) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Goods" ("Name", "Price", "Stock", "Owner.Id")
                 VALUES
                     (
                         ($qbc468NWTmrR),
                         ($L4ncQXjcyNcm),
                         ($wdnW4g7BMVMJ),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."Id" == ($RxKWCekhKaJr)
                         )
                     )`;
    return db.run(sql, {
        $qbc468NWTmrR: qbc468NWTmrR,
        $L4ncQXjcyNcm: L4ncQXjcyNcm,
        $wdnW4g7BMVMJ: wdnW4g7BMVMJ,
        $RxKWCekhKaJr: RxKWCekhKaJr,
    });
};

export const void_SQLGet_v6RECeezrpT8w = async (gid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Goods"
                 WHERE
                     (("Goods"."Id") == ($gid))`;
    return db.run(sql, { $gid: gid });
};

export const void_SQLGet_v9NE9mPqQP7Qh = async (
    TWXWTyKX33z3,
    fpbg8PgTKth8,
    FLFCzpnDbJTg,
    eEjmxnk3JP6e,
    gid
) => {
    const db = await dbPool.acquire();
    const sql = `UPDATE Goods
                 SET
                     (
                         "Name" = ($TWXWTyKX33z3),
                         "Price" = ($fpbg8PgTKth8),
                         "Stock" = ($FLFCzpnDbJTg),
                         "Owner.Id" = (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."Id" == ($eEjmxnk3JP6e)
                         )
                     )
                 WHERE
                     "Goods"."Id" == (
                         SELECT
                             "Id"
                         FROM
                             "Goods"
                         WHERE
                             "Goods"."Id" == ($gid)
                     )`;
    return db.run(sql, {
        $TWXWTyKX33z3: TWXWTyKX33z3,
        $fpbg8PgTKth8: fpbg8PgTKth8,
        $FLFCzpnDbJTg: FLFCzpnDbJTg,
        $eEjmxnk3JP6e: eEjmxnk3JP6e,
        $gid: gid,
    });
};

export const Goods_SQLGet_cTnPPMa68KJB = async (gid) => {
    const db = await dbPool.acquire();
    const sql = `SELECT
                     *
                 FROM
                     "Goods"
                 WHERE
                     "Goods"."Id" == ($gid)`;
    return db.queryOne(sql, { $gid: gid });
};

export const void_SQLGet_R33Nz7tjVfqG = async (
    count,
    tm4yWbC948B4,
    buyerId,
    gid
) => {
    const db = await dbPool.acquire();
    const sql = `INSERT INTO
                     "Order" ("Count", "TotalPrice", "Buyer.Id", "Good.Id")
                 VALUES
                     (
                         ($count),
                         ($tm4yWbC948B4),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "User"
                             WHERE
                                 "User"."Id" == ($buyerId)
                         ),
                         (
                             SELECT
                                 "Id"
                             FROM
                                 "Goods"
                             WHERE
                                 "Goods"."Id" == ($gid)
                         )
                     )`;
    return db.run(sql, {
        $count: count,
        $tm4yWbC948B4: tm4yWbC948B4,
        $buyerId: buyerId,
        $gid: gid,
    });
};

export const void_SQLGet_jRJCAxkGw4hH = async (oid) => {
    const db = await dbPool.acquire();
    const sql = `DELETE FROM "Order"
                 WHERE
                     (("Order"."Id") == ($oid))`;
    return db.run(sql, { $oid: oid });
};

export const OrderArray_SQLGetTable_NcMb9jtTBGCr = async () => {
    let db = await dbPool.acquire();
    return db.query(`SELECT * FROM "Order"`);
};
