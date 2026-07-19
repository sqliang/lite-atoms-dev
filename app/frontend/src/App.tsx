/**
 * @file App.tsx
 * @description 应用根组件 - 路由配置与全局 Provider 层
 *
 * 该文件定义了整个应用的组件树结构和路由映射：
 *
 * Provider 层级（从外到内）：
 * 1. QueryClientProvider - React Query 数据缓存
 * 2. TooltipProvider - 全局 Tooltip 支持
 * 3. BrowserRouter - 客户端路由
 * 4. AuthProvider - 认证状态管理
 *
 * 路由结构：
 * - /login          → 登录/注册页（公开）
 * - /auth/callback  → OAuth 回调处理（公开）
 * - /auth/error     → 认证错误页（公开）
 * - /               → 首页/项目列表（需认证）
 * - /project/:id    → 工作台页面（需认证）
 */

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from './pages/Index';
import Workspace from './pages/Workspace';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
// MODULE_IMPORTS_START
// MODULE_IMPORTS_END

/** React Query 客户端实例，用于管理服务端状态缓存 */
const queryClient = new QueryClient();

/**
 * 路由配置组件
 * 将 URL 路径映射到对应的页面组件
 * 需要认证的路由使用 ProtectedRoute 包裹
 */
const AppRoutes = () => (
  <Routes>
    {/* 公开路由 - 无需认证 */}
    <Route path="/login" element={<Login />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />

    {/* 受保护路由 - 需要用户登录 */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/project/:sessionId"
      element={
        <ProtectedRoute>
          <Workspace />
        </ProtectedRoute>
      }
    />
    {/* MODULE_ROUTES_START */}
    {/* MODULE_ROUTES_END */}
  </Routes>
);

/**
 * 应用根组件
 * 组装所有全局 Provider 和路由系统
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* MODULE_PROVIDERS_START */}
    {/* MODULE_PROVIDERS_END */}
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    {/* MODULE_PROVIDERS_CLOSE */}
  </QueryClientProvider>
);

export default App;
export { AppRoutes };