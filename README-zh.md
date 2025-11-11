# CAD ROOMS - 3D 场景管理系统

一个现代化的 3D 场景编辑和管理平台，集成了 HOOPS Web Viewer 3D 引擎和 Supabase 后端服务，提供完整的 CAD 零件管理和场景编辑功能。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18.svg)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-84.49%25-brightgreen.svg)](./TEST_REPORT.md)

## 📋 项目概述

CAD ROOMS 是一个全栈 Web 应用，为用户提供直观的 3D 场景创建和管理体验。通过现代化的技术栈和工业级 3D 引擎，实现了从零件上传、场景编辑到配置保存的完整工作流。

### 核心功能

- **场景管理** - 创建、编辑、删除 3D 场景，支持场景配置的序列化和反序列化
- **零件管理** - 上传和管理 CAD 文件（.scs/.step/.stl），支持缩略图预览
- **3D 编辑器** - 基于 HOOPS Web Viewer 的交互式 3D 场景编辑器
- **拖放操作** - 从零件库拖放零件到 3D 空间，所见即所得
- **场景持久化** - 场景配置自动保存到 Supabase，包括零件位置和变换矩阵
- **预设零件库** - 内置机械零件库，开箱即用

## ✨ 功能特性

### 🎨 场景管理

- **场景列表** - 查看所有场景，支持按更新时间排序
- **创建场景** - 添加带有名称和描述的新场景
- **编辑场景信息** - 更新场景名称、描述等元数据
- **删除场景** - 软删除机制，带二次确认的场景删除
- **场景预览** - 快速查看场景配置和包含的零件
- **JSON 查看器** - 查看和导出场景配置的 JSON 格式

### 🔧 零件管理

- **零件上传** - 支持 .scs、.step、.stl 等 CAD 文件格式
- **缩略图管理** - 为零件上传预览图片（PNG/JPG）
- **零件库** - 浏览所有可用零件，支持系统预设和用户上传
- **文件验证** - 自动校验文件类型和大小（最大 100MB）
- **软删除** - 零件删除后可恢复
- **双存储桶** - 分离 CAD 文件和图片存储

### 🖥️ 3D 编辑器

- **HOOPS Web Viewer** - 基于工业级 HOOPS Communicator 引擎
- **拖放操作** - 从零件库拖拽零件到 3D 场景
- **视图控制** - 旋转、平移、缩放 3D 视图
- **零件选择** - 点击选中场景中的零件
- **变换编辑** - 支持零件位置、旋转的变换矩阵编辑
- **可见性控制** - 显示/隐藏场景中的零件
- **场景序列化** - 自动保存场景配置到数据库

### 🎯 用户体验

- **欢迎页面** - 精美的 3D 动画欢迎界面（Spline）
- **实时反馈** - Toast 通知提示操作结果
- **响应式设计** - 支持不同屏幕尺寸
- **加载状态** - 清晰的加载和错误状态提示

## 🛠️ 技术栈

### 前端技术

- **React 19.1** - 最新的 React 版本，支持并发特性
- **TypeScript 5.9** - 严格类型检查，增强代码质量
- **Vite 7** (Rolldown) - 极速构建工具
- **Tailwind CSS 4** - 现代化 CSS 框架
- **Radix UI** - 无障碍的 UI 组件库

### 3D 引擎

- **HOOPS Web Viewer 2024** - Tech Soft 3D 的工业级 3D 引擎
- 支持多种 CAD 格式（.scs、.step、.stl）
- 高性能渲染和交互

### 后端服务

- **Supabase** - 开源 Firebase 替代方案
  - PostgreSQL 数据库
  - Storage 存储服务
  - Row Level Security (RLS)
  - 实时数据订阅

### 测试工具

- **Vitest 4.0** - 快速的单元测试框架
- **Testing Library** - React 组件测试
- **Coverage: 84.49%** - 高代码覆盖率
- **59 个测试用例** - 全部通过 ✅

### 开发工具

- **ESLint 9** - 代码质量检查
- **pnpm** - 高效的包管理器
- **happy-dom** - 轻量级 DOM 测试环境

## 📁 项目结构

