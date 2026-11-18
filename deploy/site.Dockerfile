# The static arcade (the output of `npm run site`) served by nginx, for the whale-net cluster
# (gnome.whalenet.app, manifests in whale-net/argok8s services/lawn-gnome-panic).
# Build after `npm run site`, with the repo root as context:
#   docker build -f deploy/site.Dockerfile -t lawn-gnome-site .
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
EXPOSE 8080
