# syntax=docker/dockerfile:1
# Build arguments for customizing mirror sources
ARG APT_MIRROR=mirrors.aliyun.com

FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

RUN corepack enable

# Build Go shared library
FROM golang:1.24 AS go-build
WORKDIR /app
COPY apps/api/sharedLibs/go-html-to-md ./sharedLibs/go-html-to-md

# Set Go proxy for China
ENV GOPROXY=https://goproxy.cn,direct

RUN cd sharedLibs/go-html-to-md && \
    go mod download && \
    go build -o libhtml-to-markdown.so -buildmode=c-shared html-to-markdown.go

FROM base AS build
WORKDIR /app

# Install system dependencies
# Use configurable mirror and add retry mechanism for better stability
# Completely replace apt sources with Aliyun mirrors
RUN echo "deb http://mirrors.aliyun.com/debian bookworm main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list && \
    # Remove all other sources.list.d files to prevent fallback to debian.org
    rm -rf /etc/apt/sources.list.d/* && \
    # Add a verification step to ensure no debian.org references remain
    grep -r "deb.debian.org" /etc/apt/ || echo "No debian.org references found" && \
    apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    build-essential \
    pkg-config \
    python3 \
    libpq-dev \
    git \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Rust with China mirror
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUSTUP_DIST_SERVER=https://rsproxy.cn \
    RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup

RUN curl --proto '=https' --tlsv1.2 -sSf https://rsproxy.cn/rustup-init.sh | sh -s -- -y --no-modify-path \
    && chmod -R a+w $RUSTUP_HOME $CARGO_HOME

# Configure Cargo to use Chinese mirror and git fetch with cli
RUN mkdir -p $CARGO_HOME && \
    echo '[net]' >> $CARGO_HOME/config.toml && \
    echo 'git-fetch-with-cli = true' >> $CARGO_HOME/config.toml && \
    echo 'retry = 5' >> $CARGO_HOME/config.toml && \
    echo '[source.crates-io]' >> $CARGO_HOME/config.toml && \
    echo 'replace-with = "ustc"' >> $CARGO_HOME/config.toml && \
    echo '[source.ustc]' >> $CARGO_HOME/config.toml && \
    echo 'registry = "https://mirrors.ustc.edu.cn/crates.io-index/"' >> $CARGO_HOME/config.toml

# Build Go shared library
FROM golang:1.24 AS go-build
WORKDIR /app
COPY apps/api/sharedLibs/go-html-to-md ./sharedLibs/go-html-to-md
ENV GOPROXY=https://goproxy.cn,direct
RUN cd sharedLibs/go-html-to-md && \
    go mod download && \
    go build -o libhtml-to-markdown.so -buildmode=c-shared html-to-markdown.go

# Install dependencies and build
FROM base AS build
WORKDIR /app

# Install system dependencies
RUN echo "deb http://mirrors.aliyun.com/debian bookworm main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list && \
    rm -rf /etc/apt/sources.list.d/* && \
    apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    build-essential \
    pkg-config \
    python3 \
    libpq-dev \
    git \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Rust with China mirror
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUSTUP_DIST_SERVER=https://rsproxy.cn \
    RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup

RUN curl --proto '=https' --tlsv1.2 -sSf https://rsproxy.cn/rustup-init.sh | sh -s -- -y --no-modify-path \
    && chmod -R a+w $RUSTUP_HOME $CARGO_HOME

# Configure Cargo
RUN mkdir -p $CARGO_HOME && \
    echo '[net]' >> $CARGO_HOME/config.toml && \
    echo 'git-fetch-with-cli = true' >> $CARGO_HOME/config.toml && \
    echo 'retry = 5' >> $CARGO_HOME/config.toml && \
    echo '[source.crates-io]' >> $CARGO_HOME/config.toml && \
    echo 'replace-with = "ustc"' >> $CARGO_HOME/config.toml && \
    echo '[source.ustc]' >> $CARGO_HOME/config.toml && \
    echo 'registry = "https://mirrors.ustc.edu.cn/crates.io-index/"' >> $CARGO_HOME/config.toml

# Build Go shared library
FROM golang:1.24 AS go-build
WORKDIR /app
COPY apps/api/sharedLibs/go-html-to-md ./sharedLibs/go-html-to-md
ENV GOPROXY=https://goproxy.cn,direct
RUN cd sharedLibs/go-html-to-md && \
    go mod download && \
    go build -o libhtml-to-markdown.so -buildmode=c-shared html-to-markdown.go

# Install dependencies and build
FROM base AS build
WORKDIR /app

# Install system dependencies
RUN echo "deb http://mirrors.aliyun.com/debian bookworm main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list && \
    rm -rf /etc/apt/sources.list.d/* && \
    apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    build-essential \
    pkg-config \
    python3 \
    libpq-dev \
    git \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Rust with China mirror
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH \
    RUSTUP_DIST_SERVER=https://rsproxy.cn \
    RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup

RUN curl --proto '=https' --tlsv1.2 -sSf https://rsproxy.cn/rustup-init.sh | sh -s -- -y --no-modify-path \
    && chmod -R a+w $RUSTUP_HOME $CARGO_HOME

# Configure Cargo
RUN mkdir -p $CARGO_HOME && \
    echo '[net]' >> $CARGO_HOME/config.toml && \
    echo 'git-fetch-with-cli = true' >> $CARGO_HOME/config.toml && \
    echo 'retry = 5' >> $CARGO_HOME/config.toml && \
    echo '[source.crates-io]' >> $CARGO_HOME/config.toml && \
    echo 'replace-with = "ustc"' >> $CARGO_HOME/config.toml && \
    echo '[source.ustc]' >> $CARGO_HOME/config.toml && \
    echo 'registry = "https://mirrors.ustc.edu.cn/crates.io-index/"' >> $CARGO_HOME/config.toml

# Copy source files
COPY apps/api/pnpm-lock.yaml apps/api/pnpm-workspace.yaml apps/api/package.json ./
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
COPY apps/api/native ./native

# Install dependencies and build native module
RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --no-frozen-lockfile --ignore-scripts && \
    cd native && pnpm build && cd ..

# Build the application
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod --ignore-scripts

# Runtime stage
FROM base AS runtime

# Install runtime dependencies
RUN echo "deb http://mirrors.aliyun.com/debian bookworm main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list && \
    rm -rf /etc/apt/sources.list.d/* && \
    apt-get clean && \
    apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    procps \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8080
WORKDIR /app

# Copy built application
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/native ./native

# Copy Go shared library
COPY --from=go-build /app/sharedLibs/go-html-to-md/libhtml-to-markdown.so ./sharedLibs/go-html-to-md/

CMD ["node", "dist/src/harness.js", "--start-docker"]
