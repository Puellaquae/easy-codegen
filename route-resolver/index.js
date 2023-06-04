import { readFileSync, writeFileSync } from 'fs';
import prettier from 'prettier';
function formatCode(str) {
    return prettier.format(str, {
        arrowParens: 'always',
        bracketSpacing: true,
        embeddedLanguageFormatting: 'auto',
        semi: true,
        tabWidth: 4,
        parser: 'babel',
    });
}
import minimist from 'minimist';

function routeProcess(
    rin = './route.json',
    lin = './logic.json',
    din = './table.json'
) {
    /**
     * @type { {url: string, method: string, fnName: string, args: string[]}[] }
     */
    let route = JSON.parse(readFileSync(rin).toString());
    /**
     * @type { {signOnly: boolean, name: string, args: {name: string, type: string}[], type: string, body: string}[] }
     */
    let fn = JSON.parse(readFileSync(lin).toString());
    let sql = JSON.parse(readFileSync(din).toString());

    let rc = route
        .map((r) => {
            let f = fn.filter((f) => f.name === r.fnName)[0];
            if (r.method === 'get') {
                let a = f.args
                    .map((a, i) => {
                        if (r.args[i] === '_') {
                            if (Object.keys(sql).includes(a.type)) {
                                let r = Object.keys(sql[a.type].member)
                                    .map((k) => {
                                        if (
                                            k === sql[a.type].primaryMember &&
                                            sql[a.type].primaryAuto
                                        ) {
                                            return null;
                                        }
                                        if (
                                            Object.keys(sql).includes(
                                                sql[a.type].member[k].typename
                                            )
                                        ) {
                                            let pk =
                                                sql[
                                                    sql[a.type].member[k]
                                                        .typename
                                                ].primaryMember;
                                            let type = sql[
                                                sql[a.type].member[k]
                                                    .typename
                                            ].member[pk].alias;
                                            if (type === "Int") {
                                                return `['${k}.${pk}']: parseInt(ctx.query['${a.name}-${k}-${pk}'], 10)`;
                                            } else {
                                                return `['${k}.${pk}']: ctx.query['${a.name}-${k}-${pk}']`;
                                            }
                                        }
                                        let t = sql[a.type].member[k].alias;
                                        if (t === "Int") {
                                            return `['${k}']: parseInt(ctx.query['${a.name}-${k}'], 10)`;
                                        } else {
                                            return `['${k}']: ctx.query['${a.name}-${k}']`;
                                        }
                                    })
                                    .filter((f) => f !== null)
                                    .join(',\n');
                                return `{${r}}`;
                            } else {
                                let t = a.type.split('.')[0]
                                if (Object.keys(sql).includes(t)) {
                                    t = sql[a.type.split('.')[0]].member[a.type.split('.').slice(1).join('.')].alias;
                                }
                                if (t === "Int") {
                                    return `parseInt(ctx.query['${a.name}'], 10)`;
                                } else {
                                    return `ctx.query['${a.name}']`;
                                }
                            }
                        } else {
                            let t = a.type.split('.')[0]
                            if (Object.keys(sql).includes(t)) {
                                t = sql[a.type.split('.')[0]].member[a.type.split('.').slice(1).join('.')].alias;
                            }
                            if (t === "Int") {
                                return `parseInt(ctx.params['${r.args[i]}'], 10)`;
                            } else {
                                return `ctx.params['${r.args[i]}']`;
                            }
                        }
                    })
                    .join(', ');
                let c;
                if (f.type === 'Void') {
                    c = `
            router.get('${r.url}', async (ctx, next) => {
                try {
                    await service.${f.name}(${a});
                ctx.body = {
                    ok: true,
                    processFn: '${r.fnName}'
                };
                } catch (err) {
                console.log(err)
                ctx.body = {
                        ok:false,
                        processFn: '${r.fnName}',
                        err: err.message
                    }; 
                }
            });
            `;
                } else {
                    c = `
            router.get('${r.url}', async (ctx, next) => {
                try{
                let res = await service.${f.name}(${a});
                ctx.body = {
                    ok:true,
                    processFn: '${r.fnName}',
                    res
                }   
            }catch(err){
                console.log(err)
                ctx.body = {
                    ok:false,
                    processFn: '${r.fnName}',
                    err: err.message
                }; 
            } 
            });
            `;
                }
                return c;
            } else {
                let a = f.args
                    .map((a, i) => {
                        if (r.args[i] === '_') {
                            return `ctx.request.body['${a.name}']`;
                        } else {
                            let t = a.type.split('.')[0]
                            if (Object.keys(sql).includes(t)) {
                                t = sql[a.type.split('.')[0]].member[a.type.split('.').slice(1).join('.')].alias;
                            }
                            if (t === "Int") {
                                return `parseInt(ctx.params['${r.args[i]}'], 10)`;
                            } else {
                                return `ctx.params['${r.args[i]}']`;
                            }
                        }
                    })
                    .join(', ');
                let c;
                if (f.type === 'Void') {
                    c = `
            router.post('${r.url}', async (ctx, next) => {
                try {
                    await service.${f.name}(${a});
                ctx.body = {
                    ok: true,
                    processFn: '${r.fnName}'
                };
                } catch (err) {
                console.log(err)
                ctx.body = {
                        ok:false,
                        processFn: '${r.fnName}',
                        err: err.message
                    }; 
                }
            });
            `;
                } else {
                    c = `
            router.post('${r.url}', async (ctx, next) => {
                try{
                let res = await service.${f.name}(${a});
                ctx.body = {
                    ok:true,
                    processFn: '${r.fnName}',
                    res
                }   
            }catch(err){
                console.log(err)
                ctx.body = {
                    ok:false,
                    processFn: '${r.fnName}',
                    err: err.message
                }; 
            } 
            });
            `;
                }
                return c;
            }
        })
        .join('\n\n');
    return rc;
}

