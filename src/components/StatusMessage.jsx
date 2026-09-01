function StatusMessage({ children, type = 'info' }) {
  return (
    <div className={`status-message status-${type}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default StatusMessage;
