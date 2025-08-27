# 多阶段构建 - 构建阶段
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段 - 使用Go服务器
FROM golang:1.21-alpine as go-builder
WORKDIR /app
COPY go.mod go.sum server.go ./
COPY --from=builder /app/dist ./dist
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server server.go

# 最终镜像
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=go-builder /app/server .
EXPOSE 3000
CMD ["./server"]
