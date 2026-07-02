import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

const COLORS = ["from-blue-400 to-blue-600","from-violet-400 to-violet-600","from-emerald-400 to-emerald-600","from-rose-400 to-rose-600","from-amber-400 to-amber-600","from-cyan-400 to-cyan-600"];
const grad = (name = "") => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const fmtTime = (d) => {
  if (!d) return "";
  const date = new Date(d), now = new Date(), diff = now - date;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function Messages() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!user) return;
    axios.get(`http://localhost:5000/api/messages/my-chats/${user.id}`)
      .then((r) => setChats(Array.isArray(r.data) ? r.data : []))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = chats.filter((c) => c.otherUserName?.toLowerCase().includes(search.toLowerCase()));
  const unread = chats.filter((c) => c.unread).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/messages" />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader
          title="Messages"
          subtitle={unread > 0 ? `${unread} unread` : `${chats.length} conversations`}
          right={unread > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
          )}
        />

        <div className="p-4 sm:p-6">
          {/* Search */}
          {chats.length > 0 && (
            <div className="relative mb-4 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm" />
            </div>
          )}

          {/* Chat list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-2xl">
            {loading ? (
              [1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : chats.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">💬</div>
                <p className="font-semibold text-slate-600 mb-1">No conversations yet</p>
                <p className="text-sm text-slate-400">Chat with your connections.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No results for "{search}"</div>
            ) : (
              filtered.map((chat, i) => (
                <div key={i}
                  onClick={() => navigate("/chat", { state: { otherUserId: chat.otherUserId, otherUserName: chat.otherUserName } })}
                  className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-none cursor-pointer transition hover:bg-slate-50 ${chat.unread ? "bg-blue-50/40" : ""}`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grad(chat.otherUserName)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {chat.otherUserName?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${chat.unread ? "text-slate-900" : "text-slate-700"}`}>{chat.otherUserName}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtTime(chat.updatedAt)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${chat.unread ? "text-blue-600 font-medium" : "text-slate-400"}`}>
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  {chat.unread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Messages;
