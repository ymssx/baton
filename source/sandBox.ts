const { VM } = require('vm2');

const runFunc = (funcString: string, res: any, data: object) => {
  const vm = new VM({
    sandbox: data,
    timeout: 1000,
  });

  return vm.run(`(${funcString})(${res ? JSON.stringify(res) : ''})`);
}

module.exports = {
  sandbox: runFunc,
};
