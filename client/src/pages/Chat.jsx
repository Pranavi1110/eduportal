import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { fetchAllStudents } from "../services/students";
import { fetchAllStartups } from "../services/startups";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/common/Avatar";

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

  useEffect(() => {
    if (!userId) return;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const res = await api.get(`/chat/${userId}`);
        setMessages(res.data || []);
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
          const startupUsers = await fetchAllStartups();
          data = startupUsers.map((u) => ({
            ...u,
            companyName: u.companyName || "Unknown",
          }));
        } else {
          data = await fetchAllStudents();
        }
        setUsers(data || []);
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
    <div className="min-h-screen bg-primary-white p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-garamond font-bold mb-4 text-primary-dark">
            {user?.userType === "student" ? "Startups" : "Students"}
          </h2>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center">No users found.</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => {
                const displayName =
                  u.userType === "startup"
                    ? u.companyName || u.username || "Startup"
                    : `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                      u.username;
                const logo =
                  u.profilePicture ||
                  u.logo ||
                  u.companyLogo ||
                  u.avatar ||
                  u.image ||
                  "";
                const email = u.email || (u.contact && u.contact.email) || "";
                const desc =
                  u.companyDescription || u.description || u.about || "";
                return (
                  <div
                    key={u._id}
                    className="card-elegant p-3 flex items-center gap-3"
                  >
                    <Avatar
                      src={logo}
                      name={displayName}
                      sizeClass="w-12 h-12"
                      className="rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-primary-dark truncate">
                        {displayName}
                      </div>
                      {email && (
                        <div className="text-xs text-gray-500 truncate">
                          {email}
                        </div>
                      )}
                      {desc && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {desc}
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/chat/${u._id}`)}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="card-elegant p-6">
            <button
              className="mb-4 text-primary-button"
              onClick={() => navigate("/chat")}
            >
              ← Back
            </button>
            {selectedUser ? (
              <>
                <div className="text-center mb-4">
                  <div className="font-bold text-xl text-primary-dark">
                    {selectedUser.firstName} {selectedUser.lastName}{" "}
                    {selectedUser.companyName
                      ? `(${selectedUser.companyName})`
                      : ""}
                  </div>
                </div>

                <div className="mb-4 h-80 overflow-y-auto bg-white p-3 rounded-xl border border-gray-200">
                  {messagesLoading ? (
                    <div className="text-center">Loading conversation...</div>
                  ) : messagesError ? (
                    <div className="text-center text-red-600">
                      {messagesError}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No messages yet.
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`mb-3 flex ${
                          msg.sender === user?.id
                            ? "justify-end"
                            : "justify-start"
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
                  {sendError && (
                    <div className="text-center text-red-600">{sendError}</div>
                  )}
                  {success && (
                    <div className="text-center text-green-700">{success}</div>
                  )}
                </form>
              </>
            ) : (
              <div className="text-center">
                Select a user to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
