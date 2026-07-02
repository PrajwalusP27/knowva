import { useUser } from "@clerk/clerk-react";

import { Navigate } from "react-router-dom";


// ==========================================
// PROTECTED ROUTE
// Redirects unauthenticated users to /login
// Wrap any private <Route> with this.
// ==========================================
function ProtectedRoute({ children }) {

  const { isSignedIn, isLoaded } =
    useUser();

  // Wait for Clerk to finish loading
  if (!isLoaded) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Loading...
        </p>
      </div>
    );
  }

  // Not signed in — redirect to login
  if (!isSignedIn) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Signed in — render the page
  return children;
}

export default ProtectedRoute;
