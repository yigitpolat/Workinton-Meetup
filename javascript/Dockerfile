FROM node:10.16.0-alpine
WORKDIR /usr/src/app
COPY . .
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && apk del build-dependencies
CMD exec /bin/sh -c "trap : TERM INT; (while true; do sleep 1; done) & wait"
