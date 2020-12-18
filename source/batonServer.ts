const { sandbox } = require('./sandBox');
const { ServerProxy: Server } = require('./serverProxy');

class BatonServer {
  server: any;
  rootList: Baton[];

  constructor(server) {
    this.server = new Server(server, this);
  }

  on(reqTree, ctx, next) {
    this.rootList = reqTree.map(batonRoot => new Baton(batonRoot, this));
    return this.emitRequest(ctx, next);
  }

  emitRequest(ctx, next) {
    const reqList = this.rootList.map(baton => {
      return baton.handleRequest({}, ctx, next);
    });

    return Promise.all(reqList);
  }

  handleRequest(requestBody, ctx, next) {
    return Promise.resolve(this.server.handleRequest(requestBody, ctx, next));
  }

  get(path, proccess) {
    this.server.get(path, proccess);
  }

  post(path, proccess) {
    this.server.post(path, proccess);
  }

  listen(port) {
    this.server.listen(port);
  }
}

enum RequestStatus {
  start,
  waiting,
  success,
  failed,
}

class Baton {
  root?: BatonServer;
  requestMethod: Function | string;
  nextChilds: Baton[];
  result: any;
  childsResult: any[];
  status: RequestStatus;

  constructor(batonData, root) {
    this.root = root;
    this.init(batonData);
    this.result = null;
    this.childsResult = [];
    this.status = RequestStatus.start;
  }

  init(batonData) {
    const { reqType, request, data, nextChilds } = batonData;
    this.requestMethod = reqType === 'F'
      ? res => sandbox(request, res, data)·
      : request;
    this.nextChilds = nextChilds && nextChilds.map((batonDataItem) => {
      return new Baton(batonDataItem, this.root);
    });
  }

  request(result, ctx, next) {
    return new Promise((resolve, reject) => {
      let requestBody;
      if (this.requestMethod instanceof Function) {
        requestBody = this.requestMethod(result);
      } else {
        requestBody = this.requestMethod;
      }

      this.root.handleRequest(requestBody, ctx, next).then((data) => {
        resolve(data);
      });
    });
  }

  handleRequest(lastResult, ctx, next) {
    return new Promise((resolve, reject) => {
      this.request(lastResult, ctx, next).then((data) => {
        this.result = data;
        this.status = RequestStatus.success;

        if (!this.nextChilds) {
          resolve({ result: data });
          return;
        }

        const requestList = this.nextChilds.map((baton: Baton, index: number) => {
          return baton.handleRequest(data, ctx, next).then((childResult) => {
            this.childsResult[index] = childResult;
          });
        });

        Promise.all(requestList).then(() => {
          resolve({
            result: data,
            childsResult: this.childsResult,
          })
        });
      });
    });
  }
}

module.exports = {
  BatonServer,
  Baton,
}
