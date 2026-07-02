import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

const COLORS = ["from-blue-400 to-blue-600","from-violet-400 to-violet-600","from-emerald-400 to-emerald-600","from-rose-400 to-rose-600","from-amber-400 to-amber-600","from-cyan-400 to-cyan-600"];
const grad = (name = "") => COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

function Matches() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    if (!user) return;
    axios.get(`http://localhost:5000/api/connections/my-connections/${user.id}`)
      .then((r) => setConnections(r.data || []))
      .catch(console.log)
      .finally(() => setLoading(false));
  }, [user]);

  const getOther = (c) => c.senderClerkId === user?.id
    ? { id: c.receiverClerkId, name: c.receiverName }
    : { id: c.senderClerkId,   name: c.senderName };

  const filtered = connections.filter((c) => getOther(c).name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/matches" />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader
          title="Matches"
          subtitle={`${connections.length} connections`}
          right={
            <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
              {connections.length} connected
            </span>
          }
        />

        <div className="p-4 sm:p-6">
          {/* Search */}
          {connections.length > 0 && (
            <div className="relative mb-4 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connections…"
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm" />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1,2,3,4,5,6].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-20 animate-pulse" />)}
            </div>
          ) : connections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🤝</div>
              <p className="font-semibold text-slate-700 mb-1">No connections yet</p>
              <p className="text-sm text-slate-400 mb-5">Find people in Community and connect.</p>
              <button onClick={() => navigate("/community")} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition">
                Explore Community
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400">No results for "{search}"</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((conn) => {
                const other = getOther(conn);
                return (
                  <div key={conn._id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow card-hover flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad(other.name)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {other.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{other.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-[10px] text-emerald-600 font-semibold">Connected</span>
                      </div>
                    </div>
                    <button onClick={() => navigate("/chat", { state: { otherUserId: other.id, otherUserName: other.name } })}
                      className="flex-shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold px-3 py-1.5 rounded-lg transition">
                      Chat
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Matches;
