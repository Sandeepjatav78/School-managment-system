import { useEffect, useState } from 'react';
import api from '../../api.js';
import AttendanceHistory from '../../components/AttendanceHistory.jsx';

export default function StudentAttendance() {
  const [data, setData] = useState({ records: [], summary: null });
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/attendance')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load attendance'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My attendance</h1>
          <p>Your record, subject by subject.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <AttendanceHistory records={data.records} summary={data.summary} />
    </>
  );
}
