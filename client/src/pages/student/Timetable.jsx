import { useEffect, useState } from 'react';
import api from '../../api.js';
import TimetableGrid from '../../components/TimetableGrid.jsx';

export default function StudentTimetable() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/timetable')
      .then((r) => setEntries(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load timetable'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>My timetable</h1>
          <p>Your weekly class schedule with your teachers.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card card-pad">
        {entries.length === 0 ? (
          <div className="empty">
            <p>No timetable published yet.</p>
          </div>
        ) : (
          <TimetableGrid entries={entries} />
        )}
      </div>
    </>
  );
}
