import { useEffect, useState } from 'react';
import api from '../../api.js';
import FeeRecords from '../../components/FeeRecords.jsx';

export default function StudentFees() {
  const [data, setData] = useState({ records: [], summary: null });
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/fees/student/mine')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load fees'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My fees</h1>
          <p>Your fee record, month by month.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <FeeRecords records={data.records} summary={data.summary} />
    </>
  );
}
