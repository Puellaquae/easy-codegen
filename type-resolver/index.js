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
                "typename": "Img.Path"
            },
            "Id": {
                "kind": "unit",
                "typename": "Img.Id"
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
                "typename": "Food.Name"
            },
            "Img": {
                "kind": "unit",
                "typename": "Img"
            },
            "Price": {
                "kind": "unit",
                "typename": "Food.Price"
            },
            "Id": {
                "kind": "unit",
                "typename": "Food.Id"
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
                "typename": "Table.Id"
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
                "typename": "OrderItem.Count"
            },
            "Id": {
                "kind": "unit",
                "typename": "OrderItem.Id"
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
                "typename": "Order.Closed"
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
                "typename": "Order.Id"
            }
        }
    }
};

function resolveTypeSelfRef(all, cur, update) {
    if (cur.kind === "unit" && all[cur.typename] !== undefined) {
        update(all[cur.typename]);
    } else if (cur.kind === "array") {
        resolveTypeSelfRef(all, cur.type, t => cur.type = t);
    } else if (cur.kind === "object") {
        for (let mtype of Object.keys(cur.member)) {
            resolveTypeSelfRef(all, cur.member[mtype], t => cur.member[mtype] = t);
        }
    }
}

for (let type of Object.keys(SQL_TABLE_TYPES)) {
    resolveTypeSelfRef(SQL_TABLE_TYPES, SQL_TABLE_TYPES[type], t => SQL_TABLE_TYPES[type] = t);
}

const BASIC_TYPES = {
    Int: {
        kind: "unit",
        typename: "int"
    },
    Str: {
        kind: "unit",
        typename: "str"
    },
    Blob: {
        kind: "unit",
        typename: "blob"
    }
};

const UNREACHABLE = () => {
    throw new Error("unreachable");
};

const UNIMPLEMENTED = () => {
    throw new Error("unimplemented");
};

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

const PROXY_HANDLER = {
    get(target, p, receiver) {
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
                    return createOneChild("reaccess", "sql", SQL_TABLE_TYPES[parentType], target);
                }
            }
        }
        // check if member access
        if (target.type.kind === "object") {
            if (target.type.member[p] !== undefined) {
                // member access
                return createOneChild("member-access", "both", target.type.member[p], target);
            }
        }

        

        UNREACHABLE();
    }
}

function createOneChild(tag, platform, type, value) {
    return new Proxy({
        platform,
        type,
        tag,
        value
    }, PROXY_HANDLER);
}

function createZeroChild(tag, platform, type) {
    return new Proxy({
        platform,
        type,
        tag
    }, PROXY_HANDLER);
}

function createVar(platform, type) {
    return createZeroChild("var", platform, type);
}


let TId = createVar("both", SQL_TABLE_TYPES.Table.member.Id);

let curOrderItems = TId.Table.CurOrder.Items;

console.log(curOrderItems);

function filter(fn) {
    let v = createVar("both", BASIC_TYPES.Int)

    let ret = fn(v);

    console.log(ret);
}

/*let theOrderItem = curOrderItems.first(x => x.Food.Id.eq(FId));
cond(
    theOrderItem.ok(),
    () => { theOrderItem.Count.selfAdd(Count); },
    () => { curOrderItems.append(OrderItem.new({})); }
)*/
/*
// TId
let a = {
    platform: "both",
    tag: "var",
    type: SQL_TABLE_TYPES.Table.member.Id,
}

// TId.Table
let b = {
    platform: "sql",
    tag: "reaccess-by-unique",
    value: a,
    type: SQL_TABLE_TYPES.Table
}

// TId.Table.CurOrder
let c = {
    platform: "sql",
    tag: "foreign-access",
    value: b,
    type: SQL_TABLE_TYPES.Order
}

// TId.CurOrder.Items
let d = {
    platform: "both",
    tag: "member-access",
    value: d,
    type: SQL_TABLE_TYPES.Order.member.Items
}

let e = {
    platform: "both",
    tag: "var",
    type: SQL_TABLE_TYPES.Order.member.Items.type
}*/