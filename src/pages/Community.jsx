import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");


function Community() {

  const { user }  = useUser();
  const navigate  = useNavigate();

  const [allUsers,    setAllUsers]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(null);
  const [sent,        setSent]        = useState({});
  const [preview,     setPreview]     = useState(null);
  const [myConnIds,   setMyConnIds]   = useState(new Set());

  // ==========================================
  // FETCH COMMUNITY USERS
  // Only users who have at least one skill
  // (teaching OR learning) are shown.
  // ==========================================
  const fetchUsers = async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/matches/${user.id}`
      );
      // Also get ALL users with skills to include non-matches
      const allRes = await axios.get(
        "http://localhost:5000/api/users/all-with-skills"
      );
      // Merge: matches first, then rest (deduplicated)
      const matchIds = new Set((res.data || []).map((u) => u.clerkId));
      const others = (allRes.data || []).filter(
        (u) => !matchIds.has(u.clerkId) && u.clerkId !== user.id
      );
      const combined = [
        ...(res.data || []).filter((u) => u.clerkId !== user.id),
        ...others,
      ];
      setAllUsers(combined);
      setFiltered(combined);
    } catch (err) {
      // Fallback: use matches endpoint only
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/matches/${user.id}`
        );
        const users = (res.data || []).filter((u) => u.clerkId !== user.id);
        setAllUsers(users);
        setFiltered(users);
      } catch (e) { console.log(e); }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH MY CONNECTIONS (to show sent state)
  // ==========================================
  const fetchMyConnections = async () => {
    if (!user) return;
    try {
      const [pendRes, connRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/connections/pending/${user.id}`),
        axios.get(`http://localhost:5000/api/connections/my-connections/${user.id}`),
      ]);
      const ids = new Set();
      (pendRes.data  || []).forEach((c) => ids.add(c.receiverClerkId));
      (connRes.data  || []).forEach((c) => {
        ids.add(c.senderClerkId);
        ids.add(c.receiverClerkId);
      });
      ids.delete(user.id);
      setMyConnIds(ids);
    } catch (err) { console.log(err); }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchMyConnections();
    }
  }, [user]);

  // ==========================================
  // SEARCH
  // Filters by name, teaching skill, or
  // learning skill.
  // ==========================================
  const handleSearch = (q) => {
    setSearch(q);
    if (!q.trim()) {
      setFiltered(allUsers);
      return;
    }
    const lower = q.toLowerCase();
    setFiltered(
      allUsers.filter((u) =>
        u.name?.toLowerCase().includes(lower) ||
        (u.teachSkills || []).some((s) => s.toLowerCase().includes(lower)) ||
        (u.learnSkills || []).some((s) => s.toLowerCase().includes(lower))
      )
    );
  };

  // ==========================================
  // SEND CONNECTION REQUEST
  // ==========================================
  const sendRequest = async (targetUser) => {
    try {
      setSending(targetUser.clerkId);
      await axios.post("http://localhost:5000/api/connections/send", {
        senderClerkId:   user.id,
        senderName:      user.fullName,
        receiverClerkId: targetUser.clerkId,
        receiverName:    targetUser.name,
      });
      setSent((prev) => ({ ...prev, [targetUser.clerkId]: true }));

      // Real-time socket notification — persists to DB via server
      socket.emit("send_notification", {
        recipientClerkId: targetUser.clerkId,
        senderClerkId:    user.id,
        senderName:       user.fullName,
        senderImage:      user.imageUrl || "",
        type:  "connection",
        title: `${user.fullName} sent you a connection request`,
        body:  "Go to your dashboard to accept or decline.",
        linkTo: "/dashboard",
      });

    } catch (err) {
      console.log(err);
    } finally {
      setSending(null);
    }
  };

  const isConnected = (clerkId) => myConnIds.has(clerkId);
  const hasSent     = (clerkId) => sent[clerkId];



  const COLORS = ["from-blue-400 to-blue-600","from-violet-400 to-violet-600","from-emerald-400 to-emerald-600","from-rose-400 to-rose-600","from-amber-400 to-amber-600","from-cyan-400 to-cyan-600"];
  const grad = (name = "") => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/community" />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader
          title="Community"
          subtitle={`${allUsers.length} members`}
          right={<span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">{allUsers.length} members</span>}
        />

        <div className="p-4 sm:p-6">
          {/* Search */}
          <div className="relative mb-5 max-w-lg">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or skill (React, Design, Python)…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm shadow-sm" />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="bg-white rounded-2xl h-44 animate-pulse border border-slate-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <div className="text-3xl mb-3">{search ? "🔍" : "⬡"}</div>
              <p className="font-semibold text-slate-600 mb-1">{search ? `No results for "${search}"` : "No members yet"}</p>
              <p className="text-sm text-slate-400">{search ? "Try a different skill." : "Users appear here once they add skills."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((member) => {
                const connected = isConnected(member.clerkId);
                const requested = hasSent(member.clerkId);
                const g = grad(member.name);
                return (
                  <div key={member.clerkId} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col hover:shadow-md transition-shadow card-hover">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 cursor-pointer mb-3" onClick={() => setPreview(member)}>
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {member.name?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                        {member.bio && <p className="text-[11px] text-slate-400 truncate">{member.bio}</p>}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex-1 space-y-2">
                      {(member.teachSkills || []).length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teaches</p>
                          <div className="flex flex-wrap gap-1">
                            {member.teachSkills.slice(0, 3).map((s) => (
                              <span key={s} onClick={() => handleSearch(s)} className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer hover:bg-blue-100 transition border border-blue-100">{s}</span>
                            ))}
                            {member.teachSkills.length > 3 && <span className="text-[10px] text-slate-400">+{member.teachSkills.length - 3}</span>}
                          </div>
                        </div>
                      )}
                      {(member.learnSkills || []).length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Learning</p>
                          <div className="flex flex-wrap gap-1">
                            {member.learnSkills.slice(0, 3).map((s) => (
                              <span key={s} onClick={() => handleSearch(s)} className="bg-slate-50 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer hover:bg-slate-100 transition border border-slate-200">{s}</span>
                            ))}
                            {member.learnSkills.length > 3 && <span className="text-[10px] text-slate-400">+{member.learnSkills.length - 3}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connect */}
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      {connected ? (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Connected
                        </div>
                      ) : requested ? (
                        <p className="text-center text-[11px] text-slate-400 font-semibold">Request Sent</p>
                      ) : (
                        <button onClick={() => sendRequest(member)} disabled={sending === member.clerkId}
                          className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold transition">
                          {sending === member.clerkId ? "Sending…" : "Connect"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              {preview.image ? (
                <img src={preview.image} alt={preview.name} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${grad(preview.name)} flex items-center justify-center text-white text-xl font-bold`}>
                  {preview.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900">{preview.name}</h2>
                {preview.location && <p className="text-xs text-slate-400 mt-0.5">📍 {preview.location}</p>}
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {preview.bio && <p className="text-sm text-slate-600 mb-4 leading-relaxed">{preview.bio}</p>}

            {(preview.teachSkills || []).length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Teaching</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.teachSkills.map((s) => <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-semibold border border-blue-100">{s}</span>)}
                </div>
              </div>
            )}
            {(preview.learnSkills || []).length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Learning</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.learnSkills.map((s) => <span key={s} className="bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-semibold border border-slate-200">{s}</span>)}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isConnected(preview.clerkId) ? (
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Connected
                </div>
              ) : hasSent(preview.clerkId) ? (
                <div className="flex-1 text-center py-2.5 text-sm text-slate-400 font-semibold bg-slate-50 rounded-xl">Request Sent</div>
              ) : (
                <button onClick={() => { sendRequest(preview); setPreview(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition">Connect</button>
              )}
              <button onClick={() => setPreview(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Community;
