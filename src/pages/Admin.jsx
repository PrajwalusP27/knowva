import { useState, useEffect } from "react";

import axios from "axios";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";


// ==========================================
// STAT CARD
// ==========================================
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{label}</p>
          <p className={`text-4xl font-black mt-2 ${color}`}>{value ?? "—"}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}


function Admin() {

  const { user } = useUser();

  // ==========================================
  // TABS
  // ==========================================
  const [tab, setTab] = useState("overview");

  // ==========================================
  // DATA STATE
  // ==========================================
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [validations,  setValidations]  = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(true);

  // ==========================================
  // HEADERS — send clerkId for middleware
  // ==========================================
  const headers = () => ({
    "x-clerk-id": user?.id || "",
  });

  // ==========================================
  // FETCH STATS
  // ==========================================
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/stats",
        { headers: headers() }
      );
      setStats(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FETCH USERS (with optional search)
  // ==========================================
  const fetchUsers = async (q = "") => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/users${q ? `?search=${q}` : ""}`,
        { headers: headers() }
      );
      setUsers(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // FETCH SESSIONS
  // ==========================================
  const fetchSessions = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/sessions",
        { headers: headers() }
      );
      setSessions(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // FETCH VALIDATIONS
  // ==========================================
  const fetchValidations = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/validations",
        { headers: headers() }
      );
      setValidations(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // FETCH CERTIFICATES
  // ==========================================
  const fetchCertificates = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/certificates",
        { headers: headers() }
      );
      setCertificates(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // SUSPEND / UNSUSPEND USER
  // ==========================================
  const toggleSuspend = async (userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/suspend`,
        {},
        { headers: headers() }
      );
      fetchUsers(search);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================
  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/users/${userId}`,
        { headers: headers() }
      );
      fetchUsers(search);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // REVOKE CERTIFICATE
  // ==========================================
  const revokeCert = async (certId) => {
    if (!window.confirm("Revoke this certificate?")) return;
    try {
      await axios.put(
        `http://localhost:5000/api/admin/certificates/${certId}/revoke`,
        {},
        { headers: headers() }
      );
      fetchCertificates();
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================================
  // LOAD ON MOUNT + TAB CHANGE
  // ==========================================
  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (tab === "users")        fetchUsers();
    if (tab === "sessions")     fetchSessions();
    if (tab === "validations")  fetchValidations();
    if (tab === "certificates") fetchCertificates();
  }, [tab, user]);

  // ==========================================
  // SEARCH HANDLER
  // ==========================================
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchUsers(q);
  };

  // ==========================================
  // STATUS BADGE
  // ==========================================
  const StatusBadge = ({ status }) => {
    const map = {
      active:    "bg-green-100 text-green-700",
      suspended: "bg-red-100 text-red-600",
      pending:   "bg-yellow-100 text-yellow-700",
      completed: "bg-blue-100 text-blue-700",
      accepted:  "bg-green-100 text-green-700",
      rejected:  "bg-red-100 text-red-600",
    };
    return (
      <span className={`text-xs font-medium px-3 py-1 rounded-xl capitalize ${map[status] || "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      <Sidebar active="/admin" />

      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-2">
              Platform overview and management tools.
            </p>
          </div>

          <UserButton />

        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 border-b flex-wrap">
          {[
            { key: "overview",      label: "Overview"      },
            { key: "users",         label: "Users"         },
            { key: "sessions",      label: "Sessions"      },
            { key: "validations",   label: "Validations"   },
            { key: "certificates",  label: "Certificates"  },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ==========================================
            OVERVIEW TAB
        ========================================== */}
        {tab === "overview" && (

          <div className="mt-8">

            {loading ? (

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="bg-white border rounded-2xl p-6 animate-pulse h-28" />
                ))}
              </div>

            ) : (

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <StatCard label="Total Users"         value={stats?.totalUsers}          icon="" color="text-blue-600"   />
                <StatCard label="Total Sessions"      value={stats?.totalSessions}       icon="" color="text-purple-600" />
                <StatCard label="Completed Sessions"  value={stats?.completedSessions}   icon="" color="text-green-600"  />
                <StatCard label="Total Validations"   value={stats?.totalValidations}    icon="" color="text-yellow-600" />
                <StatCard label="Certificates Issued" value={stats?.totalCertificates}   icon="" color="text-teal-600"   />
                <StatCard label="Active Users (30d)"  value={stats?.activeUsers}         icon="" color="text-red-500"    />
              </div>
            )}

          </div>
        )}

        {/* ==========================================
            USERS TAB
        ========================================== */}
        {tab === "users" && (

          <div className="mt-8">

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="w-full max-w-md border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm mb-6"
            />

            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">

              {users.length === 0 ? (

                <div className="p-12 text-center text-slate-400">
                  No users found.
                </div>

              ) : (

                <table className="w-full">

                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Name</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Joined</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.image && (
                              <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full" />
                            )}
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>

                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-xl ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                            {u.role || "user"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={u.status || "active"} />
                        </td>

                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">

                            {/* Don't allow suspending yourself or other admins */}
                            {u.clerkId !== user?.id && u.role !== "admin" && (
                              <button
                                onClick={() => toggleSuspend(u._id)}
                                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                                  u.status === "suspended"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                }`}
                              >
                                {u.status === "suspended" ? "Unsuspend" : "Suspend"}
                              </button>
                            )}

                            {u.clerkId !== user?.id && u.role !== "admin" && (
                              <button
                                onClick={() => deleteUser(u._id)}
                                className="text-xs px-3 py-1.5 rounded-xl font-medium bg-red-100 text-red-600 hover:bg-red-200 transition"
                              >
                                Delete
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              )}

            </div>

          </div>
        )}

        {/* ==========================================
            SESSIONS TAB
        ========================================== */}
        {tab === "sessions" && (

          <div className="mt-8 bg-white border rounded-3xl overflow-hidden shadow-sm">

            {sessions.length === 0 ? (

              <div className="p-12 text-center text-slate-400">
                No sessions found.
              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Topic</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Sender</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Receiver</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-6 py-4 font-medium">{s.topic}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.senderName}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.receiverName}</td>
                      <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.date}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        )}

        {/* ==========================================
            VALIDATIONS TAB
        ========================================== */}
        {tab === "validations" && (

          <div className="mt-8 bg-white border rounded-3xl overflow-hidden shadow-sm">

            {validations.length === 0 ? (

              <div className="p-12 text-center text-slate-400">
                No validations found.
              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Skill</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Validator</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Recipient</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Rating</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Result</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {validations.map((v, i) => (
                    <tr key={v._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-6 py-4 font-medium">{v.skill}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{v.validatorName}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{v.receiverName}</td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-500">{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={v.result} /></td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        )}

        {/* ==========================================
            CERTIFICATES TAB
        ========================================== */}
        {tab === "certificates" && (

          <div className="mt-8 bg-white border rounded-3xl overflow-hidden shadow-sm">

            {certificates.length === 0 ? (

              <div className="p-12 text-center text-slate-400">
                No certificates found.
              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Certificate ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">User</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Skill</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Avg Rating</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Issued</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {certificates.map((c, i) => (
                    <tr key={c._id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>

                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {c.certificateId}
                      </td>

                      <td className="px-6 py-4 font-medium">{c.userName}</td>

                      <td className="px-6 py-4 text-slate-500">{c.skill}</td>

                      <td className="px-6 py-4 text-yellow-500">
                        {"★".repeat(Math.round(c.averageRating))}
                        {"☆".repeat(5 - Math.round(c.averageRating))}
                        <span className="text-slate-400 ml-1 text-xs">{c.averageRating}</span>
                      </td>

                      <td className="px-6 py-4"><StatusBadge status={c.status} /></td>

                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        {c.status === "active" && (
                          <button
                            onClick={() => revokeCert(c._id)}
                            className="text-xs px-3 py-1.5 rounded-xl font-medium bg-red-100 text-red-600 hover:bg-red-200 transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            )}

          </div>
        )}

      </main>

    </div>
  );
}

export default Admin;
