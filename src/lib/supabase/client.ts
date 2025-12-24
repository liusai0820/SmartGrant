/**
 * @file client.ts
 * @input 环境变量 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * @output supabase (浏览器端客户端), isSupabaseConfigured (配置状态)
 * @pos 客户端层 - 提供浏览器端 Supabase 实例
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 检查是否有有效的 Supabase 配置
const hasValidConfig = supabaseUrl && supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your_supabase');

// 客户端 Supabase 实例 (用于浏览器端)
export const supabase = hasValidConfig
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null as any; // 如果没有配置，返回 null

export const isSupabaseConfigured = hasValidConfig;
