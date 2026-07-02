import { useState, useEffect } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { io } from "socket.io-client";

import axios from "axios";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";


// ==========================================
// SOCKET
// ==========================================
const socket =
  io("http://localhost:5000");


function Dashboard() {

  const { user } = useUser();

  console.log(user?.id);

  const navigate =
    useNavigate();

  // ==========================================
  // SKILL STATES
  // ==========================================
  const [teachSkill, setTeachSkill] =
    useState("");

  const [learnSkill, setLearnSkill] =
    useState("");

  const [teachSkills, setTeachSkills] =
    useState([]);

  const [learnSkills, setLearnSkills] =
    useState([]);

  // ==========================================
  // UI STATES
  // ==========================================
  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // NOTIFICATION STATE
  // ==========================================
  const [notifications,
    setNotifications] =
      useState(0);

  // ==========================================
  // CONNECTION STATES
  // ==========================================
  const [pendingRequests,
    setPendingRequests] =
      useState([]);

  const [acceptingId,
    setAcceptingId] =
      useState(null);

  const [unreadNotifs,
    setUnreadNotifs] =
      useState(0);

  const [trustScore,
    setTrustScore] =
      useState(null);

  const [recentBadges,
    setRecentBadges] =
      useState([]);

  const [recentCerts,
    setRecentCerts] =
      useState([]);

  const [connections,
    setConnections] =
      useState([]);

  // ==========================================
  // FETCH TRUST SCORE
  // ==========================================
  const fetchTrustScore = async () => {

    if (!user) return;

    try {

      const [scoreRes, badgesRes, certsRes] =
        await Promise.all([
          axios.get(`http://localhost:5000/api/users/trust-score/${user.id}`),
          axios.get(`http://localhost:5000/api/badges/${user.id}`),
          axios.get(`http://localhost:5000/api/certificates/my/${user.id}`),
        ]);

      setTrustScore(scoreRes.data);
      setRecentBadges((badgesRes.data || []).slice(0, 4));
      setRecentCerts((certsRes.data || []).slice(0, 3));

    } catch (error) {

      console.log(error);
    }
  };

  // ==========================================
  // FETCH USER DATA
  // ==========================================
  const fetchUserData = async () => {

    if (!user) return;

    try {

      const res = await axios.get(
        `http://localhost:5000/api/users/${user.id}`
      );

      if (res.data) {

        setTeachSkills(
          res.data.teachSkills || []
        );

        setLearnSkills(
          res.data.learnSkills || []
        );
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  // ==========================================
  // FETCH PENDING REQUESTS
  // ==========================================
  const fetchPendingRequests =
    async () => {

      try {

        const res = await axios.get(
          `http://localhost:5000/api/connections/pending/${user?.id}`
        );

        setPendingRequests(
          Array.isArray(res.data)
            ? res.data
            : []
        );

      } catch (error) {

        console.log(error);
      }
    };

  // ==========================================
  // FETCH CONNECTIONS
  // ==========================================
  const fetchConnections =
    async () => {

      try {

        const res = await axios.get(
          `http://localhost:5000/api/connections/my-connections/${user?.id}`
        );

        setConnections(
          Array.isArray(res.data)
            ? res.data
            : []
        );

      } catch (error) {

        console.log(error);
      }
    };

  // ==========================================
  // ACCEPT REQUEST
  // ==========================================
  const acceptRequest =
    async (connectionId) => {

      try {

        setAcceptingId(connectionId);

        const res = await axios.put(
          `http://localhost:5000/api/connections/accept/${connectionId}`
        );

        if (res.data?.connection) {

          emitConnectionNotif(res.data.connection);
        }

        fetchPendingRequests();

        fetchConnections();

      } catch (error) {

        console.log(error);

      } finally {

        setAcceptingId(null);
      }
    };

  // ==========================================
  // EMIT CONNECTION NOTIFICATION
  // Sends DB notification when request accepted
  // ==========================================
  const emitConnectionNotif = (connection) => {

    socket.emit("send_notification", {
      recipientClerkId: connection.senderClerkId,
      senderClerkId:    user?.id,
      senderName:       user?.fullName,
      senderImage:      user?.imageUrl || "",
      type:  "connection",
      title: `${user?.fullName} accepted your connection request`,
      body:  "You are now connected and can start a chat.",
      linkTo: "/messages",
    });
  };

  // ==========================================
  // REJECT REQUEST
  // ==========================================
  const rejectRequest =
    async (connectionId) => {

      try {

        const conn = pendingRequests.find((r) => r._id === connectionId);

        await axios.put(
          `http://localhost:5000/api/connections/reject/${connectionId}`
        );

        // Notify sender of rejection
        if (conn) {
          socket.emit("send_notification", {
            recipientClerkId: conn.senderClerkId,
            senderClerkId:    user?.id,
            senderName:       user?.fullName,
            senderImage:      user?.imageUrl || "",
            type:   "connection",
            title:  `${user?.fullName} declined your connection request`,
            body:   "Keep connecting with others on Knowva.",
            linkTo: "/community",
          });
        }

        fetchPendingRequests();

      } catch (error) {

        console.log(error);
      }
    };

  // ==========================================
  // SAVE USER DATA
  // ==========================================
  const saveUserData = async () => {

    if (!user || loading) return;

    try {

      setSaving(true);

      await axios.post(
        "http://localhost:5000/api/users/save-user",
        {
          clerkId: user?.id,

          name: user?.fullName,

          email:
            user?.primaryEmailAddress?.emailAddress,

          image: user?.imageUrl,

          teachSkills,

          learnSkills,
        }
      );

      console.log(
        "User data saved"
      );

    } catch (error) {

      console.log(error);

    } finally {

      setSaving(false);
    }
  };

  // ==========================================
  // LOAD INITIAL DATA
  // ==========================================
  useEffect(() => {

    if (user) {

      fetchUserData();

      fetchPendingRequests();

      fetchConnections();

      fetchTrustScore();

      // USER ONLINE
      socket.emit(
        "user_online",
        user.id
      );
    }

  }, [user]);

  // ==========================================
  // FETCH UNREAD NOTIFICATION COUNT
  // ==========================================
  useEffect(() => {

    const fetchUnread = async () => {

      if (!user) return;

      try {

        const res = await axios.get(
          `http://localhost:5000/api/notifications/unread-count/${user.id}`
        );

        setUnreadNotifs(res.data.count || 0);

      } catch (error) {

        console.log(error);
      }
    };

    fetchUnread();

    // Listen for real-time notifications
    socket.on(
      "receive_db_notification",
      (notif) => {

        if (notif.recipientClerkId === user?.id) {

          setUnreadNotifs((prev) => prev + 1);
        }
      }
    );

    return () => {

      socket.off("receive_db_notification");
    };

  }, [user]);

  // ==========================================
  // SOCKET NOTIFICATIONS
  // ==========================================
  
  useEffect(() => {

    // WAIT UNTIL USER LOADS
    if (!user?.id) return;

    // ======================================
    // MESSAGE NOTIFICATIONS
    // ======================================
    const handleNotification =
      (data) => {

        console.log(
          "Notification Received:",
          data
        );

        // ONLY FOR CURRENT USER
        if (
          data.receiverClerkId ===
          user.id
        ) {

          setNotifications(
            (prev) => prev + 1
          );
        }
      };

    // ======================================
    // SESSION NOTIFICATIONS
    // ======================================
    const handleSessionNotification =
      (data) => {

        console.log(
          "Session Notification:",
          data
        );

        // ONLY FOR CURRENT USER
        if (
          data.receiverClerkId ===
          user.id
        ) {

          setNotifications(
            (prev) => prev + 1
          );

          alert(
            `${data.senderName} booked a session on ${data.topic}`
          );
        }
      };

    // ======================================
    // SOCKET LISTENERS
    // ======================================
    socket.on(
      "receive_notification",
      handleNotification
    );

    socket.on(
      "receive_session_notification",
      handleSessionNotification
    );

    // ======================================
    // CLEANUP
    // ======================================
    return () => {

      socket.off(
        "receive_notification",
        handleNotification
      );

      socket.off(
        "receive_session_notification",
        handleSessionNotification
      );
    };

  }, [user?.id]);

  // ==========================================
  // AUTO SAVE SKILLS
  // ==========================================
  useEffect(() => {

    if (!loading && user) {

      saveUserData();
    }

  }, [teachSkills, learnSkills]);

  // ==========================================
  // ADD TEACH SKILL
  // ==========================================
  const addTeachSkill = () => {

    if (!teachSkill.trim()) return;

    setTeachSkills([
      ...teachSkills,
      teachSkill,
    ]);

    setTeachSkill("");
  };

  // ==========================================
  // ADD LEARN SKILL
  // ==========================================
  const addLearnSkill = () => {

    if (!learnSkill.trim()) return;

    setLearnSkills([
      ...learnSkills,
      learnSkill,
    ]);

    setLearnSkill("");
  };

  // ==========================================
  // REMOVE TEACH SKILL
  // ==========================================
  const removeTeachSkill = (index) => {

    setTeachSkills(
      teachSkills.filter((_, i) => i !== index)
    );
  };

  // ==========================================
  // REMOVE LEARN SKILL
  // ==========================================
  const removeLearnSkill = (index) => {

    setLearnSkills(
      learnSkills.filter((_, i) => i !== index)
    );
  };

  const scoreLabel = trustScore
    ? trustScore.score >= 75 ? "Highly Trusted"
    : trustScore.score >= 50 ? "Trusted"
    : trustScore.score >= 25 ? "Developing"
    : "Getting Started"
    : null;

  const scoreColor = trustScore
    ? trustScore.score >= 75 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : trustScore.score >= 50 ? "text-blue-600 bg-blue-50 border-blue-200"
    : trustScore.score >= 25 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-slate-600 bg-slate-50 border-slate-200"
    : "";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/dashboard" unreadNotifs={unreadNotifs} />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 z-20 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, {user?.firstName} 👋
            </h1>
            <p className="text-[11px] text-slate-400">Welcome back to Knowva</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-[11px] text-blue-500 animate-pulse">Saving…</span>}
            <UserButton />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">

          {/* ── TRUST SCORE + STATS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">

            {trustScore && (
              <div className="col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-sm shadow-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold opacity-70 uppercase tracking-wide">Trust Score</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-4xl font-black">{trustScore.score}</span>
                      <span className="text-sm opacity-60 mb-1">/100</span>
                    </div>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trustScore.score >= 75 ? "bg-emerald-400/20 text-emerald-100" :
                      trustScore.score >= 50 ? "bg-white/20 text-white" :
                      trustScore.score >= 25 ? "bg-amber-400/20 text-amber-100" :
                      "bg-white/10 text-white/70"
                    }`}>
                      {scoreLabel}
                    </span>
                  </div>
                  <span className="text-3xl opacity-30">◎</span>
                </div>
                <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-white transition-all duration-700" style={{ width: `${trustScore.score}%` }} />
                </div>
              </div>
            )}

            {trustScore && [
              { label: "Validations",   val: trustScore.counts.passedValidations, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Sessions",      val: trustScore.counts.completedSessions,  color: "text-blue-600",   bg: "bg-blue-50" },
              { label: "Connections",   val: trustScore.counts.connections,        color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Tests Passed",  val: trustScore.counts.passedPeerTests,    color: "text-amber-600",  bg: "bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── SKILLS ROW ── */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">I Can Teach</p>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{teachSkills.length}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add skill…"
                  value={teachSkill}
                  onChange={(e) => setTeachSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeachSkill()}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                />
                <button onClick={addTeachSkill} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl text-sm font-semibold transition">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teachSkills.map((s, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {s}
                    <button onClick={() => removeTeachSkill(i)} className="text-blue-400 hover:text-blue-700 font-bold leading-none">×</button>
                  </span>
                ))}
                {teachSkills.length === 0 && <p className="text-[11px] text-slate-300 italic">No skills added yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">I Want to Learn</p>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{learnSkills.length}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add skill…"
                  value={learnSkill}
                  onChange={(e) => setLearnSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLearnSkill()}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                />
                <button onClick={addLearnSkill} className="bg-slate-800 hover:bg-slate-900 text-white px-3 rounded-xl text-sm font-semibold transition">+</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.map((s, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    {s}
                    <button onClick={() => removeLearnSkill(i)} className="text-slate-400 hover:text-slate-700 font-bold leading-none">×</button>
                  </span>
                ))}
                {learnSkills.length === 0 && <p className="text-[11px] text-slate-300 italic">No skills added yet</p>}
              </div>
            </div>
          </div>

          {/* ── PENDING REQUESTS ── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pending Requests</p>
              {pendingRequests.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                        {req.senderName?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{req.senderName}</p>
                        <p className="text-[10px] text-slate-400">Connection request</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => acceptRequest(req._id)} disabled={acceptingId === req._id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition">
                        {acceptingId === req._id ? "…" : "Accept"}
                      </button>
                      <button onClick={() => rejectRequest(req._id)}
                        className="border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 text-[11px] font-bold px-3 py-1.5 rounded-lg transition">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CONNECTIONS GRID ── */}
          {connections.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">My Connections ({connections.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {connections.map((conn) => {
                  const otherId   = conn.senderClerkId === user?.id ? conn.receiverClerkId : conn.senderClerkId;
                  const otherName = conn.senderClerkId === user?.id ? conn.receiverName    : conn.senderName;
                  return (
                    <div key={conn._id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{otherName?.[0]}</div>
                        <p className="text-xs font-medium text-slate-800 truncate">{otherName}</p>
                      </div>
                      <button onClick={() => navigate("/chat", { state: { otherUserId: otherId, otherUserName: otherName } })}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex-shrink-0 ml-2">Msg</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── BADGES + CERTS ── */}
          {(recentBadges.length > 0 || recentCerts.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {recentBadges.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Recent Badges</p>
                  <div className="space-y-2">
                    {recentBadges.map((b) => (
                      <div key={b._id} className="flex items-center gap-3 bg-amber-50 rounded-xl px-3 py-2">
                        <span className="text-xl">{b.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{b.title}</p>
                          <p className="text-[10px] text-amber-600 capitalize font-medium">{b.tier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recentCerts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Certificates</p>
                  <div className="space-y-2">
                    {recentCerts.map((c) => (
                      <div key={c._id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📜</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{c.skill}</p>
                            <p className="text-[10px] font-mono text-slate-400">{c.certificateId}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Dashboard;
