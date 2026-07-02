import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";

// ==========================================
// SOCKET
// ==========================================
const socket = io("http://localhost:5000");

function Chat() {
  const { user }   = useUser();
  const location   = useLocation();
  const navigate   = useNavigate();
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Null safety — redirect if opened without a target
  if (!location.state?.otherUserId) {
    navigate("/messages", { replace: true });
    return null;
  }

  const { otherUserId, otherUserName } = location.state;

  // ==========================================
  // STATES
  // ==========================================
  const [message,          setMessage]          = useState("");
  const [messages,         setMessages]         = useState([]);
  const [onlineUsers,      setOnlineUsers]      = useState([]);
  const [isTyping,         setIsTyping]         = useState(false);
  const [selectedFile,     setSelectedFile]     = useState(null);
  const [uploading,        setUploading]        = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [topic,            setTopic]            = useState("");
  const [description,      setDescription]      = useState("");
  const [sessionDate,      setSessionDate]      = useState("");
  const [sessionTime,      setSessionTime]      = useState("");
  const [sending,          setSending]          = useState(false);

  const room = [user?.id, otherUserId].sort().join("_");

  const isOtherOnline = onlineUsers.some((u) => u.clerkId === otherUserId);

  // ==========================================
  // FETCH CONVERSATION
  // ==========================================
  const fetchConversation = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/messages/conversation/${user?.id}/${otherUserId}`
      );
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.log(e); }
  };

  // ==========================================
  // MARK MESSAGES AS SEEN
  // ==========================================
  const markMessagesAsSeen = async () => {
    try {
      await axios.put("http://localhost:5000/api/messages/mark-seen", {
        senderClerkId:   otherUserId,
        receiverClerkId: user?.id,
      });
      socket.emit("message_seen", { room });
    } catch (e) { console.log(e); }
  };

  // ==========================================
  // BOOK SESSION
  // ==========================================
  const bookSession = async () => {
    try {
      await axios.post("http://localhost:5000/api/sessions/create", {
        senderClerkId:   user?.id,
        receiverClerkId: otherUserId,
        senderName:      user?.fullName,
        receiverName:    otherUserName,
        topic,
        description,
        date: sessionDate,
        time: sessionTime,
      });

      socket.emit("new_session_notification", {
        receiverClerkId: otherUserId,
        senderName:      user?.fullName,
        topic,
      });

      // Persist notification via send_notification
      socket.emit("send_notification", {
        recipientClerkId: otherUserId,
        senderClerkId:    user?.id,
        senderName:       user?.fullName,
        senderImage:      user?.imageUrl || "",
        type:   "session",
        title:  `${user?.fullName} sent a session request`,
        body:   `Topic: "${topic}"`,
        linkTo: "/sessions",
      });

      setShowSessionModal(false);
      setTopic(""); setDescription(""); setSessionDate(""); setSessionTime("");
      alert("Session Request Sent!");
    } catch (e) { console.log(e); }
  };

  // ==========================================
  // SOCKET SETUP
  // ==========================================
  useEffect(() => {
    if (room)    socket.emit("join_room", room);
    if (user?.id) socket.emit("user_online", user.id);
  }, [room, user]);

  useEffect(() => {
    if (user && otherUserId) {
      markMessagesAsSeen().then(fetchConversation);
    }
  }, [user, otherUserId]);

  useEffect(() => {
    socket.on("receive_message",   (data) => setMessages((p) => [...p, data]));
    socket.on("messages_seen",     ()     => setMessages((p) => p.map((m) => m.senderClerkId === user?.id ? { ...m, seen: true } : m)));
    socket.on("online_users",      (u)    => setOnlineUsers(u));
    socket.on("user_typing",       ()     => setIsTyping(true));
    socket.on("user_stop_typing",  ()     => setIsTyping(false));
    return () => {
      socket.off("receive_message");
      socket.off("messages_seen");
      socket.off("online_users");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  const sendMessage = async () => {
    if ((!message?.trim() && !selectedFile) || sending) return;
    setSending(true);

    let fileUrl = "";
    if (selectedFile) {
      try {
        setUploading(true);
        const form = new FormData();
        form.append("file", selectedFile);
        const res = await axios.post("http://localhost:5000/api/messages/upload", form);
        fileUrl = res.data.fileUrl;
      } catch (e) { console.log(e); }
      finally { setUploading(false); }
    }

    const messageData = {
      room,
      senderClerkId:   user?.id,
      receiverClerkId: otherUserId,
      senderName:      user?.fullName,
      message:         message || "",
      fileUrl,
      seen: false,
    };

    socket.emit("send_message", messageData);
    // Persist message notification to DB via send_notification
    socket.emit("send_notification", {
      recipientClerkId: otherUserId,
      senderClerkId:    user?.id,
      senderName:       user?.fullName,
      senderImage:      user?.imageUrl || "",
      type:   "message",
      title:  `New message from ${user?.fullName}`,
      body:   message ? (message.length > 60 ? message.slice(0, 60) + "…" : message) : "Sent a file",
      linkTo: "/messages",
    });

    await axios.post("http://localhost:5000/api/messages/send", messageData);
    setMessages((p) => [...p, messageData]);
    setMessage("");
    setSelectedFile(null);
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { room });
    setTimeout(() => socket.emit("stop_typing", { room }), 1000);
  };

  const isImage = (url) => /\.(png|jpg|jpeg|webp|gif)$/i.test(url);

  // ==========================================
  // GROUP MESSAGES by sender for WhatsApp-style bubbles
  // ==========================================
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameSender = prev?.senderClerkId === msg.senderClerkId;
    const sameMinute = prev && Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt)) < 60000;
    acc.push({ ...msg, isGrouped: sameSender && sameMinute });
    return acc;
  }, []);

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition font-bold text-sm"
          >
            ←
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {otherUserName?.charAt(0)?.toUpperCase()}
            </div>
            {isOtherOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{otherUserName}</p>
            <p className="text-[11px] font-medium">
              {isOtherOnline
                ? <span className="text-emerald-500">Online</span>
                : <span className="text-slate-400">Offline</span>
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSessionModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          Book Session
        </button>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-3">💬</div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Start the conversation</p>
            <p className="text-xs text-slate-400">Say hello to {otherUserName}</p>
          </div>
        )}

        {grouped.map((msg, i) => {
          const isMine    = msg.senderClerkId === user?.id;
          const isLast    = i === grouped.length - 1;
          const showTime  = !grouped[i + 1] || grouped[i + 1]?.senderClerkId !== msg.senderClerkId;

          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"} ${msg.isGrouped ? "mt-0.5" : "mt-3"}`}
            >
              {/* Avatar for received messages (only on last in group) */}
              {!isMine && (
                <div className="w-7 flex-shrink-0 flex items-end mr-1.5">
                  {!grouped[i + 1] || grouped[i + 1]?.senderClerkId !== msg.senderClerkId ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {otherUserName?.charAt(0)}
                    </div>
                  ) : null}
                </div>
              )}

              <div className={`max-w-xs sm:max-w-sm md:max-w-md flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isMine
                      ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                      : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-md"
                  } ${msg.isGrouped ? (isMine ? "rounded-tr-md" : "rounded-tl-md") : ""}`}
                >
                  {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                  {msg.fileUrl && isImage(msg.fileUrl) && (
                    <img
                      src={msg.fileUrl}
                      alt="attachment"
                      className={`rounded-xl max-h-64 object-cover ${msg.message ? "mt-2" : ""}`}
                    />
                  )}

                  {msg.fileUrl && !isImage(msg.fileUrl) && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 mt-1 text-xs font-medium underline ${isMine ? "text-blue-200" : "text-blue-600"}`}
                    >
                      📎 Download File
                    </a>
                  )}
                </div>

                {/* Seen / time */}
                {showTime && (
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "flex-row-reverse" : ""}`}>
                    {isMine && (
                      <span className={`text-[10px] font-medium ${msg.seen ? "text-blue-500" : "text-slate-400"}`}>
                        {msg.seen ? "Seen" : "Sent"}
                      </span>
                    )}
                    {msg.createdAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {otherUserName?.charAt(0)}
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex items-center gap-1">
              {[0,1,2].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Sticky input bar ── */}
      <div className="bg-white border-t border-slate-100 flex-shrink-0">

        {/* File preview */}
        {selectedFile && (
          <div className="px-4 pt-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-3">
              <span className="text-xl">{selectedFile.type.startsWith("image/") ? "🖼️" : "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-red-500 text-lg leading-none transition"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Attach */}
          <label className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition text-slate-500 text-base flex-shrink-0">
            📎
            <input
              type="file"
              hidden
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </label>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUserName}…`}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={(!message.trim() && !selectedFile) || uploading || sending}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white transition flex-shrink-0"
          >
            {uploading || sending
              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <span className="text-base">↑</span>
            }
          </button>
        </div>
      </div>

      {/* ── Session Modal ── */}
      {showSessionModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSessionModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Book Session</h2>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Session topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowSessionModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={bookSession}
                disabled={!topic.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Chat;
