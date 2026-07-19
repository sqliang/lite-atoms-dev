/**
 * @file ProtectedRoute.tsx
 * @description 路由守卫组件
 *
 * 用于保护需要认证才能访问的页面路由。
 * 工作机制：
 * 1. 检查认证加载状态 → 显示 loading 动画
 * 2. 检查用户是否已登录 → 未登录则重定向到登录页
 * 3. 已登录 → 渲染子组件（受保护的页面内容）
 *
 * @example
 * <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // 认证状态尚未确定时显示加载动画，防止页面闪烁
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // 用户未登录，重定向到登录页面
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 用户已认证，渲染受保护的子组件
  return <>{children}</>;
}