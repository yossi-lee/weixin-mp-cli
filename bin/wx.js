#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

import { readConfig, writeConfig } from '../src/config.js';
import { markdownToHtml } from '../src/markdown.js';
import { uploadPermanentImage, listMaterials, deleteMaterial, getMaterialCount } from '../src/material.js';
import { addDraft, listDrafts, deleteDraft } from '../src/draft.js';
import { publishDraft } from '../src/publish.js';

program
  .name('weixin-mp-cli')
  .description('微信公众号 CLI 工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化微信公众号配置')
  .action(async () => {
    const existing = readConfig();
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'appid',
        message: 'AppID:',
        default: existing.appid || '',
        validate: (v) => v.trim() ? true : 'AppID 不能为空',
      },
      {
        type: 'password',
        name: 'secret',
        message: 'AppSecret:',
        mask: '*',
        default: existing.secret || '',
        validate: (v) => v.trim() ? true : 'AppSecret 不能为空',
      },
    ]);

    writeConfig({ appid: answers.appid.trim(), secret: answers.secret.trim() });
    console.log(chalk.green('✅ 配置已保存'));
  });

program
  .command('create <file>')
  .description('从 Markdown 或 HTML 文件创建草稿')
  .option('-t, --title <title>', '文章标题')
  .option('-a, --author <author>', '作者')
  .option('-d, --digest <digest>', '摘要')
  .option('-c, --cover <image-path>', '封面图片路径')
  .option('-u, --url <url>', '原文链接')
  .option('--comment', '开启评论', false)
  .action(async (file, options) => {
    try {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`❌ 文件不存在: ${filePath}`));
        process.exit(1);
      }

      const ext = path.extname(filePath).toLowerCase();
      const isHtml = ext === '.html' || ext === '.htm';

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: '文章标题:',
          default: options.title || path.basename(filePath, path.extname(filePath)),
          when: !options.title,
        },
        {
          type: 'input',
          name: 'author',
          message: '作者（可留空）:',
          default: '',
          when: !options.author,
        },
        {
          type: 'input',
          name: 'cover',
          message: '封面图片路径:',
          when: !options.cover,
          validate: (v) => {
            if (!v.trim()) return '封面图片为必填项';
            if (!fs.existsSync(path.resolve(v.trim()))) return `文件不存在: ${v.trim()}`;
            return true;
          },
        },
      ]);

      const title = options.title || answers.title;
      const author = options.author || answers.author || '';
      const coverPath = options.cover || answers.cover || '';

      console.log(chalk.cyan('\n🚀 开始处理文章...\n'));

      let thumbMediaId = '';
      if (coverPath) {
        const absoluteCoverPath = path.resolve(coverPath);
        console.log(chalk.cyan(`📤 上传封面图片: ${coverPath}`));
        const { media_id } = await uploadPermanentImage(absoluteCoverPath);
        thumbMediaId = media_id;
        console.log(chalk.green(`✅ 封面上传成功，media_id: ${media_id}`));
      }

      let htmlContent;
      if (isHtml) {
        console.log(chalk.cyan('\n📄 读取 HTML 文件...'));
        htmlContent = fs.readFileSync(filePath, 'utf-8');
      } else {
        console.log(chalk.cyan('\n📝 解析 Markdown 并上传正文图片...'));
        htmlContent = await markdownToHtml(filePath, (msg) => {
          console.log(chalk.gray(`   ${msg}`));
        });
      }

      console.log(chalk.cyan('\n📨 提交草稿...'));
      const mediaId = await addDraft({
        title,
        author,
        digest: options.digest || '',
        content: htmlContent,
        content_source_url: options.url || '',
        thumb_media_id: thumbMediaId,
        need_open_comment: options.comment ? 1 : 0,
      });

      console.log(chalk.green(`\n🎉 草稿创建成功！`));
      console.log(chalk.green(`   media_id: ${mediaId}`));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('publish <media_id>')
  .description('发布草稿')
  .action(async (mediaId) => {
    try {
      console.log(chalk.cyan(`📤 发布草稿: ${mediaId}`));
      const publishId = await publishDraft(mediaId);
      console.log(chalk.green(`🎉 发布成功！publish_id: ${publishId}`));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('列出草稿')
  .option('-o, --offset <n>', '偏移量', '0')
  .option('-c, --count <n>', '数量', '20')
  .action(async (options) => {
    try {
      const { items, total } = await listDrafts(
        parseInt(options.offset),
        parseInt(options.count)
      );

      console.log(chalk.cyan(`📋 草稿列表 (共 ${total} 条):\n`));
      if (items.length === 0) {
        console.log(chalk.gray('   暂无草稿'));
        return;
      }

      items.forEach((draft, i) => {
        const article = draft.content[0];
        console.log(chalk.yellow(`${i + 1}. ${article.title}`));
        console.log(chalk.gray(`   media_id: ${draft.media_id}`));
        console.log(chalk.gray(`   更新时间: ${new Date(draft.update_time * 1000).toLocaleString()}`));
        console.log();
      });
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('delete <media_id>')
  .description('删除草稿')
  .action(async (mediaId) => {
    try {
      await deleteDraft(mediaId);
      console.log(chalk.green('✅ 草稿已删除'));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('material:upload <file>')
  .description('上传永久素材')
  .action(async (filePath) => {
    try {
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        console.error(chalk.red(`❌ 文件不存在: ${absolutePath}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`📤 上传素材: ${filePath}`));
      const { media_id, url } = await uploadPermanentImage(absolutePath);
      console.log(chalk.green(`✅ 上传成功`));
      console.log(chalk.green(`   media_id: ${media_id}`));
      console.log(chalk.gray(`   url: ${url}`));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('material:list')
  .description('列出永久素材')
  .option('-t, --type <type>', '素材类型 (image/voice/video/news)', 'image')
  .option('-o, --offset <n>', '偏移量', '0')
  .option('-c, --count <n>', '数量', '20')
  .action(async (options) => {
    try {
      const { items, total } = await listMaterials(
        options.type,
        parseInt(options.offset),
        parseInt(options.count)
      );

      console.log(chalk.cyan(`📋 素材列表 (共 ${total} 条):\n`));
      if (items.length === 0) {
        console.log(chalk.gray('   暂无素材'));
        return;
      }

      items.forEach((item, i) => {
        console.log(chalk.yellow(`${i + 1}. ${item.name || item.title || item.media_id}`));
        console.log(chalk.gray(`   media_id: ${item.media_id}`));
        console.log(chalk.gray(`   更新时间: ${new Date(item.update_time * 1000).toLocaleString()}`));
        console.log();
      });
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('material:delete <media_id>')
  .description('删除永久素材')
  .action(async (mediaId) => {
    try {
      await deleteMaterial(mediaId);
      console.log(chalk.green('✅ 素材已删除'));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('material:count')
  .description('查看素材统计')
  .action(async () => {
    try {
      const count = await getMaterialCount();
      console.log(chalk.cyan('📊 素材统计:\n'));
      console.log(chalk.yellow(`   图片: ${count.image}`));
      console.log(chalk.yellow(`   语音: ${count.voice}`));
      console.log(chalk.yellow(`   视频: ${count.video}`));
      console.log(chalk.yellow(`   图文: ${count.news}`));
    } catch (err) {
      console.error(chalk.red(`\n❌ 出错了: ${err.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
