import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function NotFound() {
  useDocumentMeta('Page not found | neverupload', 'This page does not exist.', '');
  return (
    <div className="space-y-4 py-10 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-slate-600 dark:text-slate-400">That tool doesn’t exist (yet).</p>
      <Link to="/" className="btn-primary">
        See all tools
      </Link>
    </div>
  );
}
