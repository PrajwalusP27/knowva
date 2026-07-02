import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


function Contact() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", subject: "", message: "",
  });

  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState("");

  // ==========================================
  // FIELD UPDATE
  // ==========================================
  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerErr("");
  };

  // ==========================================
  // VALIDATION
  // ==========================================
  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.email.trim())   e.email   = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = "Enter a valid email address.";
    if (!form.subject.trim()) e.subject = "Subject is required.";
    if (!form.message.trim()) e.message = "Message is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/email/contact", form);
      setSubmitted(true);
    } catch (err) {
      setServerErr(
        err.response?.data?.message || "Failed to send. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">

          <Link to="/" className="text-3xl font-bold text-blue-600">
            Knowva
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link to="/"         className="hover:text-blue-600 transition">Home</Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
            <Link to="/contact"   className="text-blue-600 font-semibold">Contact Us</Link>
          </div>

        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-8 py-16">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mb-8 font-medium"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-bold">Contact Us</h1>

        <p className="text-slate-500 mt-3">
          Have a question or feedback? We'd love to hear from you.
        </p>

        {/* Success state */}
        {submitted ? (

          <div className="mt-10 bg-green-50 border border-green-200 rounded-3xl p-10 text-center">
            <p className="text-4xl mb-4">✅</p>
            <h2 className="text-2xl font-bold text-green-700">Message Sent!</h2>
            <p className="text-slate-600 mt-3">
              Thanks for reaching out. We'll get back to you at{" "}
              <strong>{form.email}</strong> shortly.
            </p>
            <Link
              to="/"
              className="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-medium hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>

        ) : (

          <div className="mt-10 bg-white border rounded-3xl p-8 shadow-sm space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Your full name"
                className={`w-full border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-400" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="your@email.com"
                className={`w-full border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-400" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="What's this about?"
                className={`w-full border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subject ? "border-red-400" : ""
                }`}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Tell us more..."
                rows={5}
                className={`w-full border rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.message ? "border-red-400" : ""
                }`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverErr && (
              <p className="text-red-500 text-sm text-center">{serverErr}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-2xl font-semibold transition"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default Contact;
