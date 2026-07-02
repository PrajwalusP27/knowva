import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { io } from "socket.io-client";

import { generateCertificatePDF } from "../utils/generateCertificatePDF";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";

// ==========================================
// SOCKET
// ==========================================
const socket = io("http://localhost:5000");


function Sessions() {

  const { user } = useUser();
  const navigate = useNavigate();

  const [sessions,      setSessions]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [reviewData,    setReviewData]    = useState({});
  const [notesData,     setNotesData]     = useState({});
  const [validationData,setValidationData]= useState({});
  const [peerTests,     setPeerTests]     = useState({});
  const [testFormData,  setTestFormData]  = useState({});
  const [answerData,    setAnswerData]    = useState({});
  const [reviewData2,   setReviewData2]   = useState({});
  const [testPanel,     setTestPanel]     = useState({});
  const [generatingCert,setGeneratingCert]= useState(null);
  const [generatedCerts,setGeneratedCerts]= useState({});
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [verifiedSkills,setVerifiedSkills]= useState([]);

  // ── helpers ──
  const getReview = (id) => reviewData[id]      || { rating: 5, text: "" };
  const getNotes  = (id) => notesData[id]       || { text: "", link: "" };
  const getVal    = (id) => validationData[id]  || { skill: "", rating: 5, feedback: "", result: "pass" };

  const setReview = (id, patch) => setReviewData((p)     => ({ ...p, [id]: { ...getReview(id), ...patch } }));
  const setNotes  = (id, patch) => setNotesData((p)      => ({ ...p, [id]: { ...getNotes(id),  ...patch } }));
  const setVal    = (id, patch) => setValidationData((p) => ({ ...p, [id]: { ...getVal(id),    ...patch } }));

  // ── derived ──
  const visibleSessions   = sessions.filter((s) => !(s.archivedBy || []).includes(user?.id));
  const upcomingSessions  = visibleSessions.filter((s) => s.status !== "completed");
  const completedSessions = visibleSessions.filter((s) => s.status === "completed");
  const selectedDateSessions = sessions.filter(
    (s) => new Date(s.date).toDateString() === selectedDate.toDateString()
  );

  // ==========================================
  // FETCH
  // ==========================================
  const fetchPeerTests = async () => {
    if (!user) return;
    try {
      const [sentRes, recvRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/peer-tests/sent/${user.id}`),
        axios.get(`http://localhost:5000/api/peer-tests/received/${user.id}`),
      ]);
      setPeerTests({ sent: sentRes.data || [], received: recvRes.data || [] });
    } catch (e) { console.log(e); }
  };

  const fetchVerifiedSkills = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/validations/verified-skills/${user?.id}`);
      setVerifiedSkills(res.data || []);
    } catch (e) { console.log(e); }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/my-sessions/${user?.id}`);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) { fetchSessions(); fetchVerifiedSkills(); fetchPeerTests(); }
  }, [user]);

  // ==========================================
  // SESSION ACTIONS
  // ==========================================
  const acceptSession = async (sessionId) => {
    const sess = sessions.find((s) => s._id === sessionId);
    await axios.put(`http://localhost:5000/api/sessions/accept/${sessionId}`);
    if (sess) socket.emit("send_notification", {
      recipientClerkId: sess.senderClerkId, senderClerkId: user?.id,
      senderName: user?.fullName, senderImage: user?.imageUrl || "",
      type: "session", title: `${user?.fullName} accepted your session request`,
      body: `Your session for "${sess.skill}" is now confirmed.`, linkTo: "/sessions",
    });
    fetchSessions();
  };

  const rejectSession = async (sessionId) => {
    const sess = sessions.find((s) => s._id === sessionId);
    await axios.put(`http://localhost:5000/api/sessions/reject/${sessionId}`);
    if (sess) socket.emit("send_notification", {
      recipientClerkId: sess.senderClerkId, senderClerkId: user?.id,
      senderName: user?.fullName, senderImage: user?.imageUrl || "",
      type: "session", title: `${user?.fullName} declined your session request`,
      body: `Session for "${sess.skill}" was not accepted.`, linkTo: "/sessions",
    });
    fetchSessions();
  };

  const completeSession = async (sessionId) => {
    const sess = sessions.find((s) => s._id === sessionId);
    await axios.put(`http://localhost:5000/api/sessions/complete/${sessionId}`);
    if (sess) {
      const otherId = sess.senderClerkId === user?.id ? sess.receiverClerkId : sess.senderClerkId;
      socket.emit("send_notification", {
        recipientClerkId: otherId, senderClerkId: user?.id,
        senderName: user?.fullName, senderImage: user?.imageUrl || "",
        type: "session", title: `Session completed — ${sess.skill}`,
        body: `${user?.fullName} marked the session as complete.`, linkTo: "/sessions",
      });
    }
    fetchSessions();
  };

  const archiveSession = async (sessionId) => {
    await axios.put(`http://localhost:5000/api/sessions/archive/${sessionId}`, { clerkId: user?.id });
    fetchSessions();
  };

  const submitReview = async (sessionId) => {
    const { rating, text } = getReview(sessionId);
    await axios.put(`http://localhost:5000/api/sessions/review/${sessionId}`, { rating, review: text });
    setReview(sessionId, { rating: 5, text: "" });
    fetchSessions();
  };

  const saveNotes = async (sessionId) => {
    const { text, link } = getNotes(sessionId);
    await axios.put(`http://localhost:5000/api/sessions/notes/${sessionId}`, { notes: text, resources: link });
    setNotes(sessionId, { text: "", link: "" });
    fetchSessions();
  };

  const submitValidation = async (session) => {
    const v = getVal(session._id);
    const receiver = session.senderClerkId === user?.id
      ? { id: session.receiverClerkId, name: session.receiverName }
      : { id: session.senderClerkId,   name: session.senderName };
    await axios.post("http://localhost:5000/api/validations/create", {
      validatorClerkId: user?.id, validatorName: user?.fullName,
      receiverClerkId: receiver.id, receiverName: receiver.name,
      skill: v.skill, rating: v.rating, feedback: v.feedback,
      result: v.result, sessionId: session._id,
    });
    setVal(session._id, { skill: "", rating: 5, feedback: "", result: "pass" });
    alert("Validation submitted successfully!");
    fetchSessions();
  };

  // ==========================================
  // PEER TEST ACTIONS
  // ==========================================
  const createPeerTest = async (session) => {
    const fd = testFormData[session._id] || {};
    const questions = fd.questions || [{ question: "", expectedAnswer: "" }];
    const skill = fd.skill || "";
    if (!skill.trim() || questions.some((q) => !q.question.trim())) {
      alert("Please fill in the skill and all questions."); return;
    }
    if (session.receiverClerkId !== user?.id) {
      alert("Only the teacher can create a peer test."); return;
    }
    await axios.post("http://localhost:5000/api/peer-tests/create", {
      testerClerkId: user.id, testerName: user.fullName,
      testeeClerkId: session.senderClerkId, testeeName: session.senderName,
      skill, questions, sessionId: session._id,
    });
    setTestPanel((p) => ({ ...p, [session._id]: "done" }));
    socket.emit("send_notification", {
      recipientClerkId: session.senderClerkId, senderClerkId: user?.id,
      senderName: user?.fullName, senderImage: user?.imageUrl || "",
      type: "peer_test", title: `${user?.fullName} sent you a peer test`,
      body: `You have a new peer test for "${skill}". Open Sessions to answer.`, linkTo: "/sessions",
    });
    await fetchPeerTests();
  };

  const submitTestAnswers = async (test) => {
    const answers = answerData[test._id] || [];
    await axios.put(`http://localhost:5000/api/peer-tests/submit/${test._id}`, { answers });
    socket.emit("send_notification", {
      recipientClerkId: test.testerClerkId, senderClerkId: user?.id,
      senderName: user?.fullName, senderImage: user?.imageUrl || "",
      type: "peer_test", title: `${user?.fullName} submitted peer test answers`,
      body: `Answers for "${test.skill}" are ready for your review.`, linkTo: "/sessions",
    });
    await fetchPeerTests();
  };

  const reviewPeerTest = async (test) => {
    const rd = reviewData2[test._id] || {};
    if (!rd.result) { alert("Please select Pass or Fail."); return; }
    await axios.put(`http://localhost:5000/api/peer-tests/review/${test._id}`, {
      score: rd.score || 0, result: rd.result, testerFeedback: rd.feedback || "",
    });
    const label = rd.result === "pass" ? "passed" : "failed";
    socket.emit("send_notification", {
      recipientClerkId: test.testeeClerkId, senderClerkId: user?.id,
      senderName: user?.fullName, senderImage: user?.imageUrl || "",
      type: "peer_test", title: `You ${label} the peer test for "${test.skill}"`,
      body: rd.feedback ? `Feedback: ${rd.feedback}` : `Score: ${rd.score || 0}`, linkTo: "/sessions",
    });
    await fetchPeerTests();
  };

  // ==========================================
  // CERTIFICATE ACTIONS
  // ==========================================
  const generateCertificate = async (session, peerTest) => {
    try {
      setGeneratingCert(session._id);
      const res = await axios.post("http://localhost:5000/api/certificates/issue", {
        clerkId: session.senderClerkId, userName: session.senderName,
        skill: peerTest.skill, teacherClerkId: user?.id,
        teacherName: session.receiverName, sessionCompleted: true,
        peerTestPassed: true, validationCount: 0, averageRating: 0,
      });
      const cert = res.data.certificate;
      setGeneratedCerts((p) => ({ ...p, [session._id]: cert }));
      socket.emit("send_notification", {
        recipientClerkId: session.senderClerkId, senderClerkId: user?.id,
        senderName: user?.fullName, senderImage: user?.imageUrl || "",
        type: "certificate", title: `${user?.fullName} generated your certificate`,
        body: `Your certificate for "${peerTest.skill}" is ready. Check your Sessions page.`, linkTo: "/sessions",
      });
    } catch (error) {
      if (error.response?.status === 409 && error.response.data.certificate) {
        setGeneratedCerts((p) => ({ ...p, [session._id]: error.response.data.certificate }));
      } else { console.log(error); }
    } finally { setGeneratingCert(null); }
  };

  const downloadCertificate = async (cert) => {
    const completionDate = new Date(cert.createdAt).toLocaleDateString(
      "en-US", { year: "numeric", month: "long", day: "numeric" }
    );
    await generateCertificatePDF({
      learnerName: cert.userName, skillName: cert.skill,
      teacherName: cert.teacherName || "Knowva Instructor",
      completionDate, certificateId: cert.certificateId,
    });
  };

  const sendCertificateViaMessages = async (session, cert) => {
    try {
      await axios.post("http://localhost:5000/api/messages/send", {
        senderClerkId: user?.id, receiverClerkId: session.senderClerkId,
        senderName: user?.fullName, message: cert.certText,
      });
      socket.emit("send_notification", {
        recipientClerkId: session.senderClerkId, senderClerkId: user?.id,
        senderName: user?.fullName, senderImage: user?.imageUrl || "",
        type: "certificate", title: `${user?.fullName} sent you a certificate`,
        body: `Certificate for "${cert.skill}" has been delivered to your messages.`, linkTo: "/messages",
      });
      alert("Certificate sent to learner via Messages!");
    } catch (e) { console.log(e); alert("Failed to send certificate. Please try again."); }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const statusBadge = (status) => {
    const map = {
      accepted:  "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      rejected:  "bg-red-100 text-red-600",
      pending:   "bg-yellow-100 text-yellow-700",
    };
    return `px-3 py-1 rounded-lg text-xs font-semibold capitalize ${map[status] || map.pending}`;
  };

  const roleBadge = (role) =>
    role === "Teacher"
      ? "bg-violet-100 text-violet-700 px-3 py-1 rounded-lg text-xs font-semibold"
      : "bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-semibold";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex">

      <Sidebar active="/sessions" />

      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* Sticky header */}
        <PageHeader title="Sessions" subtitle="Manage your learning sessions" />

        <div className="p-4 sm:p-6 space-y-4">

          {/* ── CALENDAR ── */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Session Calendar</h2>
            <p className="text-xs text-slate-400 mb-4">View your scheduled sessions by date.</p>
            <Calendar onChange={setSelectedDate} value={selectedDate} />

            {selectedDateSessions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Sessions on {selectedDate.toDateString()}
                </p>
                {selectedDateSessions.map((session) => (
                  <div key={session._id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{session.topic}</p>
                      <p className="text-xs text-slate-400">{session.time}</p>
                    </div>
                    <span className={statusBadge(session.status)}>{session.status}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedDateSessions.length === 0 && (
              <p className="text-xs text-slate-400 mt-4">No sessions on this date.</p>
            )}
          </div>

          {/* ── VERIFIED SKILLS ── */}
          {verifiedSkills.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Verified Skills</h2>
              <p className="text-xs text-slate-400 mb-4">Skills validated by peers.</p>
              <div className="space-y-2">
                {verifiedSkills.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{skill.skill}</p>
                      <p className="text-xs text-slate-400">{skill.verifiedBy} peer validations</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-500 text-sm">{"⭐".repeat(Math.round(skill.averageRating))}</p>
                      <p className="text-xs text-slate-400">{skill.averageRating}/5</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SESSIONS ── */}
          {loading ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-sm text-slate-400">
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm font-semibold text-slate-600 mb-1">No sessions yet</p>
              <p className="text-xs text-slate-400">Book a session from the Messages page with a connection.</p>
            </div>
          ) : (
            <>
              {/* UPCOMING */}
              {upcomingSessions.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800 mb-3">Upcoming Sessions</h2>
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => {
                      const isReceiver   = session.receiverClerkId === user?.id;
                      const otherName    = session.senderClerkId === user?.id ? session.receiverName : session.senderName;
                      const sessionRole  = session.senderClerkId === user?.id ? "Learner" : "Teacher";
                      const meetingLink  = `https://meet.jit.si/knowva-${session._id}`;

                      return (
                        <div key={session._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm">{session.topic}</p>
                              {session.description && (
                                <p className="text-xs text-slate-500 mt-1">{session.description}</p>
                              )}
                            </div>
                            <span className={statusBadge(session.status)}>{session.status}</span>
                          </div>

                          {/* Meta chips */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg">📅 {session.date}</span>
                            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg">⏰ {session.time}</span>
                            <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium">{otherName}</span>
                            <span className={roleBadge(sessionRole)}>{sessionRole}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            {isReceiver && session.status === "pending" && (
                              <>
                                <button onClick={() => acceptSession(session._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Accept</button>
                                <button onClick={() => rejectSession(session._id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Reject</button>
                              </>
                            )}
                            {session.status === "accepted" && (
                              <>
                                <button onClick={() => completeSession(session._id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Mark Completed</button>
                                <a href={meetingLink} target="_blank" rel="noreferrer" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Join Meeting</a>
                              </>
                            )}
                            <button
                              onClick={() => navigate("/chat", { state: { otherUserId: session.senderClerkId === user?.id ? session.receiverClerkId : session.senderClerkId, otherUserName: otherName } })}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition"
                            >
                              Open Chat
                            </button>
                            {(session.status === "accepted" || session.status === "rejected") && (
                              <button onClick={() => archiveSession(session._id)} className="text-slate-400 hover:text-slate-600 border border-slate-200 text-xs px-3 py-2 rounded-xl transition">Archive</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COMPLETED */}
              {completedSessions.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800 mb-3 mt-2">Completed Sessions</h2>
                  <div className="space-y-4">
                    {completedSessions.map((session) => {
                      const otherName   = session.senderClerkId === user?.id ? session.receiverName : session.senderName;
                      const sessionRole = session.senderClerkId === user?.id ? "Learner" : "Teacher";
                      const isTeacher   = session.receiverClerkId === user?.id;
                      const isLearner   = session.senderClerkId === user?.id;

                      const sentTest     = (peerTests.sent     || []).find((t) => t.sessionId === session._id);
                      const receivedTest = (peerTests.received || []).find((t) => t.sessionId === session._id);
                      const testForCert  = (peerTests.sent     || []).find((t) => t.sessionId === session._id && t.status === "reviewed");
                      const learnerPassed = testForCert?.result === "pass";
                      const alreadyGenerated = generatedCerts[session._id];

                      const panel = testPanel[session._id];
                      const fd = testFormData[session._id] || {};
                      const questions = fd.questions || [{ question: "", expectedAnswer: "" }];

                      const updateTF = (patch) => setTestFormData((p) => ({ ...p, [session._id]: { ...p[session._id], ...patch } }));
                      const updateQ = (qi, field, val) => {
                        const updated = questions.map((q, i) => i === qi ? { ...q, [field]: val } : q);
                        updateTF({ questions: updated });
                      };

                      return (
                        <div key={session._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm">{session.topic}</p>
                              {session.description && (
                                <p className="text-xs text-slate-500 mt-1">{session.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={statusBadge("completed")}>Completed</span>
                              <button onClick={() => archiveSession(session._id)} className="text-[11px] text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1 rounded-lg transition">Archive</button>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex flex-wrap gap-2 mb-5">
                            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg">📅 {session.date}</span>
                            <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-lg">⏰ {session.time}</span>
                            <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium">{otherName}</span>
                            <span className={roleBadge(sessionRole)}>{sessionRole}</span>
                          </div>

                          {/* ── NOTES ── */}
                          {(session.notes || session.resources) ? (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
                              <p className="text-xs font-semibold text-slate-600 mb-2">Session Notes</p>
                              {session.notes && <p className="text-sm text-slate-600 whitespace-pre-wrap">{session.notes}</p>}
                              {session.resources && (
                                <a href={session.resources} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-2 inline-block">Open Resource →</a>
                              )}
                            </div>
                          ) : (
                            <div className="mb-4 space-y-2">
                              <textarea
                                value={getNotes(session._id).text}
                                onChange={(e) => setNotes(session._id, { text: e.target.value })}
                                placeholder="Write session notes…"
                                rows={3}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                              <input
                                type="text"
                                value={getNotes(session._id).link}
                                onChange={(e) => setNotes(session._id, { link: e.target.value })}
                                placeholder="Paste resource link…"
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button onClick={() => saveNotes(session._id)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Save Notes</button>
                            </div>
                          )}

                          {/* ── VALIDATION ── */}
                          <div className="border-t border-slate-100 pt-4 mb-4">
                            {session.hasValidated ? (
                              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl w-fit">
                                ✅ Peer validation submitted
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-700">Validate Peer</p>
                                <input
                                  type="text"
                                  value={getVal(session._id).skill}
                                  onChange={(e) => setVal(session._id, { skill: e.target.value })}
                                  placeholder="Skill validated (React, Design, Java…)"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map((star) => (
                                    <button key={star} onClick={() => setVal(session._id, { rating: star })}
                                      className={`text-2xl ${getVal(session._id).rating >= star ? "text-amber-400" : "text-slate-200"}`}>★</button>
                                  ))}
                                </div>
                                <textarea
                                  value={getVal(session._id).feedback}
                                  onChange={(e) => setVal(session._id, { feedback: e.target.value })}
                                  placeholder="Write feedback…"
                                  rows={2}
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => setVal(session._id, { result: "pass" })}
                                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${getVal(session._id).result === "pass" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>Pass</button>
                                  <button onClick={() => setVal(session._id, { result: "fail" })}
                                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${getVal(session._id).result === "fail" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>Fail</button>
                                  <button onClick={() => submitValidation(session)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition ml-auto">Submit Validation</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ── REVIEW ── */}
                          <div className="border-t border-slate-100 pt-4 mb-4">
                            {session.rating > 0 ? (
                              <div>
                                <p className="text-amber-400 text-sm">{"⭐".repeat(session.rating)}</p>
                                {session.review && <p className="text-xs text-slate-500 mt-1 italic">"{session.review}"</p>}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-700">Leave a Review</p>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map((star) => (
                                    <button key={star} onClick={() => setReview(session._id, { rating: star })}
                                      className={`text-xl ${getReview(session._id).rating >= star ? "text-amber-400" : "text-slate-200"}`}>★</button>
                                  ))}
                                </div>
                                <textarea
                                  value={getReview(session._id).text}
                                  onChange={(e) => setReview(session._id, { text: e.target.value })}
                                  placeholder="Write your review…"
                                  rows={2}
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <button onClick={() => submitReview(session._id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Submit Review</button>
                              </div>
                            )}
                          </div>

                          {/* ── PEER TEST ── */}
                          <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-semibold text-slate-700 mb-3">Peer Test</p>

                            {/* Learner: received test */}
                            {receivedTest && receivedTest.status === "sent" && (
                              <div className="space-y-3">
                                <p className="text-xs text-slate-500">{receivedTest.testerName} sent you a test on <strong>{receivedTest.skill}</strong>.</p>
                                {receivedTest.questions.map((q, qi) => (
                                  <div key={qi} className="space-y-1.5">
                                    <p className="text-xs font-medium text-slate-700">Q{qi + 1}. {q.question}</p>
                                    <textarea
                                      value={(answerData[receivedTest._id] || [])[qi] || ""}
                                      onChange={(e) => {
                                        const arr = [...(answerData[receivedTest._id] || Array(receivedTest.questions.length).fill(""))];
                                        arr[qi] = e.target.value;
                                        setAnswerData((p) => ({ ...p, [receivedTest._id]: arr }));
                                      }}
                                      placeholder="Your answer…"
                                      rows={2}
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                  </div>
                                ))}
                                <button onClick={() => submitTestAnswers(receivedTest)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Submit Answers</button>
                              </div>
                            )}

                            {receivedTest && receivedTest.status === "answered" && (
                              <p className="text-xs text-slate-400 italic">Answers submitted. Waiting for {receivedTest.testerName} to review.</p>
                            )}

                            {receivedTest && receivedTest.status === "reviewed" && (
                              <div className="space-y-2">
                                <div className={`px-4 py-3 rounded-xl text-sm ${receivedTest.result === "pass" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                                  <p className="font-semibold">{receivedTest.result === "pass" ? "✓ Passed" : "✗ Failed"} — Score: {receivedTest.score}/{receivedTest.totalQuestions}</p>
                                  {receivedTest.testerFeedback && <p className="text-xs mt-1 opacity-80">{receivedTest.testerFeedback}</p>}
                                </div>
                                {receivedTest.result === "fail" && (
                                  <button
                                    onClick={async () => {
                                      await axios.put(`http://localhost:5000/api/peer-tests/request-retest/${receivedTest._id}`);
                                      socket.emit("send_notification", {
                                        recipientClerkId: session.receiverClerkId, senderClerkId: user?.id,
                                        senderName: user?.fullName, senderImage: user?.imageUrl || "",
                                        type: "retest", title: `${user?.fullName} requested a retest`,
                                        body: "They need another attempt at the peer test.", linkTo: "/sessions",
                                      });
                                      fetchPeerTests();
                                    }}
                                    className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl transition font-medium"
                                  >
                                    Request Retest
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Teacher: sent test */}
                            {sentTest && sentTest.status === "sent" && (
                              <p className="text-xs text-slate-400 italic">Waiting for {sentTest.testeeName} to answer.</p>
                            )}

                            {sentTest && sentTest.status === "answered" && (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-700">Review {sentTest.testeeName}'s answers:</p>
                                {sentTest.questions.map((q, qi) => (
                                  <div key={qi} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-medium">Q{qi + 1}. {q.question}</p>
                                    <p className="text-xs text-slate-600"><span className="font-medium">Answer:</span> {q.submittedAnswer || "—"}</p>
                                    <p className="text-xs text-emerald-700"><span className="font-medium">Expected:</span> {q.expectedAnswer || "—"}</p>
                                  </div>
                                ))}
                                <div className="flex flex-wrap gap-2 items-center">
                                  <input type="number" min={0} max={sentTest.totalQuestions}
                                    value={reviewData2[sentTest._id]?.score || ""}
                                    onChange={(e) => setReviewData2((p) => ({ ...p, [sentTest._id]: { ...p[sentTest._id], score: Number(e.target.value) } }))}
                                    placeholder="Score" className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
                                  <span className="text-xs text-slate-400">/ {sentTest.totalQuestions}</span>
                                  <button onClick={() => setReviewData2((p) => ({ ...p, [sentTest._id]: { ...p[sentTest._id], result: "pass" } }))}
                                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${reviewData2[sentTest._id]?.result === "pass" ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Pass</button>
                                  <button onClick={() => setReviewData2((p) => ({ ...p, [sentTest._id]: { ...p[sentTest._id], result: "fail" } }))}
                                    className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${reviewData2[sentTest._id]?.result === "fail" ? "bg-red-500 text-white" : "bg-slate-100"}`}>Fail</button>
                                  <button onClick={() => reviewPeerTest(sentTest)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Submit Review</button>
                                </div>
                              </div>
                            )}

                            {sentTest && sentTest.status === "reviewed" && (
                              <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${sentTest.result === "pass" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                                Test closed — Score: {sentTest.score}/{sentTest.totalQuestions} ({sentTest.result})
                              </div>
                            )}

                            {sentTest && sentTest.status === "retest-requested" && (
                              <div className="space-y-2">
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">{sentTest.testeeName} requested a retest.</p>
                                <button onClick={() => setTestPanel((p) => ({ ...p, [session._id]: "creating" }))}
                                  className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl transition font-semibold">Create Retest</button>
                              </div>
                            )}

                            {/* Create test form */}
                            {panel === "creating" && (
                              <div className="space-y-3 mt-2">
                                <input type="text" value={fd.skill || ""} onChange={(e) => updateTF({ skill: e.target.value })}
                                  placeholder="Skill being tested…" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                {questions.map((q, qi) => (
                                  <div key={qi} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-slate-400">Q{qi + 1}</span>
                                      {questions.length > 1 && (
                                        <button onClick={() => updateTF({ questions: questions.filter((_, i) => i !== qi) })} className="text-slate-300 hover:text-red-400 text-lg leading-none">×</button>
                                      )}
                                    </div>
                                    <input type="text" value={q.question} onChange={(e) => updateQ(qi, "question", e.target.value)}
                                      placeholder="Question…" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white" />
                                    <input type="text" value={q.expectedAnswer} onChange={(e) => updateQ(qi, "expectedAnswer", e.target.value)}
                                      placeholder="Expected answer (private)…" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none bg-white text-slate-500" />
                                  </div>
                                ))}
                                <button onClick={() => updateTF({ questions: [...questions, { question: "", expectedAnswer: "" }] })}
                                  className="text-xs text-blue-600 font-medium">+ Add question</button>
                                <div className="flex gap-2">
                                  <button onClick={() => createPeerTest(session)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition">Send Test</button>
                                  <button onClick={() => setTestPanel((p) => ({ ...p, [session._id]: null }))} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-5 py-2 rounded-xl transition">Cancel</button>
                                </div>
                              </div>
                            )}

                            {panel === "done" && (
                              <p className="text-xs text-emerald-600 font-medium">✓ Test sent successfully.</p>
                            )}

                            {/* No test yet — teacher can create */}
                            {!receivedTest && !sentTest && panel !== "creating" && panel !== "done" && isTeacher && (
                              <button onClick={() => setTestPanel((p) => ({ ...p, [session._id]: "creating" }))}
                                className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-xl transition font-medium">
                                + Create Peer Test
                              </button>
                            )}

                            {!receivedTest && !sentTest && panel !== "creating" && panel !== "done" && isLearner && (
                              <p className="text-xs text-slate-400 italic">Waiting for your teacher to send a peer test.</p>
                            )}
                          </div>

                          {/* ── CERTIFICATE (teacher only) ── */}
                          {isTeacher && (
                            <div className="border-t border-slate-100 pt-4 mt-4">
                              <p className="text-xs font-semibold text-slate-700 mb-3">Certificate</p>

                              {alreadyGenerated ? (
                                <div className="space-y-3">
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-emerald-600 text-sm">✓</span>
                                      <p className="text-sm font-bold text-emerald-700">Certificate Issued</p>
                                    </div>
                                    <p className="text-xs font-mono text-slate-400 mt-1">{alreadyGenerated.certificateId}</p>
                                    <p className="text-xs text-slate-600 mt-1"><span className="font-medium">{alreadyGenerated.userName}</span> · {alreadyGenerated.skill}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => downloadCertificate(alreadyGenerated)}
                                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">⬇ Download</button>
                                    <button onClick={() => sendCertificateViaMessages(session, alreadyGenerated)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">Send via Messages</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-500">
                                    {learnerPassed
                                      ? `${session.senderName} passed the peer test. You can now generate their certificate.`
                                      : "Certificate can only be generated after the learner passes the peer test."}
                                  </p>
                                  <button
                                    onClick={() => generateCertificate(session, testForCert)}
                                    disabled={!learnerPassed || generatingCert === session._id}
                                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${learnerPassed ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                                  >
                                    {generatingCert === session._id ? "Generating…" : "Generate Certificate"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default Sessions;
