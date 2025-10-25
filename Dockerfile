# 使用已有的nginx镜像
FROM nginx:stable-alpine

# 复制构建产物
COPY ./dist /usr/share/nginx/html/

# 复制 nginx 配置，覆盖默认配置
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 移除nginx默认的80端口配置
RUN rm -f /etc/nginx/conf.d/default.conf.bak || true && \
    # 确保nginx主配置不监听80端口
    sed -i 's/listen.*80.*default_server;/# listen 80 default_server;/' /etc/nginx/nginx.conf || true

# 只暴露 3000 端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]


