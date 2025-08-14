#!/bin/bash
# 人生小站 - 数据导出脚本 (Bash版本)

API_URL="https://life-station-api.life-island.workers.dev/api"
OUTPUT_DIR="./exports"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# 创建导出目录
mkdir -p "$OUTPUT_DIR"

echo "🌊 正在导出漂流瓶数据..."

# 导出JSON格式
echo "📄 导出JSON格式..."
curl -s "${API_URL}/bottles?limit=1000" > "${OUTPUT_DIR}/bottles_${TIMESTAMP}.json"

# 如果有jq工具，格式化JSON
if command -v jq &> /dev/null; then
    jq '.' "${OUTPUT_DIR}/bottles_${TIMESTAMP}.json" > "${OUTPUT_DIR}/bottles_${TIMESTAMP}_formatted.json"
    mv "${OUTPUT_DIR}/bottles_${TIMESTAMP}_formatted.json" "${OUTPUT_DIR}/bottles_${TIMESTAMP}.json"
fi

# 导出CSV格式
echo "📊 导出CSV格式..."
JSON_DATA=$(curl -s "${API_URL}/bottles?limit=1000")

# 创建CSV文件
echo "ID,Message,Date,Timestamp" > "${OUTPUT_DIR}/bottles_${TIMESTAMP}.csv"

# 如果有jq工具，转换为CSV
if command -v jq &> /dev/null; then
    echo "$JSON_DATA" | jq -r '.bottles[] | [.id, .message, .date, .timestamp] | @csv' >> "${OUTPUT_DIR}/bottles_${TIMESTAMP}.csv"
else
    echo "⚠️  需要安装jq工具才能导出CSV格式"
fi

# 显示导出结果
echo "✅ 导出完成！文件保存在:"
ls -la "$OUTPUT_DIR"/bottles_${TIMESTAMP}*

echo ""
echo "📁 导出目录: $OUTPUT_DIR"
echo "🕐 导出时间: $(date)"

# 显示数据统计
BOTTLE_COUNT=$(echo "$JSON_DATA" | grep -o '"id"' | wc -l)
echo "📊 漂流瓶数量: $BOTTLE_COUNT"