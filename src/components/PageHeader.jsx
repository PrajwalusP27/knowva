import { useNavigate } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";

/**
 * PageHeader — sticky top bar used on every page.
 * Props:
 *   title        string  (required)
 *   subtitle     string  (optional)
 *   back         bool    (default true) — show ← back button
 *   right        ReactNode — extra content on the right
 */
function PageHeader({ title, subtitle, back = true, right }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex-shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition text-sm font-bold"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {right}
        <UserButton />
      </div>
    </div>
  );
}

export default PageHeader;
