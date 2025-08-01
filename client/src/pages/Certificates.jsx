import React from 'react';
import { Helmet } from 'react-helmet-async';

const Certificates = () => {
  return (
    <>
      <Helmet>
        <title>Certificates - Hubinity</title>
        <meta name="description" content="View and download certificates" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <h1 className="text-3xl font-garamond font-bold text-primary-dark mb-6">
              Certificates
            </h1>
            <p className="text-gray-600">
              View and download your earned certificates for completed tasks. Certificate management coming soon.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Certificates; 