/**
 * 生成 MBTI 类型的 SVG 占位图
 * 使用渐变色背景 + MBTI 类型文字
 */

const fs = require('fs');
const path = require('path');

// MBTI 16 种类型及其主题色
const mbtiTypes = {
  // 分析家
  INTJ: { name: '建筑师', color1: '#88619A', color2: '#5E4FA2' },
  INTP: { name: '逻辑学家', color1: '#805AD5', color2: '#6B46C1' },
  ENTJ: { name: '指挥官', color1: '#8B5CF6', color2: '#7C3AED' },
  ENTP: { name: '辩论家', color1: '#A78BFA', color2: '#8B5CF6' },

  // 外交家
  INFJ: { name: '提倡者', color1: '#33C3F0', color2: '#0EA5E9' },
  INFP: { name: '调停者', color1: '#4ECDC4', color2: '#06B6D4' },
  ENFJ: { name: '主人公', color1: '#2DD4BF', color2: '#14B8A6' },
  ENFP: { name: '竞选者', color1: '#5EEAD4', color2: '#2DD4BF' },

  // 守护者
  ISTJ: { name: '物流师', color1: '#4299E1', color2: '#3182CE' },
  ISFJ: { name: '守卫者', color1: '#63B3ED', color2: '#4299E1' },
  ESTJ: { name: '总经理', color1: '#4299E1', color2: '#2B6CB0' },
  ESFJ: { name: '执政官', color1: '#90CDF4', color2: '#4299E1' },

  // 探险家
  ISTP: { name: '鉴赏家', color1: '#F6AD55', color2: '#ED8936' },
  ISFP: { name: '探险家', color1: '#FBD38D', color2: '#F6AD55' },
  ESTP: { name: '企业家', color1: '#FC8181', color2: '#F56565' },
  ESFP: { name: '表演者', color1: '#FEB2B2', color2: '#FC8181' },
};

// SVG 模板
const generateSVG = (type, data) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${type}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${data.color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${data.color2};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- 背景圆形 -->
  <circle cx="100" cy="100" r="95" fill="url(#grad-${type})" />

  <!-- MBTI 类型文字 -->
  <text x="100" y="95" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        fill="white" text-anchor="middle" letter-spacing="4">
    ${type}
  </text>

  <!-- 类型名称 -->
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="16"
        fill="rgba(255,255,255,0.9)" text-anchor="middle">
    ${data.name}
  </text>
</svg>`;
};

// 创建输出目录
const outputDir = path.join(__dirname, '../src/static/images/mbti');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成所有 MBTI 类型的 SVG
Object.entries(mbtiTypes).forEach(([type, data]) => {
  const svg = generateSVG(type, data);
  const filename = `${type.toLowerCase()}.svg`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, svg, 'utf8');
  console.log(`✓ 生成 ${filename}`);
});

console.log(`\n✓ 成功生成 ${Object.keys(mbtiTypes).length} 个 MBTI 头像`);
console.log(`✓ 输出目录: ${outputDir}`);
