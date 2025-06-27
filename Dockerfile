FROM node:22-alpine as base

RUN npm i pnpm -g

FROM base

WORKDIR /usr/app

COPY ./package*.json .
COPY ./pnpm-lock.yaml .

RUN pnpm i

EXPOSE ${PORT}
CMD ["node", "app.js"]