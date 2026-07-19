/**
 * @file Workspace.tsx
 * @description 工作台页面路由壳
 *
 * 路由：/project/:sessionId
 * sessionId 对应项目的 UUID 主键。页面本身保持轻量，
 * 数据获取、SSE 订阅与分屏布局均组装在 features/workspace/ui/WorkspaceScreen 中。
 */

import { useParams } from 'react-router-dom';
import { WorkspaceScreen } from '@/features/workspace/ui/WorkspaceScreen';

export default function WorkspacePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  if (!sessionId) return null;
  return <WorkspaceScreen projectId={sessionId} />;
}
