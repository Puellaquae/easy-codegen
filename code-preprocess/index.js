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

let inEntity = false;
let inApi = false;

let tmpGroup = [];
let breaket = 0;

for (const l of line) {
    tmpGroup.push(l);
    if (l.startsWith("entity")) {
        inEntity = true;
    } else if (l.startsWith("api")) {
        inApi = true;
    } else if (l == "}" && breaket == 0) {
        if (inEntity) {
            entities.push(tmpGroup);
            tmpGroup = [];
        } else if (inApi) {
            apis.push(tmpGroup);
            tmpGroup = [];
        }
        inEntity = false;
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

let entitiesBuilder = entities.map(e => e.join("\n")).join(",\n");
entitiesBuilder = "vec![" + entitiesBuilder + "]";

writeFileSync(outFile, entitiesBuilder);

console.log(`PreProcessing, output: ${resolve(outFile)}`);
