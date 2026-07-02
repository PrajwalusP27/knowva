import { useEffect, useState } from "react";

import { Navigate } from "react-router-dom";

import { useUser } from "@clerk/clerk-react";

import axios from "axios";


// ==========================================
// PROTECTED ADMIN ROUTE
// Checks Clerk auth AND the user's role in
// the database. Non-admins are redirected
// to /dashboard — they never see this page.
// ==========================================
function ProtectedAdminRoute({ children }) {

  const { user, isLoaded, isSignedIn } =
    useUser();

  const [checking, setChecking] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {

    const checkRole = async () => {

      if (!isLoaded) return;

      if (!isSignedIn) {
        setChecking(false);
        return;
      }

      try {

        const res = await axios.get(
          `http://localhost:5000/api/users/${user.id}`
        );

        setIsAdmin(res.data?.role === "admin");

      } catch (error) {

        setIsAdmin(false);

      } finally {

        setChecking(false);
      }
    };

    checkRole();

  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || checking) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Checking access...
        </p>
      </div>
    );
  }

  if (!isSignedIn) {

    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {

    // Silently redirect — normal users never see an error
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
