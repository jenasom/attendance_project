import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/auth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['ADMIN', 'TEACHER']
    },
    {
      path: '/courses',
      icon: 'fas fa-book',
      label: 'Courses',
      roles: ['ADMIN', 'TEACHER']
    },
    {
      path: '/students',
      icon: 'fas fa-users',
      label: 'Students',
      roles: ['ADMIN', 'TEACHER']
    },
    {
      path: '/attendance/mark',
      icon: 'fas fa-fingerprint',
      label: 'Mark Attendance',
      roles: ['ADMIN', 'TEACHER']
    },
    {
      path: '/attendance/report',
      icon: 'fas fa-chart-bar',
      label: 'Reports',
      roles: ['ADMIN', 'TEACHER']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'TEACHER')
  );

  return (
    <nav className="sidebar bg-light">
      <div className="sidebar-sticky">
        <ul className="nav flex-column">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                className={`nav-link ${isActive(item.path)}`}
                to={item.path}
              >
                <i className={`${item.icon} me-2`}></i>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
