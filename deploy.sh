#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检测系统架构
ARCH=$(uname -m)
echo -e "${GREEN}检测到系统架构: $ARCH${NC}"

# 设置 Docker 构建和运行参数
if [ "$ARCH" = "arm64" ]; then
    BUILD_PLATFORM="--platform linux/amd64"
    RUN_PLATFORM="--platform linux/amd64"
else
    BUILD_PLATFORM=""
    RUN_PLATFORM=""
fi

# 配置信息
IMAGE_NAME="mall-vue"
IMAGE_TAG="latest"
TAR_NAME="mall-vue-latest.tar"
REMOTE_USER="ecs-user"
# 生产环境地址 - 需要根据实际情况修改
REMOTE_HOST="39.108.105.196"
REMOTE_CONNECTION="${REMOTE_USER}@${REMOTE_HOST}"  # 完整的连接字符串
REMOTE_PATH="/home/${REMOTE_USER}/mall-vue"
CONTAINER_NAME="mall-vue"

# 显示进度条函数
show_progress() {
    local msg="$1"
    echo -ne "${YELLOW}$msg...${NC}\r"
}

# 显示成功消息
show_success() {
    local msg="$1"
    echo -e "${GREEN}✓ $msg${NC}"
}

# 显示错误消息
show_error() {
    local msg="$1"
    echo -e "${RED}✗ $msg${NC}"
}

echo -e "${YELLOW}开始部署流程...${NC}"

# 在部署开始前添加连接测试
show_progress "测试服务器连接"
if ssh -q ${REMOTE_CONNECTION} exit; then
    show_success "服务器连接正常"
else
    show_error "无法连接到服务器，请检查IP地址和SSH配置"
    exit 1
fi

# 1. 检查并安装依赖
show_progress "检查并安装依赖"
if [ ! -d "node_modules" ]; then
    echo "安装项目依赖..."
    if ! npm install; then
        show_error "依赖安装失败"
        exit 1
    fi
fi
show_success "依赖检查完成"

# 2. 本地构建 Vue 应用
show_progress "构建 Vue 应用"
# 清理旧的构建文件
rm -rf dist
if npm run build:prod; then
    show_success "Vue 应用构建成功"
else
    show_error "Vue 应用构建失败"
    exit 1
fi

# 3. 构建 Docker 镜像
show_progress "构建 Docker 镜像"

# 检查本地是否有 nginx:stable-alpine 镜像
if ! docker image inspect nginx:stable-alpine &> /dev/null; then
    show_progress "拉取 nginx:stable-alpine 基础镜像..."
    if ! docker pull nginx:stable-alpine; then
        show_error "拉取基础镜像失败"
        exit 1
    fi
else
    show_progress "使用本地 nginx:stable-alpine 镜像"
fi

if docker build $BUILD_PLATFORM -t ${IMAGE_NAME}:${IMAGE_TAG} .; then
    show_success "Docker 镜像构建成功"
else
    show_error "Docker 构建失败"
    exit 1
fi

# 4. 保存镜像为 tar 文件
show_progress "保存镜像为 tar 文件"
if docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${TAR_NAME}; then
    show_success "镜像保存成功"
else
    show_error "镜像保存失败"
    exit 1
fi

# 5. 创建远程目录并上传到服务器
show_progress "创建远程目录并上传到服务器"
if ssh ${REMOTE_CONNECTION} "mkdir -p ${REMOTE_PATH}" && scp ${TAR_NAME} docker-compose.yml nginx.conf ${REMOTE_CONNECTION}:${REMOTE_PATH}/; then
    show_success "文件上传成功"
else
    show_error "上传失败"
    exit 1
fi

# 6. 在远程服务器上执行部署命令
show_progress "在远程服务器上执行部署命令"
ssh ${REMOTE_CONNECTION} "
    set -e
    cd ${REMOTE_PATH}
    
    echo '停止并删除旧容器...'
    sudo docker-compose down || true
    
    echo '确保web-network网络存在...'
    sudo docker network create web-network || true
    
    echo '删除旧镜像...'
    sudo docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
    
    echo '导入新镜像...'
    sudo docker load -i ${TAR_NAME}
    
    echo '启动新容器...'
    sudo docker-compose up -d
    
    echo '验证容器网络配置...'
    sudo docker inspect mall-vue | grep -A 5 NetworkMode
" || {
    show_error "远程部署失败"
    exit 1
}

# 7. 清理本地文件
show_progress "清理本地临时文件"
if rm ${TAR_NAME}; then
    show_success "清理完成"
else
    show_error "清理失败"
fi

show_success "部署完成！"

# 8. 验证部署
echo -e "${YELLOW}验证部署状态：${NC}"
ssh ${REMOTE_CONNECTION} "
    echo '容器状态：'
    sudo docker ps | grep ${CONTAINER_NAME}
    echo '容器日志：'
    sudo docker logs --tail 10 ${CONTAINER_NAME}
"


