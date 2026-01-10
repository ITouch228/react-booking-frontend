import { memo } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';

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
