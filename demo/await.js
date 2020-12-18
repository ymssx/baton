// 使用方式
import start from './baton.js';

const root = start('http://localhost:3000/baton/');

const a = root.next({ path: '/aaa' });

const x = 1;
const y = { m: 2 };

const b = a.next((res) => {
  const { i, j } = res;
  return {
    path: '/bbb',
    params: {
      i: i + j,
      j: x,
    },
  }
}, { x, y });

const c = await b.get(res => {
  return {
    ...res,
    ok: 'ok',
  };
});

console.log(c)

main();
