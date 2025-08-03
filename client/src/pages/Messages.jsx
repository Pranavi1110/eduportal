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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          {/* Sidebar: Conversation List */}
          <div className="w-full md:w-1/3 bg-white rounded shadow p-4 h-[32rem] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Conversations</h2>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="text-gray-400">No conversations yet.</div>
            ) : (
              <ul>
                {conversations.map((user) => (
                  <li
                    key={user._id}
                    className={`p-2 rounded cursor-pointer mb-2 ${
                      selectedUser && selectedUser._id === user._id
                        ? "bg-blue-100"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-semibold">
                      {user.userType === "startup"
                        ? user.companyName
                        : `${user.firstName} ${user.lastName}`}
                    </div>
                    {user.userType === "startup" && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                    {user.userType !== "startup" && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Main Chat Area */}
          <div className="flex-1 bg-white rounded shadow p-4 h-[32rem] flex flex-col">
            {!selectedUser ? (
              <div className="text-gray-500 flex-1 flex items-center justify-center">
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                <div className="mb-2 border-b pb-2">
                  {selectedUser.userType === "startup" ? (
                    <>
                      <div className="font-bold text-lg">{selectedUser.companyName}</div>
                      <div className="text-xs text-gray-500 mt-1">{selectedUser.email}</div>
                    </>
                  ) : (
                    <div className="font-bold text-lg">Chat with {selectedUser.firstName} {selectedUser.lastName}</div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-3 rounded border">
                  {msgLoading ? (
                    <div>Loading conversation...</div>
                  ) : msgError ? (
                    <div className="text-red-500">{msgError}</div>
                  ) : messages.length === 0 ? (
                    <div className="text-gray-400">No messages yet.</div>
                  ) : (
                    messages.map((msg) => {
                      const myId = String(user?._id || user?.id);
                      // Always show my messages to the right, others to the left
                      const isMine = String(msg.sender) === myId;
                      return (
                        <div
                          key={msg._id}
                          className={`mb-2 flex ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`px-3 py-2 rounded-lg max-w-xs ${
                              isMine
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
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSend} className="flex gap-2 mt-2">
                  <textarea
                    className="input-field flex-1"
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
                </form>
                {msgError && (
                  <div className="text-red-500 mt-2">{msgError}</div>
                )}
                {success && (
                  <div className="text-green-600 mt-2">{success}</div>
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
