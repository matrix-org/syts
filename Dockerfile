FROM node:12-stretch

WORKDIR /data
ADD ./package.json .
RUN yarn install
ADD ./tsconfig.json .
ADD ./src ./src
ADD ./jest.config.js .
RUN node ./src/blueprints/loader/schema-to-ts.js

ENTRYPOINT ["yarn", "test"]
