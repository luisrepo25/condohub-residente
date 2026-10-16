import { createRoot, type Root } from 'react-dom/client';
import { App, type Contexto } from './App';

/** Contrato con el shell (frontends/shell/src/remotes/contrato.ts): mount(el, contexto) y unmount(el). */
const raices = new WeakMap<HTMLElement, Root>();

export function mount(el: HTMLElement, contexto: Contexto): void {
  const raiz = createRoot(el);
  raices.set(el, raiz);
  raiz.render(<App {...contexto} />);
}

export function unmount(el: HTMLElement): void {
  raices.get(el)?.unmount();
  raices.delete(el);
}