import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

const basePath = argv["base"] ?? "../processing-data";
const inFileName = argv["i"] ?? "input.ecg";
const inFile = join(basePath, inFileName);
const outFileName = argv["o"] ?? "processed.ecg1";
const outFile = join(basePath, outFileName);

console.log(`PreProcessing, input: ${resolve(inFile)}`);

let infileData = readFileSync(inFile).toString();

let line = infileData.split("\n").map(l => l.trim()).filter(l => l != "");

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
    if (l.startsWith("entity")) {
        inEntity = true;
    } else if (l.startsWith("fn")) {
        if (!l.endsWith("{")) {
            apis.push(tmpGroup);
            tmpGroup = [];
        } else {
            inApi = true;
        }
    } else if (l.startsWith("route")) {
        inRoute = true;
    } else if (l == "}" && breaket == 0) {
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
    } else if (l == "{") {
        breaket++;
    } else if (l == "}") {
        breaket--;
    }
}

for (const entity of entities) {
    let ei = 1;
    entity[0] = "table!(" + entity[0];
    for (; ei < entity.length - 1; ei++) {
        let [name, type] = entity[ei].split(":");
        name = name.trim();
        type = type.trim();
        if (type == "Bool") {
            type = "Int{0..2}";
        }
        entity[ei] = `field!(${name}:${type}),`;
    }
    entity[entity.length - 1] += ")";
}

for (const fn of apis) {
    let ei = 1;
    let [l, mr] = fn[0].split("(");
    let [m, r] = mr.split(")");
    let args = m.split(",").map(a => {
        let [n, t] = a.split(":");
        if (t === undefined) {
            return `"${n}"`
        } else {
            return `${n} : "${t}"`
        }
    }).join(",");

    fn[0] = `func!(${l}(${args})${r}`;
    for (; ei < fn.length - 1; ei++) {
        fn[ei] = `"${fn[ei]}",`
    }
    fn[fn.length - 1] += ")";
}

let entitiesBuilder = entities.map(e => e.join("\n")).join(",\n");
entitiesBuilder = `vec![${entitiesBuilder}]`;
let fnsBuilder = apis.map(e => e.join("\n")).join(",\n");
fnsBuilder = `vec!(${fnsBuilder})`;

let newRoot = [];
let root = [""];
for (let i = 1; i < route.length - 1; i++) {
    if (route[i].trim().startsWith('"')) {
        let [_a, url, _b] = route[i].split('"');
        root.push(url);
    } else if (route[i].trim() == "}") {
        root.pop();
    } else {
        newRoot.push(`"${root.join("/")}", ${route[i]};`);
    }
}

let routeBuilder = `route!{${newRoot.join("\n")}}`;

writeFileSync(outFile, `(${entitiesBuilder}, ${fnsBuilder}, ${routeBuilder})`);

console.log(`PreProcessing, output: ${resolve(outFile)}`);
