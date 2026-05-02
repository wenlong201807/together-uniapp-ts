#!/bin/bash
# Cloudflare DNS Nameservers 检查脚本

echo "========================================"
echo "检查 wenlong.life 的 Nameservers"
echo "========================================"
echo ""

echo "当前 Nameservers:"
nslookup -type=NS wenlong.life 8.8.8.8

echo ""
echo "========================================"
echo "预期结果:"
echo "  noran.ns.cloudflare.com"
echo "  randy.ns.cloudflare.com"
echo ""
echo "如果看到 Cloudflare 的 Nameservers，说明已生效！"
echo "========================================"
