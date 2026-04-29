FROM nginx:alpine

# 复制构建产物到 nginx 目录
COPY dist/build/h5 /usr/share/nginx/html

# 复制 nginx 配置
COPY linux-190-deploy/config/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 修复文件权限
RUN chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
