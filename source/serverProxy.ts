enum ReqMethod {
  get = 'GET',
  post = 'POST',
  delete = 'DELETE',
  put = 'PUT',
}

class ServerProxy {
  listener: any;
  server: any;
  getMap = {};
  postMap = {};

  constructor(server, listener) {
    this.server = server;
    this.server.use(async (ctx, next) => {
      const body = ctx.request.body;
      const res = await listener.on(body, ctx, next);
      ctx.response.body = res;
      return;
    });
  }

  get(path, proccess) {
    this.getMap[path] = proccess;
  }

  post(path, proccess) {
    this.postMap[path] = proccess;
  }

  handleRequest(requestBody, ctx, next) {
    const { method, path, params, body } = requestBody;
    if (ctx?.request) {
      ctx.request.params = params;
      ctx.request.body = body;
    }

    switch (method) {
      case ReqMethod.get:
        return this.getMap[path](ctx, next);
      case ReqMethod.post:
        return this.postMap[path](ctx, next);
      default:
        return;
    }
  }

  listen(port) {
    this.server.listen(port);
  }
}

module.exports = {
  ServerProxy,
};
