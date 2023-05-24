import assert, { ok } from 'assert';
import nanoidDictionary from 'nanoid-dictionary';
const { nolookalikes } = nanoidDictionary;
import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet(nolookalikes, 12);

const UTILS = {
    uniqueArray(arr) {
        return Array.from(new Set(arr));
    },
};

const SQL_TABLE_TYPES = {
    Img: {
        kind: 'object',
        primaryMember: 'Id',
        uniqueMember: ['Path', 'Id'],
        typename: 'Img',
        member: {
            Path: {
                kind: 'unit',
                typename: 'Img.Path',
                alias: 'String',
            },
            Id: {
                kind: 'unit',
                typename: 'Img.Id',
                alias: 'Int',
            },
        },
    },
    Food: {
        kind: 'object',
        primaryMember: 'Id',
        uniqueMember: ['Id'],
        typename: 'Food',
        member: {
            Name: {
                kind: 'unit',
                typename: 'Food.Name',
                alias: 'String',
            },
            Img: {
                kind: 'unit',
                typename: 'Img',
            },
            Price: {
                kind: 'unit',
                typename: 'Food.Price',
                alias: 'Int',
            },
            Id: {
                kind: 'unit',
                typename: 'Food.Id',
                alias: 'Int',
            },
        },
    },
    Table: {
        kind: 'object',
        primaryMember: 'Id',
        uniqueMember: ['Id'],
        typename: 'Table',
        member: {
            CurOrder: {
                kind: 'unit',
                typename: 'Order',
            },
            Id: {
                kind: 'unit',
                typename: 'Table.Id',
                alias: 'Int',
            },
        },
    },
    OrderItem: {
        kind: 'object',
        primaryMember: 'Id',
        uniqueMember: ['Id'],
        typename: 'OrderItem',
        member: {
            Food: {
                kind: 'unit',
                typename: 'Food',
            },
            Count: {
                kind: 'unit',
                typename: 'OrderItem.Count',
                alias: 'Int',
            },
            Id: {
                kind: 'unit',
                typename: 'OrderItem.Id',
                alias: 'Int',
            },
        },
    },
    Order: {
        kind: 'object',
        primaryMember: 'Id',
        uniqueMember: ['Items', 'Id'],
        typename: 'Order',
        member: {
            Table: {
                kind: 'unit',
                typename: 'Table',
            },
            Closed: {
                kind: 'unit',
                typename: 'Order.Closed',
                alias: 'Int',
            },
            Items: {
                kind: 'array',
                type: {
                    kind: 'unit',
                    typename: 'OrderItem',
                },
            },
            Id: {
                kind: 'unit',
                typename: 'Order.Id',
                alias: 'Int',
            },
        },
    },
};

const BASIC_TYPES = {
    Int: {
        kind: 'basic',
        typename: 'int',
    },
    String: {
        kind: 'basic',
        typename: 'str',
    },
    Blob: {
        kind: 'basic',
        typename: 'blob',
    },
    Bool: {
        kind: 'basic',
        typename: 'bool',
    },
    Void: {
        kind: 'basic',
        typename: 'void',
    },
};

function resolveTypeSelfRef(all, basic, cur, update) {
    if (cur.kind === 'unit' && all[cur.typename] !== undefined) {
        update(all[cur.typename]);
    } else if (
        cur.kind === 'unit' &&
        cur.alias !== undefined &&
        basic[cur.alias] !== undefined
    ) {
        cur.alias = basic[cur.alias];
    } else if (cur.kind === 'array') {
        resolveTypeSelfRef(all, basic, cur.type, (t) => (cur.type = t));
    } else if (cur.kind === 'object') {
        for (let mtype of Object.keys(cur.member)) {
            resolveTypeSelfRef(
                all,
                basic,
                cur.member[mtype],
                (t) => (cur.member[mtype] = t)
            );
        }
    }
}

for (let type of Object.keys(SQL_TABLE_TYPES)) {
    resolveTypeSelfRef(
        SQL_TABLE_TYPES,
        BASIC_TYPES,
        SQL_TABLE_TYPES[type],
        (t) => (SQL_TABLE_TYPES[type] = t)
    );
}

const UNREACHABLE = (inf = '') => {
    throw new Error(`unreachable ${inf}`);
};

const UNIMPLEMENTED = () => {
    throw new Error('unimplemented');
};

const TYPE_ERROR = () => {
    throw new Error('type-error');
};

const PLATFORMS = {
    HOST: 'host',
    SQL: 'sql',
    BOTH: 'both',
};

function arrayOfType(type) {
    return {
        kind: 'array',
        type,
    };
}

function sqlIdentOfType(type) {
    if (type.kind === 'object') {
        return `"${type.typename}"`;
    } else if (type.kind === 'unit') {
        return `${type.typename
            .split('.')
            .map((t) => `"${t}"`)
            .join('.')}`;
    } else if (type.kind === 'array') {
        return sqlIdentOfType(type.type);
    }
    assert(false, 'basic type no sql ident');
}

function inFnNameOfType(type) {
    if (type.kind === 'array') {
        return `${inFnNameOfType(type.type)}Array`;
    }
    return type.typename;
}

