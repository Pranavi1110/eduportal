import api from "../services/api";

// Fetch all students (for chat)
// Fetch all students from users collection with role student
export async function fetchAllStudents() {
  const res = await api.get("/users", { params: { role: "student" } });
  return res.data;
}
