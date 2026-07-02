import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";


function MySkills() {

  const { user }   = useUser();
  const navigate   = useNavigate();

  // ── skill inputs ──
  const [teachInput,  setTeachInput]  = useState("");
  const [learnInput,  setLearnInput]  = useState("");

  // ── data ──
  const [teachSkills,    setTeachSkills]    = useState([]);
  const [learnSkills,    setLearnSkills]    = useState([]);
  const [verifiedSkills, setVerifiedSkills] = useState([]);
  const [allValidations, setAllValidations] = useState([]);
  const [trustScore,     setTrustScore]     = useState(null);
  const [myBadges,       setMyBadges]       = useState([]);
  const [myCerts,        setMyCerts]        = useState([]);
  const [eligibleCerts,  setEligibleCerts]  = useState([]);

  // ── ui ──
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [issuingCert, setIssuingCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab,   setActiveTab]   = useState("teaching");

  // ==========================================
  // FETCH
  // ==========================================
  const fetchUserData = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
      if (res.data) {
        setTeachSkills(res.data.teachSkills || []);
        setLearnSkills(res.data.learnSkills || []);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const fetchVerifiedSkills = async () => {
    if (!user) return;
    try {
      const [verRes, allRes, scoreRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/validations/verified-skills/${user.id}`),
        axios.get(`http://localhost:5000/api/validations/user/${user.id}`),
        axios.get(`http://localhost:5000/api/users/trust-score/${user.id}`),
      ]);
      setVerifiedSkills(verRes.data || []);
      setAllValidations(allRes.data || []);
      setTrustScore(scoreRes.data || null);

      const [badgesRes, certsRes, eligRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/badges/${user.id}`),
        axios.get(`http://localhost:5000/api/certificates/my/${user.id}`),
        axios.get(`http://localhost:5000/api/certificates/eligible/${user.id}`),
      ]);
      setMyBadges(badgesRes.data || []);
      setMyCerts(certsRes.data || []);
      setEligibleCerts(eligRes.data?.eligible || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    if (user) { fetchUserData(); fetchVerifiedSkills(); }
  }, [user]);

  // ==========================================
  // SKILL ACTIONS
  // ==========================================
  const saveSkills = async (updatedTeach, updatedLearn) => {
    if (!user) return;
    try {
      setSaving(true);
      await axios.post("http://localhost:5000/api/users/save-user", {
        clerkId: user.id, name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        image: user.imageUrl,
        teachSkills: updatedTeach, learnSkills: updatedLearn,
      });
    } catch (e) { console.log(e); }
    finally { setSaving(false); }
  };

  const addTeachSkill = async () => {
    if (!teachInput.trim() || teachSkills.includes(teachInput.trim())) { setTeachInput(""); return; }
    const updated = [...teachSkills, teachInput.trim()];
    setTeachSkills(updated); setTeachInput(""); await saveSkills(updated, learnSkills);
  };

  const addLearnSkill = async () => {
    if (!learnInput.trim() || learnSkills.includes(learnInput.trim())) { setLearnInput(""); return; }
    const updated = [...learnSkills, learnInput.trim()];
    setLearnSkills(updated); setLearnInput(""); await saveSkills(teachSkills, updated);
  };

  const removeTeachSkill = async (index) => {
    const updated = teachSkills.filter((_, i) => i !== index);
    setTeachSkills(updated); await saveSkills(updated, learnSkills);
  };

  const removeLearnSkill = async (index) => {
    const updated = learnSkills.filter((_, i) => i !== index);
    setLearnSkills(updated); await saveSkills(teachSkills, updated);
  };

  const claimCert = async (item) => {
    try {
      setIssuingCert(item.skill);
      await axios.post("http://localhost:5000/api/certificates/issue", {
        clerkId: user.id, userName: user.fullName, skill: item.skill,
        validationCount: item.validationCount, averageRating: item.averageRating,
        sessionCompleted: item.sessionCompleted, peerTestPassed: item.peerTestPassed,
      });
      const [certsRes, eligRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/certificates/my/${user.id}`),
        axios.get(`http://localhost:5000/api/certificates/eligible/${user.id}`),
      ]);
      setMyCerts(certsRes.data || []);
      setEligibleCerts(eligRes.data?.eligible || []);
    } catch (e) { console.log(e); }
    finally { setIssuingCert(null); }
  };

  const checkBadges = async () => {
    try {
      await axios.post(`http://localhost:5000/api/badges/award/${user.id}`, { userName: user.fullName });
      const res = await axios.get(`http://localhost:5000/api/badges/${user.id}`);
      setMyBadges(res.data || []);
    } catch (e) { console.log(e); }
  };

  // ==========================================
  // COMPUTED
  // ==========================================
  const totalValidations  = allValidations.length;
  const passedValidations = allValidations.filter((v) => v.result === "pass").length;
  const avgRating         = totalValidations > 0
    ? (allValidations.reduce((s, v) => s + v.rating, 0) / totalValidations).toFixed(1)
    : "0.0";
  const verifiedCount = verifiedSkills.length;
  const score = trustScore?.score || 0;

  const q = searchQuery.toLowerCase();
  const filteredTeach    = teachSkills.filter((s) => s.toLowerCase().includes(q));
  const filteredLearn    = learnSkills.filter((s) => s.toLowerCase().includes(q));
  const filteredVerified = verifiedSkills.filter((s) => s.skill.toLowerCase().includes(q));
  const recentActivity   = allValidations.slice(0, 5);

  const TABS = [
    { key: "teaching",  label: "Teaching",                          count: teachSkills.length },
    { key: "learning",  label: "Learning",                          count: learnSkills.length },
    { key: "verified",  label: "Verified",                          count: verifiedCount },
    { key: "activity",  label: "Activity",                          count: recentActivity.length },
    { key: "badges",    label: "Badges",                            count: myBadges.length },
    { key: "certs",     label: "Certificates",                      count: myCerts.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/my-skills" />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <PageHeader
          title="My Skills"
          subtitle="Manage what you teach, learn, and have verified"
          right={saving && <span className="text-[11px] text-blue-500 animate-pulse">Saving…</span>}
        />

        <div className="p-4 sm:p-6 space-y-5">

          {/* ── STATS ROW ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Teaching",    val: teachSkills.length, color: "text-blue-600",   bg: "bg-blue-50",    suffix: "skills" },
              { label: "Learning",    val: learnSkills.length, color: "text-slate-700",  bg: "bg-slate-50",   suffix: "skills" },
              { label: "Verified",    val: verifiedCount,      color: "text-emerald-600",bg: "bg-emerald-50", suffix: "peer-validated" },
              { label: "Avg Rating",  val: avgRating,          color: "text-amber-600",  bg: "bg-amber-50",   suffix: `from ${totalValidations} reviews` },
              { label: "Trust Score", val: score,              color: score >= 75 ? "text-emerald-600" : score >= 50 ? "text-blue-600" : "text-amber-600", bg: "bg-white", suffix: "out of 100", progress: score },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border border-white rounded-2xl p-4 shadow-sm`}>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
                {s.progress !== undefined && (
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                    <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${s.progress}%` }} />
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">{s.suffix}</p>
              </div>
            ))}
          </div>

          {/* ── SEARCH ── */}
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? "opacity-60" : "text-slate-400"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: TEACHING ── */}
          {activeTab === "teaching" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a skill you can teach…"
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTeachSkill()}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
                />
                <button onClick={addTeachSkill} className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-sm font-semibold transition">
                  Add
                </button>
              </div>

              {loading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3].map((i) => <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : filteredTeach.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎓</p>
                  <p className="text-sm text-slate-500">{searchQuery ? "No skills match your search." : "No teaching skills yet. Add one above."}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredTeach.map((skill, i) => {
                    const verified = verifiedSkills.find((v) => v.skill.toLowerCase() === skill.toLowerCase());
                    return (
                      <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                        {skill}
                        {verified && <span className="text-emerald-500 text-xs font-bold" title="Peer verified">✓</span>}
                        <button onClick={() => removeTeachSkill(teachSkills.indexOf(skill))} className="text-blue-300 hover:text-red-500 font-bold transition ml-0.5">×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: LEARNING ── */}
          {activeTab === "learning" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a skill you want to learn…"
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLearnSkill()}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
                />
                <button onClick={addLearnSkill} className="bg-slate-800 hover:bg-slate-900 text-white px-5 rounded-xl text-sm font-semibold transition">
                  Add
                </button>
              </div>

              {loading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3].map((i) => <div key={i} className="h-8 w-24 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : filteredLearn.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">📚</p>
                  <p className="text-sm text-slate-500">{searchQuery ? "No skills match your search." : "No learning skills yet. Add one above."}</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredLearn.map((skill, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                      {skill}
                      <button onClick={() => removeLearnSkill(learnSkills.indexOf(skill))} className="text-slate-400 hover:text-red-500 font-bold transition ml-0.5">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: VERIFIED ── */}
          {activeTab === "verified" && (
            <div className="space-y-3">
              {filteredVerified.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-3xl mb-3">✅</p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">{searchQuery ? "No verified skills match your search." : "No verified skills yet."}</p>
                  <p className="text-xs text-slate-400">Complete sessions and get peer validations to appear here.</p>
                </div>
              ) : (
                filteredVerified.map((item) => {
                  const progress = Math.min((parseFloat(item.averageRating) / 5) * 100, 100);
                  return (
                    <div key={item.skill} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-sm">{item.skill}</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Verified</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{item.verifiedBy} peer {item.verifiedBy === 1 ? "validation" : "validations"}</p>

                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Skill level</span>
                              <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-amber-400 text-base">{"★".repeat(Math.round(parseFloat(item.averageRating)))}</div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.averageRating} / 5</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          ✓ {item.verifiedBy} validation{item.verifiedBy !== 1 ? "s" : ""}
                        </span>
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          ★ {item.averageRating} avg
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: ACTIVITY ── */}
          {activeTab === "activity" && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {recentActivity.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-3xl mb-3">📊</p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No recent activity</p>
                  <p className="text-xs text-slate-400">Peer validations will appear here.</p>
                </div>
              ) : (
                recentActivity.map((v, i) => (
                  <div key={v._id} className="flex items-start justify-between px-5 py-4 border-b border-slate-50 last:border-none">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800">{v.skill}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.result === "pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {v.result === "pass" ? "Passed" : "Needs work"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        By <span className="font-semibold text-slate-700">{v.validatorName}</span>
                      </p>
                      {v.feedback && <p className="text-[11px] text-slate-400 mt-0.5 italic">"{v.feedback}"</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-amber-400 text-sm">{"★".repeat(v.rating)}{"☆".repeat(5 - v.rating)}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(v.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: BADGES ── */}
          {activeTab === "badges" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500">{myBadges.length > 0 ? `${myBadges.length} badge${myBadges.length !== 1 ? "s" : ""} earned` : "No badges yet"}</p>
                <button onClick={checkBadges} className="text-[11px] text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition font-semibold">
                  Check for New Badges
                </button>
              </div>

              {myBadges.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-3xl mb-3">🏅</p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No badges yet</p>
                  <p className="text-xs text-slate-400">Complete sessions and get peer validations to earn badges.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {myBadges.map((badge) => (
                    <div key={badge._id} className={`bg-white border rounded-2xl p-4 text-center shadow-sm ${
                      badge.tier === "gold" ? "ring-2 ring-amber-400 border-amber-100" :
                      badge.tier === "silver" ? "ring-2 ring-slate-300 border-slate-100" :
                      "ring-2 ring-orange-300 border-orange-100"
                    }`}>
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className="font-bold text-slate-800 text-sm">{badge.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{badge.description}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize ${
                        badge.tier === "gold" ? "bg-amber-100 text-amber-700" :
                        badge.tier === "silver" ? "bg-slate-100 text-slate-600" :
                        "bg-orange-100 text-orange-700"
                      }`}>{badge.tier}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CERTIFICATES ── */}
          {activeTab === "certs" && (
            <div className="space-y-4">
              {/* Eligible */}
              {eligibleCerts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">Ready to Claim</p>
                  <div className="space-y-2">
                    {eligibleCerts.map((item) => (
                      <div key={item.skill} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.skill}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.validationCount} validations · ★ {item.averageRating} avg
                          </p>
                        </div>
                        <button
                          onClick={() => claimCert(item)}
                          disabled={issuingCert === item.skill}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap"
                        >
                          {issuingCert === item.skill ? "Issuing…" : "Claim"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issued certificates */}
              {myCerts.length === 0 && eligibleCerts.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-3xl mb-3">📜</p>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No certificates yet</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Complete a session, pass a peer test, and get peer validations to earn a certificate.</p>
                </div>
              ) : (
                myCerts.map((cert) => (
                  <div key={cert._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl flex-shrink-0">📜</div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{cert.skill}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(cert.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                          <p className="text-base font-black text-blue-600">{cert.validationCount}</p>
                          <p className="text-[10px] text-slate-400">Validations</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                          <p className="text-base font-black text-amber-600">{cert.averageRating}</p>
                          <p className="text-[10px] text-slate-400">Avg Rating</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center overflow-hidden">
                          <p className="text-[9px] font-mono font-bold text-slate-600 truncate">{cert.certificateId}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Cert ID</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default MySkills;
