import { memo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import Snowfall from 'react-snowfall';

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell = memo(function AppShell({ children }: AppShellProps) {
  return (
    <div className='app'>
      <Snowfall
        color='#d0d0d0ff'
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
        }}
      />
      <ToastContainer />
      <Header />
      <main id='main' className='app-main'>
        <div className='container'>{children}</div>
      </main>
      <Footer />
    </div>
  );
});

export default AppShell;
