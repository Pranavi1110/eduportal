import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";

const Certificates = () => {
  const { authData } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/student/certificates", {
        headers: { Authorization: `Bearer ${authData?.token}` },
      });
      setCertificates(response.data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificateId, certificateNumber) => {
    try {
      const response = await api.get(
        `/student/certificates/${certificateId}/download`,
        {
          headers: { Authorization: `Bearer ${authData?.token}` },
          responseType: "blob",
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate_${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading certificates...</div>
      </div>
    );
  }

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
              My Certificates
            </h1>

            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📜</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No certificates yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Complete tasks to earn certificates. Your certificates will
                  appear here once you finish projects.
                </p>
                <a href="/tasks" className="btn btn-primary">
                  View Available Tasks
                </a>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certificates.map((certificate) => (
                  <div
                    key={certificate._id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            🏆
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {certificate.metadata?.taskTitle ||
                              certificate.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {certificate.startup?.companyName ||
                              certificate.startup?.firstName ||
                              "Unknown Company"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Category
                        </span>
                        <p className="text-sm text-gray-700">
                          {certificate.metadata?.taskCategory || "N/A"}
                        </p>
                      </div>

                      {certificate.skills && certificate.skills.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Skills
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {certificate.skills
                              .slice(0, 3)
                              .map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            {certificate.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{certificate.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Completed
                        </span>
                        <p className="text-sm text-gray-700">
                          {new Date(
                            certificate.metadata?.completionDate ||
                              certificate.issuedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Certificate ID
                        </span>
                        <p className="text-sm text-gray-700 font-mono">
                          {certificate.certificateNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <button
                        onClick={() =>
                          downloadCertificate(
                            certificate._id,
                            certificate.certificateNumber
                          )
                        }
                        className="btn btn-primary btn-sm"
                      >
                        📄 Download PDF
                      </button>
                      <span className="text-xs text-gray-400">
                        {new Date(certificate.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Certificates;
