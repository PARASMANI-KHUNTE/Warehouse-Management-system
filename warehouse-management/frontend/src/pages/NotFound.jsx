import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-9xl font-bold text-primary-600">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-gray-600 mt-2 mb-6">The page you are looking for doesn't exist or has been moved.</p>
      <Link 
        to="/" 
        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
      >
        <FiHome className="mr-2" /> Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
