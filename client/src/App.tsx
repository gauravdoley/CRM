import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import CrmPage from './pages/CrmPage';
import CustomersPage from './pages/CustomersPage';

function App() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<'crm' | 'customers'>('crm');

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      {currentPage === 'crm' && <CrmPage navigateTo={setCurrentPage} />}
      {currentPage === 'customers' && <CustomersPage navigateTo={setCurrentPage} />}
    </div>
  );
}

export default App;