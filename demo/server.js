const Koa = require('koa');
const { BatonServer } = require('./batonServer');
const bodyParser = require('koa-bodyparser');

const KoaApp = new Koa();
KoaApp.use(bodyParser());
const app = new BatonServer(KoaApp, '/baton');

app.get('/aaa', async ctx => {
  return {
    i: 1,
    j: 2,
  }
});

app.get('/bbb', async ctx => {
  const { params } = ctx.request;
  const { i, j } = params;
  return {
    i: 3 + i,
    j: 4 * j,
  }
});

// 在端口3000监听:
app.listen(3000);