```
take-home/
├── public/
│   ├── preset_parts/           # 预设零件库
│   │   ├── axe.scs/.png       # 轴和缩略图
│   │   ├── bearing_*.scs/.png # 轴承系列
│   │   └── parts_list.json    # 零件清单
│   └── testing_parts/          # 测试零件
│
├── src/
│   ├── components/
│   │   ├── ScenesList.tsx      # 场景列表管理界面
│   │   ├── SceneEditor.tsx     # 3D 场景编辑器
│   │   ├── SceneViewer.tsx     # 只读场景查看器
│   │   ├── SceneJsonViewer.tsx # JSON 配置查看器
│   │   ├── PartsList.tsx       # 零件库组件
│   │   ├── PartUploadDialog.tsx # 零件上传对话框
│   │   ├── WelcomePage.tsx     # 欢迎页面
│   │   └── ui/                 # Radix UI 组件
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── card.tsx
│   │       └── ...
│   │
│   ├── services/
│   │   ├── partsManager.ts     # 零件管理 API
│   │   ├── sceneSerializer.ts  # 场景序列化/反序列化
│   │   └── scenesService.ts    # 场景 CRUD 操作
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase 客户端
│   │   └── utils.ts            # 工具函数
│   │
│   ├── types/
│   │   ├── Scene.ts            # 场景类型定义
│   │   ├── parts.ts            # 零件类型定义
│   │   ├── sceneConfig.ts      # 场景配置类型
│   │   └── hoops.d.ts          # HOOPS 类型声明
│   │
│   ├── test/                   # 测试文件
│   │   ├── setup.ts            # 测试环境配置
│   │   ├── sceneSerializer.test.ts  # 场景序列化测试
│   │   ├── partsManager.test.ts     # 零件管理测试
│   │   ├── ui.test.tsx         # UI 组件测试
│   │   └── integration/
│   │       └── scene.test.ts   # 集成测试
│   │
│   ├── App.tsx                 # 主应用组件
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
│
├── supabase/
│   ├── config.toml             # Supabase 配置
│   └── migrations/
│       ├── table/
│       │   ├── scenes_table.sql    # 场景表
│       │   └── parts_table.sql     # 零件表
│       └── bucket/
│           ├── asset_file_bucket.sql   # CAD 文件存储桶
│           └── asset_image_bucket.sql  # 图片存储桶
│
├── coverage/                   # 测试覆盖率报告
├── dist/                       # 构建输出
├── .env.local                  # 环境变量
├── package.json
├── vite.config.ts              # Vite 配置
├── vitest.config.ts            # Vitest 配置
├── tsconfig.json               # TypeScript 配置
├── README.md                   # 英文文档
├── README-zh.md                # 中文文档（本文档）
├── TESTING.md                  # 测试指南
├── TEST_REPORT.md              # 详细测试报告
└── TEST_CASES.md               # 测试用例清单
```

## 🚀 快速开始

### 前置要求

