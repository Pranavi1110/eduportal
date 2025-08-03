import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchAllStudents } from "../services/students";
import { fetchAllStartups } from "../services/startups";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const { authData } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  // Fetch messages when userId changes
  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const res = await api.get(`/chat/${userId}`);
        setMessages(res.data);
      } catch (err) {
        setMessagesError("Failed to load messages");
      }
      setMessagesLoading(false);
    };
    fetchMessages();
  }, [userId, success]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let data = [];
        if (authData?.user?.userType === "student") {
          data = await fetchAllStartups();
        } else {
          data = await fetchAllStudents();
        }
        setUsers(data);
        console.log("Fetched users for chat:", data);
      } catch (e) {
        setError("Failed to load users");
      }
      setLoading(false);
    };
    fetchUsers();
  }, [authData]);

  const selectedUser = userId ? users.find((u) => u._id === userId) : null;

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSuccess(null);
    try {
      await api.post("/chat/send", { receiver: userId, content: message });
      setSuccess("Message sent!");
      setMessage("");
    } catch (err) {
      setSendError("Failed to send message");
    }
    setSending(false);
  };

  return (
    <>
      <Helmet>
        <title>Chat - Hubinity</title>
        <meta name="description" content="Chat with students and startups" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        {!userId ? (
          <>
            <h2 className="text-2xl font-bold mb-6">
              {authData?.user?.userType === "student" ? "Startups" : "Students"}
            </h2>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : users.length === 0 ? (
              <div>
                No{" "}
                {authData?.user?.userType === "student"
                  ? "startups"
                  : "students"}{" "}
                found.
              </div>
            ) : (
              <div className="w-full max-w-2xl space-y-4">
                {(authData?.user?.userType === "student"
                  ? users.filter((u) => u.userType === "startup")
                  : users.filter((u) => u.userType === "student")
                ).map((user) => {
                  // Compose display name for both students and startups
                  let displayName = user.firstName || "";
                  if (user.lastName) displayName += ` ${user.lastName}`;
                  if (user.companyName) displayName += ` (${user.companyName})`;
                  displayName = displayName.trim() || user.email;

                  // Compose info line: skills for students, company for startups
                  let infoLine = "";
                  if (user.skills && user.skills.length > 0) {
                    infoLine = `Skills: ${user.skills
                      .map((sk) => sk.name || sk)
                      .join(", ")}`;
                  } else if (user.companyName) {
                    infoLine = `Company: ${user.companyName}`;
                  } else {
                    infoLine = "Skills: None";
                  }

                  return (
                    <div
                      key={user._id}
                      className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="font-semibold text-lg">
                          {displayName}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {infoLine}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary mt-2 md:mt-0"
                        onClick={() => navigate(`/chat/${user._id}`)}
                      >
                        Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="w-full max-w-md bg-white rounded shadow p-6">
            <button
              className="mb-4 text-blue-600 underline"
              onClick={() => navigate("/chat")}
            >
              &larr; Back to{" "}
              {authData?.user?.userType === "student" ? "startups" : "students"}
            </button>
            {selectedUser ? (
              <>
                <div className="font-bold text-xl mb-2">
                  Chat with {selectedUser.firstName} {selectedUser.lastName}
                  {selectedUser.companyName
                    ? ` (${selectedUser.companyName})`
                    : ""}
                </div>
                <div className="mb-4 h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
                  {messagesLoading ? (
                    <div>Loading conversation...</div>
                  ) : messagesError ? (
                    <div className="text-red-500">{messagesError}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-gray-400">No messages yet.</div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`mb-2 flex ${
                          msg.sender === authData?.user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded-lg max-w-xs ${
                            msg.sender === authData?.user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {msg.content}
                          <div className="text-xs mt-1 text-right opacity-70">
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSend} className="flex flex-col gap-3">
                  <textarea
                    className="input-field"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    required
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={sending || !message}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                  {sendError && <div className="text-red-500">{sendError}</div>}
                  {success && <div className="text-green-600">{success}</div>}
                </form>
              </>
            ) : (
              <div>Loading student info...</div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Chat;
