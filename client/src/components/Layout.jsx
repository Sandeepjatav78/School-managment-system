import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CalendarClock,
  UserRound,
  HeartHandshake,
  LogOut,
  Wallet,
  UserCheck,
  Megaphone,
  Contact,
  FileSpreadsheet,
  BookOpenCheck,
  BookMarked,
  FilePlus2,
  Library,
  Bus,
  BedDouble,
  Banknote,
  PartyPopper,
  Award,
  Inbox,
  Settings2,
} from 'lucide-react';

const NAV = {
  principal: [
    { label: 'Overview', items: [{ to: '/principal/dashboard', icon: LayoutDashboard, title: 'Dashboard' }] },
    {
      label: 'Management',
      items: [
        { to: '/principal/teachers', icon: Users, title: 'Teachers' },
        { to: '/principal/students', icon: GraduationCap, title: 'Students' },
        { to: '/principal/classes', icon: School, title: 'Classes' },
        { to: '/principal/subjects', icon: BookOpen, title: 'Subjects' },
        { to: '/principal/teacher-attendance', icon: UserCheck, title: 'Teacher Attendance' },
      ],
    },
    {
      label: 'Scheduling',
      items: [
        { to: '/principal/timetable', icon: CalendarClock, title: 'Timetable' },
        { to: '/principal/exams', icon: FileSpreadsheet, title: 'Exams', feature: 'exams' },
        { to: '/principal/results', icon: ClipboardCheck, title: 'Results & Marks', feature: 'exams' },
        { to: '/principal/homework', icon: BookOpenCheck, title: 'Homework', feature: 'homework' },
        { to: '/principal/syllabus', icon: BookMarked, title: 'Syllabus', feature: 'syllabus' },
        { to: '/principal/events', icon: PartyPopper, title: 'Events', feature: 'events' },
      ],
    },
    {
      label: 'Admissions',
      items: [{ to: '/principal/admissions', icon: FilePlus2, title: 'Admissions', feature: 'admissions' }],
    },
    {
      label: 'Operations',
      items: [
        { to: '/principal/library', icon: Library, title: 'Library', feature: 'library' },
        { to: '/principal/transport', icon: Bus, title: 'Transport', feature: 'transport' },
        { to: '/principal/hostel', icon: BedDouble, title: 'Hostel', feature: 'hostel' },
        { to: '/principal/payroll', icon: Banknote, title: 'Payroll', feature: 'payroll' },
        { to: '/principal/certificates', icon: Award, title: 'Certificates', feature: 'certificates' },
      ],
    },
    {
      label: 'Finance',
      items: [{ to: '/principal/fees', icon: Wallet, title: 'Fees' }],
    },
    {
      label: 'People',
      items: [{ to: '/principal/leaves', icon: Inbox, title: 'Leaves', feature: 'leaves' }],
    },
    {
      label: 'Communication',
      items: [
        { to: '/principal/notices', icon: Megaphone, title: 'Notices' },
        { to: '/principal/settings', icon: Settings2, title: 'School Settings' },
      ],
    },
  ],
  teacher: [
    { label: 'Overview', items: [{ to: '/teacher/dashboard', icon: LayoutDashboard, title: 'Dashboard' }] },
    {
      label: 'My Work',
      items: [
        { to: '/teacher/timetable', icon: CalendarDays, title: 'My Timetable' },
        { to: '/teacher/attendance', icon: ClipboardCheck, title: 'Mark Attendance' },
        { to: '/teacher/subjects', icon: BookOpen, title: 'My Subjects' },
        { to: '/teacher/my-attendance', icon: UserCheck, title: 'My Attendance' },
        { to: '/teacher/exams', icon: FileSpreadsheet, title: 'Exam Schedule', feature: 'exams' },
        { to: '/teacher/results', icon: ClipboardCheck, title: 'Marks Entry', feature: 'exams' },
        { to: '/teacher/homework', icon: BookOpenCheck, title: 'Homework', feature: 'homework' },
        { to: '/teacher/syllabus', icon: BookMarked, title: 'Syllabus', feature: 'syllabus' },
        { to: '/teacher/leaves', icon: Inbox, title: 'My Leaves', feature: 'leaves' },
      ],
    },
    {
      label: 'School',
      items: [{ to: '/teacher/notices', icon: Megaphone, title: 'Notices' }],
    },
  ],
  student: [
    { label: 'Overview', items: [{ to: '/student/dashboard', icon: LayoutDashboard, title: 'Dashboard' }] },
    {
      label: 'My Studies',
      items: [
        { to: '/student/timetable', icon: CalendarDays, title: 'Timetable' },
        { to: '/student/attendance', icon: ClipboardCheck, title: 'Attendance' },
        { to: '/student/subjects', icon: BookOpen, title: 'Subjects' },
        { to: '/student/exams', icon: FileSpreadsheet, title: 'Exams & Results', feature: 'exams' },
        { to: '/student/homework', icon: BookOpenCheck, title: 'Homework', feature: 'homework' },
        { to: '/student/syllabus', icon: BookMarked, title: 'Syllabus', feature: 'syllabus' },
        { to: '/student/fees', icon: Wallet, title: 'Fees' },
        { to: '/student/my-details', icon: Contact, title: 'My Details' },
      ],
    },
    {
      label: 'School',
      items: [
        { to: '/student/transport', icon: Bus, title: 'Transport', feature: 'transport' },
        { to: '/student/events', icon: PartyPopper, title: 'Events', feature: 'events' },
        { to: '/student/leaves', icon: Inbox, title: 'Leave', feature: 'leaves' },
        { to: '/student/certificates', icon: Award, title: 'Certificates', feature: 'certificates' },
        { to: '/student/notices', icon: Megaphone, title: 'Notices' },
      ],
    },
  ],
  parent: [
    { label: 'Overview', items: [{ to: '/parent/dashboard', icon: HeartHandshake, title: 'My Children' }] },
    {
      label: 'School',
      items: [
        { to: '/parent/timetable', icon: CalendarDays, title: 'Timetable' },
        { to: '/parent/attendance', icon: ClipboardCheck, title: 'Attendance' },
        { to: '/parent/exams', icon: FileSpreadsheet, title: 'Exams & Results', feature: 'exams' },
        { to: '/parent/homework', icon: BookOpenCheck, title: 'Homework', feature: 'homework' },
        { to: '/parent/fees', icon: Wallet, title: 'Fees' },
        { to: '/parent/transport', icon: Bus, title: 'Transport', feature: 'transport' },
        { to: '/parent/library', icon: Library, title: 'Library', feature: 'library' },
        { to: '/parent/leaves', icon: Inbox, title: 'Leave', feature: 'leaves' },
        { to: '/parent/events', icon: PartyPopper, title: 'Events', feature: 'events' },
        { to: '/parent/notices', icon: Megaphone, title: 'Notices' },
      ],
    },
  ],
};

