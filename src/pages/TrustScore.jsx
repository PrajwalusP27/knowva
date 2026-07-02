import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import axios from "axios";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";


// ==========================================
// SCORE RING COMPONENT
// SVG circle that fills based on score/100
// ==========================================
function ScoreRing({ score }) {

  const radius = 80;
  const stroke = 12;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const fill = circumference - (score / 100) * circumference;

  const color =
    score >= 75
      ? "#22c55e"
      : score >= 50
        ? "#3b82f6"
        : score >= 25
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">

      <svg
        width={radius * 2 + stroke}
        height={radius * 2 + stroke}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={normalised}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />

        {/* Fill */}
        <circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={normalised}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={fill}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />

      </svg>

      {/* Score label in centre */}
      <div className="absolute flex flex-col items-center">

        <span
          className="text-5xl font-black"
          style={{ color }}
        >
          {score}
        </span>

        <span className="text-slate-400 text-xs font-medium mt-1">
          / 100
        </span>

      </div>

    </div>
  );
}


// ==========================================
// BREAKDOWN BAR
// ==========================================
function BreakdownBar({ label, value, max, color }) {

  const pct = Math.round((value / max) * 100);

  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>

        <span className="text-sm text-slate-500">
          {value} / {max} pts
        </span>

      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5">

        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />

      </div>

    </div>
  );
}


