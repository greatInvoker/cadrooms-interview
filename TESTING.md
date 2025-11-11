# 测试指南

本文档提供了项目测试的详细说明。

## 📦 测试框架

本项目使用以下测试工具：

- **Vitest 4.0.8** - 快速的单元测试框架
- **@testing-library/react 16.3.0** - React 组件测试
- **@testing-library/user-event 14.6.1** - 用户交互模拟
- **@vitest/coverage-v8 4.0.8** - 代码覆盖率工具
- **happy-dom 20.0.10** - 轻量级 DOM 环境

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
# 运行所有测试（watch 模式）
pnpm test

# 运行所有测试一次（CI 模式）
pnpm test:run

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 以 UI 模式运行测试
pnpm test:ui
```

## 📊 查看测试报告

### 1. 终端输出

运行 `pnpm test:run` 后会在终端显示测试结果：

```
✓ src/test/sceneSerializer.test.ts (15 tests) 16ms
✓ src/test/partsManager.test.ts (24 tests) 81ms
✓ src/test/integration/scene.test.ts (10 tests) 16ms
✓ src/test/ui.test.tsx (10 tests) 50ms

Test Files  4 passed (4)
Tests  59 passed (59)
```

### 2. 覆盖率报告

运行 `pnpm test:coverage` 后会生成覆盖率报告：

**终端输出：**

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   84.49 |       70 |   66.66 |    84.8 |
 components/ui     |     100 |      100 |     100 |     100 |
 lib               |     100 |      100 |     100 |     100 |
 services          |   83.73 |    66.66 |      60 |   84.03 |
-------------------|---------|----------|---------|---------|
```

**HTML 报告：**

```bash
# 在浏览器中打开详细覆盖率报告
open coverage/index.html
```

### 3. 测试文档

- **[TEST_REPORT.md](./TEST_REPORT.md)** - 完整的测试报告，包含分析和建议
- **[TEST_CASES.md](./TEST_CASES.md)** - 测试用例清单

## 📁 测试文件结构

```
src/test/
├── setup.ts                      # 测试环境配置
├── sceneSerializer.test.ts       # 场景序列化测试 (15个用例)
├── partsManager.test.ts          # 零件管理测试 (24个用例)
├── ui.test.tsx                   # UI组件测试 (10个用例)
└── integration/
    └── scene.test.ts             # 集成测试 (10个用例)
```

## 🧪 测试覆盖范围

### ✅ 已测试模块

#### 1. sceneSerializer.ts

- ✅ 场景序列化 (serializeScene)
- ✅ 场景反序列化 (deserializeScene)
- ✅ 变换矩阵处理
- ✅ 节点元数据管理
- ✅ 错误处理

#### 2. partsManager.ts

- ✅ CAD 文件上传 (.scs, .step, .stl)
- ✅ 图片上传
- ✅ 零件 CRUD 操作
- ✅ 文件验证（类型、大小）
- ✅ URL 生成
- ✅ 存储桶配置检查

#### 3. UI 组件

- ✅ Button 组件完整测试

#### 4. 集成测试

- ✅ 完整场景工作流
- ✅ 序列化/反序列化流程
- ✅ 大型场景处理（20 个零件）
- ✅ 错误恢复机制

### ⚠️ 待测试模块

- ❌ ScenesList 组件
- ❌ SceneEditor 组件
- ❌ PartsList 组件
- ❌ PartUploadDialog 组件
- ❌ Card, Input, Dialog 等 UI 组件

## 📈 测试统计

| 指标       | 数值   |
| ---------- | ------ |
| 测试文件   | 4      |
| 测试用例   | 59     |
| 通过率     | 100%   |
| 语句覆盖率 | 84.49% |
| 分支覆盖率 | 70%    |
| 函数覆盖率 | 66.66% |
| 行覆盖率   | 84.8%  |

## 🔧 测试配置

测试配置文件：`vitest.config.ts`

```typescript
export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
		},
		include: ["src/test/**/*.{test,spec}.{js,ts,jsx,tsx}"],
	},
});
```

## 📝 编写新测试

### 单元测试示例

```typescript
import { describe, it, expect, vi } from "vitest";
import { yourFunction } from "@/path/to/module";

describe("yourFunction", () => {
	it("should do something", () => {
		const result = yourFunction("input");
		expect(result).toBe("expected output");
	});
});
```

### React 组件测试示例

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YourComponent } from "@/components/YourComponent";

describe("YourComponent", () => {
	it("should render correctly", () => {
		render(<YourComponent />);
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});

	it("should handle user interactions", async () => {
		const user = userEvent.setup();
		render(<YourComponent />);

		await user.click(screen.getByRole("button"));
		expect(screen.getByText("Clicked")).toBeInTheDocument();
	});
});
```

## 🎯 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## 🐛 调试测试

### 使用 UI 模式

```bash
pnpm test:ui
```

这将打开一个交互式界面，可以：

- 查看测试结果
- 重新运行特定测试
- 查看覆盖率
- 调试失败的测试

### 运行单个测试文件

```bash
pnpm vitest src/test/sceneSerializer.test.ts
```

### 运行特定测试用例

```typescript
// 使用 .only
it.only("should test this specific case", () => {
	// ...
});
```

## 📚 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/react)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ❓ 常见问题

### Q: 测试运行很慢怎么办？

A: 使用 `--no-coverage` 跳过覆盖率计算：

```bash
pnpm vitest --no-coverage
```

### Q: 如何 Mock 模块？

A: 使用 `vi.mock()`：

```typescript
vi.mock("@/lib/supabase", () => ({
	supabase: {
		from: vi.fn(),
	},
}));
```

### Q: 如何测试异步代码？

A: 使用 `async/await`：

```typescript
it("should handle async operations", async () => {
	const result = await asyncFunction();
	expect(result).toBe("expected");
});
```

---

**维护者**: lvweipeng
**最后更新**: 2025-11-11
