import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import Portal Views for each of the 6 Users
import ClerkPortal from '../Portals/clerk/Dashboard';
// import PastorPortal from '../Portals/pastor/Dashboard';
// import ElderPortal from '../Portals/elders/Dashboard';
// import CommunicationPortal from '../Portals/communication/Dashboard';
// import DeptLeaderPortal from '../Portals/dept_leaders/Dashboard';
// import MemberPortal from '../Portals/members/Dashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  // Dynamic Landing Switcher based on Role
  switch (user?.role) {
    case 'CLERK':
      return <ClerkPortal />;
    // case 'PASTOR':
      //return <PastorPortal />;
    //case 'ELDER':
     // return <ElderPortal />;
    //case 'COMMUNICATION':
      //return <CommunicationPortal />;
    //case 'DEPT_LEADER':
      //return <DeptLeaderPortal />;
    //case 'MEMBER':
    //default:
      //return <MemberPortal />;
  }
};

export default Dashboard;