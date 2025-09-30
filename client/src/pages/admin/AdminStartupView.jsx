import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import StartupDashboard from "../startup/StartupDashboard";

const AdminStartupView = () => {
  const { startupId } = useParams();

  return (
    <>
      <Helmet>
        <title>View Startup - Admin</title>
      </Helmet>

      <StartupDashboard
        viewStartupId={startupId}
        viewStartupData={null}
        isAdminView={true}
      />
    </>
  );
};

export default AdminStartupView;