const TITLES = {
  '/principal/dashboard': ['Principal Dashboard', 'School overview and daily activity'],
  '/principal/teachers': ['Teachers', 'Manage teaching staff and their subjects'],
  '/principal/students': ['Students', 'Manage student records and enrollment'],
  '/principal/classes': ['Classes', 'Organize classes and class teachers'],
  '/principal/subjects': ['Subjects', 'Subject catalogue offered by the school'],
  '/principal/timetable': ['Timetable', 'Build and manage weekly schedules'],
  '/principal/teacher-attendance': ['Teacher Attendance', 'Mark and review staff attendance'],
  '/principal/fees': ['Fees', 'Track and manage fee payments'],
  '/principal/notices': ['Notices', 'Publish and target announcements'],
  '/principal/exams': ['Exams', 'Schedule exams and hall tickets'],
  '/principal/results': ['Results & Marks', 'Marks entry, report cards and rankings'],
  '/principal/homework': ['Homework', 'Assign homework to any class'],
  '/principal/syllabus': ['Syllabus', 'Chapter-wise lesson plans'],
  '/principal/admissions': ['Admissions', 'Enquiries, applications and seats'],
  '/principal/library': ['Library', 'Catalogue, issues and returns'],
  '/principal/transport': ['Transport', 'Vehicles, routes and assignments'],
  '/principal/hostel': ['Hostel', 'Rooms and bed allotments'],
  '/principal/payroll': ['Payroll', 'Salaries and payslips'],
  '/principal/certificates': ['Certificates', 'Issue and print certificates'],
  '/principal/leaves': ['Leaves', 'Approve staff and student leave'],
  '/principal/events': ['Events', 'School calendar and holidays'],
  '/principal/settings': ['School Settings', 'Profile and enabled facilities'],
  '/teacher/dashboard': ['My Dashboard', 'Your day at a glance'],
  '/teacher/timetable': ['My Timetable', 'Your weekly teaching schedule'],
  '/teacher/attendance': ['Mark Attendance', 'Take attendance for your classes'],
  '/teacher/subjects': ['My Subjects', 'Subjects you teach and their classes'],
  '/teacher/my-attendance': ['My Attendance', 'Your attendance record at school'],
  '/teacher/notices': ['Notices', 'Announcements from the school office'],
  '/teacher/exams': ['Exam Schedule', 'Upcoming examinations'],
  '/teacher/results': ['Marks Entry', 'Enter marks for subjects you teach'],
  '/teacher/homework': ['Homework', 'Assign work and review submissions'],
  '/teacher/syllabus': ['Syllabus', 'Manage chapters for your subjects'],
  '/teacher/leaves': ['My Leaves', 'Apply for leave and track approval'],
  '/student/dashboard': ['My Dashboard', 'Your day at a glance'],
  '/student/timetable': ['My Timetable', 'Your weekly class schedule'],
  '/student/attendance': ['My Attendance', 'Your attendance record'],
  '/student/subjects': ['My Subjects', 'Subjects in your class this year'],
  '/student/fees': ['My Fees', 'Your fee record'],
  '/student/my-details': ['My Details', 'Your information on file with the school'],
  '/student/notices': ['Notices', 'Announcements for students'],
  '/student/exams': ['Exams & Results', 'Hall tickets, marks and report cards'],
  '/student/homework': ['Homework', 'Pending work and submissions'],
  '/student/syllabus': ['Syllabus', 'What you will study this year'],
  '/student/transport': ['Transport', 'Your bus route and stop'],
  '/student/events': ['Events', 'School functions and holidays'],
  '/student/leaves': ['Leave', 'Apply for leave from school'],
  '/student/certificates': ['Certificates', 'Your issued certificates'],
  '/parent/dashboard': ['My Children', 'Overview of your children at school'],
  '/parent/timetable': ['Timetable', 'Your child’s weekly schedule'],
  '/parent/attendance': ['Attendance', 'Your child’s attendance record'],
  '/parent/fees': ['Fees', 'Your child’s fee record'],
  '/parent/notices': ['Notices', 'Announcements for parents'],
  '/parent/exams': ['Exams & Results', 'Your child’s results'],
  '/parent/homework': ['Homework', 'Your child’s homework'],
  '/parent/transport': ['Transport', 'Your child’s bus details'],
  '/parent/library': ['Library', 'Your child’s library records'],
  '/parent/leaves': ['Leave', 'Apply leave for your child'],
  '/parent/events': ['Events', 'School calendar and holidays'],
  '/profile': ['Profile', 'Your account information'],
};

