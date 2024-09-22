FROM public.ecr.aws/docker/library/node:hydrogen-alpine3.20

RUN apk update && apk upgrade

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 8081

USER node

CMD [ "npm", "start" ]