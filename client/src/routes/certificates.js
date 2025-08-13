// API function to fetch all certificates for the current student
import api from "../services/api";

export async function fetchAllCertificates(token) {
  const res = await api.get("/student/certificates", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
