import NoticesView from '../../components/NoticesView.jsx';

export default function StudentNotices() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notices</h1>
          <p>Announcements for students.</p>
        </div>
      </div>
      <NoticesView />
    </>
  );
}
