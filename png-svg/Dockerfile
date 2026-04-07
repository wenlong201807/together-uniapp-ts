FROM node:22-alpine

# 安装系统工具
RUN apk add --no-cache \
    python3 \
    py3-pip \
    imagemagick \
    potrace \
    bash

# 设置工作目录
WORKDIR /app

# 复制requirements.txt
COPY requirements.txt .

# 安装Python依赖
RUN pip3 install -r requirements.txt

# 设置默认命令
CMD ["/bin/bash"]