- **Node.js**: v18 或更高版本
- **pnpm**: v8 或更高版本
- **Supabase 账号**: [注册 Supabase](https://supabase.com) 或使用本地实例
- **现代浏览器**: Chrome、Firefox、Safari 或 Edge

### 安装步骤

#### 1. 克隆仓库

```bash
git clone <repository-url>
cd take-home
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_API_KEY=your_supabase_anon_key
```

**获取 Supabase 凭证：**

- 登录 [Supabase Dashboard](https://app.supabase.com)
- 创建新项目或选择现有项目
- 进入 Settings → API
- 复制 `Project URL` 和 `anon/public` API key

#### 4. 设置数据库

有两种方式设置数据库：

**方式 A：使用 Supabase CLI（推荐）**

```bash
# 安装 Supabase CLI（如果未安装）
npm install -g supabase

# 链接到你的项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push

# 或者使用本地开发环境
supabase start
supabase db reset
```

**方式 B：手动执行 SQL**

在 Supabase Dashboard 的 SQL Editor 中依次执行：

1. `supabase/migrations/table/scenes_table.sql`
2. `supabase/migrations/table/parts_table.sql`
3. `supabase/migrations/bucket/asset_file_bucket.sql`
4. `supabase/migrations/bucket/asset_image_bucket.sql`

#### 5. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:5173` 启动并自动打开浏览器。

### 📦 可用脚本

```bash
# 开发服务器（热重载）
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 预览生产构建
pnpm preview

# 代码检查
pnpm lint

# 运行测试（watch 模式）
pnpm test

# 运行测试（单次运行）
pnpm test:run

# 测试覆盖率报告
pnpm test:coverage

# 测试 UI 界面
pnpm test:ui
```

## 📊 数据库模式

### `scenes` 表

存储 3D 场景的元数据和配置。

| 列名          | 类型        | 描述                                   |
| ------------- | ----------- | -------------------------------------- |
| `id`          | UUID        | 主键（自动生成）                       |
| `name`        | TEXT        | 场景名称（必填）                       |
| `description` | TEXT        | 场景描述（可选）                       |
| `assets`      | TEXT[]      | 资源文件名数组（已废弃）               |
| `scene_json`  | JSONB       | 序列化的场景配置（零件、变换、位置等） |
| `user_id`     | UUID        | 用户 ID（预留字段）                    |
| `del_flag`    | INTEGER     | 软删除标记（0=活跃，1=已删除）         |
| `created_at`  | TIMESTAMPTZ | 创建时间戳（自动）                     |
| `updated_at`  | TIMESTAMPTZ | 最后更新时间戳（自动）                 |

**索引：**

- `idx_scenes_updated_at` - 按更新时间排序
- `idx_scenes_user_id` - 用户关联查询
- `idx_scenes_del_flag` - 软删除过滤
- `idx_scenes_name` - 名称搜索

**触发器：**

- 自动更新 `updated_at` 字段

### `parts` 表

存储 CAD 零件的元数据和文件引用。

| 列名          | 类型        | 描述                             |
| ------------- | ----------- | -------------------------------- |
| `id`          | UUID        | 主键（自动生成）                 |
| `name`        | TEXT        | 零件名称（必填）                 |
| `description` | TEXT        | 零件描述（可选）                 |
| `file_id`     | UUID        | CAD 文件 ID（指向 Storage）      |
| `image_id`    | UUID        | 缩略图 ID（指向 Storage，可选）  |
| `remarks`     | TEXT        | 备注信息                         |
| `is_system`   | BOOLEAN     | 是否为系统预设零件（默认 false） |
| `del_flag`    | INTEGER     | 软删除标记（0=活跃，1=已删除）   |
| `created_at`  | TIMESTAMPTZ | 创建时间戳（自动）               |
| `updated_at`  | TIMESTAMPTZ | 最后更新时间戳（自动）           |

**索引：**

- `idx_parts_name` - 名称搜索
- `idx_parts_del_flag` - 软删除过滤
- `idx_parts_is_system` - 系统/用户零件区分
- `idx_parts_created_at` - 按创建时间排序

### Storage 存储桶

**`asset-file` 存储桶**

- 存储 CAD 文件（.scs、.step、.stl）
- 最大文件大小：100MB
- 公开访问

**`asset-image` 存储桶**

- 存储零件缩略图（PNG、JPG）
- 最大文件大小：10MB
- 公开访问

## 🎮 使用指南

### 首次使用

1. **启动应用** - 访问 `http://localhost:5173`
2. **欢迎页面** - 点击"Enter"进入主界面
3. **创建场景** - 点击"Create New Scene"创建第一个场景

### 场景管理

#### 创建新场景

1. 点击页面右上角的"Create New Scene"按钮
2. 输入场景名称（必填）
3. 输入场景描述（可选）
4. 点击"Create"完成创建

#### 编辑场景元数据

1. 在场景卡片上点击"Edit Info"按钮
2. 修改名称和/或描述
3. 点击"Update"保存更改

#### 删除场景

1. 在场景卡片上点击"Delete"按钮
2. 在确认对话框中点击"确认"
3. 场景将被软删除（可在数据库中恢复）

### 3D 场景编辑

#### 查看场景

1. 点击场景卡片上的"View"按钮
2. 3D 查看器将打开，显示场景内容
3. 右侧面板显示零件库

#### 编辑场景

1. 点击场景卡片上的"Edit 3D"按钮
2. **添加零件**：
   - 从右侧零件库拖拽零件到 3D 视图
   - 零件会自动添加到场景中
3. **选择零件**：
   - 在 3D 视图中点击零件进行选择
   - 选中的零件会高亮显示
4. **删除零件**：
   - 选中要删除的零件
   - 点击"Delete Selected"按钮
5. **保存场景**：
   - 点击"Save"按钮保存所有更改
   - 场景配置将自动序列化并保存到数据库

#### 3D 视图操作

- **旋转视图** - 左键拖拽
- **平移视图** - 中键或 Shift + 左键拖拽
- **缩放视图** - 鼠标滚轮

### 零件管理

#### 浏览零件库

- 零件库显示在编辑器右侧面板
- 每个零件显示缩略图和名称
- 支持系统预设零件和用户上传零件

#### 上传新零件

1. 点击零件库顶部的"Upload New Part"按钮
2. 填写零件信息：
   - 名称（必填）
   - 描述（可选）
   - 备注（可选）
3. 上传 CAD 文件（.scs/.step/.stl）
4. 上传缩略图（PNG/JPG，可选）
5. 点击"Upload"完成上传

### 查看场景配置

1. 点击场景卡片上的"View JSON"按钮
2. 查看场景的 JSON 配置
3. 可以复制配置用于调试或备份

## 🧪 测试

本项目包含全面的测试套件，确保代码质量和功能正确性。

### 测试统计

- **测试文件**: 4 个
- **测试用例**: 59 个
- **通过率**: 100% ✅
- **代码覆盖率**: 84.49%
- **测试框架**: Vitest + Testing Library

### 运行测试

```bash
# Watch 模式运行测试
pnpm test

# 单次运行所有测试
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# 打开测试 UI 界面
pnpm test:ui
```

### 测试覆盖范围

#### ✅ 已测试模块

- **场景序列化** (`sceneSerializer.ts`) - 15 个测试

  - 序列化和反序列化
  - 变换矩阵处理
  - 节点元数据管理

- **零件管理** (`partsManager.ts`) - 24 个测试

  - 文件上传（CAD + 图片）
  - CRUD 操作
  - 文件验证
  - URL 生成

- **集成测试** (`integration/scene.test.ts`) - 10 个测试

  - 完整场景工作流
  - 大型场景处理
  - 错误恢复机制

- **UI 组件** (`ui.test.tsx`) - 10 个测试
  - Button 组件
  - 事件处理
  - 样式变体

### 查看详细报告

- **[TESTING.md](./TESTING.md)** - 测试指南和配置说明
- **[TEST_REPORT.md](./TEST_REPORT.md)** - 详细测试报告和分析
- **[TEST_CASES.md](./TEST_CASES.md)** - 完整测试用例清单
- **coverage/index.html** - HTML 格式的覆盖率报告

## 🏗️ 架构设计

### 前端架构

```
用户界面
    ↓
React 组件层
    ↓
服务层 (Services)
    ↓
Supabase 客户端
    ↓
后端 API
```

### 核心模块

#### 1. 组件层 (`src/components/`)

- **业务组件** - 场景管理、编辑器、零件库
- **UI 组件** - 基于 Radix UI 的可复用组件
- **布局组件** - 欢迎页面、主布局

#### 2. 服务层 (`src/services/`)

- **partsManager** - 零件 CRUD、文件上传、URL 生成
- **sceneSerializer** - 场景序列化/反序列化
- **scenesService** - 场景 CRUD 操作

#### 3. 类型系统 (`src/types/`)

- 完整的 TypeScript 类型定义
- HOOPS Web Viewer 类型声明
- 场景配置和零件数据结构

### 数据流

#### 场景保存流程

```
1. 用户在 3D 编辑器中编辑场景
2. 点击"Save"按钮
3. serializeScene() 提取场景数据
4. 生成 SceneConfig JSON
5. 保存到 Supabase scenes 表
6. 更新 scene_json 字段
```

#### 场景加载流程

```
1. 从数据库读取 scene_json
2. deserializeScene() 解析配置
3. 根据 cadUrl 加载每个零件
4. 应用变换矩阵和可见性
5. 渲染完整的 3D 场景
```

## 🔧 开发

### 技术要求

- TypeScript 严格模式
- ESLint 配置
- 代码格式化（Prettier 推荐）
- Git 提交规范

### 添加新功能

1. **创建分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发功能**

   - 编写代码
   - 添加类型定义
   - 更新相关文档

3. **编写测试**

   ```bash
   # 为新功能添加测试
   touch src/test/your-feature.test.ts
   ```

4. **运行测试和检查**

   ```bash
   pnpm test:run
   pnpm lint
   pnpm build
   ```

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

### 调试技巧

#### 调试 HOOPS Viewer

在浏览器控制台中访问 viewer 实例：

```javascript
// 在 SceneEditor.tsx 中已经暴露了全局 viewer
window.hwv_viewer.model.getNodeChildren(0);
```

#### 查看场景配置

```javascript
// 序列化当前场景
const config = await window.serializeCurrentScene();
console.log(JSON.stringify(config, null, 2));
```

### 性能优化建议

1. **大型场景** - 使用 LOD（细节层次）
2. **零件库** - 实现虚拟滚动
3. **场景加载** - 增加加载进度条
4. **3D 渲染** - 调整 HOOPS Viewer 渲染质量

## 📦 部署

### 构建生产版本

```bash
# 类型检查 + 构建
pnpm build
```

构建输出位于 `dist/` 目录。

### 部署到 Vercel

1. 安装 Vercel CLI：

   ```bash
   npm install -g vercel
   ```

2. 部署：

   ```bash
   vercel --prod
   ```

3. 配置环境变量：
   - 在 Vercel 项目设置中添加：
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_API_KEY`

### 部署到 Netlify

1. 连接 Git 仓库到 Netlify
2. 配置构建设置：
   - Build command: `pnpm build`
   - Publish directory: `dist`
3. 添加环境变量

### 预览生产构建

```bash
pnpm preview
```

本地预览地址：`http://localhost:4173`

## ⚠️ 注意事项与限制

### 当前限制

1. **用户认证** - 尚未实现用户登录和权限管理

   - 所有场景和零件目前是公开的
   - `user_id` 字段已预留，待实现

2. **HOOPS Viewer 许可** - 需要有效的 HOOPS Communicator 许可

   - 当前使用的是 Tech Soft 3D 的示例代码
   - 生产环境需要获取正式许可

3. **文件格式支持**

   - 完整支持：.scs（HOOPS 原生格式）
   - 部分支持：.step、.stl（需要转换）
   - 某些复杂模型可能加载失败

4. **浏览器兼容性**

   - 推荐：Chrome 90+、Edge 90+
   - 支持：Firefox 88+、Safari 14+
   - WebGL 2.0 是必需的

5. **性能考虑**
   - 大型场景（>50 个零件）可能影响性能
   - 建议将复杂零件拆分为子装配
   - 移动设备性能有限

### 安全考虑

1. **Row Level Security (RLS)** - 已启用但需要配置用户策略
2. **文件上传** - 需要添加更严格的文件类型验证
3. **API 密钥** - 不要将 `.env.local` 提交到 Git
4. **CORS 配置** - Supabase Storage 需要正确的 CORS 设置

### 最佳实践

- **场景命名** - 使用描述性名称，便于管理
- **零件组织** - 为零件添加详细描述和标签
- **定期备份** - 导出重要场景的 JSON 配置
- **性能监控** - 关注大型场景的加载时间
- **测试覆盖** - 添加新功能时编写测试用例

## 🔮 未来规划

### 近期计划（1-2 个月）

#### 功能增强

- [ ] **用户认证系统** - 集成 Supabase Auth

  - 用户注册和登录
  - 场景和零件的所有权管理
  - 团队协作功能

- [ ] **零件搜索和过滤** - 提升零件库体验

  - 按名称、标签搜索
  - 按类型、大小过滤
  - 收藏和最近使用

- [ ] **场景版本控制** - 保存场景历史
  - 自动保存草稿
  - 版本历史记录
  - 回退到历史版本

#### 编辑器增强

- [ ] **零件变换控制** - 更精确的编辑

  - 位置、旋转、缩放 UI 控件
  - 对齐和捕捉功能
  - 网格和参考线

- [ ] **装配约束** - 智能装配

  - 共面约束
  - 同轴约束
  - 距离约束

- [ ] **测量工具** - CAD 测量功能
  - 距离测量
  - 角度测量
  - 面积和体积计算

### 中期计划（3-6 个月）

#### 性能优化

- [ ] **虚拟化零件库** - 提升大型列表性能
- [ ] **场景预览缩略图** - 快速识别场景
- [ ] **增量加载** - 大型场景分块加载
- [ ] **Web Workers** - 后台处理序列化

#### 协作功能

- [ ] **多人实时协作** - 类似 Figma
- [ ] **评论和标注** - 场景批注系统
- [ ] **分享链接** - 公开场景预览
- [ ] **导出功能** - 导出为图片、PDF

#### 数据管理

- [ ] **场景模板** - 预设场景模板
- [ ] **零件分类和标签** - 更好的组织
- [ ] **批量操作** - 批量导入导出
- [ ] **回收站** - 软删除数据恢复

### 长期愿景（6 个月以上）

#### 高级功能

- [ ] **AI 辅助设计** - 智能推荐零件放置
- [ ] **自动装配** - 基于规则的自动装配
- [ ] **碰撞检测** - 实时碰撞检测
- [ ] **运动仿真** - 简单的动画和仿真

#### 集成和扩展

- [ ] **PLM 集成** - 与 PLM 系统集成
- [ ] **CAD 软件插件** - SolidWorks、AutoCAD 插件
- [ ] **API 开放** - RESTful API 和 SDK
- [ ] **移动应用** - iOS 和 Android 应用

#### 企业功能

- [ ] **权限管理** - 基于角色的访问控制
- [ ] **审计日志** - 操作历史追踪
- [ ] **SSO 集成** - 企业单点登录
- [ ] **私有部署** - 支持本地部署

## 📚 参考资料

### 官方文档

- **[HOOPS Communicator](https://docs.techsoft3d.com/communicator/latest/overview/overview.html)** - 3D 引擎官方文档
- **[Supabase 文档](https://supabase.com/docs)** - 后端服务文档
- **[React 文档](https://react.dev/)** - React 框架文档
- **[TypeScript 手册](https://www.typescriptlang.org/docs/)** - TypeScript 官方指南
- **[Vite 指南](https://vitejs.dev/)** - 构建工具文档
- **[Vitest 文档](https://vitest.dev/)** - 测试框架文档

### 相关资源

- **[Radix UI](https://www.radix-ui.com/)** - 无障碍 UI 组件库
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS 工具框架
- **[pnpm 文档](https://pnpm.io/)** - 包管理器文档

### 示例和教程

- **[assembly_creator](https://github.com/techsoft3d/assembly_creator)** - HOOPS 装配示例（本项目参考）
- **[Supabase 示例](https://github.com/supabase/supabase/tree/master/examples)** - 官方示例集合
- **[React Testing Library](https://testing-library.com/react)** - 测试最佳实践

### 项目文档

- **[README.md](./README.md)** - 英文版文档
- **[TESTING.md](./TESTING.md)** - 测试指南
- **[TEST_REPORT.md](./TEST_REPORT.md)** - 详细测试报告
- **[TEST_CASES.md](./TEST_CASES.md)** - 测试用例清单

## 🤝 贡献指南

### 如何贡献

我们欢迎所有形式的贡献！

1. **Fork 仓库**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

### 代码规范

- 遵循 ESLint 配置
- 编写清晰的提交信息
- 为新功能添加测试
- 更新相关文档

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链更新
```

### 报告问题

发现 bug 或有功能建议？请[创建 Issue](https://github.com/your-repo/issues)。

提供以下信息会很有帮助：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、操作系统）
- 截图或错误日志

## 📄 许可证

本项目为技术评估项目，用于演示目的。

相关技术和库的许可证：

- React - MIT License
- Supabase - Apache License 2.0
- HOOPS Communicator - 商业许可证（需获取）
- Radix UI - MIT License

## 🙏 致谢

### 技术支持

- **[Tech Soft 3D](https://www.techsoft3d.com/)** - 提供 HOOPS Communicator 3D 引擎
- **[Supabase](https://supabase.com/)** - 提供开源后端服务
- **[Vercel](https://vercel.com/)** - 提供构建工具和部署平台

### 开源社区

感谢所有开源贡献者，特别是：

- React 和 TypeScript 团队
- Vite 和 Vitest 团队
- Radix UI 和 Tailwind CSS 团队
- 所有依赖库的维护者

### 灵感来源

- **[assembly_creator](https://github.com/techsoft3d/assembly_creator)** - Tech Soft 3D 的装配示例
- **[Wikifactory CADRooms](https://github.com/wikifactory/cadrooms-interview)** - 原始面试题目

---

## 📞 联系方式

### 开发者

- **GitHub**: [@lvweipeng](https://github.com/greatInvoker)
- **Email**: 593597559@qq.com

### 项目链接

- **仓库**: [https://github.com/greatInvoker/take-home](https://github.com/your-username/take-home)
- **文档**: [English](./README.md) | [中文](./README-zh.md)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by [lvweipeng](https://github.com/greatInvoker/take-home)

---

**最后更新**: 2025-11-11
**版本**: 0.0.0
**状态**: 🚧 积极开发中

</div>