function typeEqual(ta, tb) {
    let tl = ta.kind === 'unit' ? ta.alias : ta;
    let tr = tb.kind === 'unit' ? tb.alias : tb;
    if (tl.kind !== tr.kind) {
        return false;
    }
    if (tl.kind === 'basic') {
        return tl.typename === tr.typename;
    } else if (tl.kind === 'array') {
        return typeEqual(tl.type, tr.type);
    } else if (tl.kind === 'object') {
        for (const tlm of Object.keys(tl.member)) {
            if (tr.member[tlm] === undefined) {
                return false;
            }
            if (!typeEqual(tl.member[tlm], tr.member[tlm])) {
                return false;
            }
        }
        return true;
    }
    UNREACHABLE();
}

/**
 *
 * @param {string} typename
 * @returns {string}
 */
function getParentType(typename) {
    let [p, _c] = typename.split('.');
    return p;
}

/**
 *
 * @param {string} typename
 * @returns {string}
 */
function getMemberName(typename) {
    let [_p, c] = typename.split('.');
    return c;
}

const OPERATORS = {
    VAR: 'var',
    CONST: 'const',
    FIRST: 'first',
    FILTER: 'filter',
    MAP: 'map',
    SUM: 'sum',
    COUNT: 'count',
    SLICE: 'slice',
    REACCESS: 'reacess',
    MEMBER_ACCESS: 'member-access',
    FOREIGN_MEMBER_ACCESS: 'foreign-member-access',
    ARRAY_MEMBER_ACCESS: 'array-member-access',
    IS_NULL: 'is-null',
    NOT: 'not',
    EQ: 'eq',
    NEQ: 'neq',
    LT: 'lt',
    LE: 'le',
    GT: 'gt',
    GE: 'ge',
    LIKE: 'like',
    AND: 'and',
    OR: 'or',
    ADD: 'add',
    SUB: 'sub',
    MUL: 'mul',
    DIV: 'div',
    SELF_ADD: 'self-add',
    SELF_SUB: 'self-sub',
    SELF_MUL: 'self-mul',
    SELF_DIV: 'self-div',
    COND: 'cond',
    APPEND: 'append',
    NEW: 'new',
    FUNC: 'func',
    ASSERT: 'assert',
    // Specifial operator
    SQL_TO_HOST: 'sql-to-host',
};

const RAW_DATA = Symbol('de-proxy');

let effectExprs = [];

