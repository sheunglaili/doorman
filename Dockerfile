FROM node:19 as builder

WORKDIR /usr/doorman

COPY src ./src
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm install
RUN npm run build

FROM node:19 

WORKDIR /usr/doorman
COPY package.json ./
COPY package-lock.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/doorman/dist .

EXPOSE 8080 

CMD ["npm", "run", "start"]