import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

const basePath = argv["base"] ?? "../processing-data";
const inFileName = argv["i"] ?? "input.ecg";
const inFile = join(basePath, inFileName);
const doutFileName = argv["od"] ?? "processed.ecgd1";
const doutFile = join(basePath, doutFileName);
const loutFileName = argv["ol"] ?? "processed.ecgl1";
const loutFile = join(basePath, loutFileName);
const routFileName = argv["or"] ?? "processed.ecgr1";
const routFile = join(basePath, routFileName);

console.log(`PreProcessing, input: ${resolve(inFile)}`);

let infileData = readFileSync(inFile).toString();

let line = infileData
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l != "");

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
  } else if (l === "{" || (inRoute && l.endsWith("{"))) {
    breaket++;
  } else if (l === "}") {
    breaket--;
  }
}

for (const entity of entities) {
  let ei = 1;
  entity[0] = "table!(" + entity[0];
  for (; ei < entity.length - 1; ei++) {
    if (entity[ei].endsWith(",")) {
      entity[ei].slice(0, -1);
    }
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

let fns = apis.map((fn) => {
  let fnSign = fn[0];
  let [l, mr] = fnSign.split("(");
  let [_1, fname] = l.split("fn");
  fname = fname.trim();
  let [m, r] = mr.split(")");
  let [_2, rtt] = r.split("->");
  if (rtt) {
    rtt = rtt.trim();
    let [t, _3] = rtt.split("{");
    rtt = t.trim();
  } else {
    rtt = "Void";
  }
  let args = m
    .trim()
    .split(",")
    .filter((s) => s !== "")
    .map((a) => a.split(":").map((n) => n.trim()))
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
      body: fn.slice(1, -1).join("\n"),
    };
  }
});

let entitiesBuilder = entities.map((e) => e.join("\n")).join(",\n");
entitiesBuilder = `vec![${entitiesBuilder}]`;

let routes = [];
let root = [""];
for (let i = 1; i < route.length - 1; i++) {
    if (route[i].trim().startsWith('"')) {
        let [_a, url, _b] = route[i].split('"');
        root.push(url);
    } else if (route[i].trim() == "}") {
        root.pop();
    } else {
        const url = root.join("/");
        let [m, f] = route[i].split('=>');
        m = m.trim();
        let [fn, rst] = f.split('(');
        let [args, _1] = rst.split(')');
        let arg = args.split(',').map(a => a.trim());
        fn = fn.trim();
        let inf = {
            url,
            method: m,
            fnName: fn,
            args: arg
        }
        routes.push(inf);
    }
}

writeFileSync(doutFile, entitiesBuilder);
writeFileSync(loutFile, JSON.stringify(fns));
writeFileSync(routFile, JSON.stringify(routes));

console.log(`PreProcessing, output-D: ${resolve(doutFile)}`);
console.log(`PreProcessing, output-L: ${resolve(loutFile)}`);
console.log(`PreProcessing, output-R: ${resolve(routFile)}`);
