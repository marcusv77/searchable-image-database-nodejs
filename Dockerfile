FROM node:13.10.1-buster as base
# Create project directory
WORKDIR /opt/cric/backend
# Install app dependencies
COPY package*.json ./
RUN npm install --production && npm cache clean --force
# Set PATH
ENV PATH /opt/cric/backend/node_modules/.bin:$PATH
LABEL   version="0.1.7-base" \
        description="Backend in Node.js for CRIC Searchable Image Database" \
        maintainer="raniere@rgaiacs.com"

FROM base as development
RUN npm install && npm cache clean --force
LABEL   version="0.1.7-development"

FROM base as production
# Copy ./src
COPY . ./
ENV NODE_ENV production
LABEL   version="0.1.7-production"