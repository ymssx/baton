export enum ReqMethod {
  get = 'GET',
  post = 'POST',
  delete = 'DELETE',
  put = 'PUT',
}

export interface Request {
  url: string;
  method: ReqMethod;
}

export type GetRequest = () => Request;

export class Baton {
  nextChilds: Baton[] = [];
  request: Request | GetRequest;
  father: Baton | BatonRoot;
  data: object;
  resolve: Function;
  reject: Function;

  constructor(request?: Request | GetRequest, data?: object) {
    this.request = request;
    this.data = data;
  }

  next(request: Request | GetRequest, data?: object) {
    const newBaton = new Baton(request, data);
    this.nextChilds.push(newBaton);
    newBaton.father = this;
    return newBaton;
  }

  get(finalProcess?: Function) {
    return new Promise((resolve, reject) => {
      this.resolve = finalProcess ? res => resolve(finalProcess(res)) : resolve;
      this.reject = reject;
    });
  }

  getTree() {
    const { request, data, nextChilds } = this;
    return {
      reqType: request instanceof Function ? 'F' : 'S',
      request: request instanceof Function
        ? String(request)
        : request,
      data,
      nextChilds: nextChilds.map((item: Baton) => {
        return item.getTree();
      }),
    };
  }

  onResult(data) {
    if (this.resolve instanceof Function) {
      this.resolve(data.result);
    }
      
    for (let index = 0; index < this.nextChilds.length; index += 1) {
      this.nextChilds[index].onResult(data.childsResult[index]);
    }
  }
}

export class BatonRoot {
  request: string;
  nextChilds: Baton[] = [];

  constructor(request) {
    this.request = request instanceof Function ? request() : request;
  }

  next(request: Request | GetRequest, data?: object) {
    const newBaton = new Baton(request, data);
    this.nextChilds.push(newBaton);
    newBaton.father = this;
    return newBaton;
  }

  emitRequest() {
    const reuqestTree = this.nextChilds.map((baton: Baton) => {
      return baton.getTree();
    });

    fetch(this.request, {
      body: JSON.stringify(reuqestTree),
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
    }).then(jsonRes => jsonRes.json()).then(res => {
      if (Array.isArray(res)) {
        for (let index = 0; index < res.length; index += 1) {
          this.nextChilds[index].onResult(res[index]);
        }
      }
    })
  }
}

const GLOBAL_POOL = {
  timer: null,
  pools: new Set<BatonRoot>(),
  add(baton: BatonRoot, delay?: number) {
    this.pools.add(baton);
    this.emitRequest(delay);
  },
  emitRequest(delay = 0) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      for (const baton of this.pools.values()) {
        baton.emitRequest();
      }
    }, delay);
  },
};

const start = (request: Request | GetRequest) => {
  const batonRoot = new BatonRoot(request);
  GLOBAL_POOL.add(batonRoot);
  return batonRoot;
};

export default start;
