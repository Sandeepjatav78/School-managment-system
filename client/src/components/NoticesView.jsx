import { useEffect, useState } from 'react';
import api from '../api.js';
import NoticeBoard from '../components/NoticeBoard.jsx';

export default function NoticesView() {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/notices/mine')
      .then((r) => setNotices(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load notices'));
  }, []);

  return (
    <>
      {error && <div className="error-banner">{error}</div>}
      <NoticeBoard notices={notices} />
    </>
  );
}
