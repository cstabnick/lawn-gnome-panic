# The platform service (player accounts). Self-contained Go module, so the context is this folder:
#   docker build -t lawn-gnome-platform packages/platform-server
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/platform-server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/platform-server /platform-server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/platform-server"]
