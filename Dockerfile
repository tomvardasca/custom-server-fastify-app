FROM node:lts-alpine

WORKDIR /app


COPY package.json yarn.lock /app/

RUN yarn


COPY next.config.js /app
COPY pages /app/pages


RUN yarn build

COPY server.mjs next-worker.mjs /app/

EXPOSE 3000
EXPOSE 9229

ENTRYPOINT [ "yarn", "start" ]