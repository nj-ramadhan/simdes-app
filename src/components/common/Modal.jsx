export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close" aria-label="Tutup">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
