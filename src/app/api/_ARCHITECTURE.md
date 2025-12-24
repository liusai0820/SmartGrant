# api/ 架构说明

> ⚠️ **自指声明**：一旦我所属的文件夹有所变化，请更新我。

## 极简架构（3行）
- **核心评审** - `/review` 多 Agent 协同评审，`/chat` AI 对话
- **数据处理** - `/upload` 文件解析，`/extract-metadata` 元数据提取
- **输出服务** - `/export` Word 导出，`/expert` 专家遴选

---

## 子目录清单

| 名称 | 路由 | 功能 |
|------|------|------|
| `review/` | POST `/api/review` | 核心评审接口，调用多 Agent 返回评审意见 |
| `chat/` | POST `/api/chat` | AI 对话接口，基于项目上下文智能问答 |
| `upload/` | POST `/api/upload` | 文件上传，解析 PDF/Word 提取文本 |
| `extract-metadata/` | POST `/api/extract-metadata` | AI 元数据提取，自动识别项目信息 |
| `export/` | POST `/api/export` | Word 公文导出，生成 GB/T 9704 格式 |
| `expert/` | POST `/api/expert` | 专家遴选，根据技术领域匹配专家库 |

---

## 请求流向

```
用户上传文件
    │
    ▼
/api/upload ──▶ 解析文件内容
    │
    ▼
/api/extract-metadata ──▶ AI 提取项目信息
    │
    ▼
/api/review ──▶ 多 Agent 评审
    │
    ├──▶ /api/expert ──▶ 专家遴选
    ├──▶ /api/chat ──▶ AI 问答
    └──▶ /api/export ──▶ Word 导出
```

---

*最后更新：2025-12-24*
