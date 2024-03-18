FROM node:20-alpine AS node-builder
WORKDIR /build

RUN corepack enable

# Install dependencies

COPY app/package.json app/yarn.lock app/.yarnrc.yml ./app/
COPY app/.yarn ./app/.yarn

WORKDIR /build/app

RUN yarn install --immutable

# Build the frontend app

COPY app .

RUN yarn build

FROM golang:1.22 AS server-builder
WORKDIR /build

# Get server dependencies

COPY go.mod go.sum ./
RUN go mod download

# Build server app

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /build/todaily

# Put it all together in a small distroless server
FROM gcr.io/distroless/base-nossl-debian12 AS build-release-stage
USER nonroot:nonroot

# For debugging
# FROM debian:12 AS build-release-stage

ENV PORT=4700
WORKDIR /

COPY --from=node-builder /build/app/dist /app/dist
COPY --from=server-builder /build/todaily /todaily

EXPOSE 4700

ENTRYPOINT [ "/todaily" ]

