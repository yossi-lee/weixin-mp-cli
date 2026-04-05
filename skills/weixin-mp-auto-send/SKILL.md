---
name: weixin-mp-auto-send
description: >
  自动发送微信公众号文章。该技能处理从收集文章材料到发布的完整工作流。
  当用户想要发送/发布公众号文章、提到「公众号」、想要自动发送推文、或需要管理微信公众号草稿时，请使用此技能。
  当用户提到创建新的公众号文章、发布内容、或在 weixin-mp 目录结构中组织文章草稿时，也应触发此技能。
---

# 微信公众号自动发送

本技能使用两个 CLI 工具自动化发送微信公众号文章的流程：

## 工具一：WeMD-cli（排版工具）

> 将 Markdown 转换为精美排版的 HTML — 命令行工具

将 Markdown 文件转换为带有精美内联样式的 HTML 输出。支持 13 种主题，适合用于微信公众号文章排版、文档发布等场景。

**安装：**
```bash
npm install -g @yossi-lee/wemd-cli
```

**用法：**
```bash
wemd-cli <file> [options]
```

| 选项                  | 说明                                     | 默认值  |
| --------------------- | ---------------------------------------- | ------- |
| `-t, --theme <theme>` | 应用的主题                               | `basic` |
| `-o, --output <file>` | 输出文件路径（不指定则输出到终端）       | stdout  |
| `--full-html`         | 输出完整 HTML 文档（可直接在浏览器打开） | `false` |

**可用主题：**

| 主题名      | 风格描述       |
| ----------- | -------------- |
| `basic`     | 默认简约风格   |
| `default`   | 自定义默认风格 |
| `academic`  | 学术论文风格   |
| `aurora`    | 极光玻璃风格   |
| `bauhaus`   | 包豪斯风格     |
| `cyberpunk` | 赛博朋克风格   |
| `knowledge` | 知识库风格     |
| `luxury`    | 黑金奢华风格   |
| `morandi`   | 莫兰迪森林风格 |
| `brutalism` | 新粗野主义风格 |
| `receipt`   | 购物小票风格   |
| `sunset`    | 落日胶片风格   |
| `github`    | GitHub 风格    |

## 工具二：weixin-mp-cli（发布工具）

> 微信公众号 CLI 工具，支持从 Markdown / HTML 文件创建草稿、发布文章、管理素材

**安装：**
```bash
npm install -g @yossi-lee/weixin-mp-cli
```

**常用命令：**

| 命令 | 说明 |
|------|------|
| `weixin-mp-cli init` | 初始化配置（AppID / AppSecret） |
| `weixin-mp-cli create <file> [options]` | 从 Markdown/HTML 创建草稿 |
| `weixin-mp-cli publish <media_id>` | 发布草稿到公众号 |
| `weixin-mp-cli list` | 列出草稿 |
| `weixin-mp-cli delete <media_id>` | 删除草稿 |

**create 命令选项：**

| 选项 | 说明 |
|------|------|
| `-t, --title <title>` | 文章标题（默认取文件名） |
| `-a, --author <author>` | 作者 |
| `-d, --digest <digest>` | 摘要 |
| `-c, --cover <image-path>` | 封面图片路径（本地文件） |
| `-u, --url <url>` | 原文链接 |
| `--comment` | 开启评论 |

## 工作流

技能执行最多 4 个步骤：

1. **收集材料** — 收集标题、作者、正文、封面图片
2. **创建文件** — 将 MD 转换为带主题的 HTML，创建文章目录（包含 md、html、info.yaml）
3. **创建草稿** — 通过 wx CLI 创建草稿（不发布）
4. **发布** — 仅当用户明确要求时，发布草稿到公众号

## 步骤 1：收集材料

向用户询问（或从上下文中提取）以下信息：

- **title** — 文章标题 **（必填）**
- **author** — 作者名 **（必填）**
- **body** — 文章正文（Markdown 格式） **（必填）**
- **cover** — 封面图片路径（本地文件，用于创建草稿时上传） **（必填）**
- **theme** — WeMD 排版主题（默认：`luxury`）。可用主题：`basic`、`default`、`academic`、`aurora`、`bauhaus`、`cyberpunk`、`knowledge`、`luxury`、`morandi`、`brutalism`、`receipt`、`sunset`、`github`

### 必填字段校验

**title、author、body、cover 为必填字段。** 在执行后续步骤前，必须确保这四个字段都已提供：

