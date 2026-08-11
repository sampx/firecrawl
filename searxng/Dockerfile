FROM searxng/searxng:latest

# Self-contained SearXNG config: no bind mounts needed (remote docker compatible)
COPY settings.yml /etc/searxng/settings.yml
COPY limiter.toml /etc/searxng/limiter.toml
