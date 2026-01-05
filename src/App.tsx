import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/authContext.ts';
import AppWithRouter from './components/AppWithRouter.tsx';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppWithRouter />
      </HashRouter>
    </AuthProvider>
  );
}