const ROLE_LABEL = { principal: 'Principal', teacher: 'Teacher', student: 'Student', parent: 'Parent' };

export default function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const features = user.features || {};
  const nav = (NAV[user.role] || [])
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.feature || features[item.feature]),
    }))
    .filter((group) => group.items.length > 0);
  const home = `/${user.role}/dashboard`;
  const { pathname } = window.location;
  const title = TITLES[pathname] || [ROLE_LABEL[user.role], ''];

  const enabledRoutes = nav.flatMap((g) => g.items.map((i) => i.to));
  if (pathname !== home && !enabledRoutes.includes(pathname) && pathname !== '/profile') {
    return <Navigate to={home} replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">Athena School</div>
            <div className="brand-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((group, i) => (
            <div key={i}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <item.icon />
                  {item.title}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">
            {user.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{ROLE_LABEL[user.role]}</div>
          </div>
          <button className="icon-btn" onClick={logout} title="Sign out" style={{ borderRadius: 999 }}>
            <LogOut />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            {title[0]}
            <small>{title[1]}</small>
          </div>
          <div className="topbar-right">
            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="user-chip">
                <div className="avatar sm">
                  {user.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="who">
                  <strong>{user.name}</strong>
                  <span className={`role-badge ${user.role[0]}`}>{ROLE_LABEL[user.role]}</span>
                </div>
              </div>
            </Link>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}