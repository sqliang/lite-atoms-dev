/**
 * Stable-repository file tree model.
 *
 * The API exposes the stable version as a flat list of repository-relative paths; the
 * workbench explorer needs a nested tree plus per-file editor metadata. Paths are the
 * single identity source: a node id equals its full path so editor tabs survive tree
 * rebuilds after a new stable version is promoted.
 */
import type { FileNode, TabType } from '@/context/WorkspaceContext';

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  css: 'css',
  json: 'json',
  html: 'html',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  svg: 'xml',
};

/** Map a repository path to the viewer used by the editor area. */
export function fileTypeForPath(path: string): TabType {
  return /\.md$/i.test(path) ? 'document' : 'code';
}

/** Map a repository path to a highlight.js language id, when known. */
export function languageForPath(path: string): string | undefined {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGE_BY_EXTENSION[extension];
}

/** Convert flat stable file paths into the nested explorer structure, folders first. */
export function buildFileTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];
  for (const path of [...paths].sort()) {
    const segments = path.split('/');
    let siblings = root;
    segments.forEach((name, index) => {
      const isFile = index === segments.length - 1;
      const nodePath = segments.slice(0, index + 1).join('/');
      let node = siblings.find((candidate) => candidate.name === name && (candidate.type === 'folder') !== isFile);
      if (!node) {
        node = isFile
          ? { id: nodePath, name, type: 'file', path: nodePath, fileType: fileTypeForPath(nodePath), language: languageForPath(nodePath) }
          : { id: nodePath, name, type: 'folder', children: [] };
        siblings.push(node);
      }
      if (!isFile) siblings = node.children ?? [];
    });
  }
  const sortLevel = (nodes: FileNode[]): FileNode[] =>
    nodes
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
      .map((node) => (node.children ? { ...node, children: sortLevel(node.children) } : node));
  return sortLevel(root);
}

/** Collect every file path in a tree, for whole-project ZIP export. */
export function collectFilePaths(nodes: FileNode[]): string[] {
  return nodes.flatMap((node) => (node.type === 'file' && node.path ? [node.path] : collectFilePaths(node.children ?? [])));
}
