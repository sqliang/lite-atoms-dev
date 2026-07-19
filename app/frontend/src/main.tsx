import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
/** The workbench has a single React entry point; it does not prerender blog routes. */
createRoot(document.getElementById('root')!).render(<App />);
