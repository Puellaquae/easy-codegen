import * as dao from "./dao.js";
import { uuid } from "./utils.js";
import * as utils from "./utils.js";

export const permissionCheck = async (uid, requireLevel) => {
    return (
        (
            await utils.asyncFilter(
                await dao.PermissionArray_SQLGetTable_K4L4WHptXdEM(),
                async (filter_xHqNCk8wixqe) => {
                    return filter_xHqNCk8wixqe["User.Id"] === uid;
                }
            )
        )[0].Level >= requireLevel
    );
};

export const setPermissLevel = async (uid, level) => {
    await (async () => {
        if (
            (
                await utils.asyncFilter(
                    await dao.PermissionArray_SQLGetTable_LWFLzDNkeXqN(),
                    async (filter_v8VGUJh4jf8Rg) => {
                        return filter_v8VGUJh4jf8Rg["User.Id"] === uid;
                    }
                )
            ).length === 0
        ) {
            return (async () => {
                let Fx7eYeCfemGz = await (
                    await dao.User_SQLGet_DigJFzzr7j8U(uid)
                ).Id;
                await dao.Void_SQLGet_BpWipE9FjKTt(level, Fx7eYeCfemGz);
            })();
        } else {
            return (async () => {
                await dao.Void_SQLGet_CJkbxwrjCwYM(level, uid);
            })();
        }
    })();
};

export const signup = async (u) => {
    let Kkgiw7H7rDWt = await u.UserName;
    let YUFeqhzbHrdP = await u.PassWord;
    let v4cHHrwFkUd6F = await u.Age;
    await dao.Void_SQLGet_eFdaxknMVCGn(
        Kkgiw7H7rDWt,
        YUFeqhzbHrdP,
        v4cHHrwFkUd6F
    );
};

export const signdown = async (uid) => {
    await dao.Void_SQLGet_kkMLFccpxqgr(uid);
};

export const login = async (name, pw) => {
    await (async () => {
        if (!((await dao.User_SQLGet_bDnaRThM3bAg(name)).PassWord === pw)) {
            throw new Error("用户名或密码不正确");
        }
    })();
    let iFbfznPXdMxK = await await uuid();
    let UW8NqRFxJBeY = await (await dao.User_SQLGet_kn7QWWiK7nC3(name)).Id;
    await dao.Void_SQLGet_Ew4n8xpQxf4w(iFbfznPXdMxK, UW8NqRFxJBeY);
    return iFbfznPXdMxK;
};

export const logout = async (tok) => {
    await dao.Void_SQLGet_UJJPNfBHeXfV(tok);
};

export const tokenToUser = async (tok) => {
    return await dao.User_SQLGet_KGUGXwKEg8A4(tok);
};

export const getAllGoods = async () => {
    return await dao.GoodsArray_SQLGetTable_XkMhrqgQGJhC();
};

export const newGoods = async (g) => {
    let ttnX9yihE78G = await g["Owner.Id"];
    let FGyq4nA3L7XD = await g.Name;
    let v4G6miGn4CgWg = await g.Price;
    let hmFqHT7CdMiA = await g.Stock;
    let aepwyPJitFiw = await g.Description;
    let qVdDnpcVdiWq = await (
        await dao.User_SQLGet_Bd7kHUi4Twmz(ttnX9yihE78G)
    ).Id;
    await dao.Void_SQLGet_bTF8CdxVihHB(
        FGyq4nA3L7XD,
        v4G6miGn4CgWg,
        hmFqHT7CdMiA,
        aepwyPJitFiw,
        qVdDnpcVdiWq
    );
};

export const removeGoods = async (gid) => {
    await dao.Void_SQLGet_L7WrHngziLf6(gid);
};

export const updateGoods = async (gid, g) => {
    let xmYF9HdApm9b = await g["Owner.Id"];
    let Edat6G48XxaL = await g.Name;
    let GTBe4pcXRq4g = await g.Price;
    let NrAVjebMWGLp = await g.Stock;
    let bakznm63pKBg = await g.Description;
    let k9wxBDEgFeDt = await (
        await dao.User_SQLGet_KY9LLnJ3xqaG(xmYF9HdApm9b)
    ).Id;
    await dao.Void_SQLGet_chcqbDBeC6Ei(
        Edat6G48XxaL,
        GTBe4pcXRq4g,
        NrAVjebMWGLp,
        bakznm63pKBg,
        k9wxBDEgFeDt,
        gid
    );
};

export const newOrder = async (buyerId) => {
    let DdjeFVcmmHgB = await (await dao.User_SQLGet_bdKUJtY8Nmzn(buyerId)).Id;
    await dao.Void_SQLGet_EatQ6NWzdnpJ(DdjeFVcmmHgB);
};

export const removeOrder = async (oid) => {
    await dao.Void_SQLGet_ziMwmdwqyUxJ(oid);
};

export const getAllOrder = async () => {
    return await dao.OrderArray_SQLGetTable_EwKw76GbNLhp();
};

export const getOrderItems = async (oid) => {
    return await dao.OrderItemArray_SQLGet_YMxTmLrqUMbq();
};

export const getOnesOrder = async (uid) => {
    return await utils.asyncFilter(
        await dao.OrderArray_SQLGetTable_eb8VinP4PHry(),
        async (filter_CaajYEktRDEK) => {
            return filter_CaajYEktRDEK["Buyer.Id"] === uid;
        }
    );
};
