# AGENTS.md - weixin-mp-cli

## Project Overview

微信公众号 CLI 工具，支持从 Markdown / HTML 文件创建草稿、发布文章、管理素材。

Node.js ESM package, published to npm as `@yossi-lee/weixin-mp-cli`.

## Commands

```bash
# Install dependencies
npm install

# Run CLI locally
node bin/wx.js <command>
# or
npm run wx -- <command>

# Publish to npm
npm publish --access public
```

There is no build step, linter, or test framework. Run commands directly with `node bin/wx.js`.

## Project Structure

```
bin/wx.js              # CLI entry point (commander)
src/auth.js            # WeChat access token management with caching
src/config.js          # Config read/write (~/.weixin-mp-cli.json)
src/draft.js           # Draft CRUD operations
src/markdown.js        # Markdown to HTML conversion with image upload
src/material.js        # Permanent material management
src/publish.js         # Publish draft to public account
```

## Code Style

### Imports
- Use ES module syntax (`import`/`export`)
- Group imports: external libraries first, then local `../src/*.js` modules
- Always include `.js` extension in local imports

### Formatting
- 2-space indentation
- Single quotes for strings
- No semicolons required but current code uses them inconsistently — follow existing file style
- Max line length: keep reasonable, no hard wrap

### Naming Conventions
- Functions: camelCase (`getAccessToken`, `addDraft`)
- Variables: camelCase (`thumbMediaId`, `htmlContent`)
- Constants: UPPER_SNAKE_CASE (`CONFIG_PATH`)
- WeChat API fields: use exact snake_case from API (`media_id`, `access_token`, `thumb_media_id`)

### Types
- No TypeScript; use JSDoc comments for public API functions
- Document params and return types in JSDoc blocks

### Error Handling
- All CLI commands wrap logic in `try/catch`
- On error: print `chalk.red` message with `err.message`, then `process.exit(1)`
- API modules throw `Error` with formatted message including `errcode` and `errmsg`
- Token caching: in-memory with 60-second expiry buffer

### Async Patterns
- Use `async/await` exclusively, no raw `.then()` chains
- Progress callbacks use synchronous function: `(msg) => console.log(...)`

### Console Output
- Use `chalk` for colored output
- Colors: green (success), red (error), cyan (info/steps), gray (details), yellow (list items)
- Emoji prefixes for visual clarity

## Adding New Commands

1. Add command in `bin/wx.js` using `program.command()`
2. If new API call needed, create corresponding module in `src/`
3. All API modules import `getAccessToken` from `./auth.js`
4. Follow existing error handling pattern

## WeChat API Reference

- Token: `GET /cgi-bin/token`
- Draft: `POST /cgi-bin/draft/add`, `POST /cgi-bin/draft/batchget`, `POST /cgi-bin/draft/delete`
- Publish: `POST /cgi-bin/freepublish/submit`
- Material: `POST /cgi-bin/material/add_material`, `POST /cgi-bin/material/batchget_material`, `POST /cgi-bin/material/del_material`, `GET /cgi-bin/material/get_materialcount`
- Article image: `POST /cgi-bin/media/uploadimg`
