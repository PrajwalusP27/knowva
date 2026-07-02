import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const NAV = [
  { to: "/dashboard",     label: "Dashboard",     icon: "▦" },
  { to: "/my-skills",     label: "My Skills",     icon: "◈" },
  { to: "/sessions",      label: "Sessions",      icon: "◉" },
  { to: "/messages",      label: "Messages",      icon: "◎" },
  { to: "/community",     label: "Community",     icon: "⬡" },
  { to: "/matches",       label: "Matches",       icon: "⟡" },
  { to: "/notifications", label: "Notifications", icon: "◫" },
  { to: "/certificates",  label: "Certificates",  icon: "◑" },
  { to: "/settings",      label: "Settings",      icon: "⚙" },
];

function Sidebar({ active, unreadNotifs: propUnread }) {
  const { user } = useUser();
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [selfUnread, setSelfUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadNotifs = propUnread !== undefined ? propUnread : selfUnread;

  useEffect(() => {
    if (!user) return;
    axios.get(`http://localhost:5000/api/users/${user.id}`)
      .then((r) => setIsAdmin(r.data?.role === "admin"))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || propUnread !== undefined) return;
    const fetch = () =>
      axios.get(`http://localhost:5000/api/notifications/unread-count/${user.id}`)
        .then((r) => setSelfUnread(r.data.count || 0))
        .catch(() => {});
    fetch();
    const handler = (n) => { if (n.recipientClerkId === user.id) setSelfUnread((c) => c + 1); };
    socket.on("receive_db_notification", handler);
    return () => socket.off("receive_db_notification", handler);
  }, [user, propUnread]);

  const NavItems = () => (
    <>
      {NAV.map((item) => {
        const isActive = active === item.to;
        return (
          <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}>
            <div className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-100 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-[13px] w-4 text-center">{item.icon}</span>
                <span className="text-[13px] font-medium">{item.label}</span>
              </div>
              {item.to === "/notifications" && unreadNotifs > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${isActive ? "bg-white/25 text-white" : "bg-blue-600 text-white"}`}>
                  {unreadNotifs > 99 ? "99+" : unreadNotifs}
                </span>
              )}
            </div>
          </Link>
        );
      })}
      {isAdmin && (
        <Link to="/admin" onClick={() => setMobileOpen(false)}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${active === "/admin" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <span className="text-[13px] w-4 text-center">⬡</span>
            <span className="text-[13px] font-medium">Admin</span>
          </div>
        </Link>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-[#0d1117] text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-40
        w-56 bg-[#0d1117] border-r border-white/5
        flex flex-col flex-shrink-0
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm">K</div>
            <span className="text-white font-bold text-base tracking-tight">Knowva</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <NavItems />
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-3 pb-4 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
              <img src={user.imageUrl} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-300 truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
