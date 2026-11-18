import {createRoot, type Root} from 'react-dom/client';
import type {ReactNode} from 'react';

// Vite may re-evaluate the entry module without replacing the DOM container.
// Keep ownership on that container, rather than in the replaceable module scope.
const rootKey = Symbol.for('uab-grant-budget-workspace.react-root');
type RootContainer = HTMLElement & {[rootKey]?: Root};
export function renderWorkspace(container: HTMLElement, content: ReactNode): Root {
  const owned = container as RootContainer;
  const root = owned[rootKey] ?? (owned[rootKey] = createRoot(container));
  root.render(content);
  return root;
}
