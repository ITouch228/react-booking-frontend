import { memo } from 'react';

const Footer = memo(function Footer() {
  return (
    <footer className='app-footer'>
      <div className='container'>
        <div>© {new Date().getFullYear()} ITouch-Pet-Project</div>
      </div>
    </footer>
  );
});

export default Footer;
