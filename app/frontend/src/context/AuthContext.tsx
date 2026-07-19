/**
 * @file AuthContext.tsx
 * @description 认证上下文提供者
 *
 * 该模块实现了基于 Supabase Auth 的全局认证状态管理，提供：
 * - 用户登录状态的实时监听与同步
 * - 登录（signIn）、注册（signUp）、登出（signOut）方法
 * - Session 和 User 对象的全局访问
 *
 * 核心数据流：
 * 1. 应用启动时通过 getSession() 获取持久化的会话
 * 2. 通过 onAuthStateChange 监听器实时响应认证状态变化
 * 3. 子组件通过 useAuth() hook 消费认证状态
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * 认证上下文类型定义
 * @property user - 当前登录用户对象，未登录时为 null
 * @property session - 当前会话对象，包含 access_token 等信息
 * @property loading - 初始化加载状态，用于防止页面闪烁
 * @property signIn - 邮箱密码登录方法
 * @property signUp - 邮箱密码注册方法
 * @property signOut - 登出方法，清除本地会话
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件
 * 包裹应用根组件，为所有子组件提供认证状态和方法
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  /** loading 为 true 时表示正在获取初始会话，此时不应渲染需要认证的内容 */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * 初始化认证状态
     * 从 Supabase 获取当前持久化的 session（存储在 localStorage 中）
     */
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    /**
     * 监听认证状态变化
     * 当用户登录、登出、token 刷新时自动触发
     * 事件类型包括：SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED 等
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // 组件卸载时取消订阅，防止内存泄漏
    return () => subscription.unsubscribe();
  }, []);

  /**
   * 邮箱密码登录
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @returns 包含错误信息的对象，成功时 error 为 null
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  /**
   * 邮箱密码注册
   * 注册成功后会发送确认邮件到用户邮箱
   * @param email - 用户邮箱
   * @param password - 用户密码（至少 6 位）
   * @returns 包含错误信息的对象，成功时 error 为 null
   */
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  /**
   * 用户登出
   * 清除本地 session 并通知 Supabase 服务端使 token 失效
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 认证状态 Hook
 * 在组件中使用此 hook 获取当前用户信息和认证方法
 *
 * @example
 * const { user, signOut } = useAuth();
 * if (user) console.log('已登录:', user.email);
 *
 * @throws 如果在 AuthProvider 外部使用会抛出错误
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}