const PROXY_HANDLER = {
    get(target, p, receiver) {
        if (p === RAW_DATA) {
            return target;
        }
        if (target.type.kind === 'array') {
            if (p === 'first') {
                return () => {
                    return createOneChild(
                        OPERATORS.FIRST,
                        PLATFORMS.BOTH,
                        target.type.type,
                        target
                    );
                };
            } else if (p === 'filter') {
                return (fn) => {
                    let fnE = functionProcess(fn, [
                        createVar(PLATFORMS.BOTH, target.type.type, {
                            name: `filter_${nanoid()}`,
                            kind: 'filter-iter',
                        }),
                    ]);
                    if (typeEqual(fnE[RAW_DATA].type, BASIC_TYPES.Bool)) {
                        return createMultiChild(
                            OPERATORS.FILTER,
                            PLATFORMS.BOTH,
                            target.type,
                            {
                                left: target,
                                right: fnE[RAW_DATA],
                            }
                        );
                    }
                    TYPE_ERROR();
                };
            } else if (p === 'map') {
                return (fn) => {
                    let fnE = functionProcess(fn, [
                        createVar(PLATFORMS.BOTH, target.type.type, {
                            name: `map_${nanoid()}`,
                            kind: 'map-iter',
                        }),
                    ]);
                    if (typeEqual(fnE[RAW_DATA].type, BASIC_TYPES.Void)) {
                        TYPE_ERROR();
                    }
                    return createMultiChild(
                        OPERATORS.MAP,
                        PLATFORMS.BOTH,
                        arrayOfType(fnE[RAW_DATA].type),
                        {
                            left: target,
                            right: fnE[RAW_DATA],
                        }
                    );
                };
            } else if (p === 'sum') {
                if (typeEqual(target.type.type, BASIC_TYPES.Int)) {
                    return () => {
                        return createOneChild(
                            OPERATORS.SUM,
                            PLATFORMS.BOTH,
                            target.type.type,
                            target
                        );
                    };
                }
                TYPE_ERROR();
            } else if (p === 'count') {
                return () => {
                    return createOneChild(
                        OPERATORS.COUNT,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Int,
                        target
                    );
                };
            } else if (p === 'slice') {
                return (off, len) => {
                    let offE = null;
                    if (typeof off === 'number') {
                        offE = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            off
                        );
                    } else if (typeEqual(off[RAW_DATA].type, BASIC_TYPES.Int)) {
                        offE = off;
                    } else {
                        TYPE_ERROR();
                    }

                    let lenE = null;
                    if (typeof len === 'number') {
                        lenE = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            len
                        );
                    } else if (typeEqual(len[RAW_DATA].type, BASIC_TYPES.Int)) {
                        lenE = len;
                    } else {
                        TYPE_ERROR();
                    }

                    return createMultiChild(
                        OPERATORS.SLICE,
                        PLATFORMS.BOTH,
                        target.type,
                        {
                            src: target,
                            off: offE[RAW_DATA],
                            len: lenE[RAW_DATA],
                        }
                    );
                };
            } else if (p === 'append') {
                return (val) => {
                    if (typeEqual(val[RAW_DATA].type, target.type.type)) {
                        let e = createMultiChild(
                            OPERATORS.APPEND,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Void,
                            {
                                left: target,
                                right: val[RAW_DATA],
                            }
                        );
                        effectExprs.push(e);
                        return;
                    }
                    TYPE_ERROR();
                };
            }
        }
        // check if reaccessable
        if (target.type.kind === 'unit') {
            let parentType = getParentType(target.type.typename);
            let memberName = getMemberName(target.type.typename);
            /** @type {string[]} */
            let reaccessableMember = SQL_TABLE_TYPES[parentType].uniqueMember;
            if (reaccessableMember.includes(memberName)) {
                // reaccessable
                if (p === parentType) {
                    return createOneChild(
                        OPERATORS.REACCESS,
                        PLATFORMS.SQL,
                        SQL_TABLE_TYPES[parentType],
                        target
                    );
                }
            }
        }
        // check if member access
        if (target.type.kind === 'object') {
            if (target.type.member[p] !== undefined) {
                let pType = target.type.member[p];
                if (pType.kind === 'unit' || pType.kind === 'basic') {
                    // normal member access
                    return createOneChild(
                        OPERATORS.MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target
                    );
                } else if (pType.kind === 'object') {
                    // foreign member access
                    return createOneChild(
                        OPERATORS.FOREIGN_MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target
                    );
                } else if (pType.kind === 'array') {
                    // foreign array member access
                    return createOneChild(
                        OPERATORS.ARRAY_MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target
                    );
                }
            }
        }

        // create new table entity
        if (target.inf.globalTable && p === 'new') {
            return (obj) => {
                TODO();
            };
        }

        if (target.type.kind !== 'basic' && p == 'isNull') {
            return () =>
                createOneChild(
                    OPERATORS.IS_NULL,
                    PLATFORMS.BOTH,
                    BASIC_TYPES.Bool,
                    target
                );
        }

        if (['eq', 'lt', 'le', 'gt', 'ge', 'neq'].includes(p)) {
            let op = {
                eq: OPERATORS.EQ,
                neq: OPERATORS.NEQ,
                lt: OPERATORS.LT,
                le: OPERATORS.LE,
                gt: OPERATORS.GT,
                GE: OPERATORS.GE,
            }[p];
            return (val) => {
                if (
                    typeEqual(target.type, BASIC_TYPES.String) &&
                    typeof val === 'string'
                ) {
                    let r = createConst(
                        PLATFORMS.BOTH,
                        BASIC_TYPES.String,
                        val
                    );
                    return createMultiChild(
                        op,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Bool,
                        {
                            left: target,
                            right: r[RAW_DATA],
                        }
                    );
                }
                if (
                    typeEqual(target.type, BASIC_TYPES.Int) &&
                    typeof val === 'number'
                ) {
                    let r = createConst(PLATFORMS.BOTH, BASIC_TYPES.Int, val);
                    return createMultiChild(
                        op,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Bool,
                        {
                            left: target,
                            right: r[RAW_DATA],
                        }
                    );
                }
                if (typeEqual(target.type, val[RAW_DATA].type)) {
                    return createMultiChild(
                        op,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Bool,
                        {
                            left: target,
                            right: val[RAW_DATA],
                        }
                    );
                }
                TYPE_ERROR();
            };
        }

        if (typeEqual(target.type, BASIC_TYPES.String)) {
            if (p === 'like') {
                return (str) => {
                    if (typeof str === 'string') {
                        let r = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.String,
                            str
                        );
                        return createMultiChild(
                            OPERATORS.LIKE,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Bool,
                            {
                                left: target,
                                right: r[RAW_DATA],
                            }
                        );
                    }
                    if (typeEqual(str[RAW_DATA].type, BASIC_TYPES.String)) {
                        return createMultiChild(
                            OPERATORS.LIKE,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Bool,
                            {
                                left: target,
                                right: str[RAW_DATA],
                            }
                        );
                    }
                    TYPE_ERROR();
                };
            }
        }

        if (typeEqual(target.type, BASIC_TYPES.Bool)) {
            if (['and', 'or'].includes(p)) {
                let op = {
                    and: OPERATORS.AND,
                    or: OPERATORS.OR,
                }[p];
                return (b) => {
                    if (typeof val === 'boolean') {
                        let r = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Bool,
                            val
                        );
                        return createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Bool,
                            {
                                left: target,
                                right: r[RAW_DATA],
                            }
                        );
                    }
                    if (typeEqual(b[RAW_DATA].type, BASIC_TYPES.Bool)) {
                        return createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Bool,
                            {
                                left: target,
                                right: b[RAW_DATA],
                            }
                        );
                    }
                    TYPE_ERROR();
                };
            }

            if (p === 'cond') {
                return (bt, bf) => {
                    let branchTrue = functionProcess(bt, []);
                    let branchFalse = null;
                    if (bf) {
                        branchFalse = functionProcess(bf, []);
                    }
                    if (bf !== null && !typeEqual(bt.type, bf.type)) {
                        TYPE_ERROR();
                    }
                    let e = createMultiChild(
                        OPERATORS.COND,
                        PLATFORMS.HOST,
                        bt.type,
                        {
                            cond: target,
                            true: branchTrue,
                            false: branchFalse,
                        }
                    );
                    if (typeEqual(bt.type, BASIC_TYPES.Void)) {
                        effectExprs.push(e);
                    } else {
                        return e;
                    }
                };
            }

            if (p === 'not') {
                return () => {
                    return createOneChild(
                        OPERATORS.NOT,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Bool,
                        target
                    );
                };
            }
        }

        if (typeEqual(target.type, BASIC_TYPES.Int)) {
            if (['add', 'sub', 'mul', 'div'].includes(p)) {
                let op = {
                    add: OPERATORS.ADD,
                    sub: OPERATORS.SUB,
                    mul: OPERATORS.MUL,
                    div: OPERATORS.DIV,
                }[p];
                return (val) => {
                    if (typeof val === 'number') {
                        let r = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            val
                        );
                        return createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            {
                                left: target,
                                right: r[RAW_DATA],
                            }
                        );
                    }
                    if (typeEqual(val[RAW_DATA].type, BASIC_TYPES.Int)) {
                        return createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            {
                                left: target,
                                right: val[RAW_DATA],
                            }
                        );
                    }
                    TYPE_ERROR();
                };
            }
        }

        // effect operator, push expr into effectExprList
        if (typeEqual(target.type, BASIC_TYPES.Int)) {
            if (['selfAdd', 'selfSub', 'selfMul', 'selfDiv'].includes(p)) {
                let op = {
                    selfAdd: OPERATORS.SELF_ADD,
                    selfSub: OPERATORS.SELF_SUB,
                    selfMul: OPERATORS.SELF_MUL,
                    selfDiv: OPERATORS.SELF_DIV,
                }[p];
                return (val) => {
                    if (typeof val === 'number') {
                        let r = createConst(
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            val
                        );
                        let e = createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            {
                                left: target,
                                right: r[RAW_DATA],
                            }
                        );
                        effectExprs.push(e);
                        return;
                    }
                    if (typeEqual(val[RAW_DATA].type, BASIC_TYPES.Int)) {
                        let e = createMultiChild(
                            op,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Int,
                            {
                                left: target,
                                right: val[RAW_DATA],
                            }
                        );
                        effectExprs.push(e);
                        return;
                    }
                    TYPE_ERROR();
                };
            }
        }

        if (typeEqual(target.type, BASIC_TYPES.Bool)) {
            if (p === 'assert') {
                return (msg) => {
                    if (msg === undefined) {
                        msg = "";
                    }

                    assert(typeof(msg) === "string")

                    let e = createMultiChild(
                        OPERATORS.ASSERT,
                        PLATFORMS.HOST,
                        BASIC_TYPES.Void,
                        {
                            check: target,
                            msg
                        }
                    );
                    effectExprs.push(e);
                };
            }
        }

        UNREACHABLE(p);
    },
};

