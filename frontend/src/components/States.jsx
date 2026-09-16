import { Link } from 'react-router-dom';

export function LoadingState({ message = 'Загрузка…' }) {
  return (
    <div className="state-block" role="status">
      <p className="text-muted">{message}</p>
    </div>
  );
}

export function ErrorState({ title = 'Что-то пошло не так', message, onRetry }) {
  return (
    <div className="state-block" role="alert">
      <h2>{title}</h2>
      {message && <p className="text-muted">{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="state-block">
      <h2>{title}</h2>
      {message && <p className="text-muted">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
