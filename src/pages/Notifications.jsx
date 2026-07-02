import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

const socket = io("http://localhost:5000");

const TYPE_META = {
  message:     { icon: "💬", label: "Message",     dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-600 border-blue-100" },
  session:     { icon: "📅", label: "Session",     dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-600 border-violet-100" },
  connection:  { icon: "🤝", label: "Connection",  dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  validation:  { icon: "✅", label: "Validation",  dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700 border-amber-100" },
  peer_test:   { icon: "🧪", label: "Peer Test",   dot: "bg-rose-500",    pill: "bg-rose-50 text-rose-600 border-rose-100" },
  certificate: { icon: "📜", label: "Certificate", dot: "bg-yellow-500",  pill: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  retest:      { icon: "🔄", label: "Retest",      dot: "bg-orange-500",  pill: "bg-orange-50 text-orange-600 border-orange-100" },
};

const getMeta = (t) => TYPE_META[t] || { icon: "🔔", label: t, dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600 border-slate-200" };

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${days}d`;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "message", label: "Messages" },
  { key: "session", label: "Sessions" },
  { key: "connection", label: "Connections" },
  { key: "peer_test", label: "Tests" },
  { key: "certificate", label: "Certificates" },
];

function Notifications() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const r = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
      setNotifications(r.data || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const markRead = async (n) => {
    if (!n.isRead) {
      await axios.put(`http://localhost:5000/api/notifications/mark-read/${n._id}`);
      setNotifications((p) => p.map((x) => x._id === n._id ? { ...x, isRead: true } : x));
    }
    if (n.linkTo) navigate(n.linkTo);
  };

  const markAllRead = async () => {
    await axios.put(`http://localhost:5000/api/notifications/mark-all-read/${user.id}`);
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
  };

  const del = async (id, e) => {
    e.stopPropagation();
    await axios.delete(`http://localhost:5000/api/notifications/${id}`);
    setNotifications((p) => p.filter((n) => n._id !== id));
  };

  useEffect(() => {
    if (!user) return;
    const h = (n) => { if (n.recipientClerkId === user.id) setNotifications((p) => [n, ...p]); };
    socket.on("receive_db_notification", h);
    return () => socket.off("receive_db_notification", h);
  }, [user]);

  useEffect(() => { if (user) fetchNotifs(); }, [user]);

  const unread = notifications.filter((n) => !n.isRead).length;

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter((n) => !n.isRead)
    : notifications.filter((n) => n.type === filter);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/notifications" />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
          right={unread > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold">
              Mark all read
            </button>
          )}
        />

        <div className="p-4 sm:p-6">
          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {FILTERS.map((f) => {
              const cnt = f.key === "unread" ? unread : f.key === "all" ? notifications.length : notifications.filter((n) => n.type === f.key).length;
              if (f.key !== "all" && f.key !== "unread" && cnt === 0) return null;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${filter === f.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                  {f.label} {cnt > 0 && <span className={`ml-1 ${filter === f.key ? "opacity-60" : "text-slate-400"}`}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="space-y-1.5">
            {loading ? (
              [1,2,3,4,5].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🔔</div>
                <p className="font-semibold text-slate-600 mb-1">No notifications</p>
                <p className="text-sm text-slate-400">Your activity will appear here.</p>
              </div>
            ) : (
              filtered.map((n) => {
                const m = getMeta(n.type);
                return (
                  <div key={n._id} onClick={() => markRead(n)}
                    className={`group flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${n.isRead ? "bg-white border-slate-100" : "bg-blue-50/50 border-blue-100"}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-base">{m.icon}</div>
                      {!n.isRead && <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.dot}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-snug ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                        <button onClick={(e) => del(n._id, e)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition text-base leading-none flex-shrink-0">×</button>
                      </div>
                      {n.body && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.body}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${m.pill}`}>{m.label}</span>
                        <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        {n.senderName && <span className="text-[10px] text-slate-400">· {n.senderName}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Notifications;
