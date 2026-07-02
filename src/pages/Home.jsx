import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/clerk-react";

function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden relative">

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10"></div>
      <div className="absolute top-40 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 md:px-16 py-5 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-bold text-blue-600"
          >
            Knowva
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">

            <Link to="/" className="hover:text-blue-600 transition">
              Home
            </Link>

            <Link to="/dashboard" className="hover:text-blue-600 transition">
              Dashboard
            </Link>

            <Link to="/contact" className="hover:text-blue-600 transition">
              Contact Us
            </Link>

            {/* Signed out: show Login + Signup */}
            <SignedOut>
              <Link to="/login" className="hover:text-blue-600 transition">
                Login
              </Link>
              <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition">
                Sign Up
              </Link>
            </SignedOut>

            {/* Signed in: show user profile button */}
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 md:px-16 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">

          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >

            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              🚀 Peer-to-Peer Skill Exchange Platform
            </div>

            <h1 className="mt-8 text-5xl md:text-7xl font-bold leading-tight">
              Exchange Skills.
              <span className="text-blue-600">
                {" "}Build Futures.
              </span>
            </h1>

            <p className="mt-8 text-lg text-slate-600 leading-relaxed max-w-xl">
              Knowva connects learners and mentors through smart
              skill exchange, live collaboration, peer testing, and
              reputation-based learning experiences.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-wrap gap-5">

              <Link
                to="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:scale-105 transition"
              >
                Get Started
              </Link>

              <a
                href="#features"
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-semibold transition"
              >
                Learn More
              </a>

            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-14 flex-wrap">

              <div>
                <h2 className="text-3xl font-bold">10K+</h2>
                <p className="text-slate-500 mt-1">
                  Active Users
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold">500+</h2>
                <p className="text-slate-500 mt-1">
                  Skills Shared
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold">25K+</h2>
                <p className="text-slate-500 mt-1">
                  Sessions
                </p>
              </div>

            </div>
          </motion.div>

          {/* Right Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative"
          >

            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-10 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">

              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

              <h2 className="text-3xl font-bold">
                Smart Skill Matching
              </h2>

              <p className="mt-6 text-blue-100 text-lg leading-relaxed">
                Our matching system connects you with ideal learning
                partners based on skills, interests, goals, and learning
                preferences.
              </p>

              <div className="mt-10 space-y-4">

                <div className="bg-white/15 backdrop-blur-lg p-5 rounded-2xl border border-white/10">
                  🚀 Real-time Chat & Collaboration
                </div>

                <div className="bg-white/15 backdrop-blur-lg p-5 rounded-2xl border border-white/10">
                  🎯 Peer Skill Testing & Validation
                </div>

                <div className="bg-white/15 backdrop-blur-lg p-5 rounded-2xl border border-white/10">
                  🏆 Reputation, Ratings & Badges
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-24 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto px-8 md:px-16">

          <div className="text-center">
            <h2 className="text-5xl font-bold">
              Why Choose{" "}
              <span className="text-blue-600">
                Knowva?
              </span>
            </h2>

            <p className="mt-5 text-slate-600 text-lg">
              Built for collaborative learning and meaningful skill exchange.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">

            {[
              {
                emoji: "🤝",
                title: "Skill Exchange",
                desc: "Teach what you know and learn what you need from talented peers worldwide."
              },
              {
                emoji: "🔍",
                title: "Smart Matching",
                desc: "Our matching system finds compatible learning partners based on your skills and goals."
              },
              {
                emoji: "🏆",
                title: "Reputation System",
                desc: "Earn trust through ratings, badges, peer reviews, and verified expertise."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition"
              >
                <div className="text-5xl">
                  {item.emoji}
                </div>

                <h3 className="text-2xl font-semibold mt-6">
                  {item.title}
                </h3>

                <p className="mt-4 text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 md:px-16">
        <div className="max-w-5xl mx-auto">

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[2rem] p-14 text-center text-white shadow-2xl">

            <h2 className="text-5xl font-bold">
              Ready to Start Learning?
            </h2>

            <p className="mt-6 text-blue-100 text-lg">
              Join Knowva and experience the future of peer-to-peer learning.
            </p>

            <Link
              to="/signup"
              className="inline-block mt-10 bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition"
            >
              Join Knowva
            </Link>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex flex-col md:flex-row items-center justify-between">

          <h1 className="text-3xl font-bold text-blue-600">
            Knowva
          </h1>

          <p className="text-slate-500 mt-4 md:mt-0">
            © 2026 Knowva. All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
}

export default Home;