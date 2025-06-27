FROM node:22-alpine

WORKDIR /usr/app

COPY ./package*.json .
COPY ./yarn.lock .

RUN yarn install --immutable --immutable-cache --check-cache

EXPOSE ${PORT}
CMD [ "node", "app.js"]