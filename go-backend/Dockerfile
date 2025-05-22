# # For Production
# FROM golang:1.24-alpine AS builder
# WORKDIR /app
#
# # Install necessary build tools
# RUN apk add --no-cache git
#
# # Copy go.mod and go.sum files
# COPY go.mod go.sum* ./
# RUN go mod download
#
# # Copy source code
# COPY . .
#
# # Build the application
# RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o main .
#
# # Use a minimal alpine image
# FROM alpine:3.19
# RUN apk --no-cache add ca-certificates
# WORKDIR /app
#
# # Copy the binary from builder
# COPY --from=builder /app/main .
#
# EXPOSE 8081
# CMD ["./main"]

# For Development
FROM golang:1.24-alpine

WORKDIR /app

 # Install air for hot reloading
RUN go install github.com/air-verse/air@latest

 # Install dependencies
RUN apk add --no-cache git

# Copy go mod and sum files first (for better caching)
COPY go.mod go.sum ./

# Download and tidy modules
RUN go mod download
RUN go mod tidy

# Copy the rest of the source code
COPY . .

 # mount the source code as a volume
EXPOSE 8081

 # air provides hot reload capability
CMD ["air", "-c", ".air.toml"]