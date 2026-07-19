/**
 * @file supabase.ts
 * @description Supabase 客户端初始化配置
 *
 * 该文件负责创建并导出 Supabase 客户端实例，用于整个应用中的：
 * - 用户认证（登录、注册、登出）
 * - 数据库 CRUD 操作（项目表等）
 * - 实时订阅（未来扩展）
 *
 * 使用 Supabase 匿名密钥（anon key）进行客户端初始化，
 * 所有敏感操作通过 Row Level Security (RLS) 策略在服务端保护。
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 项目 URL
 * 用于标识 Supabase 后端实例的唯一地址
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * Supabase 匿名公钥（Anon Key）
 * 此密钥可安全暴露在客户端，所有数据访问权限由 RLS 策略控制
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured');
}

/**
 * 全局 Supabase 客户端实例
 * 在整个应用中通过此实例与 Supabase 后端交互
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