function TrustScore() {

  const { user } = useUser();

  // ==========================================
  // STATE
  // ==========================================
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================
  // FETCH TRUST SCORE
  // ==========================================
  const fetchScore = async () => {

    if (!user) return;

    try {

      const res = await axios.get(
        `http://localhost:5000/api/users/trust-score/${user.id}`
      );

      setData(res.data);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    if (user) fetchScore();

  }, [user]);

  // ==========================================
  // TRUST LEVEL LABEL
  // ==========================================
  const trustLevel = (score) => {

    if (score >= 80) return { label: "Highly Trusted",  color: "text-green-600",  bg: "bg-green-50"  };
    if (score >= 60) return { label: "Trusted",         color: "text-blue-600",   bg: "bg-blue-50"   };
    if (score >= 40) return { label: "Developing",      color: "text-yellow-600", bg: "bg-yellow-50" };
    if (score >= 20) return { label: "New Member",      color: "text-orange-500", bg: "bg-orange-50" };
    return                  { label: "Getting Started", color: "text-slate-500",  bg: "bg-slate-50"  };
  };

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

          <Link to="/peer-testing">
            <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
              Peer Testing
            </div>
          </Link>

          <div className="w-full text-left px-4 py-3 rounded-xl font-medium bg-blue-50 text-blue-600">
            Trust Score
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
      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold text-slate-900">
              Trust Score
            </h1>

            <p className="text-slate-500 mt-2">
              Your credibility on Knowva based on activity and peer feedback.
            </p>

          </div>

          <UserButton />

        </div>

        {loading ? (

          <div className="mt-16 flex items-center justify-center">

            <div className="text-slate-400">
              Calculating your score...
            </div>

          </div>

        ) : data ? (

          <div className="mt-10 space-y-6 max-w-3xl">

            {/* Main score card */}
            <div className="bg-white border rounded-3xl p-10 shadow-sm flex flex-col md:flex-row items-center gap-10">

              <ScoreRing score={data.score} />

              <div className="flex-1 text-center md:text-left">

                {(() => {

                  const level = trustLevel(data.score);

                  return (
                    <>
                      <span
                        className={`inline-block px-4 py-1 rounded-xl text-sm font-semibold ${level.bg} ${level.color} mb-3`}
                      >
                        {level.label}
                      </span>

                      <h2 className="text-2xl font-bold">
                        {user?.fullName}
                      </h2>

                      <p className="text-slate-500 mt-2 text-sm">
                        Your trust score is built from peer validations, completed
                        sessions, connections, peer test results, and rating quality.
                        Keep engaging to grow it.
                      </p>
                    </>
                  );
                })()}

              </div>

            </div>

            {/* Breakdown */}
            <div className="bg-white border rounded-3xl p-8 shadow-sm">

              <h3 className="text-xl font-bold mb-6">
                Score Breakdown
              </h3>

              <div className="space-y-5">

                <BreakdownBar
                  label="Peer Validations (pass)"
                  value={data.breakdown.validations}
                  max={30}
                  color="#3b82f6"
                />

                <BreakdownBar
                  label="Rating Quality"
                  value={data.breakdown.rating}
                  max={10}
                  color="#8b5cf6"
                />

                <BreakdownBar
                  label="Completed Sessions"
                  value={data.breakdown.sessions}
                  max={25}
                  color="#22c55e"
                />

                <BreakdownBar
                  label="Accepted Connections"
                  value={data.breakdown.connections}
                  max={15}
                  color="#f59e0b"
                />

                <BreakdownBar
                  label="Peer Tests Passed"
                  value={data.breakdown.peerTests}
                  max={20}
                  color="#ef4444"
                />

              </div>

            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

              {[
                {
                  label: "Validations",
                  value: data.counts.passedValidations,
                  icon:  "✅",
                },
                {
                  label: "Sessions",
                  value: data.counts.completedSessions,
                  icon:  "📅",
                },
                {
                  label: "Connections",
                  value: data.counts.connections,
                  icon:  "🤝",
                },
                {
                  label: "Tests Passed",
                  value: data.counts.passedPeerTests,
                  icon:  "🎯",
                },
                {
                  label: "Avg Rating",
                  value: data.counts.avgRating,
                  icon:  "⭐",
                },
              ].map((stat) => (

                <div
                  key={stat.label}
                  className="bg-white border rounded-2xl p-5 shadow-sm text-center"
                >

                  <div className="text-2xl mb-1">
                    {stat.icon}
                  </div>

                  <div className="text-2xl font-bold">
                    {stat.value}
                  </div>

                  <div className="text-xs text-slate-400 mt-1">
                    {stat.label}
                  </div>

                </div>
              ))}

            </div>

            {/* How to improve */}
            <div className="bg-white border rounded-3xl p-8 shadow-sm">

              <h3 className="text-xl font-bold mb-5">
                How to Improve Your Score
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {[
                  {
                    icon: "✅",
                    title: "Get peer validations",
                    desc:  "Ask connections to validate your skills after sessions. Each pass adds 5 pts.",
                    link:  "/sessions",
                    cta:   "View Sessions",
                  },
                  {
                    icon: "📅",
                    title: "Complete more sessions",
                    desc:  "Each completed session adds 5 pts to your score (up to 25).",
                    link:  "/matches",
                    cta:   "Find Matches",
                  },
                  {
                    icon: "🤝",
                    title: "Grow your connections",
                    desc:  "Each accepted connection adds 3 pts (up to 15).",
                    link:  "/matches",
                    cta:   "Browse Matches",
                  },
                  {
                    icon: "🎯",
                    title: "Pass peer tests",
                    desc:  "Ask connections to test you. Each pass adds 5 pts (up to 20).",
                    link:  "/peer-testing",
                    cta:   "Peer Testing",
                  },
                ].map((tip) => (

                  <div
                    key={tip.title}
                    className="border rounded-2xl p-5 hover:shadow-md transition"
                  >

                    <div className="text-2xl mb-2">
                      {tip.icon}
                    </div>

                    <p className="font-semibold">
                      {tip.title}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {tip.desc}
                    </p>

                    <Link to={tip.link}>

                      <span className="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">
                        {tip.cta} →
                      </span>

                    </Link>

                  </div>
                ))}

              </div>

            </div>

          </div>

        ) : (

          <div className="mt-16 text-center">

            <p className="text-slate-400">
              Could not load your trust score. Please try again.
            </p>

          </div>
        )}

      </main>

    </div>
  );
}

export default TrustScore;
