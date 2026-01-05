import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthProvider';
import AppWithRouter from './components/AppWithRouter';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppWithRouter />
      </HashRouter>
    </AuthProvider>
  );
}
