# supabase/ 架构说明

> ⚠️ **自指声明**：一旦我所属的文件夹有所变化，请更新我。

## 极简架构（3行）
- **客户端封装** - client.ts (浏览器) + server.ts (服务端)
- **Schema 定义** - schema.sql 表结构 + schema-templates.sql 模板数据
- Supabase 是唯一的云端持久化层

---

## 文件清单

| 名称 | 地位 | 功能 |
|------|------|------|
| `client.ts` | 🌐 客户端 | 浏览器端 Supabase Client，用于前端数据操作 |
| `server.ts` | 🔧 服务端 | 服务端 Supabase Client，用于 API Routes |
| `schema.sql` | 📊 结构 | 数据库表结构 DDL，定义 projects、materials 等表 |
| `schema-templates.sql` | 📝 数据 | 评审模板初始数据，预置 Prompt 模板 |

---

## 使用模式

```typescript
// 前端组件中
import { supabase } from '@/lib/supabase/client';

// API Route 中
import { createServerSupabaseClient } from '@/lib/supabase/server';
```

---

*最后更新：2025-12-24*
