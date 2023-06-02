import { readFileSync, writeFileSync } from "fs";

let route = JSON.parse(readFileSync('./route.json').toString())
let fn = JSON.parse(readFileSync('./logic.json').toString())
let sql = JSON.parse(readFileSync('./table.json').toString())

for (const r of route) {
    if (r.method === "get") {
        `
        router.get('${url}', (ctx, next) => {
                
        });
        `
    } else {

    }
}