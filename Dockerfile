FROM node:14-alpine

WORKDIR /usr/app

COPY ./package*.json .
COPY ./yarn.lock .

RUN yarn install --immutable --immutable-cache --check-cache
RUN yarn global add nodemon

EXPOSE ${PORT}
CMD [ "nodemon", "-L", "app.js"]