const SQL_TABLE_TYPES = {
    "Img": {
        "kind": "object",
        "primaryMember": "Id",
        "uniqueMember": [
            "Path",
            "Id"
        ],
        "member": {
            "Path": {
                "kind": "unit",
                "typename": "Img.Path",
                "alias": "String"
            },
            "Id": {
                "kind": "unit",
                "typename": "Img.Id",
                "alias": "Int"
            }
        }
    },
    "Food": {
        "kind": "object",
        "primaryMember": "Id",
        "uniqueMember": [
            "Id"
        ],
        "member": {
            "Name": {
                "kind": "unit",
                "typename": "Food.Name",
                "alias": "String"
            },
            "Img": {
                "kind": "unit",
                "typename": "Img"
            },
            "Price": {
                "kind": "unit",
                "typename": "Food.Price",
                "alias": "Int"
            },
            "Id": {
                "kind": "unit",
                "typename": "Food.Id",
                "alias": "Int"
            }
        }
    },
    "Table": {
        "kind": "object",
        "primaryMember": "Id",
        "uniqueMember": [
            "Id"
        ],
        "member": {
            "CurOrder": {
                "kind": "unit",
                "typename": "Order"
            },
            "Id": {
                "kind": "unit",
                "typename": "Table.Id",
                "alias": "Int"
            }
        }
    },
    "OrderItem": {
        "kind": "object",
        "primaryMember": "Id",
        "uniqueMember": [
            "Id"
        ],
        "member": {
            "Food": {
                "kind": "unit",
                "typename": "Food"
            },
            "Count": {
                "kind": "unit",
                "typename": "OrderItem.Count",
                "alias": "Int"
            },
            "Id": {
                "kind": "unit",
                "typename": "OrderItem.Id",
                "alias": "Int"
            }
        }
    },
    "Order": {
        "kind": "object",
        "primaryMember": "Id",
        "uniqueMember": [
            "Items",
            "Id"
        ],
        "member": {
            "Table": {
                "kind": "unit",
                "typename": "Table"
            },
            "Closed": {
                "kind": "unit",
                "typename": "Order.Closed",
                "alias": "Int"
            },
            "Items": {
                "kind": "array",
                "type": {
                    "kind": "unit",
                    "typename": "OrderItem"
                }
            },
            "Id": {
                "kind": "unit",
                "typename": "Order.Id",
                "alias": "Int"
            }
        }
    }
};

const BASIC_TYPES = {
    Int: {
        kind: "basic",
        typename: "int"
    },
    String: {
        kind: "basic",
        typename: "str"
    },
    Blob: {
        kind: "basic",
        typename: "blob"
    }
};

function resolveTypeSelfRef(all, basic, cur, update) {
    if (cur.kind === "unit" && all[cur.typename] !== undefined) {
        update(all[cur.typename]);
    } else if (cur.kind === "unit" && cur.alias !== undefined && basic[cur.alias] !== undefined) {
        cur.alias = basic[cur.alias];
    } else if (cur.kind === "array") {
        resolveTypeSelfRef(all, cur.type, t => cur.type = t);
    } else if (cur.kind === "object") {
        for (let mtype of Object.keys(cur.member)) {
            resolveTypeSelfRef(all, cur.member[mtype], t => cur.member[mtype] = t);
        }
    }
}

for (let type of Object.keys(SQL_TABLE_TYPES)) {
    resolveTypeSelfRef(SQL_TABLE_TYPES, BASIC_TYPES, SQL_TABLE_TYPES[type], t => SQL_TABLE_TYPES[type] = t);
}

const UNREACHABLE = () => {
    throw new Error("unreachable");
};

const UNIMPLEMENTED = () => {
    throw new Error("unimplemented");
};

const PLATFORMS = {
    HOST: 1,
    SQL: 2,
    BOTH: 3
}

function ArrayOfType(type) {
    return {
        kind: "array",
        type
    };
}

/**
 * 
 * @param {string} typename 
 * @returns {string}
 */
function getParentType(typename) {
    let [p, _c] = typename.split(".");
    return p;
}

/**
 * 
 * @param {string} typename 
 * @returns {string}
 */
function getMemberName(typename) {
    let [_p, c] = typename.split(".");
    return c;
}