function webMap(
    rin = './route.json',
    lin = './logic.json',
    din = './table.json'
) {
    /**
     * @type { {url: string, method: string, fnName: string, args: string[]}[] }
     */
    let route = JSON.parse(readFileSync(rin).toString());
    /**
     * @type { {signOnly: boolean, name: string, args: {name: string, type: string}[], type: string, body: string}[] }
     */
    let fn = JSON.parse(readFileSync(lin).toString());
    let sql = JSON.parse(readFileSync(din).toString());

    let rc = route
        .map((r) => {
            let f = fn.filter((f) => f.name === r.fnName)[0];
            let a = f.args
                .map((a, i) => {
                    if (r.args[i] === '_') {
                        if (Object.keys(sql).includes(a.type)) {
                            let r = Object.keys(sql[a.type].member)
                                .map((k) => {
                                    if (
                                        k === sql[a.type].primaryMember &&
                                        sql[a.type].primaryAuto
                                    ) {
                                        return null;
                                    }
                                    if (
                                        Object.keys(sql).includes(
                                            sql[a.type].member[k].typename
                                        )
                                    ) {
                                        let pk =
                                            sql[
                                                sql[a.type].member[k]
                                                    .typename
                                            ].primaryMember;
                                        let type = sql[
                                            sql[a.type].member[k]
                                                .typename
                                        ].member[pk].alias;
                                        return `"${a.name}_${k}_${pk}": {"label":"${a.name}.'${k}.${pk}'", "type":"${type}", "own":"${a.name}", "key":"${k}.${pk}"}`;
                                    }
                                    let t = sql[a.type].member[k].alias;
                                    return `"${a.name}_${k}": {"label":"${a.name}.${k}", "type":"${t}", "own":"${a.name}", "key":"${k}"}`;
                                })
                                .filter((f) => f !== null)
                                .join(',\n');
                            return `${r}`;
                        } else {
                            let t = a.type.split('.')[0]
                            if (Object.keys(sql).includes(t)) {
                                t = sql[a.type.split('.')[0]].member[a.type.split('.').slice(1).join('.')].alias;
                            }
                            return `"${a.name}": {"label":"${a.name}","type":"${t}"}`;
                        }
                    } else {
                        let t = a.type.split('.')[0]
                        if (Object.keys(sql).includes(t)) {
                            t = sql[a.type.split('.')[0]].member[a.type.split('.').slice(1).join('.')].alias;
                        }
                        return `"${a.name}": {"label":"${a.name}","type":"${t}", "place":"url"}`;
                    }
                })
                .filter(f => f !== null)
                .join(', ');
            let c = `{
                    "url": "${r.url}","name": "${r.fnName}",
                    "method": "${r.method.toUpperCase()}",
                    params:{${a}}
                }`
            return eval(`(() => (${c}))()`);
        });
    let r = {};
    for (const rr of rc) {
        r[rr.name] = rr
    }
    return formatCode(`router.get("/api", async (ctx, next) => {
        ctx.body = 
    ${JSON.stringify(r, null, 2)};})`);
}

if (process.argv.length > 2) {
    const argv = minimist(process.argv.slice(2));
    const din = argv.din;
    const lin = argv.lin;
    const rin = argv.rin;
    const routc = argv.routc;
    const routi = argv.routi;

    let rc = routeProcess(rin, lin, din);
    let wc = webMap(rin, lin, din);
    let c = `
import koa from 'koa';
import koaRouter from 'koa-router';
import { koaBody } from 'koa-body';
import * as service from './service.js';

let app = new koa();
let router = new koaRouter();

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Upgrade-Insecure-Requests');
    await next();
});
app.use(koaBody())

    ${rc}

    ${wc}

    app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(8877);
`;
    writeFileSync(routc, formatCode(c));
} else {
    console.log(webMap());
}