1. 首先尝试从用户提供的材料或上下文中提取这四个字段
2. 如果用户未提供某个必填字段，或从提供的内容中无法提取出该字段，**必须停止并让用户补充**
3. 明确告知用户缺少哪个字段，并等待用户提供后再继续
4. 不可使用默认值或猜测值替代必填字段

在继续之前确认所有材料。

## 步骤 3：创建文件

在 `~/Documents/weixin-mp/` 下创建目录结构：

```
~/Documents/weixin-mp/
└── YYYY-MM-DD_HH-mm-ss/
    ├── article.md
    ├── article.html
    └── info.yaml
```

### 目录命名

使用当前日期时间作为目录名，格式为 `YYYY-MM-DD_HH-mm-ss`（例如：`2026-04-04_14-30-00`）。

### article.md

将收集的正文内容写入为 Markdown 文件。

### article.html

使用 WeMD-cli 将 Markdown 转换为带主题的 HTML：

```bash
wemd-cli article.md -t <theme> --full-html -o article.html
```

### info.yaml

以 YAML 格式保存文章元数据：

```yaml
title: "文章标题"
author: "作者名"
theme: "default"
cover: "/path/to/cover.jpg"
created_at: "2026-04-04T14:30:00"
```

字段说明：
- `title` — 文章标题
- `author` — 作者名
- `theme` — 使用的 WeMD 排版主题
- `cover` — 封面图片路径
- `created_at` — 创建时间的 ISO 8601 格式

## 步骤 3：创建草稿

使用 `weixin-mp-cli` CLI 创建草稿：

1. **检查命令是否存在** — 在运行前先检查命令是否已安装：
   ```bash
   which weixin-mp-cli
   ```
   如果未找到，提示用户先运行 `npm install -g @yossi-lee/weixin-mp-cli`

2. **检查 CLI 是否已配置** — 检查配置文件是否存在：
   ```bash
   cat ~/.weixin-mp-cli.json
   ```
   如果文件不存在或为空，提示用户先运行 `weixin-mp-cli init`

3. **创建草稿** — 使用转换后的 HTML 文件运行创建命令：
   ```bash
   weixin-mp-cli create article.html -t "标题" -a "作者" -c "封面图片路径"
   ```

4. 向用户报告 `media_id` 表示草稿创建成功。

**除非用户明确要求发布，否则在此步骤停止。** 告知用户草稿已创建，如需发布可运行 `weixin-mp-cli publish <media_id>`。

## 步骤 4：发布（可选）

**仅当用户明确要求发布时才执行此步骤。** 如果用户没有强调或说明要发布，不要调用 publish 命令。

1. **检查命令是否存在** — 在运行前先检查命令是否已安装：
   ```bash
   which weixin-mp-cli
   ```

2. **发布草稿** — 草稿创建成功并获得 `media_id` 后，运行：
   ```bash
   weixin-mp-cli publish <media_id>
   ```

3. 向用户报告 `publish_id` 表示发布成功。

## 错误处理

- 如果 `weixin-mp-cli` 未配置，提示用户先运行 `weixin-mp-cli init`
- 如果 `weixin-mp-cli` 未安装，运行 `npm install -g @yossi-lee/weixin-mp-cli`
- 如果 WeMD-cli 未安装，运行 `npm install -g @yossi-lee/wemd-cli`
- 遇到任何错误时，显示错误信息并停止 — 不要继续下一步
- 如果文章目录已存在（相同时间戳），追加计数器（如 `_1`、`_2`）

### IP 白名单配置

当调用 `weixin-mp-cli` 报错提示 IP 不在白名单时，需要配置 API IP 白名单：

1. **获取当前公网 IP**：
   ```bash
   curl ifconfig.me
   ```

2. **打开微信公众号平台** — 使用 CDP 控制浏览器打开 `https://developers.weixin.qq.com/console/`

3. **导航至 IP 白名单设置**：
   - 点击「我的业务」→「公众号」
   - 找到「API IP白名单」区域，点击「编辑」

4. **添加 IP** — 将获取到的公网 IP 添加到白名单列表中并保存

5. **处理登录验证** — 如果页面需要登录或扫码确认：
   - 使用浏览器截图功能截取当前页面
   - 将截图发送给用户，等待用户扫码确认
   - 用户确认后再继续操作

6. 配置完成后，重新执行失败的命令。

## 依赖

- `weixin-mp-cli` 必须已安装并配置（`npm install -g @yossi-lee/weixin-mp-cli`，如未配置请运行 `weixin-mp-cli init`）
- `@yossi-lee/wemd-cli` 必须已安装（`npm install -g @yossi-lee/wemd-cli`）
- Node.js 环境和 npm
