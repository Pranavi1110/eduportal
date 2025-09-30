import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import StudentDashboard from "../student/StudentDashboard";

const AdminStudentView = () => {
  const { studentId } = useParams();

  return (
    <>
      <Helmet>
        <title>View Student - Admin</title>
      </Helmet>

      <StudentDashboard
        viewUserId={studentId}
        viewUserData={null}
        isAdminView={true}
      />
    </>
  );
};

export default AdminStudentView;
