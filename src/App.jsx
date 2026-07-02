import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ProtectedRoute      from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Signup        from "./pages/Signup";
import Contact       from "./pages/Contact";
import Dashboard     from "./pages/Dashboard";
import Matches       from "./pages/Matches";
import Chat          from "./pages/Chat";
import Messages      from "./pages/Messages";
import Sessions      from "./pages/Sessions";
import MySkills      from "./pages/MySkills";
import Settings      from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Community     from "./pages/Community";
import Certificates  from "./pages/Certificates";
import Badges        from "./pages/Badges";
import TrustScore    from "./pages/TrustScore";
import PeerTesting   from "./pages/PeerTesting";
import Admin         from "./pages/Admin";


function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Public */}
        <Route path="/"        element={<Home />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/signup"  element={<Signup />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected — normal users */}
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/matches"       element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/chat"          element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/messages"      element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/sessions"      element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
        <Route path="/my-skills"     element={<ProtectedRoute><MySkills /></ProtectedRoute>} />
        <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/community"     element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/certificates"  element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="/badges"        element={<ProtectedRoute><Badges /></ProtectedRoute>} />
        <Route path="/trust-score"   element={<ProtectedRoute><TrustScore /></ProtectedRoute>} />
        <Route path="/peer-testing"  element={<ProtectedRoute><PeerTesting /></ProtectedRoute>} />

        {/* Protected — admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
