let infileData = `
route {
    "login" {
        post => login(_, _)
    }
    "logout" {
        get => logout(_)
    }
}
`;

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
    } else if (l === "{" || (inRoute && l.endsWith("{"))) {
        breaket++;
    } else if (l === "}") {
        breaket--;
    }
}

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
