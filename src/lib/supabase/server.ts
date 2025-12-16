import { createClient } from '@supabase/supabase-js';

// 服务端 Supabase 实例 (用于 Server Actions / API Routes)
// 使用 Service Role Key，拥有完整权限
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
