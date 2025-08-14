import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [msgError, setMsgError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch all users you've chatted with (conversations)
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get all users you've chatted with (from messages API)
        const res = await api.get("/chat/conversations");
        setConversations(res.data);
      } catch (e) {
        setError("Failed to load conversations");
      }
      setLoading(false);
    };
    fetchConversations();
  }, []);

  // Fetch messages with selected user
  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      setMsgLoading(true);
      setMsgError(null);
      try {
        const res = await api.get(`/chat/${selectedUser._id}`);
        setMessages(res.data);
      } catch (e) {
        setMsgError("Failed to load messages");
      }
      setMsgLoading(false);
    };
    fetchMessages();
  }, [selectedUser, success]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccess(null);
    setMsgError(null);
    try {
      await api.post("/chat/send", {
        receiver: selectedUser._id,
        content: message,
      });
      setSuccess("Message sent!");
      setMessage("");
    } catch (e) {
      setMsgError("Failed to send message");
    }
    setSending(false);
  };

  return (
    <>
      <Helmet>
        <title>Messages - Hubinity</title>
        <meta name="description" content="In-app messaging system" />
      </Helmet>
      <div className="min-h-screen bg-primary-white section-padding">
        <div className="container-responsive flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Conversation List */}
          <div className="w-full lg:w-1/3 card-elegant h-[32rem] overflow-y-auto">
            <h2 className="text-xl font-garamond font-bold mb-4 text-primary-dark">Conversations</h2>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="text-gray-500">No conversations yet.</div>
            ) : (
              <ul>
                {conversations.map((user) => (
                  <li
                    key={user._id}
                    className={`p-3 rounded-xl cursor-pointer mb-2 transition-colors ${
                      selectedUser && selectedUser._id === user._id
                        ? "bg-primary-card"
                        : "hover:bg-primary-card"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-semibold text-primary-dark">
                      {user.userType === "startup"
                        ? user.companyName
                        : `${user.firstName} ${user.lastName}`}
                    </div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Main Chat Area */}
          <div className="flex-1 card-elegant h-[32rem] flex flex-col">
            {!selectedUser ? (
              <div className="text-gray-600 flex-1 flex items-center justify-center">
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                <div className="mb-2 border-b border-gray-200 pb-2">
                  {selectedUser.userType === "startup" ? (
                    <>
                      <div className="font-bold text-lg text-primary-dark">{selectedUser.companyName}</div>
                      <div className="text-xs text-gray-600 mt-1">{selectedUser.email}</div>
                    </>
                  ) : (
                    <div className="font-bold text-lg text-primary-dark">Chat with {selectedUser.firstName} {selectedUser.lastName}</div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mb-4 bg-primary-card p-3 rounded-xl border border-gray-200">
                  {msgLoading ? (
                    <div>Loading conversation...</div>
                  ) : msgError ? (
                    <div className="text-red-600">{msgError}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-gray-500">No messages yet.</div>
                  ) : (
                    messages.map((msg) => {
                      const myId = String(user?._id || user?.id);
                      const isMine = String(msg.sender) === myId;
                      return (
                        <div
                          key={msg._id}
                          className={`mb-2 flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`px-3 py-2 rounded-xl max-w-xs border text-sm break-words ${
                              isMine
                                ? "bg-primary-button text-primary-dark border-primary-button/30"
                                : "bg-white text-primary-dark border-gray-200"
                            }`}
                          >
                            {msg.content}
                            <div className="text-xs mt-1 text-right opacity-70">
                              {new Date(msg.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSend} className="flex gap-3 mt-2">
                  <textarea
                    className="input-field-elegant flex-1 min-h-[48px] resize-none"
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
                </form>
                {msgError && (
                  <div className="text-red-600 mt-2">{msgError}</div>
                )}
                {success && (
                  <div className="text-green-700 mt-2">{success}</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Messages;
