import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Profile - Hubinity</title>
        <meta name="description" content="User profile management" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-3xl font-garamond font-bold text-primary-dark mb-6">
              Profile
            </h1>
            <p className="text-gray-600">
              Profile management features coming soon. Welcome, {user?.firstName}!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile; 