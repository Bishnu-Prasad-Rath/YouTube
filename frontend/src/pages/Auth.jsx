import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (isLogin) {
        await login(formData.get("email"), formData.get("username"), formData.get("password"));
        navigate("/");
      } else {
        await register(formData);
        setIsLogin(true); // switch to login after registering
      }
    } catch (error) {
      alert("Authentication Failed. " + (error.response?.data?.message || ""));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md neo-card bg-neoYellow">
        <h2 className="text-4xl font-black uppercase text-center mb-8 bg-neoWhite border-4 border-neoBlack shadow-neo py-4 mt-[-40px] rotate-[-2deg]">
          {isLogin ? "Sign In" : "Join Us"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
{!isLogin && (
            <>
              <input name="fullName" type="text" placeholder="Full Name" required className="neo-input" />
              
              <div className="flex flex-col gap-1 mt-2">
                <label className="pl-1 text-sm font-black tracking-widest uppercase">Avatar Image</label>
                <input name="avatar" type="file" required className="font-bold transition-colors neo-input file:mr-4 file:py-2 file:px-4 file:border-4 file:border-neoBlack file:bg-neoBlue file:font-black file:shadow-neo hover:file:bg-neoWhite" />
              </div>

              <div className="flex flex-col gap-1 mt-2 mb-2">
                <label className="pl-1 text-sm font-black tracking-widest uppercase">Cover Image</label>
                <input name="coverImage" type="file" className="font-bold transition-colors neo-input file:mr-4 file:py-2 file:px-4 file:border-4 file:border-neoBlack file:bg-neoBlue file:font-black file:shadow-neo hover:file:bg-neoWhite" />
              </div>
            </>
          )}
          <input name="username" type="text" placeholder="Username" required className="neo-input" />
          <input name="email" type="email" placeholder="Email (for login)" className="neo-input" />
          <input name="password" type="password" placeholder="Password" required className="neo-input" />

          <button type="submit" className="py-3 mt-4 text-xl neo-btn bg-neoBlue">
            {isLogin ? "ENTER" : "REGISTER"}
          </button>
        </form>

        <p className="mt-6 font-bold text-center">
          {isLogin ? "No account?" : "Already user?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="underline decoration-4 underline-offset-4 decoration-neoBlue hover:text-neoBlue">
            {isLogin ? "Create one" : "Sign in here"}
          </button>
        </p>
      </div>
    </div>
  );
};
