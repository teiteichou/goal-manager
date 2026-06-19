export type SyncState = "waiting" | "local" | "synced";

export function resolveSyncState(saved: boolean): SyncState {
  return saved ? "synced" : "local";
}
