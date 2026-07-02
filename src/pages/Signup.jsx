import { SignUp } from "@clerk/clerk-react";

function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}

export default Signup;