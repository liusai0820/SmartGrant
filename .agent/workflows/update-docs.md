---
description: 更新分形文档结构 - 在代码变更后同步更新相关文档
---

# 分形文档更新工作流

> 基于《哥德尔、埃舍尔、巴赫》的自指理念，确保代码与文档的自蔓延同步。

## 触发条件

当你完成以下任何操作后，必须执行此工作流：
- 新增文件
- 删除文件
- 重命名文件
- 修改文件的依赖关系 (import/export)
- 修改文件的核心功能

## 更新步骤

### 1. 更新被修改文件的开头注释

确保文件开头包含：

```typescript
/**
 * @file 文件名
 * @input 依赖外部的什么
 * @output 对外提供什么
 * @pos 在系统局部的地位
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */
```

### 2. 更新所属文件夹的 `_ARCHITECTURE.md`

找到该文件所在目录的 `_ARCHITECTURE.md`，更新：
- 文件清单表格（如果新增/删除文件）
- 极简架构描述（如果职责变化）

### 3. 检查父目录是否需要更新

如果子目录的架构发生重大变化，检查父目录的 `_ARCHITECTURE.md` 是否需要同步更新。

### 4. 检查 README.md

如果变更涉及：
- 新增核心功能模块
- 技术栈变化
- 项目结构变化

则更新根目录 `README.md` 的相关章节。

## 示例：新增组件

假设你新增了 `src/components/NewFeature.tsx`：

1. **添加文件头注释**：
```typescript
/**
 * @file NewFeature.tsx
 * @input 相关 props 类型
 * @output NewFeature 组件
 * @pos 功能组件 - 描述其作用
 */
```

2. **更新 `src/components/_ARCHITECTURE.md`**：
在文件清单表格中添加新行。

3. **无需更新父目录**（组件新增通常不影响 src 级别架构）。

## 自动化提示

在 commit message 中使用以下格式来提醒自己：

```
feat(components): add NewFeature component

📚 Docs: Updated _ARCHITECTURE.md
```
