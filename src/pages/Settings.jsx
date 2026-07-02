import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserButton, useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";


function Settings() {

  const { user }   = useUser();
  const navigate   = useNavigate();

  // ── profile form ──
  const [bio,      setBio]      = useState("");
  const [location, setLocation] = useState("");
  const [website,  setWebsite]  = useState("");

  // ── ui ──
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [showCertificates,  setShowCertificates]  = useState(true);
  const [activeTab,         setActiveTab]         = useState("profile");

  // ==========================================
  // FETCH
  // ==========================================
  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
      if (res.data) {
        setBio(res.data.bio || "");
        setLocation(res.data.location || "");
        setWebsite(res.data.website || "");
        setShowCertificates(res.data.showCertificates !== false);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  // ==========================================
  // SAVE
  // ==========================================
  const saveProfile = async () => {
    if (!user) return;
    try {
      setSaving(true); setSaved(false);
      await axios.post("http://localhost:5000/api/users/save-user", {
        clerkId: user.id, name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        image: user.imageUrl,
        bio, location, website, showCertificates,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.log(e); }
    finally { setSaving(false); }
  };

  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "account", label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/settings" />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader title="Settings" subtitle="Manage your profile and account" />

        <div className="p-4 sm:p-6">

          {/* ── TABS ── */}
          <div className="flex gap-1 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="space-y-4 max-w-2xl">

              {/* Avatar card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-black flex-shrink-0">
                      {user?.fullName?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-900 text-base truncate">{user?.fullName}</h2>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Photo managed via Clerk account</p>
                  </div>
                  <UserButton />
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Bio</label>
                {loading ? (
                  <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself, your background, and what you're passionate about…"
                    rows={4}
                    maxLength={300}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none bg-slate-50 resize-none"
                  />
                )}
                <p className="text-[10px] text-slate-400 mt-1.5 text-right">{bio.length} / 300</p>
              </div>

              {/* Location + Website — side by side on larger screens */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Location</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📍</span>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-slate-50 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Website</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔗</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-slate-50 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate visibility */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Certificate Visibility</p>
                    <p className="text-xs text-slate-500 mt-1">When enabled, your certificates will be visible on your public profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCertificates(!showCertificates)}
                    className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCertificates ? "bg-blue-600" : "bg-slate-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showCertificates ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <p className={`text-[11px] font-semibold mt-3 ${showCertificates ? "text-emerald-600" : "text-slate-400"}`}>
                  {showCertificates ? "✓ Visible to others" : "Hidden"}
                </p>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {saved && (
                  <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                    <span className="text-base">✓</span> Saved
                  </span>
                )}
              </div>

            </div>
          )}

          {/* ── ACCOUNT TAB ── */}
          {activeTab === "account" && (
            <div className="space-y-4 max-w-2xl">

              {/* Account info */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Account Information</p>
                <div className="space-y-4">
                  {[
                    { label: "Full Name",     val: user?.fullName },
                    { label: "Email Address", val: user?.primaryEmailAddress?.emailAddress },
                    { label: "Member Since",  val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex items-start justify-between gap-3 pb-4 border-b border-slate-50 last:border-none last:pb-0">
                      <p className="text-xs text-slate-500 font-medium flex-shrink-0 w-28">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 text-right">{val || "—"}</p>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-slate-500 font-medium flex-shrink-0 w-28">User ID</p>
                    <p className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg break-all text-right">{user?.id || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Quick Links</p>
                <div className="space-y-2">
                  {[
                    { to: "/my-skills",     icon: "◈", label: "Manage Skills",    sub: "Add or remove your teaching and learning skills" },
                    { to: "/sessions",      icon: "◉", label: "My Sessions",      sub: "View upcoming and completed sessions" },
                    { to: "/certificates",  icon: "◑", label: "Certificates",     sub: "View and download your skill certificates" },
                    { to: "/matches",       icon: "⟡", label: "Find Matches",     sub: "Discover users who match your skills" },
                  ].map(({ to, icon, label, sub }) => (
                    <Link key={to} to={to}>
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition group">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-base">{icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{label}</p>
                            <p className="text-[11px] text-slate-400">{sub}</p>
                          </div>
                        </div>
                        <span className="text-slate-300 group-hover:text-slate-500 transition text-sm">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account management */}
              <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Account Management</p>
                <p className="text-xs text-slate-500 mb-4">
                  To update your name, email, or password, use the Clerk account portal.
                </p>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonTrigger: "border border-slate-200 rounded-xl px-4 py-2",
                    },
                  }}
                />
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default Settings;
