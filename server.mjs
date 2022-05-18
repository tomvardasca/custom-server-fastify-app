import Next from "next";
import { Piscina } from "piscina";
import http from "http";

import fastifyFactory from "fastify";
import { Readable } from "stream";

const fastify = fastifyFactory({
  logger: { level: "error" },
  pluginTimeout: 0,
});

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const enableWorkers = process.env.WORKERS !== "false";

fastify.register((fastify, opts, next) => {
  const app = Next({ dev });
  const handle = app.getRequestHandler();

  if (enableWorkers) {
    const pool = new Piscina({
      filename: new URL("./next-worker.mjs", import.meta.url).href,
      maxThreads: 4,
      minThreads: 4,
    });
    console.log("How may pool workers?", pool.threads.length);
    fastify.decorate("piscina", pool);
    fastify.decorate("run", (...args) => pool.run(...args));
  }
  app
    .prepare()
    .then(() => {
      if (dev) {
        fastify.get("/_next/*", (req, reply) => {
          return handle(req.raw, reply.raw).then(() => {
            reply.sent = true;
          });
        });
      }

      fastify.get("/aw", async (req, reply) => {
        if (!enableWorkers) {
          return app.render(req.raw, reply.raw, "/a", req.query).then(() => {
            reply.sent = true;
          });
        }

        const { url, method, headers, body } = req;
        const responseStream = new Readable({ read: () => {} });
        reply.type("text/html").send(responseStream);
        const channel = new MessageChannel();
        const messageChannelPromise = new Promise((resolve) => {
          channel.port2.on("message", (args) => {
            if (args.fn && reply[args.fn]) {
              reply[args.fn].apply(reply, args.args);
            }
            if (args.fn == "write") {
              responseStream.push(args.args[0]);
            }

            if (args.fn == "end") {
              responseStream.push(args.args[0]);
              responseStream.push(null);
              resolve();
            }
          });
        });

        try {
          await fastify.run(
            {
              req: { url, method, headers, body },
              port: channel.port1,
            },
            { transferList: [channel.port1] },
          );
          await messageChannelPromise;
        } finally {
          channel.port1.close();
          channel.port2.close();
        }
      });

      fastify.get("/as", async (req, reply) => {
        return app.render(req.raw, reply.raw, "/a", req.query).then(() => {
          reply.sent = true;
        });
      });

      fastify.get("/b", (req, reply) => {
        return app.render(req.raw, reply.raw, "/b", req.query).then(() => {
          reply.sent = true;
        });
      });

      fastify.all("/*", (req, reply) => {
        return handle(req.raw, reply.raw).then(() => {
          reply.sent = true;
        });
      });

      fastify.setNotFoundHandler((request, reply) => {
        return app.render404(request.raw, reply.raw).then(() => {
          reply.sent = true;
        });
      });

      next();
    })
    .catch((err) => next(err));
});

fastify.listen(port, "0.0.0.0", (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