function createFunction(platform, type, body, inf = {}) {
    return new Proxy(
        {
            kind: 'func',
            tag: OPERATORS.FUNC,
            platform,
            type,
            body,
            inf,
        },
        PROXY_HANDLER
    );
}

function createMultiChild(tag, platform, type, valueObj, inf = {}) {
    return new Proxy(
        {
            kind: 'obj-child',
            platform,
            type,
            tag,
            valueObj,
            inf,
        },
        PROXY_HANDLER
    );
}

function createOneChild(tag, platform, type, value, inf = {}) {
    return new Proxy(
        {
            kind: 'one-child',
            platform,
            type,
            tag,
            value,
            inf,
        },
        PROXY_HANDLER
    );
}

function createZeroChild(tag, platform, type, inf = {}) {
    return new Proxy(
        {
            kind: 'zero-child',
            platform,
            type,
            tag,
            inf,
        },
        PROXY_HANDLER
    );
}

function createNewChild(tag, platform, type, inf = {}) {}

function createVar(platform, type, inf) {
    return createZeroChild(OPERATORS.VAR, platform, type, inf);
}

function createConst(platform, type, value) {
    return createOneChild(OPERATORS.CONST, platform, type, value);
}

for (const table of Object.keys(SQL_TABLE_TYPES)) {
    globalThis[table] = createVar(
        PLATFORMS.SQL,
        arrayOfType(SQL_TABLE_TYPES[table]),
        { globalTable: true }
    );
}

function functionProcess(fn, inputs) {
    let oldEffectExpr = effectExprs;
    effectExprs = [];
    let ret = fn(...inputs);
    if (ret === undefined) {
        ret = null;
    } else {
        ret = ret[RAW_DATA];
    }
    let fnEffectExpr = effectExprs;
    effectExprs = oldEffectExpr;

    return createFunction(
        fnEffectExpr.length == 0 ? PLATFORMS.BOTH : PLATFORMS.HOST,
        ret === null ? BASIC_TYPES.Void : ret.type,
        {
            expr: fnEffectExpr,
            inputs,
            ret,
        }
    );
}

function tableOrderAppend(TId, FId, Count) {
    let curOrderItems = TId.Table.CurOrder.Items;
    let theOrderItem = curOrderItems.first((x) => x.Food.Id.eq(FId));
    theOrderItem
        .isNull()
        .not()
        .cond(
            () => theOrderItem.Count.selfAdd(Count),
            () =>
                curOrderItems.append(
                    OrderItem.new({
                        Food: FId.Food,
                        Count,
                    })
                )
        );
}

