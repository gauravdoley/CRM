import { useAuth } from '../context/AuthContext';

// Define the props this component will receive
interface AppHeaderProps {
    currentPage: 'crm' | 'customers';
    navigateTo: (page: 'crm' | 'customers') => void;
    openCreateLeadModal?: () => void; // Make this optional
    openCreateCustomerModal?: () => void; // Add this for future use
}

const AppHeader = ({ currentPage, navigateTo, openCreateLeadModal }: AppHeaderProps) => {
    const { logout, user } = useAuth();

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center w-full">
            {/* Left side: Navigation */}
            <nav className="flex items-center space-x-4 sm:space-x-6">
                <span className="font-bold text-gray-800 hidden sm:inline">{user?.name}'s CRM</span>
                <div className="h-6 w-px bg-gray-300 hidden sm:inline"></div>
                <button
                    onClick={() => navigateTo('crm')}
                    className={`text-base sm:text-lg font-semibold pb-1 ${currentPage === 'crm' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pipeline
                </button>
                <button
                    onClick={() => navigateTo('customers')}
                    className={`text-base sm:text-lg font-semibold pb-1 ${currentPage === 'customers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Customers
                </button>
            </nav>

            {/* Right side: Action Buttons */}
            <div className="flex items-center space-x-4">
                {/* Conditionally render the "Create Lead" button only on the CRM page */}
                {currentPage === 'crm' && openCreateLeadModal && (
                    <button
                        onClick={openCreateLeadModal}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow"
                    >
                        Create Lead
                    </button>
                )}
                <button onClick={logout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                    Logout
                </button>
            </div>
        </header>
    );
};

export default AppHeader;