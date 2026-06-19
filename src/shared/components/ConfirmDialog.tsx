export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="ghost" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className="primary" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
