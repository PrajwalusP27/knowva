import { SignIn } from "@clerk/clerk-react";

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <SignIn />
    </div>
  );
}

export default Login;