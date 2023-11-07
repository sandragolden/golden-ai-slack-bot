FROM node:18.15.0-alpine
RUN mkdir -p /opt/golden-ai-slack-bot
WORKDIR /opt/golden-ai-slack-bot
COPY ./src /opt/golden-ai-slack-bot/src
COPY ./package.json ./yarn.lock ./
RUN yarn install --production && yarn cache clean
CMD ["yarn", "start"]
