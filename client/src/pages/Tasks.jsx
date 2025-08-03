import React from "react";
import { Helmet } from "react-helmet-async";

const Tasks = () => {
  return (
    <>
      <Helmet>
        <title>Tasks - Hubinity</title>
        <meta name="description" content="Browse and manage tasks" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <h2 className="text-xl text-gray-500">Tasks data is temporarily unavailable.</h2>
      </div>
    </>
  );
};

export default Tasks;
                       