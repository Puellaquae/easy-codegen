import assert, { ok } from 'assert';
import nanoidDictionary from 'nanoid-dictionary';
const { nolookalikes } = nanoidDictionary;
import { customAlphabet } from 'nanoid';
const _nanoid = customAlphabet(nolookalikes, 12);
const nanoid = () => {
    let t = _nanoid();
    if (!UTILS.isValidVariableName(t)) {
        t = `v${t}`;
    }
    return t;
};
import prettier from 'prettier';
import { readFileSync } from 'fs';
import { format as sqlFormat } from 'sql-formatter';

const UTILS = {
    uniqueArray(arr) {
        return Array.from(new Set(arr));
    },
    isValidVariableName(str) {
        // 不能以数字开头
        if (/^[0-9]/.test(str)) {
            return false;
        }

        // 只能包含字母、数字、下划线
        if (!/^[a-zA-Z0-9_]+$/.test(str)) {
            return false;
        }

        // 不能是保留关键字
        const keywords = [
            'abstract',
            'await',
            'boolean',
            'break',
            'byte',
            'case',
            'catch',
            'char',
            'class',
            'const',
            'continue',
            'debugger',
            'default',
            'delete',
            'do',
            'double',
            'else',
            'enum',
            'eval',
            'export',
            'extends',
            'false',
            'final',
            'finally',
            'float',
            'for',
            'function',
            'goto',
            'if',
            'implements',
            'import',
            'in',
            'instanceof',
            'int',
            'interface',
            'let',
            'long',
            'native',
            'new',
            'null',
            'package',
            'private',
            'protected',
            'public',
            'return',
            'short',
            'static',
            'super',
            'switch',
            'synchronized',
            'this',
            'throw',
            'throws',
            'transient',
            'true',
            'try',
            'typeof',
            'var',
            'void',
            'volatile',
            'while',
            'with',
            'yield',
        ];
        if (keywords.includes(str)) {
            return false;
        }

        return true;
    },
    escapeString(str) {
        // 使用正则表达式匹配特殊字符，并替换为转义字符
        return str.replace(/[\\'"]/g, '\\$&');
    },
    formatCode(str) {
        return prettier.format(str, {
            arrowParens: 'always',
            bracketSpacing: true,
            embeddedLanguageFormatting: 'auto',
            semi: true,
            tabWidth: 4,
            parser: 'babel',
        });
    },
    removePrefix(str, pat) {
        if (str.startsWith(pat)) {
            return str.slice(pat.length);
        }
        return str;
    },
    replaceInvalidChars(str) {
        // 定义正则表达式，匹配除了字母、数字和下划线之外的任何字符
        const regex = /[^a-zA-Z0-9_]/g;
        // 将匹配到的字符替换为下划线，并返回新字符串
        return str.replace(regex, '_');
    },
};

let SQL_TABLE_TYPES = {
    City: {
        kind: 'object',
        primaryMember: 'Id',
        primaryAuto: true,
        uniqueMember: ['Id'],
        typename: 'City',
        member: {
            Name: { kind: 'unit', typename: 'City.Name', alias: 'String' },
            Id: { kind: 'unit', typename: 'City.Id', alias: 'Int' },
        },
    },
    Person: {
        kind: 'object',
        primaryMember: 'Id',
        primaryAuto: true,
        uniqueMember: ['Friends', 'Id'],
        typename: 'Person',
        member: {
            Name: {
                kind: 'unit',
                typename: 'Person.Name',
                alias: 'String',
            },
            City: { kind: 'unit', typename: 'City' },
            Age: { kind: 'unit', typename: 'Person.Age', alias: 'Int' },
            Friends: {
                kind: 'array',
                type: { kind: 'unit', typename: 'Person' },
            },
            Id: { kind: 'unit', typename: 'Person.Id', alias: 'Int' },
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

function parseType(str) {
    if (str.startsWith('[') && str.endsWith(']')) {
        let type = parseType(str.slice(1, -1));
        return arrayOfType(type);
    } else if (Object.keys(BASIC_TYPES).includes(str)) {
        return BASIC_TYPES[str];
    } else if (Object.keys(SQL_TABLE_TYPES).includes(str)) {
        return SQL_TABLE_TYPES[str];
    } else {
        let ss = str.split('.');
        let p = ss[0];
        let m = ss.slice(1).join('.');
        let pt = parseType(p);
        if (Object.keys(pt.member).includes(m)) {
            return pt.member[m];
        }
        TYPE_ERROR();
    }
}

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

function loadSQLTableInf(jsonInf) {
    SQL_TABLE_TYPES = JSON.parse(jsonInf);
    for (let type of Object.keys(SQL_TABLE_TYPES)) {
        resolveTypeSelfRef(
            SQL_TABLE_TYPES,
            BASIC_TYPES,
            SQL_TABLE_TYPES[type],
            (t) => (SQL_TABLE_TYPES[type] = t)
        );
    }
}

const UNREACHABLE = (inf = '') => {
    throw new Error(`unreachable ${inf}`);
};

const TODO = () => {
    throw new Error('todo');
};

const TYPE_ERROR = () => {
    throw new Error('type-error');
};

const PLATFORMS = {
    HOST: 'host',
    SQL: 'sql',
    BOTH: 'both',
};

let PREFER_PLATFORM = PLATFORMS.SQL;

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
        let t = type.typename.split('.');
        return `"${t[0]}"."${t.slice(1).join('.')}"`;
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

function daoKindOfType(type) {
    if (type.kind === 'array') {
        return daoKindOfType(type.type);
    } else if (type.kind === 'object') {
        return type.typename;
    } else if (type.kind === 'unit') {
        return type.typename.split('.')[0];
    }
    return 'Other';
}

function nativeTypeEqual(na, ta) {
    if (typeEqual(ta, BASIC_TYPES.Bool) && typeof na === 'boolean') {
        return true;
    }
    if (typeEqual(ta, BASIC_TYPES.Int) && typeof na === 'number') {
        return true;
    }
    if (typeEqual(ta, BASIC_TYPES.String) && typeof na === 'string') {
        return true;
    }
    return false;
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
            if (tl.member[tlm] === tl || tl.member[tlm].type === tl) {
                continue;
            }
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
    REDUCE: 'reduce',
    MAP: 'map',
    FOREACH: 'foreach',
    SUM: 'sum',
    COUNT: 'count',
    AVG: 'avg',
    SLICE: 'slice',
    REACCESS: 'reacess',
    MEMBER_ACCESS: 'memberAccess',
    FOREIGN_MEMBER_ACCESS: 'foreignMemberAccess',
    ARRAY_MEMBER_ACCESS: 'arrayMemberAccess',
    IS_NULL: 'isNull',
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
    COND: 'cond',
    APPEND: 'append',
    SET: 'set',
    REMOVE: 'remove',
    NEW: 'new',
    FUNC: 'func',
    ASSERT: 'assert',
    // Specifial operator
    SQL_TO_HOST: 'sqlToHost',
    CALL: 'call',
    PIN: 'pin',
};

const RAW_DATA = Symbol('de-proxy');

let effectExprs = [];

const PARSER_TABLE = {
    [RAW_DATA]: {
        validator: () => true,
        processor: (target, p, r) => {
            return target;
        },
    },
    [OPERATORS.PIN]: {
        validator: () => true,
        processor: (target, p, r) => {
            return () => {
                let varName = nanoid();
                effectExprs.push(
                    createOneChild(
                        OPERATORS.PIN,
                        PLATFORMS.HOST,
                        BASIC_TYPES.Void,
                        target,
                        {
                            varName,
                        }
                    )[RAW_DATA]
                );
                return createVar(PLATFORMS.HOST, target.type, {
                    name: varName,
                });
            };
        },
    },
    [OPERATORS.FIRST]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return () => {
                return createOneChild(
                    OPERATORS.FIRST,
                    PLATFORMS.BOTH,
                    target.type.type,
                    target
                );
            };
        },
    },
    [OPERATORS.FILTER]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return (fn) => {
                let fnE = functionProcess(fn, [
                    createVar(PLATFORMS.BOTH, target.type.type, {
                        name: `filter_${nanoid()}`,
                        nameForSql: target.type.type.typename
                            .split('.')
                            .slice(1)
                            .join('.'),
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
        },
    },
    [OPERATORS.MAP]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return (fn) => {
                let fnE = functionProcess(fn, [
                    createVar(PLATFORMS.BOTH, target.type.type, {
                        name: `map_${nanoid()}`,
                        nameForSql: target.type.type.typename
                            .split('.')
                            .slice(1)
                            .join('.'),
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
        },
    },
    [OPERATORS.FOREACH]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return (fn) => {
                let fnE = functionProcess(fn, [
                    createVar(PLATFORMS.BOTH, target.type.type, {
                        name: `foreach_${nanoid()}`,
                        nameForSql: target.type.type.typename
                            .split('.')
                            .slice(1)
                            .join('.'),
                        kind: 'foreach-iter',
                    }),
                ]);
                if (!typeEqual(fnE[RAW_DATA].type, BASIC_TYPES.Void)) {
                    TYPE_ERROR();
                }
                return createMultiChild(
                    OPERATORS.FOREACH,
                    PLATFORMS.BOTH,
                    arrayOfType(fnE[RAW_DATA].type),
                    {
                        left: target,
                        right: fnE[RAW_DATA],
                    }
                );
            };
        },
    },
    [OPERATORS.REDUCE]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return (fn, init) => {
                let fnE = functionProcess(fn, [
                    createVar(PLATFORMS.BOTH, init[RAW_DATA].type, {
                        name: `reduce_acc_${nanoid()}`,
                        kind: 'reduce-acc',
                    }),
                    createVar(PLATFORMS.BOTH, target.type.type, {
                        name: `reduce_${nanoid()}`,
                        kind: 'reduce-iter',
                    }),
                ]);
                if (!typeEqual(fnE[RAW_DATA].type, init[RAW_DATA].type)) {
                    TYPE_ERROR();
                }
                return createMultiChild(
                    OPERATORS.MAP,
                    PLATFORMS.BOTH,
                    fnE[RAW_DATA].type,
                    {
                        src: target,
                        fn: fnE[RAW_DATA],
                        init: init[RAW_DATA],
                    }
                );
            };
        },
    },
    [OPERATORS.APPEND]: {
        validator: (target, p, r) => target.type.kind === 'array',
        processor: (target, p, r) => {
            return (val) => {
                val = val[RAW_DATA];
                if (typeEqual(val.type, target.type.type)) {
                    let e = createMultiChild(
                        OPERATORS.APPEND,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Void,
                        {
                            left: target,
                            right: val,
                        }
                    );
                    effectExprs.push(e[RAW_DATA]);
                    return;
                }
                TYPE_ERROR();
            };
        },
    },
    [OPERATORS.NEW]: {
        validator: (target, t, p) => target.inf.globalTable,
        processor: (target, t, p) => {
            // create new table entity
            return (obj) => {
                if (typeof obj === 'object') {
                    let members = Object.keys(target.type.type.member);
                    for (const m of members) {
                        if (
                            target.type.type.primaryMember.includes(m) &&
                            target.type.type.primaryAuto
                        ) {
                            continue;
                        }
                        if (obj[m] === undefined) {
                            TYPE_ERROR();
                        }
                        if (target.type.type.member[m].kind === 'object') {
                            // this is object, we need get pri id
                            if (
                                nativeTypeEqual(
                                    obj[m],
                                    target.type.type.member[m]
                                )
                            ) {
                                // actualy unreablable here
                                TYPE_ERROR();
                            } else if (
                                typeEqual(
                                    obj[m][RAW_DATA].type,
                                    target.type.type.member[m]
                                )
                            ) {
                                let priK = obj[m][RAW_DATA].type.primaryMember;
                                obj[`${m}.${priK}`] = obj[m][priK][RAW_DATA];
                                delete obj[m];
                            } else {
                                TYPE_ERROR();
                            }
                        } else {
                            if (
                                nativeTypeEqual(
                                    obj[m],
                                    target.type.type.member[m]
                                )
                            ) {
                                obj[m] = createConst(
                                    PLATFORMS.BOTH,
                                    target.type.type.member[m],
                                    obj[m]
                                )[RAW_DATA];
                            } else if (
                                typeEqual(
                                    obj[m][RAW_DATA].type,
                                    target.type.type.member[m]
                                )
                            ) {
                                obj[m] = obj[m][RAW_DATA];
                            } else {
                                TYPE_ERROR();
                            }
                        }
                    }
                    return createMultiChild(
                        OPERATORS.NEW,
                        PLATFORMS.BOTH,
                        target.type.type,
                        obj
                    );
                }
                TYPE_ERROR();
            };
        },
    },
    [OPERATORS.REMOVE]: {
        validator: (target, p, r) => {
            return (
                (target.type.kind === 'array' && target.inf.globalTable) ||
                target.type.kind === 'object'
            );
        },
        processor: (target, p, r) => {
            if (target.type.kind === 'object') {
                return () => {
                    let e = createOneChild(
                        OPERATORS.REMOVE,
                        PLATFORMS.HOST,
                        BASIC_TYPES.Void,
                        target,
                        {
                            fromObject: true,
                        }
                    );
                    effectExprs.push(e[RAW_DATA]);
                };
            } else {
                return (fn) => {
                    let fnE = functionProcess(fn, [
                        createVar(PLATFORMS.BOTH, target.type.type, {
                            name: `remove_${nanoid()}`,
                            nameForSql: target.type.type.typename
                                .split('.')
                                .slice(1)
                                .join('.'),
                            kind: 'remove-iter',
                        }),
                    ]);
                    if (typeEqual(fnE[RAW_DATA].type, BASIC_TYPES.Bool)) {
                        let e = createMultiChild(
                            OPERATORS.REMOVE,
                            PLATFORMS.BOTH,
                            BASIC_TYPES.Void,
                            {
                                left: target,
                                right: fnE[RAW_DATA],
                            },
                            {
                                fromObject: false,
                            }
                        );
                        effectExprs.push(e[RAW_DATA]);
                        return;
                    }
                    TYPE_ERROR();
                };
            }
        },
    },
};

const PROXY_HANDLER = {
    get(target, p, receiver) {
        if (
            PARSER_TABLE[p] !== undefined &&
            PARSER_TABLE[p].validator(target, p, receiver)
        ) {
            return PARSER_TABLE[p].processor(target, p, receiver);
        }
        if (target.type.kind === 'array') {
            if (p === 'sum' || p === 'avg') {
                if (typeEqual(target.type.type, BASIC_TYPES.Int)) {
                    return () => {
                        return createOneChild(
                            { sum: OPERATORS.SUM, avg: OPERATORS.AVG }[p],
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
                        target,
                        {
                            memberName: p,
                        }
                    );
                }
            }
        }
        // check if member access
        if (target.type.kind === 'object') {
            if (target.type.member[p] !== undefined) {
                let pType = target.type.member[p];
                if (pType.kind === 'unit' || pType.kind === 'basic') {
                    if (
                        target.type.primaryMember === p &&
                        target.tag === OPERATORS.FOREIGN_MEMBER_ACCESS
                    ) {
                        return createOneChild(
                            OPERATORS.MEMBER_ACCESS,
                            PLATFORMS.BOTH,
                            pType,
                            target.value,
                            {
                                memberName: `${target.inf.memberName}.${p}`,
                            }
                        );
                    }
                    // normal member access
                    return createOneChild(
                        OPERATORS.MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target,
                        {
                            memberName: p,
                        }
                    );
                } else if (pType.kind === 'object') {
                    // foreign member access
                    return createOneChild(
                        OPERATORS.FOREIGN_MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target,
                        {
                            memberName: p,
                        }
                    );
                } else if (pType.kind === 'array') {
                    // foreign array member access
                    return createOneChild(
                        OPERATORS.ARRAY_MEMBER_ACCESS,
                        PLATFORMS.BOTH,
                        pType,
                        target,
                        {
                            memberName: p,
                        }
                    );
                }
            }
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
                ge: OPERATORS.GE,
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
                    let branchTrue = functionProcess(bt, [])[RAW_DATA];
                    let branchFalse = null;
                    if (bf) {
                        branchFalse = functionProcess(bf, [])[RAW_DATA];
                    } else if (!typeEqual(branchTrue.type, BASIC_TYPES.Void)) {
                        TYPE_ERROR();
                    }
                    if (
                        bf !== null &&
                        !typeEqual(branchTrue.type, branchFalse.type)
                    ) {
                        TYPE_ERROR();
                    }
                    let e = createMultiChild(
                        OPERATORS.COND,
                        PLATFORMS.HOST,
                        branchTrue.type,
                        {
                            cond: target,
                            true: branchTrue,
                            false: branchFalse,
                        }
                    );
                    if (typeEqual(branchTrue.type, BASIC_TYPES.Void)) {
                        effectExprs.push(e[RAW_DATA]);
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
            // deprecated
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
                        effectExprs.push(e[RAW_DATA]);
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
                        effectExprs.push(e[RAW_DATA]);
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
                        msg = '';
                    }

                    assert(typeof msg === 'string');

                    let e = createMultiChild(
                        OPERATORS.ASSERT,
                        PLATFORMS.HOST,
                        BASIC_TYPES.Void,
                        {
                            check: target,
                            msg,
                        }
                    );
                    effectExprs.push(e[RAW_DATA]);
                };
            }
        }

        if (p === 'set' && target.type.kind !== 'array') {
            return (val) => {
                let expr;
                if (
                    typeEqual(target.type, BASIC_TYPES.Bool) &&
                    typeof val === 'boolean'
                ) {
                    expr = createMultiChild(
                        OPERATORS.SET,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Void,
                        {
                            left: target,
                            right: createConst(
                                PLATFORMS.BOTH,
                                target.type,
                                val
                            )[RAW_DATA],
                        }
                    );
                } else if (
                    typeEqual(target.type, BASIC_TYPES.Int) &&
                    typeof val === 'number'
                ) {
                    expr = createMultiChild(
                        OPERATORS.SET,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Void,
                        {
                            left: target,
                            right: createConst(
                                PLATFORMS.BOTH,
                                target.type,
                                val
                            )[RAW_DATA],
                        }
                    );
                } else if (
                    typeEqual(target.type, BASIC_TYPES.String) &&
                    typeof val === 'string'
                ) {
                    expr = createMultiChild(
                        OPERATORS.SET,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Void,
                        {
                            left: target,
                            right: createConst(
                                PLATFORMS.BOTH,
                                target.type,
                                val
                            )[RAW_DATA],
                        }
                    );
                } else if (typeEqual(val[RAW_DATA].type, target.type)) {
                    expr = createMultiChild(
                        OPERATORS.SET,
                        PLATFORMS.BOTH,
                        BASIC_TYPES.Void,
                        {
                            left: target,
                            right: val[RAW_DATA],
                        }
                    );
                } else {
                    TYPE_ERROR();
                }
                effectExprs.push(expr[RAW_DATA]);
            };
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

function registerSQLTableIntoGlobalThis() {
    for (const table of Object.keys(SQL_TABLE_TYPES)) {
        globalThis[table] = createVar(
            PLATFORMS.SQL,
            arrayOfType(SQL_TABLE_TYPES[table]),
            {
                globalTable: true,
            }
        );
    }
}

function unregisterSQLTableFromGlobalThis() {
    for (const table of Object.keys(SQL_TABLE_TYPES)) {
        delete globalThis[table];
    }
}

function functionProcess(fn, inputs) {
    let oldEffectExpr = effectExprs;
    effectExprs = [];
    let ret = fn(...inputs);
    if (ret === undefined) {
        ret = null;
    } else if (typeof ret === 'number') {
        ret = createConst(PLATFORMS.HOST, BASIC_TYPES.Int, ret)[RAW_DATA];
    } else if (typeof ret === 'string') {
        ret = createConst(PLATFORMS.HOST, BASIC_TYPES.String, ret)[RAW_DATA];
    } else if (typeof ret === 'bool') {
        ret = createConst(PLATFORMS.HOST, BASIC_TYPES.Bool, ret)[RAW_DATA];
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
    [OPERATORS.VAR]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.VAR);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            if (expr.inf.globalTable) {
                let fnName = `${inFnNameOfType(
                    expr.type
                )}_SQLGetTable_${nanoid()}`;
                ctx.dependedFn.push({
                    fnBody: `const ${fnName} = async () => {
    let db = await dbPool.acquire();
    return db.query(\`SELECT * FROM ${sqlIdentOfType(expr.type)}\`);
}`,
                    daoKind: daoKindOfType(expr.type),
                });
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
                // assert(ctx.vars.map((v) => v.name).includes(expr.inf.name));
                if (expr.inf.nameForSql !== undefined) {
                    return {
                        platform: PLATFORMS.SQL,
                        sqlParams: [],
                        type: expr.type,
                        expr: `"${expr.inf.nameForSql}"`,
                    };
                }
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [expr.inf.name],
                    type: expr.type,
                    expr: `$${expr.inf.name}`,
                };
            }
        }
    },
    [OPERATORS.CONST]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.CONST);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.SQL) {
            if (typeEqual(expr.type, BASIC_TYPES.Bool)) {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `${expr.value ? 1 : 0}`,
                };
            } else if (typeEqual(expr.type, BASIC_TYPES.String)) {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `'${UTILS.escapeString(expr.value)}'`,
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
            if (typeEqual(expr.type, BASIC_TYPES.String)) {
                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: [],
                    type: expr.type,
                    expr: `'${UTILS.escapeString(expr.value)}'`,
                };
            } else {
                return {
                    platform: PLATFORMS.HOST,
                    type: expr.type,
                    expr: `${expr.value}`,
                };
            }
        }
    },
    [OPERATORS.FIRST]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.FIRST);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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

            if (targetSql.expr.startsWith('SELECT')) {
                return {
                    sqlParams: targetSql.sqlParams,
                    type: expr.type,
                    platform: PLATFORMS.SQL,
                    expr: `${targetSql.expr} LIMIT 1`,
                };
            }

            return {
                sqlParams: targetSql.sqlParams,
                type: expr.type,
                platform: PLATFORMS.SQL,
                expr: `SELECT * FROM ${fromExpr(targetSql.expr)} LIMIT 1`,
            };
        }
    },
    [OPERATORS.FILTER]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.FILTER);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                expr: `SELECT * FROM ${fromExpr(ele.expr)} WHERE (${ere.expr})`,
            };
        }
    },
    [OPERATORS.REDUCE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.REDUCE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }
    },
    [OPERATORS.MAP]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.MAP);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                expr: `Promise.all((${ele.expr}).map(${ere.expr}))`,
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

            if (ele.expr.startsWith('SELECT * FROM ')) {
                ele.expr = ele.expr.slice('SELECT * FROM '.length);
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
    [OPERATORS.FOREACH]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.FOREACH);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }
    },
    [OPERATORS.SUM]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.SUM);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.COUNT]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.COUNT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.AVG]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.AVG);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                expr: `utils.avg(${host.expr})`,
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
                expr: `SELECT AVG("${getSumIdentName(
                    target.type.type.typename
                )}") FROM ${fromExpr(sql.expr)}`,
            };
        }
    },
    [OPERATORS.SLICE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.SLICE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.REACCESS]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.REACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.MEMBER_ACCESS]: (
        ctx,
        expr,
        platformRequire = PLATFORMS.BOTH
    ) => {
        assert(expr.tag === OPERATORS.MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let target = expr.value;
            let tryHost = CODE_GENERATORS[target.tag](
                ctx,
                target,
                PLATFORMS.HOST
            );
            if (tryHost !== null) {
                let memberName = expr.inf.memberName; //getMemberName(expr.type.typename);
                if (!UTILS.isValidVariableName(memberName)) {
                    return {
                        platform: PLATFORMS.HOST,
                        type: expr.type,
                        expr: `(${tryHost.expr})["${memberName}"]`,
                    };
                }
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
                let memberName = expr.inf.memberName; // getMemberName(expt.type);
                if (!UTILS.isValidVariableName(memberName)) {
                    return {
                        platform: PLATFORMS.HOST,
                        type: expr.type,
                        expr: `(${host.expr})["${memberName}"]`,
                    };
                }
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
                let selectName = `"${target.type.typename}"."${expr.inf.memberName}"`; //sqlIdentOfType(expr.type);

                if (target.tag === OPERATORS.VAR) {
                    return {
                        platform: PLATFORMS.SQL,
                        sqlParams: [],
                        type: trySQL.type,
                        expr: `${selectName}`,
                    };
                }
                if (trySQL.expr.startsWith('SELECT * FROM ')) {
                    trySQL.expr = trySQL.expr.slice('SELECT * FROM '.length);
                    selectName = selectName.split('.').slice(1).join('.');
                }

                return {
                    platform: PLATFORMS.SQL,
                    sqlParams: trySQL.sqlParams ?? [],
                    type: trySQL.type,
                    expr: `SELECT ${selectName} FROM ${fromExpr(trySQL.expr)}`,
                };
            } else {
                // object var can't insert into sql
                return null;
            }
        }
    },
    [OPERATORS.FOREIGN_MEMBER_ACCESS]: (
        ctx,
        expr,
        platformRequire = PLATFORMS.BOTH
    ) => {
        assert(expr.tag === OPERATORS.FOREIGN_MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.SQL) {
            let myTableName = expr.value.type.typename;
            let tableName = expr.type.typename;
            let priKeyName = expr.type.primaryMember;

            let sql = CODE_GENERATORS[OPERATORS.MEMBER_ACCESS](
                ctx,
                createOneChild(
                    OPERATORS.MEMBER_ACCESS,
                    PLATFORMS.BOTH,
                    {
                        kind: 'unit',
                        typename: `${myTableName}.${expr.inf.memberName}.${priKeyName}`,
                        type: SQL_TABLE_TYPES[tableName].member[priKeyName],
                    },
                    expr.value,
                    {
                        memberName: `${expr.inf.memberName}.${priKeyName}`,
                    }
                )[RAW_DATA],
                PLATFORMS.SQL
            );

            return {
                platform: PLATFORMS.SQL,
                sqlParams: [],
                type: expr.type,
                expr: `SELECT * FROM "${tableName}" WHERE "${tableName}"."${priKeyName}" == (${sql.expr})`,
            };
        } else {
            return null;
        }
    },
    [OPERATORS.ARRAY_MEMBER_ACCESS]: (
        ctx,
        expr,
        platformRequire = PLATFORMS.BOTH
    ) => {
        assert(expr.tag === OPERATORS.ARRAY_MEMBER_ACCESS);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.SQL) {
            if (expr.type.type.kind === 'object') {
                let src = expr.value;
                let myTableName = src.type.typename;
                let resTableName = expr.type.type.typename;
                let memberName = expr.inf.memberName;
                let interTableName = `${myTableName}-${memberName}-${resTableName}`;
                let myTablePK = src.type.primaryMember;
                let resTablePK = expr.type.type.primaryMember;
                let leftF = `L.${myTableName}.${myTablePK}`;
                let rightF = `R.${resTableName}.${resTablePK}`;

                let sqlE = new Proxy(src, PROXY_HANDLER)[myTablePK][RAW_DATA];
                let sql = CODE_GENERATORS[sqlE.tag](ctx, sqlE, PLATFORMS.SQL);

                return {
                    platform: PLATFORMS.SQL,
                    type: expr.type,
                    sqlParams: [],
                    expr: `SELECT "${resTableName}" FROM "${interTableName}", "${resTableName}" WHERE "${resTableName}"."${resTablePK}" == "${interTableName}"."${rightF}" AND "${interTableName}"."${leftF}" == (${sql.expr})`,
                };
            } else {
                TODO();
            }
        } else {
            return null;
        }
    },
    [OPERATORS.IS_NULL]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.IS_NULL);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.NOT]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.NOT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
    [OPERATORS.EQ]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.EQ);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.NEQ]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.NEQ);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.LT]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.LT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.LE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.LE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.GT]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.GT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.GE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.GE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.LIKE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.LIKE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
            }

            return {
                platform: PLATFORMS.HOST,
                type: expr.type,
                expr: `utils.like((${el.expr}), (${er.expr}))`,
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
    [OPERATORS.AND]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.AND);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.OR]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.OR);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.ADD]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.ADD);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.SUB]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.SUB);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.MUL]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.MUL);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.DIV]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.DIV);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                let elsql = CODE_GENERATORS[expr.valueObj.left.tag](
                    ctx,
                    expr.valueObj.left,
                    PLATFORMS.SQL
                );
                el = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, elsql);
            }

            if (er === null) {
                let ersql = CODE_GENERATORS[expr.valueObj.right.tag](
                    ctx,
                    expr.valueObj.right,
                    PLATFORMS.SQL
                );
                er = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, ersql);
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
    [OPERATORS.COND]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.COND);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let cond = expr.valueObj.cond;
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
                expr: `(async () => {if (${ce.expr}) {
                    return (${bte.expr})();
                } else { 
                    return (${bfe.expr})(); 
                }})()`,
            };
        } else {
            return null;
        }
    },
    [OPERATORS.APPEND]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.APPEND);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            return null;
        }

        let target = expr.valueObj.right;
        let src = expr.valueObj.left;
        if (target.tag === OPERATORS.NEW) {
            let members = Object.keys(target.valueObj);
            let sqlParams = [];
            let obj = {};
            for (const m of members) {
                obj[m] = CODE_GENERATORS[target.valueObj[m].tag](
                    ctx,
                    target.valueObj[m],
                    PLATFORMS.SQL
                );
                if (obj[m] === null) {
                    return null;
                }
                sqlParams.push(...(obj[m].sqlParams ?? []));
            }
            let srcTableName = src.type.type.typename;
            return {
                platform: PLATFORMS.SQL,
                sqlParams: UTILS.uniqueArray(sqlParams),
                type: BASIC_TYPES.Void,
                expr: `INSERT INTO ${srcTableName} (${Object.keys(obj)
                    .map((m) => `"${m}"`)
                    .join(', ')}) VALUES (${Object.keys(obj)
                    .map((m) => `(${obj[m].expr})`)
                    .join(', ')})`,
            };
        } else {
            let srcTableName = src.type.type.typename;
            let newC = {};
            let members = Object.keys(src.type.type.member);
            for (const m of members) {
                if (
                    src.type.type.primaryMember.includes(m) &&
                    src.type.type.primaryAuto
                ) {
                    continue;
                }
                newC[m] = new Proxy(target, PROXY_HANDLER)[m].pin();
            }
            let t = globalThis[srcTableName].new(newC);
            expr.valueObj.right = t[RAW_DATA];
            return CODE_GENERATORS[OPERATORS.APPEND](
                ctx,
                expr,
                platformRequire
            );
        }
    },
    [OPERATORS.SET]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.SET);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            return null;
        }

        let left = expr.valueObj.left;
        let right = expr.valueObj.right;

        if (left.type.kind === 'object') {
            TODO();
        } else if (left.type.kind === 'array') {
            TODO();
        } else {
            let tableName = left.type.typename.split('.')[0];
            let fieldName = left.type.typename.split('.').slice(1).join('.');
            let tableType = SQL_TABLE_TYPES[tableName];
            let tablePriMem = tableType.primaryMember;
            let valS = CODE_GENERATORS[right.tag](ctx, right, PLATFORMS.SQL);
            if (valS === null) {
                return null;
            }
            if (left.tag === OPERATORS.MEMBER_ACCESS) {
                left = left.value;
            }
            let lp = new Proxy(left, PROXY_HANDLER)[tablePriMem][RAW_DATA];
            let lps = CODE_GENERATORS[lp.tag](ctx, lp, PLATFORMS.SQL);
            if (lps === null) {
                return null;
            }
            return {
                sqlParams: UTILS.uniqueArray([
                    ...(valS.sqlParams ?? []),
                    ...(lps.sqlParams ?? []),
                ]),
                platform: PLATFORMS.SQL,
                type: BASIC_TYPES.Void,
                expr: `UPDATE "${tableName}" SET "${fieldName}" = (${valS.expr}) WHERE "${tableName}"."${tablePriMem}" == (${lps.expr})`,
            };
        }
    },
    [OPERATORS.REMOVE]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.REMOVE);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            return null;
        }

        if (expr.inf.fromObject) {
        } else {
            let el = expr.valueObj.left;
            let er = expr.valueObj.right;

            let ere = CODE_GENERATORS[er.tag](ctx, er, PLATFORMS.SQL);

            if (ere === null) {
                return null;
            }
            let tblName = el.type.type.typename;
            return {
                sqlParams: ere.sqlParams,
                platform: PLATFORMS.SQL,
                type: expr.type,
                expr: `DELETE FROM "${tblName}" WHERE (${ere.expr})`,
            };
        }
    },
    [OPERATORS.NEW]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.NEW);
        checkCtx(ctx);

        TODO();
    },
    [OPERATORS.SQL_TO_HOST]: (ctx, sql, opt = {}) => {
        checkCtx(ctx);
        assert(sql.platform === PLATFORMS.SQL);

        // db.all return any[], if type isn't array use queryOne to any
        let queryFn = 'query';
        if (sql.type.kind === 'object') {
            queryFn = 'queryOne';
        } else if (
            sql.type.kind === 'unit' ||
            (sql.type.kind === 'basic' &&
                !typeEqual(sql.type, BASIC_TYPES.Void))
        ) {
            queryFn = 'queryOneElem';
        } else if (typeEqual(sql.type, BASIC_TYPES.Void)) {
            queryFn = 'run';
        } else if (
            sql.type.kind === 'array' &&
            sql.type.type.kind !== 'object'
        ) {
            queryFn = 'queryElem';
        }
        let fnName = `${inFnNameOfType(sql.type)}_SQLGet_${nanoid()}`;
        let params = sql.sqlParams.map((f) => `$${f}: ${f}`).join(',\n');
        if (params !== '') {
            params = `, {${params}}`;
        }
        fnName = UTILS.replaceInvalidChars(fnName);
        let formatSqlExpr = sqlFormat(sql.expr, {
            language: 'sqlite',
            tabWidth: 4,
        })
            .split('\n')
            .map((v, i) => {
                if (i !== 0) {
                    return `                 ${v}`;
                }
                return v;
            })
            .join('\n');
        ctx.dependedFn.push({
            fnBody: `const ${fnName} = async (${sql.sqlParams.join(', ')}) => {
    const db = await dbPool.acquire();
    const sql = \`${formatSqlExpr}\`;
    return db.${queryFn}(sql${params});
}`,
            daoKind: daoKindOfType(sql.type),
        });
        return {
            platform: PLATFORMS.HOST,
            type: sql.type,
            expr: `await ${fnName}(${sql.sqlParams.join(', ')})`,
        };
    },
    [OPERATORS.FUNC]: (ctx, func, platformRequire = PLATFORMS.BOTH) => {
        assert(func.tag === OPERATORS.FUNC);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.HOST) {
            let genFns = [];
            let fnBodies = [];
            let inputNames = func.body.inputs.map((i) => i[RAW_DATA].inf.name);

            const processExpr = (expr) => {
                let myctx = {
                    vars: func.body.inputs.map((i) => ({
                        name: i[RAW_DATA].inf.name,
                        expr: i[RAW_DATA].inf.name,
                    })),
                };
                let oldEffectExprs = effectExprs;
                effectExprs = [];
                let g = CODE_GENERATORS[expr.tag](myctx, expr, PLATFORMS.HOST);
                let newEE = effectExprs;
                effectExprs = oldEffectExprs;
                if (g === null) {
                    let oldEffectExprs = effectExprs;
                    effectExprs = [];
                    let gsql = CODE_GENERATORS[expr.tag](
                        myctx,
                        expr,
                        PLATFORMS.SQL
                    );
                    g = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](myctx, gsql);
                    newEE = effectExprs;
                    effectExprs = oldEffectExprs;
                }

                for (const v of myctx.vars) {
                    if (!inputNames.includes(v.name)) {
                        fnBodies.push(`let ${v.name} = ${v.expr};`);
                    }
                }
                newEE.forEach((e) => processExpr(e));
                genFns.push(...myctx.dependedFn);
                fnBodies.push(`${g.expr};`);
            };

            for (const expr of func.body.expr) {
                processExpr(expr);
            }
            if (func.body.ret !== null) {
                processExpr(func.body.ret);
            }
            // let asyncF = genFns.length === 0 ? '' : 'async ';
            ctx.dependedFn.push(...genFns);
            return {
                platform: PLATFORMS.HOST,
                expr: func.type,
                expr: `async (${inputNames.join(', ')}) => {
    ${fnBodies.join('\n')}
}`,
            };
        } else {
            {
                if (func.body.expr.length !== 0 || func.body.ret === null) {
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
    [OPERATORS.ASSERT]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.ASSERT);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
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
                await (async () => {
                    if (!(${host.expr})) { 
                        throw new Error("${msg}")
                    }
                })()
            `,
        };
    },
    [OPERATORS.CALL]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.CALL);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.SQL) {
            return null;
        }

        let args = expr.valueObj.args;
        let fnName = expr.valueObj.fnName;

        let argsE = [];
        for (const arg of args) {
            let e = CODE_GENERATORS[arg.tag](ctx, arg, PLATFORMS.HOST);
            if (e === null) {
                let s = CODE_GENERATORS[arg.tag](ctx, arg, PLATFORMS.SQL);
                e = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, s);
            }
            argsE.push(e);
        }

        return {
            platform: PLATFORMS.HOST,
            type: expr.type,
            expr: `${fnName}(${argsE.map((a) => `(${a.expr})`).join(',')})`,
        };
    },
    [OPERATORS.PIN]: (ctx, expr, platformRequire = PLATFORMS.BOTH) => {
        assert(expr.tag === OPERATORS.PIN);
        checkCtx(ctx);

        if (platformRequire === PLATFORMS.BOTH) {
            platformRequire = PREFER_PLATFORM;
        }

        if (platformRequire === PLATFORMS.SQL) {
            return null;
        }

        let varName = expr.inf.varName;
        let target = expr.value;

        let h = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.HOST);
        if (h === null) {
            let s = CODE_GENERATORS[target.tag](ctx, target, PLATFORMS.SQL);
            h = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, s);
        }

        return {
            platform: PLATFORMS.HOST,
            type: expr.type,
            expr: `let ${varName} = (${h.expr})`,
        };
    },
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
    let r = CODE_GENERATORS[f.tag](ctx, f, PLATFORMS.BOTH);
    if (r === null) {
        r = CODE_GENERATORS[f.tag](ctx, f, PLATFORMS.HOST);
    } else if (r.platform === PLATFORMS.SQL) {
        r = CODE_GENERATORS[OPERATORS.SQL_TO_HOST](ctx, r);
        return {
            daos: ctx.dependedFn,
            host: `const ${fnName} = async () => ${r.expr};`,
        };
    }
    return {
        daos: ctx.dependedFn,
        host: `const ${fnName} = ${r.expr};`,
    };
}

function printGeneratedFunction(f) {
    for (const d of f.daos) {
        console.log(UTILS.formatCode(d.fnBody));
    }
    console.log(UTILS.formatCode(f.host));
}

/**
 *
 * @param {(...any) => any} fn
 * @param {{name: string, val: any}[]} inputs
 */
function sqlGenerateTest(fn, inputs) {
    let f = functionProcess(fn, inputs)[RAW_DATA];
    let ctx = {};
    let g = CODE_GENERATORS[f.tag](ctx, f, PLATFORMS.SQL);
    console.dir(ctx);
    console.dir(g);
}

function fncallHelperGen(fn) {
    let exceptArgsLen = fn.args.length;
    let retType = parseType(fn.type);
    return (...args) => {
        assert(args.length === exceptArgsLen);

        for (let i = 0; i < exceptArgsLen; i++) {
            assert(
                typeEqual(args[i][RAW_DATA].type, parseType(fn.args[i].type))
            );
        }

        return createMultiChild(OPERATORS.CALL, PLATFORMS.BOTH, retType, {
            args,
            fnName: fn.name,
        });
    };
}

function registerFuncSignIntoGlobalThis(fns) {
    for (const fn of fns) {
        globalThis[fn.name] = fncallHelperGen(fn);
    }
}

function unregisterFuncSignFromGlobalThis(fns) {
    for (const fn of fns) {
        delete globalThis[fn.name];
    }
}

function codeGen(lcode) {
    loadSQLTableInf(readFileSync('./table.json').toString());
    registerSQLTableIntoGlobalThis();
    const fns = JSON.parse(lcode);
    registerFuncSignIntoGlobalThis(fns);

    for (const fn of fns) {
        if (fn.signOnly) {
            continue;
        }
        let f = functionGenerate(
            fn.name,
            new Function(...fn.args.map((a) => a.name), fn.body),
            fn.args.map((a) => {
                return createVar(PLATFORMS.HOST, parseType(a.type), {
                    name: a.name,
                });
            })
        );
        printGeneratedFunction(f);
    }

    unregisterFuncSignFromGlobalThis(fns);
    unregisterSQLTableFromGlobalThis();
}

function integrateTest(infileData) {
    let line = infileData
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l != '');

    let entities = [];
    let apis = [];
    let route = [];

    let inEntity = false;
    let inApi = false;
    let inRoute = false;

    let tmpGroup = [];
    let breaket = 0;

    for (const l of line) {
        tmpGroup.push(l);
        if (l.startsWith('entity')) {
            inEntity = true;
        } else if (l.startsWith('fn')) {
            if (!l.endsWith('{')) {
                apis.push(tmpGroup);
                tmpGroup = [];
            } else {
                inApi = true;
            }
        } else if (l.startsWith('route')) {
            inRoute = true;
        } else if (l == '}' && breaket == 0) {
            if (inEntity) {
                entities.push(tmpGroup);
                tmpGroup = [];
            } else if (inApi) {
                apis.push(tmpGroup);
                tmpGroup = [];
            } else if (inRoute) {
                route = tmpGroup;
                tmpGroup = [];
            }
            inEntity = false;
            inApi = false;
            inRoute = false;
        } else if (l == '{') {
            breaket++;
        } else if (l == '}') {
            breaket--;
        }
    }

    let fns = apis.map((fn) => {
        let fnSign = fn[0];
        let [l, mr] = fnSign.split('(');
        let [_1, fname] = l.split('fn');
        fname = fname.trim();
        let [m, r] = mr.split(')');
        let [_2, rtt] = r.split('->');
        if (rtt) {
            rtt = rtt.trim();
            let [t, _3] = rtt.split('{');
            rtt = t.trim();
        } else {
            rtt = 'Void';
        }
        let args = m
            .trim()
            .split(',')
            .filter((s) => s !== '')
            .map((a) => a.split(':').map((n) => n.trim()))
            .map((a) => ({
                name: a[0],
                type: a[1],
            }));

        if (fn.length === 1) {
            // sign only
            return {
                signOnly: true,
                name: fname,
                args,
                type: rtt,
            };
        } else {
            return {
                signOnly: false,
                name: fname,
                args,
                type: rtt,
                body: fn.slice(1, -1).join('\n'),
            };
        }
    });

    codeGen(JSON.stringify(fns));
}

PREFER_PLATFORM = PLATFORMS.HOST;

integrateTest(`
fn removeOrder(oid: Order.Id) {
    Order.remove(o => o.Id.eq(oid))
}`);