/*
let ff = functionProcess(tableOrderAppend, [
    createVar(PLATFORMS.BOTH, SQL_TABLE_TYPES.Table.member.Id, { name: "TId" }),
    createVar(PLATFORMS.BOTH, SQL_TABLE_TYPES.Food.member.Id, { name: "TId" }),
    createVar(PLATFORMS.BOTH, BASIC_TYPES.Int, { name: "Count" })
]);

console.dir(ff);
*/
/*
    selfAdd, selfSub, selfMul, selfDiv 生成的做法，
    如果左侧是 basic type，那么生成到 host，
    然后要求有则计算到 host，
    生成为 (vl) += (vr)

    如果左侧是 sql type，那么生成 sql
    左侧此时为 T.F 然后从表达式树中查找得到 T，然后要求生成到 host


*/

function checkCtx(ctx) {
    if (ctx.dependedFn === undefined) {
        ctx.dependedFn = [];
    }
    if (ctx.vars === undefined) {
        ctx.vars = [];
    }
}

/**
 *
 * @param {string} e
 * @returns {string}
 */
const fromExpr = (e) => {
    if (e.startsWith('SELECT')) {
        return `(${e})`;
    } else {
        return e;
    }
};

const CODE_GENERATORS = {
    [OPERATORS.VAR](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.VAR);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            if (expr.inf.globalTable) {
                let fnName = `${inFnNameOfType(
                    expr.type
                )}_SQLGetTable_${nanoid()}`;
                ctx.dependedFn.push(`const ${fnName} = async () => {
    let db = await dbPool.acquire();
    return db.query('SELECT * FROM ${sqlIdentOfType(expr.type)}');
}`);
                return {
                    platform: PLATFORMS.HOST,
                    type: expr.type,
                    expr: `await ${fnName}()`,
                };
            } else {
                return {
                    platform: PLATFORMS.HOST,
                    type: expr.type,
                    expr: expr.inf.name,
                };
            }
        } else {
            if (expr.inf.globalTable) {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `"${expr.type.type.typename}"`,
                };
            } else {
                assert(ctx.vars.map((v) => v.name).includes(expr.inf.name));

                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [expr.inf.name],
                    type: expr.type,
                    expr: `$${expr.inf.name}`,
                };
            }
        }
    },
    [OPERATORS.REACCESS](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.REACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            // prefer gen to sql
            platformRequire = PLATFORMS.SQL;
        }
        if (platformRequire === PLATFORMS.SQL) {
            let target = expr.value;
            let trySQL = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.SQL
            );
            if (trySQL !== null) {
                return {
                    sqlParams: trySQL.sqlParams ?? [],
                    platform: PLATFORMS.SQL,
                    type: expr.type,
                    expr: `SELECT * FROM ${sqlIdentOfType(
                        expr.type
                    )} WHERE ${sqlIdentOfType(target.type)} == (${
                        trySQL.expr
                    })`,
                };
            } else {
                let host = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.HOST
                );
                let tmpVarName = nanoid();
                ctx.vars.push({
                    name: tmpVarName,
                    expr: host,
                });
                return {
                    sqlParams: [tmpVarName],
                    platform: PLATFORMS.SQL,
                    type: expr.type,
                    expr: `SELECT * FROM ${sqlIdentOfType(
                        expr.type
                    )} WHERE ${sqlIdentOfType(
                        target.type
                    )} == ($${tmpVarName})`,
                };
            }
        } else {
            let selfSQL = CODE_GENERATORS[OPERATORS.REACCESS](
                ctx,
                expr,
                PLATFORMS.SQL
            );
            // in sql it actual array type, but we need one
            return CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, selfSQL);
        }
    },
    [OPERATORS.MEMBER_ACCESS](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let target = expr.value;
            let tryHost = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.HOST
            );
            if (tryHost !== null) {
                let memberName = getMemberName(expr.type.typename);
                return {
                    platform: PLATFORMS.HOST,
                    type: expr.type,
                    expr: `(${tryHost.expr}).${memberName}`,
                };
            } else {
                let sql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                let host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
                let memberName = getMemberName(expt.type);
                return {
                    platform: PLATFORMS.HOST,
                    type: expr.type,
                    expr: `(${host.expr}).${memberName}`,
                };
            }
        } else {
            let target = expr.value;
            let trySQL = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.SQL
            );
            if (trySQL !== null) {
                let selectName = sqlIdentOfType(expr.type);
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: trySQL.sqlParams ?? [],
                    type: trySQL.type,
                    expr: `${selectName}`,
                };
            } else {
                // object var can't insert into sql
                return null;
            }
        }
    },
    [OPERATORS.CONST](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.CONST);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.SQL) {
            if (typeEqual(expr.type, BASIC_TYPES.Bool)) {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `${expr.value ? 1 : 0}`,
                };
            } else {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `${expr.value}`,
                };
            }
        } else {
            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `${expr.value}`,
            };
        }
    },
    [OPERATORS.FIRST](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.FIRST);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let target = expr.value;
            let targetHost = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.HOST
            );

            if (targetHost === null) {
                let targetSql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                targetHost = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](
                    ctx,
                    targetSql
                );
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${targetHost.expr})[0]`,
            };
        } else {
            let target = expr.value;
            let targetSql = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.SQL
            );

            if (targetSql === null) {
                return null;
            }

            return {
                sqlParams: targetSql.sqlParams,
                type: expr.type,
                platform: PLATFORMS.SQL,
                expr: `${targetSql.expr} LIMIT 1`,
            };
        }
    },
    [OPERATORS.FILTER](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.FILTER);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = expr.valueObj.left;
            let er = expr.valueObj.right;

            let ele = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.HOST);
            let ere = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.HOST);

            if (ele === null) {
                let elsql = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.SQL);
                ele = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (ere === null) {
                let ersql = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.SQL);
                ere = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${ele.expr}).filter(${ere.expr})`,
            };
        } else {
            let el = expr.valueObj.left;
            let er = expr.valueObj.right;

            let ele = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.SQL);
            let ere = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.SQL);

            if (ele === null) {
                return null;
            }

            if (ere === null) {
                return null;
            }

            return {
                sqlParams: UTILS.uniqueArray([
                    ...(ele.sqlParams ?? []),
                    ...(ere.sqlParams ?? []),
                ]),
                platform: PLATFORMS.SQL,
                type: expr.type,
                expr: `(${ele.expr}) WHERE (${ere.expr})`,
            };
        }
    },
    [OPERATORS.MAP](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.MAP);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = expr.valueObj.left;
            let er = expr.valueObj.right;

            let ele = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.HOST);
            let ere = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.HOST);

            if (ele === null) {
                let elsql = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.SQL);
                ele = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (ere === null) {
                let ersql = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.SQL);
                ere = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${ele.expr}).map(${ere.expr})`,
            };
        } else {
            let el = expr.valueObj.left;
            let er = expr.valueObj.right;

            let ele = CODE_GENERATORS[el.tag](ctx, el, PLATFORMS.SQL);
            let ere = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.SQL);

            if (ele === null) {
                return null;
            }

            if (ere === null) {
                return null;
            }

            return {
                sqlParams: UTILS.uniqueArray([
                    ...(ele.sqlParams ?? []),
                    ...(ere.sqlParams ?? []),
                ]),
                platform: PLATFORMS.SQL,
                type: expr.type,
                expr: `SELECT (${ere.expr}) FROM ${fromExpr(ele.expr)}`,
            };
        }
    },
    [OPERATORS.SUM](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SUM);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        let target = expr.value;
        if (platformRequire === PLATFORMS.HOST) {
            let host = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.HOST);

            if (host === null) {
                let sql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `utils.sum(${host.expr})`,
            };
        } else {
            let sql = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.SQL);

            if (sql === null) {
                return null;
            }

            const getSumIdentName = (name) => {
                let [p, m] = name.split('.');
                if (m === undefined) {
                    return p;
                }
                return m;
            };

            return {
                platform: PLATFORMS.SQL,
                sqlParams: sql.sqlParams,
                type: expr.type,
                expr: `SELECT SUM("${getSumIdentName(
                    target.type.type.typename
                )}") FROM ${fromExpr(sql.expr)}`,
            };
        }
    },
    [OPERATORS.COUNT](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.COUNT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        let target = expr.value;
        if (platformRequire === PLATFORMS.HOST) {
            let host = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.HOST);

            if (host === null) {
                let sql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${host.expr}).length`,
            };
        } else {
            let sql = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.SQL);

            if (sql === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: sql.sqlParams,
                type: expr.type,
                expr: `SELECT COUNT(*) FROM ${fromExpr(sql.expr)}`,
            };
        }
    },
    [OPERATORS.SLICE](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SLICE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let { src, off, len } = expr.valueObj;

            let [srcHost, offHost, lenHost] = [src, off, len].map((e) => {
                let host = CODE_GENERATORS[e.tag](ctx, e, PLATFORMS.HOST);
                if (host === null) {
                    let sql = CODE_GENERATORS[e.tag](ctx, e, PLATFORMS.SQL);
                    host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
                }
                return host;
            });

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${srcHost.expr}).slice((${offHost.expr}), (${offHost.expr}) + (${lenHost.expr}))`,
            };
        } else {
            let { src, off, len } = expr.valueObj;

            let [srcSql, offSql, lenSql] = [src, off, len].map((e) =>
                CODE_GENERATORS[e.tag](ctx, e, PLATFORMS.SQL)
            );

            if (srcSql === null) {
                return null;
            }

            if (offSql === null) {
                return null;
            }

            if (lenSql === null) {
                return null;
            }

            return {
                sqlParams: UTILS.uniqueArray([
                    ...(srcSql.sqlParams ?? []),
                    ...(offSql.sqlParams ?? []),
                    ...(lenSql.sqlParams ?? []),
                ]),
                type: expr.type,
                platform: PLATFORMS.SQL,
                expr: `${srcSql.expr} LIMIT (${lenSql.expr}) OFFSET (${offSql.expr})`,
            };
        }
    },
    [OPERATORS.FOREIGN_MEMBER_ACCESS](
        ctx,
        expr,
        platformRequire = PLATFORMS.BOTH
    ) {
        assert(expr.tag === OPERATORS.FOREIGN_MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.SQL;
        }

        if (platformRequire === PLATFORMS.SQL) {
        } else {
            return null;
        }
    },
    [OPERATORS.ARRAY_MEMBER_ACCESS](
        ctx,
        expr,
        platformRequire = PLATFORMS.BOTH
    ) {
        assert(expr.tag === OPERATORS.ARRAY_MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.SQL;
        }

        if (platformRequire === PLATFORMS.SQL) {
        } else {
            return null;
        }
    },
    [OPERATORS.IS_NULL](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.IS_NULL);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let target = expr.value;
            let host = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.HOST);
            if (host !== null) {
                let sql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
            }
            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${host.expr}) === null`,
            };
        } else {
            let target = expr.value;
            let sql = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.SQL);
            if (sql === null) {
                return null;
            }
            return {
                platform: PLATFORMS.SQL,
                sqlParams: sql.sqlParams ?? [],
                type: expr.type,
                expr: `(${sql.expr}) IS NULL`,
            };
        }
    },
    [OPERATORS.NOT](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.NOT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let target = expr.value;
            let host = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.HOST);
            if (host === null) {
                let sql = CODE_GENERATORS[target.tag](
                    ctx,
                    target,
                    PLATFORMS.SQL
                );
                host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
            }
            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `!(${host.expr})`,
            };
        } else {
            let target = expr.value;
            let sql = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.SQL);
            if (sql === null) {
                return null;
            }
            return {
                platform: PLATFORMS.SQL,
                sqlParams: sql.sqlParams ?? [],
                type: expr.type,
                expr: `NOT(${sql.expr})`,
            };
        }
    },
    [OPERATORS.EQ](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.EQ);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) === (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) == (${er.expr})`,
            };
        }
    },
    [OPERATORS.NEQ](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.NEQ);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) !== (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) != (${er.expr})`,
            };
        }
    },
    [OPERATORS.LT](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.LT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) < (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) < (${er.expr})`,
            };
        }
    },
    [OPERATORS.LE](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.LE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) <= (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) <= (${er.expr})`,
            };
        }
    },
    [OPERATORS.GT](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.GT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) > (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) > (${er.expr})`,
            };
        }
    },
    [OPERATORS.GE](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.GE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) >= (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) >= (${er.expr})`,
            };
        }
    },
    [OPERATORS.LIKE](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.LIKE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `utils.like((${el.expr})(${er.expr}))`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) LIKE (${er.expr})`,
            };
        }
    },
    [OPERATORS.AND](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.AND);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) && (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) AND (${er.expr})`,
            };
        }
    },
    [OPERATORS.OR](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.OR);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) || (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) OR (${er.expr})`,
            };
        }
    },
    [OPERATORS.ADD](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.ADD);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) + (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) + (${er.expr})`,
            };
        }
    },
    [OPERATORS.SUB](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SUB);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) - (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) - (${er.expr})`,
            };
        }
    },
    [OPERATORS.MUL](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.MUL);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) * (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) * (${er.expr})`,
            };
        }
    },
    [OPERATORS.DIV](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.DIV);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.HOST
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.HOST
            );

            if (el === null) {
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, el);
            }

            if (er === null) {
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, er);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `(${el.expr}) / (${er.expr})`,
            };
        } else {
            let el = CODE_GENERATORS[expr.valueObj.left.tag](
                ctx,
                expr.valueObj.left,
                PLATFORMS.SQL
            );
            let er = CODE_GENERATORS[expr.valueObj.right.tag](
                ctx,
                expr.valueObj.right,
                PLATFORMS.SQL
            );

            if (el === null) {
                return null;
            }

            if (er === null) {
                return null;
            }

            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray([
                    ...(el.sqlParams ?? []),
                    ...(er.sqlParams ?? []),
                ]),
                type: expr.type,
                expr: `(${el.expr}) / (${er.expr})`,
            };
        }
    },
    [OPERATORS.SELF_ADD](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SELF_ADD);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.SELF_DIV](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SELF_DIV);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.SELF_MUL](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SELF_MUL);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.SELF_SUB](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.SELF_SUB);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.COND](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.COND);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let cond = expr.value.cond;
            let bt = expr.valueObj.true;
            let bf = expr.valueObj.false;

            let ce = CODE_GENERATORS[cond.tag](ctx, cond, PLATFORMS.HOST);
            let bte = CODE_GENERATORS[bt.tag](ctx, bt, PLATFORMS.HOST);
            let bfe = CODE_GENERATORS[bf.tag](ctx, bf, PLATFORMS.HOST);

            if (ce === null) {
                let cs = CODE_GENERATORS[cond.tag](ctx, cond, PLATFORMS.SQL);
                ce = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, cs);
            }

            if (bte === null) {
                let bts = CODE_GENERATORS[bt.tag](ctx, bt, PLATFORMS.SQL);
                bte = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, bts);
            }

            if (bfe === null) {
                let bfs = CODE_GENERATORS[bf.tag](ctx, bf, PLATFORMS.SQL);
                bfe = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, bfs);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `
                (() => {if (${ce.expr}) {
                    return (${bte.expr})();
                } else { 
                    return (${bfe.expr})(); 
                }})()
                `,
            };
        } else {
            return null;
        }
    },
    [OPERATORS.APPEND](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.APPEND);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.NEW](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.NEW);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.SQL_TO_HOST](ctx, sql, opt = {}) {
        checkCtx(ctx);
        assert(sql.platform === PLATFORMS.SQL);

        // db.all return any[], if type isn't array use queryOne to any
        let queryFn = 'query';
        if (sql.type.kind === 'object') {
            queryFn = 'queryOne';
        } else if (sql.type.kind === 'unit' || sql.type.kind === 'basic') {
            queryFn = 'queryOneElem';
        }
        let fnName = `${inFnNameOfType(sql.type)}_SQLGet_${nanoid()}`;
        ctx.dependedFn.push(`const ${fnName} = (${sql.sqlParams.join(
            ', '
        )}) => {
    let db = await dbPool.acquire();
    return db.${queryFn}('${sql.expr}', {
        ${sql.sqlParams.map((f) => `$${f}: ${f}`).join(',\n')}
    });
}`);
        return {
            platform: PLATFORMS.HOST,
            type: sql.type,
            expr: `${fnName}(${sql.sqlParams.join(', ')})`,
        };
    },
    [OPERATORS.FUNC](ctx, func, platformRequire = PLATFORMS.BOTH) {
        assert(func.tag === OPERATORS.FUNC);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let genFns = [];
            let fnBodies = [];
            let inputNames = func.body.inputs.map((i) => i[RAW_DATA].inf.name);
            for (const expr of func.body.expr) {
                let myctx = {
                    vars: func.body.inputs.map((i) => ({
                        name: i[RAW_DATA].inf.name,
                        expr: i[RAW_DATA].inf.name,
                    })),
                };
                let g = CODE_GENERATORS[expr.tag](myctx, expr, PLATFORMS.HOST);
                for (const v of myctx.vars) {
                    if (!inputNames.includes(v.name)) {
                        fnBodies.push(`let ${v.name} = ${v.expr};`);
                    }
                }
                genFns.push(...myctx.dependedFn);
                fnBodies.push(`${g.expr};`);
            }
            {
                let myctx = {
                    vars: func.body.inputs.map((i) => ({
                        name: i[RAW_DATA].inf.name,
                        expr: i[RAW_DATA].inf.name,
                    })),
                };
                let g = CODE_GENERATORS[func.body.ret.tag](
                    myctx,
                    func.body.ret,
                    PLATFORMS.HOST
                );
                for (const v of myctx.vars) {
                    if (!inputNames.includes(v.name)) {
                        fnBodies.push(`let ${v.name} = ${v.expr};`);
                    }
                }
                genFns.push(...myctx.dependedFn);
                fnBodies.push(`return ${g.expr};`);
            }
            ctx.dependedFn.push(...genFns);
            return {
                platform: PLATFORMS.HOST,
                expr: func.type,
                expr: `(${inputNames.join(', ')}) => {
    ${fnBodies.join('\n')}
}`,
            };
        } else {
            {
                if (func.body.expr.length !== 0) {
                    return null;
                }
                let myctx = {
                    vars: func.body.inputs.map((i) => ({
                        name: i[RAW_DATA].inf.name,
                        expr: i[RAW_DATA].inf.name,
                    })),
                };
                let g = CODE_GENERATORS[func.body.ret.tag](
                    myctx,
                    func.body.ret,
                    PLATFORMS.SQL
                );
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: g.sqlParams ?? [],
                    type: func.type,
                    expr: g.expr,
                };
            }
        }
    },
    [OPERATORS.ASSERT](ctx, expr, platformRequire = PLATFORMS.BOTH) {
        assert(expr.tag === OPERATORS.ASSERT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PLATFORMS.HOST
        }

        if (platformRequire === PLATFORMS.SQL) {
            return null;
        }

        let check = expr.valueObj.check;
        let msg = expr.valueObj.msg;

        let host = CODE_GENERATORS[check.tag](ctx, check, PLATFORMS.HOST);
        if (host === null) {
            let sql = CODE_GENERATORS[check.tag](ctx, check, PLATFORMS.SQL);
            host = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, sql);
        }

        return {
            platform: PLATFORMS.HOST,
            type: expr.type,
            expr: `
                (() => {
                    if (!(${host.expr})) { 
                        throw new Error("${msg}")
                    }
                })()
            `
        }
    }
};

/**
 *
 * @param {string} fnName
 * @param {(...any) => any | void} fn
 * @param {{name: string, val: any}[]} inputs
 */
function functionGenerate(fnName, fn, inputs) {
    let f = functionProcess(fn, inputs)[RAW_DATA];
    let ctx = {};
    let r = CODE_GENERATORS[f.tag](ctx, f, PLATFORMS.HOST);
    return [...ctx.dependedFn, `const ${fnName}= ${r.expr};`];
}

/**
 *
 * @param {(...any) => any} fn
 * @param {{name: string, val: any}[]} inputs
 */
function sqlGenerateTest(fn, inputs) {
    let f = functionProcess(
        fn,
        inputs.map((i) => i.val)
    )[RAW_DATA];
    let ctx = {};
    let g = CODE_GENERATORS[f.tag](ctx, f, PLATFORMS.SQL);
    console.dir(ctx);
    console.dir(g);
}

let f = functionGenerate(
    'test',
    (x) => x.Food.Price.le(100).and(x.lt(33).not()),
    [
        createVar(PLATFORMS.BOTH, SQL_TABLE_TYPES.Food.member.Id, {
            name: 'a',
        }),
    ]
);

console.log(f.join('\n\n'));

sqlGenerateTest(
    () =>
        Food.slice(1, 10)
            .map((f) => f.Id.add(13))
            .sum(),
    []
);
sqlGenerateTest(
    () =>
        Food.filter((f) => f.Id.add(13).lt(13))
            .map((f) => f.Id)
            .slice(1, 10)
            .sum(),
    []
);