const OPERATORS = {
    FIRST: "first",
    FILTER: "filter",
    MAP: "map",
    SUM: "sum",
    COUNT: "count",
    SKIP: "skip",
    TAKE: "take",
    REACCESS: "reacess",
    MEMBER_ACCESS: "member-access",
    IS_NULL: "is-null",
    NOT_NULL: "not-null"
}

const OBJ_BUILTIN = {
    type: Symbol("@type"),
    platform: Symbol("@platform"),
    tag: Symbol("@tag")
}

const PROXY_HANDLER = {
    get(target, p, receiver) {
        if (typeof(p) === "symbol") {
            for (const sym of OBJ_BUILTIN) {
                if (p === OBJ_BUILTIN[sym]) {
                    return target[sym];
                }
            }
        }
        if (target.type.kind === "array") {
            if (p === "first") {
                UNIMPLEMENTED();
            } else if (p === "filter") {
                UNIMPLEMENTED();
            } else if (p === "map") {
                UNIMPLEMENTED();
            } else if (p === "sum") {
                UNIMPLEMENTED();
            } else if (p === "count") {
                UNIMPLEMENTED();
            } else if (p === "skip") {
                UNIMPLEMENTED();
            } else if (p === "take") {
                UNIMPLEMENTED();
            }
        }
        // check if reaccessable
        if (target.type.kind === "unit") {
            let parentType = getParentType(target.type.typename);
            let memberName = getMemberName(target.type.typename);
            /** @type {string[]} */
            let reaccessableMember = SQL_TABLE_TYPES[parentType].uniqueMember;
            if (reaccessableMember.includes(memberName)) {
                // reaccessable
                if (p === parentType) {
                    return createOneChild(OPERATORS.REACCESS, PLATFORMS.SQL, SQL_TABLE_TYPES[parentType], target);
                }
            }
        }
        // check if member access
        if (target.type.kind === "object") {
            if (target.type.member[p] !== undefined) {
                // member access
                return createOneChild(OPERATORS.MEMBER_ACCESS, PLATFORMS.BOTH, target.type.member[p], target);
            }
        }

        // create new table entity
        if (target.inf.globalTable && p === "new") {
            return (obj) => {

            };
        }

        if (target.type.kind !== "basic" && p == "isNull") {
            return createOneChild(OPERATORS.IS_NULL, PLATFORMS.BOTH, BASIC_TYPES.Int, target);
        }

        if (target.type.kind !== "basic" && p == "isNotNull") {
            return createOneChild(OPERATORS.NOT_NULL, PLATFORMS.BOTH, BASIC_TYPES.Int, target);
        }

        if (["eq", "lt", "le", "gt", "ge", "neq"].contains(p)) {
            return (val) => {
                if (typeEqual(target.type, val[OBJ_BUILTIN.type])) {

                }
            }
        }

        UNREACHABLE();
    }
}

function createMultiChild(tag, platform, type, valueObj, inf = {}) {
    return new Proxy({
        platform,
        type,
        tag,
        valueObj,
        inf
    }, PROXY_HANDLER);
}

function createOneChild(tag, platform, type, value, inf = {}) {
    return new Proxy({
        platform,
        type,
        tag,
        value,
        inf
    }, PROXY_HANDLER);
}

function createZeroChild(tag, platform, type, inf = {}) {
    return new Proxy({
        platform,
        type,
        tag,
        inf
    }, PROXY_HANDLER);
}

function createVar(platform, type) {
    return createZeroChild("var", platform, type);
}

for (const table of Object.keys(SQL_TABLE_TYPES)) {
    globalThis[table] = createVar(PLATFORMS.SQL, ArrayOfType(SQL_TABLE_TYPES[table]), { globalTable: true });
}

function functionProcess(fnName, fn, inputs) {
    tableOrderAppend(...inputs);
}

function tableOrderAppend(TId, FId, Count) {
    let curOrderItems = TId.Table.CurOrder.Items;
    let theOrderItem = curOrderItems.first(x => x.Food.Id.eq(FId));
    theOrderItem.isNotNull().cond(
        () => theOrderItem.Count.selfAdd(Count),
        () => curOrderItems.append(OrderItem.new({
            Food: FId.Food,
            Count
        }))
    )
}
