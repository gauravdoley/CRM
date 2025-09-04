import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
}

interface CustomersPageProps {
    navigateTo: (page: 'crm' | 'customers') => void;
}

const CustomersPage = ({ navigateTo }: CustomersPageProps) => {
    const { token } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await fetch('/api/customers', {
                    headers: { 'x-auth-token': token }
                });
                if (!response.ok) throw new Error('Failed to fetch customers');
                const data = await response.json();
                setCustomers(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, [token]);

    return (
        <div className="bg-gray-100 min-h-screen">
            <AppHeader currentPage="customers" navigateTo={navigateTo} />
            
            <main className="p-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && <tr><td colSpan={3} className="text-center p-4">Loading...</td></tr>}
                            {error && <tr><td colSpan={3} className="text-center p-4 text-red-500">{error}</td></tr>}
                            {!isLoading && customers.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default CustomersPage;