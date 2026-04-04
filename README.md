# weixin-mp-cli

微信公众号 CLI 工具，支持从 Markdown 文件创建草稿、发布文章、管理素材。

## 安装

```bash
npm install -g @yossi-lee/weixin-mp-cli
```

或在项目本地使用：

```bash
npm install
npm run wx -- <command>
```

## 快速开始

```bash
# 1. 初始化配置
weixin-mp-cli init

# 2. 从 Markdown 创建草稿
weixin-mp-cli create article.md -t "文章标题" -c cover.jpg

# 3. 发布草稿
weixin-mp-cli publish <media_id>
```

## 命令

### init

初始化微信公众号配置（AppID / AppSecret）。

```bash
weixin-mp-cli init
```

### create

从 Markdown 文件创建草稿，自动上传正文内图片和封面。

```bash
weixin-mp-cli create <markdown-file> [options]
```

| 选项 | 说明 |
|------|------|
| `-t, --title <title>` | 文章标题（默认取文件名） |
| `-a, --author <author>` | 作者 |
| `-d, --digest <digest>` | 摘要 |
| `-c, --cover <image-path>` | 封面图片路径（本地文件） |
| `-u, --url <url>` | 原文链接 |
| `--comment` | 开启评论 |

### publish

发布草稿到公众号。

```bash
weixin-mp-cli publish <media_id>
```

### list

列出草稿。

```bash
weixin-mp-cli list [options]
```

| 选项 | 说明 |
|------|------|
| `-o, --offset <n>` | 偏移量（默认 0） |
| `-c, --count <n>` | 数量（默认 20） |

### delete

删除草稿。

```bash
weixin-mp-cli delete <media_id>
```

### material:upload

上传永久素材（用于封面等）。

```bash
weixin-mp-cli material:upload <file>
```

### material:list

列出永久素材。

```bash
weixin-mp-cli material:list [options]
```

| 选项 | 说明 |
|------|------|
| `-t, --type <type>` | 素材类型：image / voice / video / news（默认 image） |
| `-o, --offset <n>` | 偏移量（默认 0） |
| `-c, --count <n>` | 数量（默认 20） |

### material:delete

删除永久素材。

```bash
weixin-mp-cli material:delete <media_id>
```

### material:count

查看素材统计。

```bash
weixin-mp-cli material:count
```

## 项目结构

```
weixin-mp-cli/
├── bin/
│   └── wx.js              # CLI 入口
└── src/
    ├── auth.js            # Token 管理（带缓存）
    ├── config.js          # 配置读写
    ├── draft.js           # 草稿操作
    ├── markdown.js        # Markdown 转 HTML + 图片上传
    ├── material.js        # 素材操作
    └── publish.js         # 发布草稿
```

## 工作流程

1. Markdown 中的本地图片自动上传到微信服务器并替换为可用 URL
2. 封面图片上传为永久素材获取 `thumb_media_id`
3. 创建草稿到公众号草稿箱
4. 调用发布接口将草稿发布到公众号

## License

Apache-2.0
