import type { AppState } from "../types/state";

// Немає по-записового злиття (розділ "Що переноситься" плану синхронізації) —
// для одного акаунта на кількох власних пристроях весь стан цілком віддається
// тому, хто записав його пізніше. Рівні мітки — лишаємось на локальному, щоб
// не переписувати без потреби.
export function pickNewer(local: AppState, remote: AppState): AppState {
  const localTime = local.meta?.updatedAt ?? 0;
  const remoteTime = remote.meta?.updatedAt ?? 0;
  return remoteTime > localTime ? remote : local;
}
