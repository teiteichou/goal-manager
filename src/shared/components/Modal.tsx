import type { ReactNode } from "react";

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation">
      {children}
    </div>
  );
}
