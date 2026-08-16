import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import PrincipalDashboard from './pages/principal/Dashboard.jsx';
import PrincipalTeachers from './pages/principal/Teachers.jsx';
import PrincipalStudents from './pages/principal/Students.jsx';
import PrincipalClasses from './pages/principal/Classes.jsx';
import PrincipalSubjects from './pages/principal/Subjects.jsx';
import PrincipalTimetable from './pages/principal/Timetable.jsx';
import PrincipalFees from './pages/principal/Fees.jsx';
import PrincipalTeacherAttendance from './pages/principal/TeacherAttendance.jsx';
import PrincipalNotices from './pages/principal/Notices.jsx';
import PrincipalExams from './pages/principal/Exams.jsx';
import PrincipalResults from './pages/principal/Results.jsx';
import PrincipalHomework from './pages/principal/Homework.jsx';
import PrincipalSyllabus from './pages/principal/Syllabus.jsx';
import PrincipalAdmissions from './pages/principal/Admissions.jsx';
import PrincipalLibrary from './pages/principal/Library.jsx';
import PrincipalTransport from './pages/principal/Transport.jsx';
import PrincipalHostel from './pages/principal/Hostel.jsx';
import PrincipalPayroll from './pages/principal/Payroll.jsx';
import PrincipalEvents from './pages/principal/Events.jsx';
import PrincipalCertificates from './pages/principal/Certificates.jsx';
import PrincipalLeaves from './pages/principal/Leaves.jsx';
import PrincipalSettings from './pages/principal/Settings.jsx';
import TeacherDashboard from './pages/teacher/Dashboard.jsx';
import TeacherTimetable from './pages/teacher/Timetable.jsx';
import TeacherAttendance from './pages/teacher/Attendance.jsx';
import TeacherSubjects from './pages/teacher/Subjects.jsx';
import TeacherMyAttendance from './pages/teacher/MyAttendance.jsx';
import TeacherNotices from './pages/teacher/Notices.jsx';
import TeacherExams from './pages/teacher/Exams.jsx';
import TeacherResults from './pages/teacher/Results.jsx';
import TeacherHomework from './pages/teacher/Homework.jsx';
import TeacherSyllabus from './pages/teacher/Syllabus.jsx';
import TeacherLeaves from './pages/teacher/Leaves.jsx';
import StudentDashboard from './pages/student/Dashboard.jsx';
import StudentTimetable from './pages/student/Timetable.jsx';
import StudentAttendance from './pages/student/Attendance.jsx';
import StudentSubjects from './pages/student/Subjects.jsx';
import StudentFees from './pages/student/Fees.jsx';
import StudentMyDetails from './pages/student/MyDetails.jsx';
import StudentNotices from './pages/student/Notices.jsx';
import StudentExams from './pages/student/Exams.jsx';
import StudentHomework from './pages/student/Homework.jsx';
import StudentSyllabus from './pages/student/Syllabus.jsx';
import StudentTransport from './pages/student/Transport.jsx';
import StudentEvents from './pages/student/Events.jsx';
import StudentLeaves from './pages/student/Leaves.jsx';
import StudentCertificates from './pages/student/Certificates.jsx';
import ParentDashboard from './pages/parent/Dashboard.jsx';
import ParentTimetable from './pages/parent/Timetable.jsx';
import ParentAttendance from './pages/parent/Attendance.jsx';
import ParentFees from './pages/parent/Fees.jsx';
import ParentNotices from './pages/parent/Notices.jsx';
import ParentExams from './pages/parent/Exams.jsx';
import ParentHomework from './pages/parent/Homework.jsx';
import ParentTransport from './pages/parent/Transport.jsx';
import ParentLibrary from './pages/parent/Library.jsx';
import ParentLeaves from './pages/parent/Leaves.jsx';
import ParentEvents from './pages/parent/Events.jsx';

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/principal/dashboard"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/teachers"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalTeachers />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/students"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalStudents />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/classes"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalClasses />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/subjects"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalSubjects />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/timetable"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalTimetable />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/fees"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalFees />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/teacher-attendance"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalTeacherAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/notices"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalNotices />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/exams"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalExams />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/results"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalResults />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/homework"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalHomework />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/syllabus"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalSyllabus />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/admissions"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalAdmissions />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/library"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalLibrary />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/transport"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalTransport />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/hostel"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalHostel />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/payroll"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalPayroll />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/events"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalEvents />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/certificates"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalCertificates />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/leaves"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalLeaves />
            </RoleRoute>
          }
        />
        <Route
          path="/principal/settings"
          element={
            <RoleRoute roles={['principal']}>
              <PrincipalSettings />
            </RoleRoute>
          }
        />

        <Route
          path="/teacher/dashboard"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/timetable"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherTimetable />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/subjects"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherSubjects />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/my-attendance"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherMyAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/notices"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherNotices />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/exams"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherExams />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/results"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherResults />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/homework"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherHomework />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/syllabus"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherSyllabus />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/leaves"
          element={
            <RoleRoute roles={['teacher']}>
              <TeacherLeaves />
            </RoleRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <RoleRoute roles={['student']}>
              <StudentDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <RoleRoute roles={['student']}>
              <StudentTimetable />
            </RoleRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <RoleRoute roles={['student']}>
              <StudentAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/student/subjects"
          element={
            <RoleRoute roles={['student']}>
              <StudentSubjects />
            </RoleRoute>
          }
        />
        <Route
          path="/student/fees"
          element={
            <RoleRoute roles={['student']}>
              <StudentFees />
            </RoleRoute>
          }
        />
        <Route
          path="/student/my-details"
          element={
            <RoleRoute roles={['student']}>
              <StudentMyDetails />
            </RoleRoute>
          }
        />
        <Route
          path="/student/notices"
          element={
            <RoleRoute roles={['student']}>
              <StudentNotices />
            </RoleRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <RoleRoute roles={['student']}>
              <StudentExams />
            </RoleRoute>
          }
        />
        <Route
          path="/student/homework"
          element={
            <RoleRoute roles={['student']}>
              <StudentHomework />
            </RoleRoute>
          }
        />
        <Route
          path="/student/syllabus"
          element={
            <RoleRoute roles={['student']}>
              <StudentSyllabus />
            </RoleRoute>
          }
        />
        <Route
          path="/student/transport"
          element={
            <RoleRoute roles={['student']}>
              <StudentTransport />
            </RoleRoute>
          }
        />
        <Route
          path="/student/events"
          element={
            <RoleRoute roles={['student']}>
              <StudentEvents />
            </RoleRoute>
          }
        />
        <Route
          path="/student/leaves"
          element={
            <RoleRoute roles={['student']}>
              <StudentLeaves />
            </RoleRoute>
          }
        />
        <Route
          path="/student/certificates"
          element={
            <RoleRoute roles={['student']}>
              <StudentCertificates />
            </RoleRoute>
          }
        />

        <Route
          path="/parent/dashboard"
          element={
            <RoleRoute roles={['parent']}>
              <ParentDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/timetable"
          element={
            <RoleRoute roles={['parent']}>
              <ParentTimetable />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/attendance"
          element={
            <RoleRoute roles={['parent']}>
              <ParentAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/fees"
          element={
            <RoleRoute roles={['parent']}>
              <ParentFees />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/notices"
          element={
            <RoleRoute roles={['parent']}>
              <ParentNotices />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/exams"
          element={
            <RoleRoute roles={['parent']}>
              <ParentExams />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/homework"
          element={
            <RoleRoute roles={['parent']}>
              <ParentHomework />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/transport"
          element={
            <RoleRoute roles={['parent']}>
              <ParentTransport />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/library"
          element={
            <RoleRoute roles={['parent']}>
              <ParentLibrary />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/leaves"
          element={
            <RoleRoute roles={['parent']}>
              <ParentLeaves />
            </RoleRoute>
          }
        />
        <Route
          path="/parent/events"
          element={
            <RoleRoute roles={['parent']}>
              <ParentEvents />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
