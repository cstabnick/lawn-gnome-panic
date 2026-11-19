# The static arcade (the output of `npm run site`) served by nginx, for the whale-net cluster
# (gnome.whalenet.app, manifests in whale-net/argok8s services/lawn-gnome-panic).
# Build after `npm run site`, with the repo root as context:
#   docker build -f deploy/site.Dockerfile -t lawn-gnome-site .
# ENABLE_OTEL_LOGGING=true switches the access log to whale-net JSON lines on stdout (deploy/otel-logging.sh).
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 deploy/otel-logging.sh /docker-entrypoint.d/30-otel-logging.sh
# Empty defaults (stock access log) for a container started without the entrypoint; the script rewrites both.
USER root
RUN touch /etc/nginx/conf.d/00-lawn-log-format.conf /etc/nginx/conf.d/access-log.inc \
 && chown 101:101 /etc/nginx/conf.d/00-lawn-log-format.conf /etc/nginx/conf.d/access-log.inc
USER 101
COPY site/ /usr/share/nginx/html/
EXPOSE 8080
