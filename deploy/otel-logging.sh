#!/bin/sh
# Runs from the nginx image's /docker-entrypoint.d before nginx starts (installed as 30-otel-logging.sh).
#
# ENABLE_OTEL_LOGGING=true|1|yes: the access log becomes whale-net JSON lines on stdout (the shape of
# whale-net/everything libs/go/logging: timestamp, severity, message, app_name, domain, environment, ...) with OTel
# HTTP semantic-convention keys. Identity comes from the whale-net variables: APP_NAME (default lawn-gnome-site),
# APP_DOMAIN, APP_ENV/ENVIRONMENT, APP_VERSION, POD_NAME/HOSTNAME, NAMESPACE/POD_NAMESPACE, NODE_NAME.
# OTEL_SDK_DISABLED=true or OTEL_LOGS_DISABLED=true turn it off again. nginx cannot push OTLP itself: the collector
# has to read the pod's stdout. Otherwise the stock access log stays as it was.
#
# Never logged: the client address and the query string (invite/room codes), see PRIVACY.md.
set -eu
CONF=${LAWN_NGINX_CONF_DIR:-/etc/nginx/conf.d} # override only for testing the script
FORMAT=$CONF/00-lawn-log-format.conf # sorts before default.conf, which uses it
INC=$CONF/access-log.inc

lower() { printf '%s' "$1" | tr 'A-Z' 'a-z'; }
# Identity values go into the format as literals: keep only characters that are safe in JSON and nginx strings.
clean() { printf '%s' "$1" | tr -cd 'A-Za-z0-9._:/-'; }

# Off: write nothing (the image ships both files empty), so a read-only root filesystem still starts.
off() { exit 0; }
case "$(lower "${ENABLE_OTEL_LOGGING:-}")" in true|1|yes) ;; *) off ;; esac
[ "$(lower "${OTEL_SDK_DISABLED:-}")" = true ] && off
[ "$(lower "${OTEL_LOGS_DISABLED:-}")" = true ] && off

name=$(clean "${APP_NAME:-lawn-gnome-site}")
ident="\"app_name\":\"$name\""
ident="$ident,\"domain\":\"$(clean "${APP_DOMAIN:-lawn-gnome-panic}")\""
envname=$(clean "${APP_ENV:-${ENVIRONMENT:-development}}")
ident="$ident,\"environment\":\"$envname\""
ident="$ident,\"version\":\"$(clean "${APP_VERSION:-latest}")\""
pod=$(clean "${POD_NAME:-${HOSTNAME:-}}"); [ -n "$pod" ] && ident="$ident,\"pod_name\":\"$pod\""
ns=$(clean "${NAMESPACE:-${POD_NAMESPACE:-}}"); [ -n "$ns" ] && ident="$ident,\"namespace\":\"$ns\""
node=$(clean "${NODE_NAME:-}"); [ -n "$node" ] && ident="$ident,\"node_name\":\"$node\""

cat > "$FORMAT" <<CONF
# Request correlation: the ingress's X-Request-ID when it is a plain short token (the id the platform service logs too),
# else nginx's own; the trace id of an incoming W3C traceparent, if any; the game, the first path segment.
map \$http_x_request_id \$lawn_request_id {
  "~^[A-Za-z0-9-]{1,64}\$" \$http_x_request_id;
  default                 \$request_id;
}
map \$http_traceparent \$lawn_trace_id {
  "~^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}\$" \$1;
  default                                          "";
}
map \$uri \$lawn_game {
  "~^/([A-Za-z0-9_-]+)/" \$1;
  default                "";
}
log_format lawn_json escape=json
  '{"timestamp":"\$time_iso8601","severity":"\$lawn_severity","message":"\$request_method \$uri \$status",'
  '"logger":"nginx.access",$ident,'
  '"request_id":"\$lawn_request_id","trace_id":"\$lawn_trace_id","game":"\$lawn_game",'
  '"http.request.method":"\$request_method","url.path":"\$uri","url.scheme":"\$scheme",'
  '"server.address":"\$host","http.request.size":\$request_length,'
  '"http.response.status_code":\$status,"http.response.body.size":\$body_bytes_sent,'
  '"http.server.request.duration":\$request_time,"network.protocol.version":"\$server_protocol",'
  '"user_agent.original":"\$http_user_agent"}';
CONF
echo 'access_log /dev/stdout lawn_json;' > "$INC"
echo "$0: ENABLE_OTEL_LOGGING on: JSON access log on stdout as $name ($envname)"
