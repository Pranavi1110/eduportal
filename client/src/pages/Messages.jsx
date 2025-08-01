import React from 'react';
import { Helmet } from 'react-helmet-async';

const Messages = () => {
  return (
    <>
      <Helmet>
        <title>Messages - Hubinity</title>
        <meta name="description" content="In-app messaging system" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-3xl font-garamond font-bold text-primary-dark mb-6">
              Messages
            </h1>
            <p className="text-gray-600">
              Communicate with other users through our in-app messaging system. Messaging features coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages; 