import koa from 'koa';
import koaRouter from 'koa-router';
import { koaBody } from 'koa-body';

let app = new koa();
let router = new koaRouter();

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Upgrade-Insecure-Requests');
    await next();
});
app.use(koaBody())

router.get('/test', (ctx, next) => {
    ctx.body = 'hello koa-route'
})

router.get('/test/json', (ctx, next) => {
    ctx.body = {
        kind: 'get',
        aa: [1, '2', false]
    }
})

router.get('/test/url/:aaa', (ctx, next) => {
    ctx.body = {
        aaa: ctx.params.aaa
    }
})

router.get('/test/urlq', (ctx, next) => {
    ctx.body = {
        query: ctx.query
    }
})

router.post('/test/body', (ctx, next) => {
    ctx.body = {
        query: ctx.query,
        body: ctx.request.body
    }
})

app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(8877);
