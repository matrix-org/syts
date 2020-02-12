FROM node:12-stretch

WORKDIR /data
ADD ./package.json .
RUN yarn install
ADD ./tsconfig.json .
ADD ./src ./src

ENTRYPOINT ["yarn", "test"]
