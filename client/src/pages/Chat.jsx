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
  const { user } = useAuth();
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
        if (user?.userType === "student") {
          const startupUsers = await fetchAllStartups(); // These should already have companyName
          data = startupUsers.map((u) => ({
            ...u,
            companyName: u.companyName || "Unknown",
          }));
        } else {
          // Just fetch students directly
          data = await fetchAllStudents();
        }

        setUsers(data);
        console.log("Fetched users for chat:", data);
      } catch (e) {
        console.error(e);
        setError("Failed to load users");
      }
      setLoading(false);
    };

    fetchUsers();
  }, [user]);

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
      <div className="min-h-screen bg-primary-white section-padding">
        {/* Centered container */}
        <div className="container-responsive flex justify-center">
          {!userId ? (
            <div className="w-full max-w-3xl">
              <h2 className="text-2xl font-garamond font-bold mb-6 text-primary-dark text-center">
                {user?.userType === "student" ? "Startups" : "Students"}
              </h2>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : users.length === 0 ? (
                <div className="text-center">No {user?.userType === "student" ? "startups" : "students"} found.</div>
              ) : (
                <div className="space-y-4">
                  {(user?.userType === "student"
                    ? users.filter((u) => u.userType === "startup")
                    : users.filter((u) => u.userType === "student")
                  ).map((user) => {
                    let displayName =
                      user.userType === "startup"
                        ? user.companyName
                        : `${user.firstName} ${user.lastName}`;
                    let infoLine = "";
                    if (user.userType === "student") {
                      if (user.skills && user.skills.length > 0) {
                        infoLine = `Skills: ${user.skills
                          .map((sk) => sk.name || sk)
                          .join(", ")}`;
                      } else {
                        infoLine = "Skills: None";
                      }
                    }
                    return (
                      <div
                        key={user._id}
                        className="card-elegant p-5 flex flex-col md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="font-semibold text-lg text-primary-dark">
                            {displayName}
                          </div>
                          {user.userType === "startup" && (
                            <div className="text-xs text-gray-600 mt-1">
                              {user.email}
                            </div>
                          )}
                          {user.userType !== "startup" && (
                            <div className="text-gray-700 text-sm mt-1">
                              {infoLine}
                            </div>
                          )}
                        </div>
                        <button
                          className="btn-primary mt-3 md:mt-0"
                          onClick={() => navigate(`/chat/${user._id}`)}
                        >
                          Chat
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-2xl">
              <div className="card-elegant p-6">
                <button
                  className="mb-4 text-primary-button hover:text-primary-dark transition-colors"
                  onClick={() => navigate("/chat")}
                >
                  &larr; Back to {user?.userType === "student" ? "startups" : "students"}
                </button>
                {selectedUser ? (
                  <>
                    <div className="font-bold text-xl mb-2 text-primary-dark text-center">
                      Chat with {selectedUser.firstName} {selectedUser.lastName}
                      {selectedUser.companyName ? ` (${selectedUser.companyName})` : ""}
                    </div>
                    <div className="mb-4 h-80 overflow-y-auto bg-white p-3 rounded-xl border border-gray-200">
                      {messagesLoading ? (
                        <div className="text-center">Loading conversation...</div>
                      ) : messagesError ? (
                        <div className="text-center text-red-600">{messagesError}</div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500">No messages yet.</div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg._id}
                            className={`mb-3 flex ${
                              msg.sender === user?.id ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`px-4 py-2 rounded-2xl max-w-xs shadow-sm border text-sm break-words ${
                                msg.sender === user?.id
                                  ? "bg-primary-button text-primary-dark border-primary-button/30"
                                  : "bg-primary-card text-primary-dark border-gray-200"
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
                        className="input-field-elegant min-h-[56px] resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        required
                      />
                      <button
                        className="btn-primary"
                        type="submit"
                        disabled={sending || !message}
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                      {sendError && <div className="text-center text-red-600">{sendError}</div>}
                      {success && <div className="text-center text-green-700">{success}</div>}
                    </form>
                  </>
                ) : (
                  <div className="text-center">Loading user info...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chat;