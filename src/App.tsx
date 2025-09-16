
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './components/auth/AuthProvider';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
    </>
  );
}

export default App;
