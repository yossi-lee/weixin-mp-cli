import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { uploadArticleImage } from './material.js';

async function markdownToHtml(mdFilePath, onProgress = () => {}) {
  const mdDir = path.dirname(path.resolve(mdFilePath));
  let content = fs.readFileSync(mdFilePath, 'utf-8');

  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const localImages = [];
  let match;

  while ((match = imagePattern.exec(content)) !== null) {
    const [fullMatch, altText, imgPath] = match;
    if (/^https?:\/\//i.test(imgPath)) continue;

    const absolutePath = path.resolve(mdDir, imgPath);
    if (!fs.existsSync(absolutePath)) {
      onProgress(`⚠️  图片不存在，跳过: ${imgPath}`);
      continue;
    }
    localImages.push({ fullMatch, altText, imgPath, absolutePath });
  }

  for (const image of localImages) {
    onProgress(`📤 上传图片: ${image.imgPath}`);
    const wxUrl = await uploadArticleImage(image.absolutePath);
    content = content.replace(
      image.fullMatch,
      `![${image.altText}](${wxUrl})`
    );
    onProgress(`✅ 图片已上传: ${wxUrl}`);
  }

  return marked.parse(content);
}

export { markdownToHtml };
