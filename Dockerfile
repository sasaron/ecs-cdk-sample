FROM node:16-slim

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g aws-cdk

COPY . .
