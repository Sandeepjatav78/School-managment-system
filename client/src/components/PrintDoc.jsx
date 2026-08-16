import { X, Printer } from 'lucide-react';

export default function PrintDoc({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay print-overlay">
      <div className="modal print-modal">
        <div className="modal-head no-print">
          <h3>{title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={13} /> Print
            </button>
            <button className="icon-btn" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>
        <div className="modal-body print-body">{children}</div>
        {footer && <div className="modal-foot no-print">{footer}</div>}
      </div>
    </div>
  );
}