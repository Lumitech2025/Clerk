import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import Portal Views for Users
import ClerkPortal from '../Portals/clerk/ClerkDashboard';
import PastorDashboard from '../Portals/Pastor/PastorDashboard';
import ElderDashboard from '../Portals/Elders/ElderDashboard';
import DepartmentDashboard from '../Portals/Department/DepartmentDashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Read designation directly from your Django User model serializer
  const userDesignation = (user?.designation || user?.role || 'CLERK').toUpperCase();

  switch (userDesignation) {
    case 'CLERK':
      return <ClerkPortal />;
    
    case 'PASTOR':
      return <PastorDashboard />;

    case 'ELDER':
      return <ElderDashboard />; 

    case 'DEPT_LEADER':
      return <DepartmentDashboard />;
      
    case 'COMMUNICATION':
    
    case 'MEMBER':
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#020617', height: '100vh', color: '#fff' }}>
          <h2>Welcome, {user?.first_name || user?.username || 'User'}!</h2>
          <p style={{ color: '#94a3b8', marginTop: '10px' }}>
            The {userDesignation} portal module is currently under active development.
          </p>
        </div>
      );

    default:
      return <ClerkPortal />;
  }
};

export default Dashboard;