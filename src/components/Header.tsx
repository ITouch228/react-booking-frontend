import { memo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { cx } from '../utils/utils';
import useAuth from '../hooks/useAuth';

const nav = [
  { to: '/', label: 'Главная', icon: 'fa-house' },
  { to: '/booking', label: 'Бронирование', icon: 'fa-calendar-check' },
  { to: '/profile', label: 'Профиль', icon: 'fa-user' },
];

const Header = memo(function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className='app-header' role='banner'>
      <div className='container'>
        <div className='header-inner'>
          <Link className='brand' to='/'>
            <span className='brand-mark' aria-hidden='true'>
              B
            </span>
            <span className='brand-title'>
              <strong>ITouch-Pet-Project</strong>
              <span>Vite · React · TS</span>
            </span>
          </Link>

          <nav className='nav' aria-label='Навигация'>
            {nav.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                <i className={cx('fa-solid', item.icon)} aria-hidden='true'></i>{' '}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className='header-actions'>
            {!user ? (
              <span className='pill' title='Войти'>
                <NavLink to={'/login'}>
                  <i className={'fa-solid fa-door-open'} aria-hidden='true'></i>{' '}
                  <span>Войти</span>
                </NavLink>
              </span>
            ) : (
              <span
                className='pill'
                title='Выйти'
                style={{ cursor: 'pointer' }}
              >
                <div
                  onClick={() => {
                    navigate('/');
                    logout();
                  }}
                >
                  <i className={'fa-solid fa-door-open'} aria-hidden='true'></i>{' '}
                  <span>Выйти</span>
                </div>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;
