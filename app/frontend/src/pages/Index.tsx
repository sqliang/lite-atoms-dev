import { Navigate } from 'react-router-dom';

/**
 * Index page redirects to a default demo project session.
 * TODO: In production, show HomePage for new users or redirect to last active session.
 */
export default function Index() {
  return <Navigate to="/project/session-1720000000000-abc123" replace />;
}