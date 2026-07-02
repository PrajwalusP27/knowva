import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

import axios from "axios";

import {
  UserButton,
  useUser,
} from "@clerk/clerk-react";


// ==========================================
// TIER STYLES
// ==========================================
const TIER_STYLE = {
  gold:   { ring: "ring-yellow-400", bg: "bg-yellow-50",  label: "bg-yellow-100 text-yellow-700" },
  silver: { ring: "ring-slate-400",  bg: "bg-slate-50",   label: "bg-slate-200   text-slate-700" },
  bronze: { ring: "ring-orange-400", bg: "bg-orange-50",  label: "bg-orange-100  text-orange-700" },
};


function Badges() {

  const { user } = useUser();

  const [earned,       setEarned]       = useState([]);
  const [definitions,  setDefinitions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [awarding,     setAwarding]     = useState(false);
  const [awardResult,  setAwardResult]  = useState(null);
  const [filter,       setFilter]       = useState("all");

  // ==========================================
  // FETCH BADGES
  // ==========================================
  const fetchBadges = async () => {

    if (!user) return;

    try {

      const [earnedRes, defsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/badges/${user.id}`),
        axios.get("http://localhost:5000/api/badges/definitions/all"),
      ]);

      setEarned(earnedRes.data     || []);
      setDefinitions(defsRes.data  || []);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    if (user) fetchBadges();

  }, [user]);

  // ==========================================
  // CHECK AND AWARD BADGES
  // ==========================================
  const checkBadges = async () => {

    if (!user) return;

    try {

      setAwarding(true);
      setAwardResult(null);

      const res = await axios.post(
        `http://localhost:5000/api/badges/award/${user.id}`,
        { userName: user.fullName }
      );

      const newCount = res.data.awarded?.length || 0;

      setAwardResult(newCount);

      // Refresh badge list
      await fetchBadges();

    } catch (error) {

      console.log(error);

    } finally {

      setAwarding(false);
    }
  };

  // ==========================================
  // DERIVED DATA
  // ==========================================
  const earnedKeys = new Set(earned.map((b) => b.badgeKey));

  const locked = definitions.filter(
    (d) => !earnedKeys.has(d.key)
  );

  const filtered =
    filter === "all"    ? { earned, locked } :
    filter === "earned" ? { earned, locked: [] } :
    filter === "locked" ? { earned: [], locked } :
    {
      earned: earned.filter((b) => b.tier === filter),
      locked: locked.filter((d) => d.tier === filter),
    };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r p-8 hidden md:flex flex-col">

        <h1 className="text-3xl font-bold text-blue-600">
          Knowva
        </h1>

        <div className="space-y-3 mt-10">

          {[
            { to: "/dashboard",     label: "Dashboard"      },
            { to: "/my-skills",     label: "My Skills"      },
            { to: "/matches",       label: "Matches"        },
            { to: "/messages",      label: "Messages"       },
            { to: "/sessions",      label: "Sessions"       },
            { to: "/notifications", label: "Notifications"  },
            { to: "/certificates",  label: "Certificates"   },
            { to: "/settings",      label: "Settings"       },
          ].map((item) => (

            <Link key={item.to} to={item.to}>
              <div className="w-full text-left px-4 py-3 rounded-xl transition font-medium hover:bg-slate-100 text-slate-700">
                {item.label}
              </div>
            </Link>
          ))}

          <div className="w-full px-4 py-3 rounded-xl font-medium bg-blue-50 text-blue-600">
            Badges
          </div>

        </div>

      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-xl font-bold text-slate-900">
              Badges
            </h1>

            <p className="text-slate-500 mt-2">
              {earned.length} earned · {locked.length} remaining
            </p>

          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={checkBadges}
              disabled={awarding}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-2xl font-medium transition"
            >
              {awarding ? "Checking..." : "Check for New Badges"}
            </button>

            <UserButton />

          </div>

        </div>

        {/* Award result toast */}
        {awardResult !== null && (

          <div
            className={`mt-5 px-5 py-4 rounded-2xl font-medium ${
              awardResult > 0
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {awardResult > 0
              ? `You earned ${awardResult} new badge${awardResult > 1 ? "s" : ""}!`
              : "No new badges this time. Keep going!"}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mt-8 border-b flex-wrap">

          {[
            { key: "all",    label: "All" },
            { key: "earned", label: `Earned (${earned.length})` },
            { key: "locked", label: `Locked (${locked.length})` },
            { key: "gold",   label: "Gold"   },
            { key: "silver", label: "Silver" },
            { key: "bronze", label: "Bronze" },
          ].map((tab) => (

            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
                filter === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}

        </div>

        {loading ? (

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border rounded-3xl p-8 animate-pulse h-48" />
            ))}
          </div>

        ) : (

          <div className="mt-8 space-y-8">

            {/* Earned */}
            {filtered.earned.length > 0 && (

              <div>

                <h2 className="text-xl font-bold text-slate-700 mb-4">
                  Earned
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

                  {filtered.earned.map((badge) => {

                    const s = TIER_STYLE[badge.tier] || TIER_STYLE.bronze;

                    return (

                      <div
                        key={badge._id}
                        className={`bg-white border rounded-3xl p-6 text-center shadow-sm ring-2 ${s.ring} ${s.bg}`}
                      >

                        <div className="text-5xl mb-3">
                          {badge.icon}
                        </div>

                        <p className="font-bold text-slate-800">
                          {badge.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {badge.description}
                        </p>

                        <span className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-xl capitalize ${s.label}`}>
                          {badge.tier}
                        </span>

                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(badge.createdAt).toLocaleDateString()}
                        </p>

                      </div>
                    );
                  })}

                </div>

              </div>
            )}

            {/* Locked */}
            {filtered.locked.length > 0 && (

              <div>

                <h2 className="text-xl font-bold text-slate-700 mb-4">
                  Locked
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

                  {filtered.locked.map((def) => {

                    const s = TIER_STYLE[def.tier] || TIER_STYLE.bronze;

                    return (

                      <div
                        key={def.key}
                        className="bg-white border rounded-3xl p-6 text-center shadow-sm opacity-50"
                      >

                        <div className="text-5xl mb-3 grayscale">
                          {def.icon}
                        </div>

                        <p className="font-bold text-slate-800">
                          {def.title}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {def.description}
                        </p>

                        <span className={`inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-xl capitalize ${s.label}`}>
                          {def.tier}
                        </span>

                      </div>
                    );
                  })}

                </div>

              </div>
            )}

            {filtered.earned.length === 0 && filtered.locked.length === 0 && (

              <div className="bg-white border rounded-3xl p-16 text-center">

                <p className="text-5xl mb-4">🏅</p>

                <p className="text-slate-500 text-lg font-medium">
                  No badges to show for this filter.
                </p>

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}

export default Badges;
