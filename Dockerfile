FROM node:12-stretch

RUN npm install -g typescript@3
WORKDIR /data
ADD ./package.json .
RUN yarn install
ADD ./tsconfig.json .
ADD ./src ./src
RUN tsc

ENTRYPOINT ["node", "./dist/main.js"]
