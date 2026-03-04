# Firecrawl API 构建说明

## 常见构建问题及解决方案

### 1. apt-get 哈希校验失败问题

在构建 Docker 镜像时，可能会遇到如下错误：

```
Hash Sum mismatch
E: Failed to fetch http://deb.debian.org/debian/dists/bookworm-updates/main/binary-amd64/by-hash/SHA256/...
```

这是由于网络不稳定或 Debian 镜像源问题导致的。

#### 解决方案

**方案一：使用默认镜像源（已优化）**

我们已经在 Dockerfile 中做了以下优化：
1. 使用更稳定的 `httpredir.debian.org` 镜像源
2. 添加 `--fix-missing` 参数
3. 使用 `--no-install-recommends` 减少依赖

直接构建：
```bash
docker-compose build api
```

**方案二：使用国内镜像源（中国用户）**

```bash
# 使用阿里云镜像源
docker-compose build --build-arg APT_MIRROR=mirrors.aliyun.com api
```

**方案三：使用清华镜像源（中国用户）**

```bash
# 使用清华大学镜像源
docker-compose build --build-arg APT_MIRROR=mirrors.tuna.tsinghua.edu.cn api
```

**方案四：重试构建**

有时问题只是临时网络问题，可以简单重试：

```bash
docker-compose build api
```

### 2. 其他常见问题

#### 环境变量警告

构建时看到的环境变量警告是正常的：
```
WARN[0000] The "PROXY_USERNAME" variable is not set. Defaulting to a blank string.
```

这些警告不会影响构建过程。如果需要设置环境变量，请参考 `.env.example` 文件创建 `.env` 文件。

#### 构建缓存问题

如果修改了 Dockerfile 但构建仍使用旧缓存，可以强制重建：

```bash
docker-compose build --no-cache api
```

### 3. 推荐构建流程

1. 首次构建：
   ```bash
   docker-compose build api
   ```

2. 如果失败，尝试使用国内镜像源（根据地理位置选择）：
   ```bash
   # 中国用户
   docker-compose build --build-arg APT_MIRROR=mirrors.aliyun.com api
   
   # 或者使用清华源
   docker-compose build --build-arg APT_MIRROR=mirrors.tuna.tsinghua.edu.cn api
   ```

3. 启动服务：
   ```bash
   docker-compose up api
   ```

如有其他问题，请查看完整的 README 和相关文档。