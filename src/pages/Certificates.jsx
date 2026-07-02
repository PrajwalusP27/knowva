import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { UserButton, useUser } from "@clerk/clerk-react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { generateCertificatePDF } from "../utils/generateCertificatePDF";


function Certificates() {
  const { user } = useUser();

  const [certificates,  setCertificates]  = useState([]);
  const [eligible,      setEligible]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [issuing,       setIssuing]       = useState(null);
  const [verifyId,      setVerifyId]      = useState("");
  const [verifyResult,  setVerifyResult]  = useState(null);
  const [verifying,     setVerifying]     = useState(false);
  const [tab,           setTab]           = useState("mine");
  const [downloading,   setDownloading]   = useState(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [mineRes, eligRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/certificates/my/${user.id}`),
        axios.get(`http://localhost:5000/api/certificates/eligible/${user.id}`),
      ]);
      setCertificates(mineRes.data || []);
      setEligible(eligRes.data?.eligible || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const claimCertificate = async (skillData) => {
    try {
      setIssuing(skillData.skill);
      await axios.post("http://localhost:5000/api/certificates/issue", {
        clerkId:         user.id,
        userName:        user.fullName,
        skill:           skillData.skill,
        validationCount: skillData.validationCount,
        averageRating:   skillData.averageRating,
      });
      await fetchData();
    } catch (error) {
      console.log(error);
    } finally {
      setIssuing(null);
    }
  };

  const verifyCertificate = async () => {
    if (!verifyId.trim()) return;
    try {
      setVerifying(true);
      setVerifyResult(null);
      const res = await axios.get(
        `http://localhost:5000/api/certificates/verify/${verifyId.trim()}`
      );
      setVerifyResult(res.data);
    } catch {
      setVerifyResult({ valid: false, message: "Certificate not found." });
    } finally {
      setVerifying(false);
    }
  };

  const downloadCert = async (cert) => {
    try {
      setDownloading(cert._id);
      const completionDate = new Date(cert.createdAt).toLocaleDateString(
        "en-US", { year: "numeric", month: "long", day: "numeric" }
      );
      await generateCertificatePDF({
        learnerName:   cert.userName,
        skillName:     cert.skill,
        teacherName:   cert.teacherName || "Knowva Instructor",
        completionDate,
        certificateId: cert.certificateId,
      });
    } catch (e) {
      console.log(e);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active="/certificates" />

      <main className="flex-1 min-w-0 overflow-y-auto">

        {/* Header */}
        <PageHeader title="Certificates" subtitle="Your verified credentials" />

        <div className="p-4 sm:p-6">

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
            {[
              { key: "mine",   label: `My Certificates`, count: certificates.length },
              { key: "claim",  label: `Claim New`,       count: eligible.length },
              { key: "verify", label: "Verify",          count: null },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  tab === t.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                {t.count !== null && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.key ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── MY CERTIFICATES ── */}
          {tab === "mine" && (
            <div className="space-y-4">
              {loading ? (
                [1,2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse h-36" />
                ))
              ) : certificates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">📜</div>
                  <p className="font-semibold text-slate-700 mb-1">No certificates yet</p>
                  <p className="text-sm text-slate-400 mb-5">Get peer validations to become eligible.</p>
                  <button
                    onClick={() => setTab("claim")}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Check Eligibility
                  </button>
                </div>
              ) : (
                certificates.map((cert) => (
                  <CertCard
                    key={cert._id}
                    cert={cert}
                    downloading={downloading === cert._id}
                    onDownload={() => downloadCert(cert)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── CLAIM NEW ── */}
          {tab === "claim" && (
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse h-28" />
              ) : eligible.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🎯</div>
                  <p className="font-semibold text-slate-700 mb-1">No eligible skills yet</p>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto">
                    You need ≥ 2 peer validations with avg rating ≥ 3.5, a completed session, and a passed peer test.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500">
                    These skills qualify for a certificate.
                  </p>
                  {eligible.map((item) => (
                    <div
                      key={item.skill}
                      className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.skill}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-slate-500">{item.validationCount} validations</span>
                          <span className="text-xs text-amber-600 font-medium">★ {item.averageRating} avg</span>
                        </div>
                      </div>
                      <button
                        onClick={() => claimCertificate(item)}
                        disabled={issuing === item.skill}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap"
                      >
                        {issuing === item.skill ? "Issuing…" : "Claim Certificate"}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── VERIFY ── */}
          {tab === "verify" && (
            <div className="max-w-lg">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-1">Verify a Certificate</h3>
                <p className="text-sm text-slate-500 mb-5">
                  Enter a Knowva certificate ID to check its authenticity.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyId}
                    onChange={(e) => setVerifyId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyCertificate()}
                    placeholder="CERT-1234567890-ABCD1234"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={verifyCertificate}
                    disabled={verifying}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 rounded-xl text-sm font-medium transition"
                  >
                    {verifying ? "…" : "Verify"}
                  </button>
                </div>

                {verifyResult && (
                  <div className={`mt-4 p-4 rounded-xl border ${
                    verifyResult.valid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    {verifyResult.valid ? (
                      <>
                        <p className="font-semibold text-green-700 mb-3">✓ Valid Certificate</p>
                        <div className="space-y-1.5 text-sm text-slate-700">
                          <p><span className="text-slate-500">Skill:</span> {verifyResult.certificate.skill}</p>
                          <p><span className="text-slate-500">Issued to:</span> {verifyResult.certificate.userName}</p>
                          <p><span className="text-slate-500">Date:</span> {new Date(verifyResult.certificate.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                      </>
                    ) : (
                      <p className="font-semibold text-red-600">
                        {verifyResult.message || "Invalid or revoked certificate."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}


// ──────────────────────────────────────────────
// CERTIFICATE CARD
// ──────────────────────────────────────────────
function CertCard({ cert, downloading, onDownload }) {
  const date = new Date(cert.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

      {/* Gold banner preview */}
      <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📜</span>
              <h3 className="font-bold text-slate-900 text-lg">{cert.skill}</h3>
              <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                Verified
              </span>
            </div>

            <p className="text-sm text-slate-500">
              Issued to <span className="font-medium text-slate-700">{cert.userName}</span>
              {cert.teacherName && (
                <> · By <span className="font-medium text-slate-700">{cert.teacherName}</span></>
              )}
            </p>

            <p className="text-xs text-slate-400 mt-0.5">{date}</p>
          </div>

          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex-shrink-0 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              "⬇"
            )}
            Download
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <span className="bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-lg">
            {cert.validationCount} peer validations
          </span>
          {cert.averageRating > 0 && (
            <span className="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-lg">
              ★ {cert.averageRating} avg rating
            </span>
          )}
          <span className="bg-slate-50 text-slate-500 text-xs px-3 py-1.5 rounded-lg font-mono">
            {cert.certificateId}
          </span>
        </div>
      </div>
    </div>
  );
}


export default Certificates;
