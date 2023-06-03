import * as dao from "./dao.js";
import { uuid } from "./utils.js";
import * as utils from "./utils.js";

export const permissionCheck = async (uid, requireLevel) => {
    return (
        (await dao.PermissionArray_SQLGetTable_DVBQKLNnhVQn()).filter(
            async (filter_Md7dMfd7JAga) => {
                return filter_Md7dMfd7JAga["User.Id"] === uid;
            }
        )[0].Level >= requireLevel
    );
};

export const setPermissLevel = async (uid, level) => {
    (async () => {
        if (
            (await dao.PermissionArray_SQLGetTable_btf6Cfgip9J4()).filter(
                async (filter_rNnKyTd4ihcG) => {
                    return filter_rNnKyTd4ihcG["User.Id"] === uid;
                }
            ).length === 0
        ) {
            return (async () => {
                await dao.void_SQLGet_MCC6Az8QFcw9(level, uid);
            })();
        } else {
            return (async () => {
                await dao.void_SQLGet_LzpG8fcCMymm(level, uid);
            })();
        }
    })();
};

export const signup = async (u) => {
    let NQmqqpAcPLYy = u.UserName;
    let v6CxFpJqqfMgi = u.PassWord;
    await dao.void_SQLGet_DgbD9WctUrW9(NQmqqpAcPLYy, v6CxFpJqqfMgi);
};

export const signdown = async (uid) => {
    await dao.void_SQLGet_qMWAGcyagKLr(uid);
};

export const login = async (name, pw) => {
    await (async () => {
        if (!((await dao.User_SQLGet_x4BmnByCgwrt(name)).PassWord === pw)) {
            throw new Error("用户名或密码不正确");
        }
    })();
    let CTYttR4VQnm9 = uuid();
    await dao.void_SQLGet_v94ytFBr6XYxw(CTYttR4VQnm9, name);
    return CTYttR4VQnm9;
};

export const logout = async (tok) => {
    await dao.void_SQLGet_mA36fPR4Kgit(tok);
};

export const tokenToUser = async (tok) => {
    return await dao.User_SQLGet_ViRjayBwa8XR(tok);
};

export const getAllGoods = async () => {
    return await dao.GoodsArray_SQLGetTable_bBxaWe7rXUmy();
};

export const newGoods = async (g) => {
    let RxKWCekhKaJr = g["Owner.Id"];
    let qbc468NWTmrR = g.Name;
    let L4ncQXjcyNcm = g.Price;
    let wdnW4g7BMVMJ = g.Stock;
    await dao.void_SQLGet_keTaxMQq3hLg(
        qbc468NWTmrR,
        L4ncQXjcyNcm,
        wdnW4g7BMVMJ,
        RxKWCekhKaJr
    );
};

export const removeGoods = async (gid) => {
    await dao.void_SQLGet_v6RECeezrpT8w(gid);
};

export const updateGoods = async (gid, g) => {
    let eEjmxnk3JP6e = g["Owner.Id"];
    let TWXWTyKX33z3 = g.Name;
    let fpbg8PgTKth8 = g.Price;
    let FLFCzpnDbJTg = g.Stock;
    await dao.void_SQLGet_v9NE9mPqQP7Qh(
        TWXWTyKX33z3,
        fpbg8PgTKth8,
        FLFCzpnDbJTg,
        eEjmxnk3JP6e,
        gid
    );
};

export const newOrder = async (buyerId, gid, count) => {
    let tm4yWbC948B4 = (await dao.Goods_SQLGet_cTnPPMa68KJB(gid)).Price * count;
    await dao.void_SQLGet_R33Nz7tjVfqG(count, tm4yWbC948B4, buyerId, gid);
};

export const removeOrder = async (oid) => {
    await dao.void_SQLGet_jRJCAxkGw4hH(oid);
};

export const getAllOrder = async () => {
    return await dao.OrderArray_SQLGetTable_NcMb9jtTBGCr();
};
