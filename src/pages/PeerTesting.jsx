import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import axios from "axios";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";


// ==========================================
// STATUS BADGE HELPER
// ==========================================
function StatusBadge({ status }) {

  const map = {
    sent:     { label: "Awaiting Answer", bg: "bg-yellow-100", text: "text-yellow-700" },
    answered: { label: "Needs Review",    bg: "bg-blue-100",   text: "text-blue-700" },
    reviewed: { label: "Reviewed",        bg: "bg-green-100",  text: "text-green-700" },
    created:  { label: "Draft",           bg: "bg-slate-100",  text: "text-slate-600" },
  };

  const s = map[status] || map.created;

  return (
    <span
      className={`text-xs font-medium px-3 py-1 rounded-xl ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}


// ==========================================
// RESULT BADGE HELPER
// ==========================================
function ResultBadge({ result }) {

  if (!result || result === "pending") return null;

  return (
    <span
      className={`text-xs font-bold px-3 py-1 rounded-xl ${
        result === "pass"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}
    >
      {result === "pass" ? "Passed" : "Failed"}
    </span>
  );
}


function PeerTesting() {

  const { user } = useUser();

  // ==========================================
  // TABS: sent | received
  // ==========================================
  const [tab, setTab] =
    useState("received");

  // ==========================================
  // DATA
  // ==========================================
  const [sentTests, setSentTests] =
    useState([]);

  const [receivedTests, setReceivedTests] =
    useState([]);

  const [connections, setConnections] =
    useState([]);

  // ==========================================
  // UI: CREATE TEST FORM
  // ==========================================
  const [showCreate, setShowCreate] =
    useState(false);

  const [targetUser, setTargetUser] =
    useState(null);

  const [skill, setSkill] =
    useState("");

  const [questions, setQuestions] =
    useState([
      { question: "", expectedAnswer: "" },
    ]);

  const [creating, setCreating] =
    useState(false);

  // ==========================================
  // UI: ANSWER FORM (keyed by test _id)
  // ==========================================
  const [answerData, setAnswerData] =
    useState({});

  const [submitting, setSubmitting] =
    useState(null);

  // ==========================================
  // UI: REVIEW FORM (keyed by test _id)
  // ==========================================
  const [reviewData, setReviewData] =
    useState({});

  const [reviewing, setReviewing] =
    useState(null);

  // ==========================================
  // UI: EXPANDED TEST DETAIL
  // ==========================================
  const [expanded, setExpanded] =
    useState(null);

  // ==========================================
  // FETCH DATA
  // ==========================================
  const fetchAll = async () => {

    if (!user) return;

    try {

      const [sentRes, receivedRes, connRes] =
        await Promise.all([
          axios.get(
            `http://localhost:5000/api/peer-tests/sent/${user.id}`
          ),
          axios.get(
            `http://localhost:5000/api/peer-tests/received/${user.id}`
          ),
          axios.get(
            `http://localhost:5000/api/connections/my-connections/${user.id}`
          ),
        ]);

      setSentTests(sentRes.data || []);
      setReceivedTests(receivedRes.data || []);
      setConnections(connRes.data || []);

    } catch (error) {

      console.log(error);
    }
  };

  useEffect(() => {

    if (user) fetchAll();

  }, [user]);

  // ==========================================
  // CONNECTION DISPLAY NAME
  // ==========================================
  const otherPerson = (conn) => {

    return conn.senderClerkId === user?.id
      ? { id: conn.receiverClerkId, name: conn.receiverName }
      : { id: conn.senderClerkId,   name: conn.senderName };
  };

  // ==========================================
  // ADD / REMOVE QUESTION ROWS
  // ==========================================
  const addQuestion = () => {

    setQuestions([
      ...questions,
      { question: "", expectedAnswer: "" },
    ]);
  };

  const removeQuestion = (index) => {

    setQuestions(
      questions.filter((_, i) => i !== index)
    );
  };

  const updateQuestion = (index, field, value) => {

    setQuestions(
      questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    );
  };

  // ==========================================
  // CREATE TEST
  // ==========================================
  const createTest = async () => {

    if (!targetUser || !skill.trim()) return;

    if (questions.some((q) => !q.question.trim())) {

      alert("Please fill in all question fields.");
      return;
    }

    try {

      setCreating(true);

      await axios.post(
        "http://localhost:5000/api/peer-tests/create",
        {
          testerClerkId: user.id,
          testerName:    user.fullName,
          testeeClerkId: targetUser.id,
          testeeName:    targetUser.name,
          skill,
          questions,
        }
      );

      setShowCreate(false);
      setTargetUser(null);
      setSkill("");
      setQuestions([{ question: "", expectedAnswer: "" }]);

      await fetchAll();

    } catch (error) {

      console.log(error);

    } finally {

      setCreating(false);
    }
  };

  // ==========================================
  // SUBMIT ANSWERS (testee)
  // ==========================================
  const submitAnswers = async (test) => {

    const answers =
      (answerData[test._id] || []);

    try {

      setSubmitting(test._id);

      await axios.put(
        `http://localhost:5000/api/peer-tests/submit/${test._id}`,
        { answers }
      );

      await fetchAll();

    } catch (error) {

      console.log(error);

    } finally {

      setSubmitting(null);
    }
  };

  // ==========================================
  // REVIEW (tester)
  // ==========================================
  const submitReview = async (test) => {

    const rd =
      reviewData[test._id] || {};

    if (!rd.result) {

      alert("Please select Pass or Fail.");
      return;
    }

    try {

      setReviewing(test._id);

      await axios.put(
        `http://localhost:5000/api/peer-tests/review/${test._id}`,
        {
          score:         rd.score || 0,
          result:        rd.result,
          testerFeedback: rd.feedback || "",
        }
      );

      await fetchAll();

    } catch (error) {

      console.log(error);

    } finally {

      setReviewing(null);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ==========================================
          SIDEBAR
      ========================================== */}
      <aside className="w-72 bg-white border-r p-8 hidden md:flex flex-col">

        <h1 className="text-3xl font-bold text-blue-600">
          Knowva
        </h1>

        <div className="space-y-3 mt-10">

          <Link to="/dashboard">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Dashboard
            </div>
          </Link>

          <Link to="/my-skills">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              My Skills
            </div>
          </Link>

          <Link to="/matches">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Matches
            </div>
          </Link>

          <Link to="/messages">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Messages
            </div>
          </Link>

          <Link to="/sessions">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Sessions
            </div>
          </Link>

          <div className="w-full text-left px-4 py-3 rounded-xl font-medium bg-blue-50 text-blue-600">
            Peer Testing
          </div>

          <Link to="/notifications">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Notifications
            </div>
          </Link>

          <Link to="/settings">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Settings
            </div>
          </Link>

        </div>

      </aside>

      {/* ==========================================
          MAIN
      ========================================== */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold">
              Peer Testing
            </h1>

            <p className="text-slate-500 mt-2">
              Challenge your connections. Prove your skills.
            </p>

          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
            >
              + Create Test
            </button>

            <UserButton />

          </div>

        </div>

        {/* ==========================================
            CREATE TEST MODAL
        ========================================== */}
        {showCreate && (

          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-2xl font-bold">
                  Create Peer Test
                </h2>

                <button
                  onClick={() => setShowCreate(false)}
                  className="text-slate-400 hover:text-slate-700 text-2xl"
                >
                  &times;
                </button>

              </div>

              {/* Select testee */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Connection to Test
                </label>

                <select
                  value={targetUser?.id || ""}
                  onChange={(e) => {

                    const conn =
                      connections.find((c) => {

                        const p = otherPerson(c);
                        return p.id === e.target.value;
                      });

                    setTargetUser(
                      conn ? otherPerson(conn) : null
                    );
                  }}
                  className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    — Choose a connection —
                  </option>

                  {connections.map((conn) => {

                    const p = otherPerson(conn);

                    return (
                      <option key={conn._id} value={p.id}>
                        {p.name}
                      </option>
                    );
                  })}

                </select>

              </div>

              {/* Skill */}
              <div className="mb-5">

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Skill Being Tested
                </label>

                <input
                  type="text"
                  value={skill}
                  onChange={(e) =>
                    setSkill(e.target.value)
                  }
                  placeholder="e.g. React.js, Python, UI Design"
                  className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Questions */}
              <div className="mb-5">

                <div className="flex items-center justify-between mb-3">

                  <label className="text-sm font-semibold text-slate-700">
                    Questions
                  </label>

                  <button
                    onClick={addQuestion}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add question
                  </button>

                </div>

                <div className="space-y-4">

                  {questions.map((q, index) => (

                    <div
                      key={index}
                      className="border rounded-2xl p-4 space-y-3 bg-slate-50"
                    >

                      <div className="flex items-center justify-between">

                        <span className="text-xs font-semibold text-slate-500">
                          Q{index + 1}
                        </span>

                        {questions.length > 1 && (

                          <button
                            onClick={() =>
                              removeQuestion(index)
                            }
                            className="text-slate-300 hover:text-red-400 transition"
                          >
                            &times;
                          </button>
                        )}

                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "question",
                            e.target.value
                          )
                        }
                        placeholder="Write your question..."
                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />

                      <input
                        type="text"
                        value={q.expectedAnswer}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "expectedAnswer",
                            e.target.value
                          )
                        }
                        placeholder="Expected answer (only visible to you)"
                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-500 text-sm"
                      />

                    </div>
                  ))}

                </div>

              </div>

              {/* Submit */}
              <div className="flex gap-3 mt-6">

                <button
                  onClick={createTest}
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-2xl font-semibold transition"
                >
                  {creating ? "Sending..." : "Send Test"}
                </button>

                <button
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-medium"
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TABS
        ========================================== */}
        <div className="flex gap-2 mt-10 border-b">

          {[
            { key: "received", label: `Tests for Me (${receivedTests.length})` },
            { key: "sent",     label: `Tests I Sent (${sentTests.length})` },
          ].map((t) => (

            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 font-medium text-sm transition border-b-2 -mb-px ${
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
            RECEIVED TESTS TAB
        ========================================== */}
        {tab === "received" && (

          <div className="mt-6 space-y-4">

            {receivedTests.length === 0 ? (

              <div className="bg-white border rounded-3xl p-16 text-center">

                <p className="text-5xl mb-4">📝</p>

                <p className="text-slate-500 text-lg font-medium">
                  No tests received yet
                </p>

                <p className="text-slate-400 text-sm mt-2">
                  When a connection sends you a skill test, it will appear here.
                </p>

              </div>

            ) : (

              receivedTests.map((test) => (

                <div
                  key={test._id}
                  className="bg-white border rounded-3xl p-6 shadow-sm"
                >

                  {/* Test header */}
                  <div className="flex items-start justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <h3 className="text-xl font-bold">
                          {test.skill}
                        </h3>

                        <StatusBadge status={test.status} />
                        <ResultBadge result={test.result} />

                      </div>

                      <p className="text-slate-500 text-sm mt-1">
                        From{" "}
                        <span className="font-medium text-slate-700">
                          {test.testerName}
                        </span>
                        {" · "}
                        {test.totalQuestions} question
                        {test.totalQuestions !== 1 ? "s" : ""}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setExpanded(
                          expanded === test._id
                            ? null
                            : test._id
                        )
                      }
                      className="text-slate-400 hover:text-slate-700 transition px-3 py-1 rounded-xl border text-sm"
                    >
                      {expanded === test._id
                        ? "Collapse"
                        : "View"}
                    </button>

                  </div>

                  {/* Expanded: answer form or results */}
                  {expanded === test._id && (

                    <div className="mt-6 space-y-5 border-t pt-6">

                      {/* NOT YET ANSWERED */}
                      {test.status === "sent" && (

                        <>
                          <p className="text-sm font-semibold text-slate-600">
                            Answer each question below:
                          </p>

                          {test.questions.map(
                            (q, qi) => (

                              <div key={qi} className="space-y-2">

                                <p className="font-medium">
                                  Q{qi + 1}. {q.question}
                                </p>

                                <textarea
                                  value={
                                    (answerData[test._id] || [])[qi] || ""
                                  }
                                  onChange={(e) => {

                                    const updated =
                                      [...(answerData[test._id] || Array(test.questions.length).fill(""))];

                                    updated[qi] = e.target.value;

                                    setAnswerData((prev) => ({
                                      ...prev,
                                      [test._id]: updated,
                                    }));
                                  }}
                                  placeholder="Your answer..."
                                  rows={3}
                                  className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />

                              </div>
                            )
                          )}

                          <button
                            onClick={() =>
                              submitAnswers(test)
                            }
                            disabled={
                              submitting === test._id
                            }
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-3 rounded-2xl transition font-medium"
                          >
                            {submitting === test._id
                              ? "Submitting..."
                              : "Submit Answers"}
                          </button>

                        </>
                      )}

                      {/* ANSWERED — waiting for review */}
                      {test.status === "answered" && (

                        <div className="text-center py-6">

                          <p className="text-slate-500">
                            Your answers have been submitted.
                          </p>

                          <p className="text-slate-400 text-sm mt-1">
                            Waiting for {test.testerName} to review and score.
                          </p>

                        </div>
                      )}

                      {/* REVIEWED — show all Q&A */}
                      {test.status === "reviewed" && (

                        <div className="space-y-4">

                          <div
                            className={`px-5 py-4 rounded-2xl ${
                              test.result === "pass"
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <p className="font-bold text-lg">
                              Score: {test.score} / {test.totalQuestions}
                            </p>

                            {test.testerFeedback && (

                              <p className="text-slate-600 mt-1 text-sm">
                                {test.testerFeedback}
                              </p>
                            )}

                          </div>

                          {test.questions.map(
                            (q, qi) => (

                              <div
                                key={qi}
                                className="border rounded-2xl p-4 space-y-2"
                              >

                                <p className="font-semibold">
                                  Q{qi + 1}. {q.question}
                                </p>

                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">
                                    Your answer:
                                  </span>{" "}
                                  {q.submittedAnswer || "—"}
                                </p>

                                <p className="text-sm text-green-700">
                                  <span className="font-medium">
                                    Expected:
                                  </span>{" "}
                                  {q.expectedAnswer || "—"}
                                </p>

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </div>
              ))
            )}

          </div>
        )}

        {/* ==========================================
            SENT TESTS TAB
        ========================================== */}
        {tab === "sent" && (

          <div className="mt-6 space-y-4">

            {sentTests.length === 0 ? (

              <div className="bg-white border rounded-3xl p-16 text-center">

                <p className="text-5xl mb-4">🎯</p>

                <p className="text-slate-500 text-lg font-medium">
                  No tests sent yet
                </p>

                <p className="text-slate-400 text-sm mt-2">
                  Click "Create Test" to challenge one of your connections.
                </p>

              </div>

            ) : (

              sentTests.map((test) => (

                <div
                  key={test._id}
                  className="bg-white border rounded-3xl p-6 shadow-sm"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <h3 className="text-xl font-bold">
                          {test.skill}
                        </h3>

                        <StatusBadge status={test.status} />
                        <ResultBadge result={test.result} />

                      </div>

                      <p className="text-slate-500 text-sm mt-1">
                        Sent to{" "}
                        <span className="font-medium text-slate-700">
                          {test.testeeName}
                        </span>
                        {" · "}
                        {test.totalQuestions} question
                        {test.totalQuestions !== 1 ? "s" : ""}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        setExpanded(
                          expanded === test._id
                            ? null
                            : test._id
                        )
                      }
                      className="text-slate-400 hover:text-slate-700 transition px-3 py-1 rounded-xl border text-sm"
                    >
                      {expanded === test._id
                        ? "Collapse"
                        : "View"}
                    </button>

                  </div>

                  {/* Expanded: review form if answered */}
                  {expanded === test._id && (

                    <div className="mt-6 space-y-5 border-t pt-6">

                      {test.status === "sent" && (

                        <p className="text-slate-500 text-center py-4">
                          Waiting for {test.testeeName} to answer.
                        </p>
                      )}

                      {test.status === "answered" && (

                        <>
                          <p className="text-sm font-semibold text-slate-600 mb-2">
                            Review {test.testeeName}'s answers:
                          </p>

                          {test.questions.map(
                            (q, qi) => (

                              <div
                                key={qi}
                                className="border rounded-2xl p-4 space-y-2"
                              >

                                <p className="font-semibold">
                                  Q{qi + 1}. {q.question}
                                </p>

                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">
                                    Their answer:
                                  </span>{" "}
                                  {q.submittedAnswer || "—"}
                                </p>

                                <p className="text-sm text-green-700">
                                  <span className="font-medium">
                                    Expected:
                                  </span>{" "}
                                  {q.expectedAnswer || "—"}
                                </p>

                              </div>
                            )
                          )}

                          {/* Score + result */}
                          <div className="border-t pt-5 space-y-4">

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Score (correct answers)
                              </label>

                              <input
                                type="number"
                                min={0}
                                max={test.totalQuestions}
                                value={
                                  reviewData[test._id]?.score ?? ""
                                }
                                onChange={(e) =>
                                  setReviewData((prev) => ({
                                    ...prev,
                                    [test._id]: {
                                      ...prev[test._id],
                                      score: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-32 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              <span className="text-slate-400 ml-3 text-sm">
                                / {test.totalQuestions}
                              </span>

                            </div>

                            <div className="flex gap-3">

                              <button
                                onClick={() =>
                                  setReviewData((prev) => ({
                                    ...prev,
                                    [test._id]: {
                                      ...prev[test._id],
                                      result: "pass",
                                    },
                                  }))
                                }
                                className={`px-6 py-3 rounded-2xl font-medium transition ${
                                  reviewData[test._id]?.result === "pass"
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-green-50"
                                }`}
                              >
                                Pass
                              </button>

                              <button
                                onClick={() =>
                                  setReviewData((prev) => ({
                                    ...prev,
                                    [test._id]: {
                                      ...prev[test._id],
                                      result: "fail",
                                    },
                                  }))
                                }
                                className={`px-6 py-3 rounded-2xl font-medium transition ${
                                  reviewData[test._id]?.result === "fail"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-red-50"
                                }`}
                              >
                                Fail
                              </button>

                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Feedback (optional)
                              </label>

                              <textarea
                                value={
                                  reviewData[test._id]?.feedback || ""
                                }
                                onChange={(e) =>
                                  setReviewData((prev) => ({
                                    ...prev,
                                    [test._id]: {
                                      ...prev[test._id],
                                      feedback: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Add any feedback for the testee..."
                                rows={3}
                                className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />

                            </div>

                            <button
                              onClick={() =>
                                submitReview(test)
                              }
                              disabled={
                                reviewing === test._id
                              }
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-3 rounded-2xl transition font-medium"
                            >
                              {reviewing === test._id
                                ? "Saving..."
                                : "Submit Review"}
                            </button>

                          </div>

                        </>
                      )}

                      {test.status === "reviewed" && (

                        <div className="space-y-4">

                          <div
                            className={`px-5 py-4 rounded-2xl ${
                              test.result === "pass"
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}
                          >
                            <p className="font-bold text-lg">
                              Score: {test.score} / {test.totalQuestions}
                            </p>

                            {test.testerFeedback && (

                              <p className="text-slate-600 mt-1 text-sm">
                                {test.testerFeedback}
                              </p>
                            )}

                          </div>

                          {test.questions.map(
                            (q, qi) => (

                              <div
                                key={qi}
                                className="border rounded-2xl p-4 space-y-2"
                              >

                                <p className="font-semibold">
                                  Q{qi + 1}. {q.question}
                                </p>

                                <p className="text-sm text-slate-600">
                                  <span className="font-medium">
                                    Their answer:
                                  </span>{" "}
                                  {q.submittedAnswer || "—"}
                                </p>

                                <p className="text-sm text-green-700">
                                  <span className="font-medium">
                                    Expected:
                                  </span>{" "}
                                  {q.expectedAnswer || "—"}
                                </p>

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </div>
              ))
            )}

          </div>
        )}

      </main>

    </div>
  );
}

export default PeerTesting;
