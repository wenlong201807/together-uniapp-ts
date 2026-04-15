const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat } = require('docx');
const fs = require('fs');

// 解析Markdown并转换为DOCX
function parseMarkdownToDocx(mdContent, filename) {
  const lines = mdContent.split('\n');
  const children = [];
  
  let inCodeBlock = false;
  let codeBlockContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 处理代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        if (codeBlockContent.length > 0) {
          children.push(new Paragraph({
            children: [new TextRun({
              text: codeBlockContent.join('\n'),
              font: 'Courier New',
              size: 20
            })],
            spacing: { before: 120, after: 120 }
          }));
        }
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // 开始代码块
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // 处理标题
    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        text: line.substring(2),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 }
      }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({
        text: line.substring(3),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        text: line.substring(4),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 }
      }));
    } else if (line.startsWith('#### ')) {
      children.push(new Paragraph({
        text: line.substring(5),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 120, after: 60 }
      }));
    } else if (line.trim() === '') {
      // 空行
      children.push(new Paragraph({ text: '' }));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // 无序列表
      const text = line.substring(2);
      children.push(new Paragraph({
        text: text,
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 }
      }));
    } else if (/^\d+\.\s/.test(line)) {
      // 有序列表
      const text = line.replace(/^\d+\.\s/, '');
      children.push(new Paragraph({
        text: text,
        numbering: { reference: 'default-numbering', level: 0 },
        spacing: { before: 60, after: 60 }
      }));
    } else if (line.startsWith('> ')) {
      // 引用
      children.push(new Paragraph({
        text: line.substring(2),
        italics: true,
        indent: { left: 720 },
        spacing: { before: 60, after: 60 }
      }));
    } else if (line.startsWith('---')) {
      // 分隔线
      children.push(new Paragraph({
        text: '',
        border: {
          bottom: {
            color: 'CCCCCC',
            space: 1,
            style: 'single',
            size: 6
          }
        },
        spacing: { before: 120, after: 120 }
      }));
    } else {
      // 普通段落 - 处理粗体和斜体
      const textRuns = parseInlineFormatting(line);
      children.push(new Paragraph({
        children: textRuns,
        spacing: { before: 60, after: 60 }
      }));
    }
  }
  
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 }
                }
              }
            }
          ]
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: 11906,
            height: 16838
          },
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: children
    }]
  });
  
  return doc;
}

// 解析行内格式（粗体、斜体等）
function parseInlineFormatting(text) {
  const runs = [];
  let currentText = '';
  let i = 0;
  
  while (i < text.length) {
    // 处理粗体 **text**
    if (text[i] === '*' && text[i+1] === '*') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      i += 2;
      let boldText = '';
      while (i < text.length && !(text[i] === '*' && text[i+1] === '*')) {
        boldText += text[i];
        i++;
      }
      if (boldText) {
        runs.push(new TextRun({ text: boldText, bold: true }));
      }
      i += 2;
    }
    // 处理斜体 *text*
    else if (text[i] === '*') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      i++;
      let italicText = '';
      while (i < text.length && text[i] !== '*') {
        italicText += text[i];
        i++;
      }
      if (italicText) {
        runs.push(new TextRun({ text: italicText, italics: true }));
      }
      i++;
    }
    // 处理代码 `code`
    else if (text[i] === '`') {
      if (currentText) {
        runs.push(new TextRun(currentText));
        currentText = '';
      }
      i++;
      let codeText = '';
      while (i < text.length && text[i] !== '`') {
        codeText += text[i];
        i++;
      }
      if (codeText) {
        runs.push(new TextRun({ 
          text: codeText, 
          font: 'Courier New',
          size: 20
        }));
      }
      i++;
    }
    else {
      currentText += text[i];
      i++;
    }
  }
  
  if (currentText) {
    runs.push(new TextRun(currentText));
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)];
}

// 读取并转换所有文件
const files = [
  '红井讲解稿-原版.md',
  '红井讲解稿分析报告.md',
  '讲解稿评判标准体系.md',
  '红井讲解稿-修订版.md',
  '红井讲解稿-平衡优化版-20分钟.md',
  '深度优化思考过程.md'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const doc = parseMarkdownToDocx(content, file);
    const outputFile = file.replace('.md', '.docx');
    
    Packer.toBuffer(doc).then(buffer => {
      fs.writeFileSync(outputFile, buffer);
      console.log(`✓ 已生成: ${outputFile}`);
    });
  } catch (error) {
    console.error(`✗ 处理 ${file} 时出错:`, error.message);
  }
});
