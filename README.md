# Lite Atoms Dev

一个基于 AI 的开发者工作台，左侧为 AI 对话面板，右侧为代码编辑器/预览区域。深色主题，IDE 风格界面。

## 架构设计

- **前端**: UI 界面展示与交互
- **后端**: Supabase（认证 + 数据库）用来处理用户认证、管理用户数据、存储项目文件等数据持久化。
- **Agent 推理服务**: 用来处理用户指令，生成代码、执行任务等。


## 技术栈

- **前端框架**: React 18 + TypeScript
- **前端构建工具**: Vite
- **前端UI 组件库**: shadcn/ui
- **前端样式**: Tailwind CSS
- **前端路由**: React Router v6
- **后端服务**: Supabase（认证 + 数据库）
- **Agent 推理服务**: Python3/FastAPI、DeepAgents、Langchain、LangGraph


## 环境要求

- Node.js >= 18
- pnpm >= 8

## 快速启动

### 1. 安装依赖

前端依赖安装：
```bash
cd app/frontend

pnpm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，填入 Supabase 配置：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 注意：如果在 Atoms 平台上运行，环境变量已自动配置，无需手动设置。

### 3. 启动开发服务器

前端启动：
```bash
cd app/frontend

pnpm dev
```

开发服务器默认运行在 `http://localhost:5173`。

Agent 推理服务启动：待补充

### 4. 构建生产版本

前端构建：
```bash
cd app/frontend

pnpm run build
```

构建产物输出到 `dist/` 目录。


### 5. 代码检查

前端代码检查：
```bash
pnpm run lint
```

## 功能说明

### 用户认证
- 支持邮箱注册和登录
- 基于 Supabase Auth 的会话管理
- 未登录用户自动重定向到登录页

### 首页
- 展示用户的历史项目列表（从 Supabase 实时查询）
- 输入需求描述，一键创建新项目
- 快速开始建议标签

### 工作台
- 左右分屏布局，支持拖拽调整宽度
- 左侧：AI 对话面板，与 Coding Agent 交互
- 右侧：代码编辑器 + 应用预览（支持多设备模式）
- 文件目录树，支持搜索和快速导航

### 数据管理
- 项目数据存储在 Supabase `projects` 表
- 启用 Row Level Security (RLS)，用户只能访问自己的数据

