import Next from "next";
import http from "http";

const dev = process.env.NODE_ENV !== "production";

async function initialize() {
  console.log("Initializing Next.js thread...");
  const app = Next({ dev });
  await app.prepare();
  return async ({ req, port }) => {
    const request = new http.IncomingMessage({});
    const response = new http.ServerResponse(request);
    request.url = req.url;
    request.method = req.method;
    request.headers = req.headers;

    const responseProxy = new Proxy(response, {
      get: function (target, property, receiver) {
        const value = Reflect.get(target, property, receiver);

        if (typeof value === "function") {
          if (value.name === "end") {
            return function () {
              port.postMessage({ fn: "end", args: [arguments[0]] });
            };
          }
          if (value.name === "getHeader") {
            return function () {
              value.apply(target, arguments);
            };
          }
          if (value.name === "hasHeader") {
            return function () {
              value.apply(target, arguments);
            };
          }
          if (value.name === "setHeader") {
            return function () {
              value.apply(target, arguments);
              return port.postMessage({
                fn: "header",
                args: [arguments[0], arguments[1]],
              });
            };
          }
          if (value.name === "writeHead") {
            return function () {
              return port.postMessage({ fn: "status", args: [arguments[0]] });
            };
          }
          if (value.name === "write") {
            return function () {
              return port.postMessage({ fn: "write", args: [arguments[0]] });
            };
          }
          return value.bind(target);
        }

        return value;
      },
    });
    await app.render(request, responseProxy, "/a", "");
  };
}

export default initialize();
