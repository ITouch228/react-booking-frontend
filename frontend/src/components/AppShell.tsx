import { memo } from 'react';
import { ToastContainer } from 'react-toastify';
import Header from './Header';
import Footer from './Footer';

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell = memo(function AppShell({ children }: AppShellProps) {
  return (
    <div className='app'>
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
