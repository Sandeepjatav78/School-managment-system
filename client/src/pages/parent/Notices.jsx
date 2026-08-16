import NoticesView from '../../components/NoticesView.jsx';

export default function ParentNotices() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notices</h1>
          <p>Announcements for parents.</p>
        </div>
      </div>
      <NoticesView />
    </>
  );
}
