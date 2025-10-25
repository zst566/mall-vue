# 使用已有的nginx镜像
FROM nginx:stable-alpine

# 复制构建产物
COPY ./dist /usr/share/nginx/html/

# 复制 nginx 配置
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 只暴露 3000 端口，移除默认的80端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]


