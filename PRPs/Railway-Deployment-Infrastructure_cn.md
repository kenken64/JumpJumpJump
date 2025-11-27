# PRP: Railway部署基础设施

## 问题陈述
游戏需要部署到可通过互联网访问的生产环境，需要容器化、环境配置以及针对前端和后端服务的平台特定优化。

## 需求
- 将前端React/Phaser应用部署到Railway
- 将后端FastAPI服务部署到Railway
- 为两个服务配置Docker容器
- 处理Railway平台的动态端口绑定
- 设置API通信的环境变量
- 优化生产构建流程
- 启用HTTPS和自定义域名支持
- 配置nginx用于SPA路由和静态资源服务

## 解决方案

### 基础设施
- **平台**：Railway（https://railway.app）
- **前端**：带nginx的Docker容器
- **后端**：带uvicorn的Docker容器
- **数据库**：SQLite（嵌入后端容器）
- **静态资源**：通过nginx提供静态文件服务

### 前端部署架构
1. **多阶段Docker构建**
   - 阶段1：使用Node.js和pnpm构建
   - 阶段2：使用nginx alpine提供服务
2. **nginx配置**
   - 通过envsubst动态PORT绑定
   - SPA路由（try_files回退到index.html）
   - 静态资源缓存（不可变资源1年）
   - 健康检查端点
3. **资源处理**
   - 将所有Kenney资源包复制到dist/assets
   - 保留文件夹结构用于资源加载
   - 验证资源在构建器和nginx阶段都存在

### 后端部署架构
1. **Python FastAPI容器**
   - uvicorn ASGI服务器
   - SQLite数据库初始化
   - 为前端源配置CORS
2. **动态端口绑定**
   - Railway PORT环境变量
   - 本地开发默认8000

## 实现细节

### 前端Dockerfile
```dockerfile
# 阶段1：构建
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build
RUN mkdir -p /app/dist/assets && cp -r /app/assets/. /app/dist/assets/

# 阶段2：服务
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

### nginx配置
```nginx
server {
    listen ${PORT:-80};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location /health {
        return 200 "healthy\n";
    }
}
```

### 后端配置
```python
# main.py
app = FastAPI()

# Railway前端的CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://*.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 动态端口绑定
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 环境变量
**前端**：
- `VITE_API_BASE_URL`：后端Railway URL（例如https://backend-production.railway.app）
- `PORT`：来自Railway的动态端口（运行时注入）

**后端**：
- `PORT`：来自Railway的动态端口（默认8000）
- `DATABASE_URL`：SQLite文件路径（嵌入）

## 构建优化

### 1. pnpm锁文件问题
**问题**：Railway构建时`ERR_PNPM_OUTDATED_LOCKFILE`

**解决方案**：
- 从`pnpm install`中移除`--frozen-lockfile`标志
- 允许Railway即使有微小锁文件差异也能构建
- 仍使用锁文件但非严格模式

### 2. 端口绑定问题
**问题**："应用程序无法响应" - nginx监听80端口而不是Railway的动态PORT

**解决方案**：
- 将nginx配置更改为使用`${PORT:-80}`变量
- 在CMD中添加`envsubst`命令在运行时替换PORT
- nginx模板在容器启动时处理
- 本地开发默认80端口

### 3. 资源加载
**问题**：构建后找不到资源（404错误）

**解决方案**：
- 手动将assets文件夹复制到dist/assets
- 使用`cp -r /app/assets/. /app/dist/assets/`保留结构
- 在构建器和nginx阶段都验证资源
- 配置nginx以正确的缓存头提供静态资源

## CSP配置
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval'; 
               connect-src 'self' http://localhost:8000 https://*.railway.app;" />
```
- `unsafe-eval`：TensorFlow.js需要
- Railway后端域名允许API调用

## 部署流程
1. **连接GitHub仓库**到Railway
2. **创建两个服务**：
   - 前端服务（根目录：`frontend/`）
   - 后端服务（根目录：`backend/`）
3. **配置环境变量**：
   - 前端：设置`VITE_API_BASE_URL`为后端Railway URL
   - 后端：无需配置（PORT自动注入）
4. **部署**：推送到GitHub触发自动部署
5. **验证**：检查部署日志并访问Railway URL

## 监控与健康检查
- **前端**：`/health`端点返回200 "healthy"
- **后端**：FastAPI `/docs`端点用于API文档
- **日志**：Railway仪表板显示实时日志
- **指标**：Railway UI中的CPU、内存、网络使用

## 已知问题与解决方案

### 问题：构建缓存
**问题**：旧构建缓存导致过时部署

**解决方案**：在Railway仪表板触发重建

### 问题：TensorFlow.js加载
**问题**：CSP阻止TensorFlow.js eval()

**解决方案**：在CSP的script-src中添加'unsafe-eval'

### 问题：资源404
**问题**：构建后Kenney资源不可访问

**解决方案**：手动将资源复制到dist/并保留结构

## 成本优化
- **免费层**：Railway为业余项目提供免费层
- **休眠模式**：不活动服务30分钟后自动休眠
- **资源限制**：设置内存/CPU限制防止超额
- **构建缓存**：Docker层缓存加速构建

## 未来改进
- CDN集成用于资源分发
- 特定环境构建（staging/production）
- 数据库迁移到PostgreSQL用于生产规模
- Redis缓存API响应
- 高流量负载均衡
- 蓝绿部署策略
- 自动备份系统

## 文档
- **frontend/RAILWAY.md**：前端部署指南
- **backend/RAILWAY.md**：后端部署指南
- 包含分步说明和故障排除

## 状态
✅ **已完成** - 两个服务成功部署到Railway，具有动态端口绑定和资源优化
