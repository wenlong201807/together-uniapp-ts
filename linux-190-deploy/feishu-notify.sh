#!/bin/bash

# ============================================
# 飞书通知脚本
# ============================================

# 飞书 Webhook URL（需要配置）
FEISHU_WEBHOOK="${FEISHU_WEBHOOK_URL:-}"

# 发送飞书通知
send_feishu_notification() {
    local title=$1
    local content=$2
    local msg_type=${3:-"info"}  # info, success, warning, error

    if [ -z "$FEISHU_WEBHOOK" ]; then
        echo "未配置飞书 Webhook，跳过通知"
        return 0
    fi

    # 根据类型设置颜色
    local color
    case $msg_type in
        success) color="green" ;;
        warning) color="orange" ;;
        error) color="red" ;;
        *) color="blue" ;;
    esac

    # 构建消息
    local message=$(cat <<EOF
{
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {
                "tag": "plain_text",
                "content": "${title}"
            },
            "template": "${color}"
        },
        "elements": [
            {
                "tag": "div",
                "text": {
                    "tag": "lark_md",
                    "content": "${content}"
                }
            },
            {
                "tag": "hr"
            },
            {
                "tag": "note",
                "elements": [
                    {
                        "tag": "plain_text",
                        "content": "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
                    }
                ]
            }
        ]
    }
}
EOF
)

    # 发送请求
    curl -X POST "${FEISHU_WEBHOOK}" \
        -H "Content-Type: application/json" \
        -d "${message}" \
        --silent --show-error

    echo "飞书通知已发送"
}

# 部署成功通知
notify_deploy_success() {
    local env=$1
    local commit=$2
    local changes=$3

    local content="**部署环境:** ${env}\\n**提交版本:** \`${commit}\`\\n\\n**更新内容:**\\n${changes}\\n\\n✅ 服务已成功部署并运行"

    send_feishu_notification "🚀 部署成功" "${content}" "success"
}

# 部署失败通知
notify_deploy_failure() {
    local env=$1
    local error=$2

    local content="**部署环境:** ${env}\\n**错误信息:**\\n\`\`\`\\n${error}\\n\`\`\`\\n\\n❌ 部署失败，请检查日志"

    send_feishu_notification "⚠️ 部署失败" "${content}" "error"
}

# 回滚通知
notify_rollback() {
    local from_env=$1
    local to_env=$2

    local content="**从环境:** ${from_env}\\n**回滚到:** ${to_env}\\n\\n🔄 已执行回滚操作"

    send_feishu_notification "🔄 服务回滚" "${content}" "warning"
}

# 健康检查失败通知
notify_health_check_failure() {
    local env=$1

    local content="**环境:** ${env}\\n\\n⚠️ 健康检查失败，服务可能异常"

    send_feishu_notification "⚠️ 健康检查失败" "${content}" "warning"
}

# 导出函数
export -f send_feishu_notification
export -f notify_deploy_success
export -f notify_deploy_failure
export -f notify_rollback
export -f notify_health_check_failure
