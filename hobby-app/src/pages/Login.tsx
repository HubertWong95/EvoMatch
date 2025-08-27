import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "@/components/PixelButton";
import Layout from "@/components/Layout";
import { loginUser, registerUser, User } from "@/lib/userService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Additional fields for signup
  const [name, setName] = useState("New Player");
  const [age, setAge] = useState("25");
  const [location, setLocation] = useState("Game World");
  const [bio, setSignupBio] = useState("Tell others about yourself...");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // Reset on unmount
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    
    try {
      const user = loginUser(username, password);
      
      if (user) {
        // User is automatically stored in localStorage by the loginUser function
        // Navigate to profile page
        navigate("/profile");
      } else {
        setError("Invalid username or password");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!username.trim() || !password.trim() || !name.trim()) {
      setError("Please fill in required fields");
      return;
    }
    
    try {
      // Register new user
      const newUser: Omit<User, 'id'> = {
        username,
        password,
        name,
        age,
        location,
        bio,
        hobbies: ["Gaming"] // Default hobby
      };
      
      registerUser(newUser);
      
      // Navigate to profile page
      navigate("/profile");
    } catch (error: any) {
      setError(error.message || "An error occurred during signup");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Background */}
      <Layout />
      
      {/* Logo and Title */}
      <div className="text-center mb-5">
        <h1 className="font-pixel text-5xl text-game-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          EvoMatch
        </h1>
        <p className="text-game-white font-pixel text-md">Find friends with shared interests!</p>
      </div>
      
      {/* Login/Signup Card */}
      <div className="bg-white border-4 border-black rounded-lg p-8 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 font-pixel text-sm">
            {error}
          </div>
        )}
        
        {!isSigningUp ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="font-pixel text-xl text-center mb-4">LOGIN</h2>
            
            {/* Username */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                USERNAME <span className="text-game-purple text-xs">[A]</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pixel-input w-full h-12 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                placeholder="Enter your username"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                PASSWORD <span className="text-game-purple text-xs">[B]</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input w-full h-12 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                placeholder="Enter your password"
              />
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 mr-2 accent-game-green"
                />
                <label htmlFor="remember" className="font-pixel text-xs">
                  Remember me <span className="text-game-purple text-xs">[X]</span>
                </label>
              </div>
              <a href="#" className="font-pixel text-xs text-game-blue hover:underline">
                Forgot password? <span className="text-game-purple text-xs">[Y]</span>
              </a>
            </div>
            
            {/* Login Button */}
            <div className="pt-2">
              <PixelButton type="submit" className="w-full">
                START GAME <span className="ml-2">▶</span>
              </PixelButton>
            </div>
          </form>
        ) : (
          // Signup Form
          <form onSubmit={handleSignup} className="space-y-4">
            <h2 className="font-pixel text-xl text-center mb-4">NEW PLAYER</h2>
            
            {/* Username */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                USERNAME <span className="text-game-purple text-xs">[A]</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pixel-input w-full h-10 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                placeholder="Choose a username"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                PASSWORD <span className="text-game-purple text-xs">[B]</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input w-full h-10 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                placeholder="Create a password"
              />
            </div>
            
            {/* Name */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                NAME <span className="text-game-purple text-xs">[C]</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pixel-input w-full h-10 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                placeholder="Your display name"
              />
            </div>
            
            {/* Row of Age and Location */}
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="font-pixel text-sm block mb-2 text-game-black">
                  AGE
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="pixel-input w-full h-10 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                  placeholder="Age"
                />
              </div>
              <div className="w-1/2">
                <label className="font-pixel text-sm block mb-2 text-game-black">
                  LOCATION
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pixel-input w-full h-10 rounded-md font-pixel p-3 border-2 border-gray-300 focus:border-game-blue focus:outline-none"
                  placeholder="City"
                />
              </div>
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="signupRemember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 mr-2 accent-game-green"
              />
              <label htmlFor="signupRemember" className="font-pixel text-xs">
                Remember me <span className="text-game-purple text-xs">[X]</span>
              </label>
            </div>
            
            {/* Signup Button */}
            <div className="pt-2">
              <PixelButton type="submit" className="w-full">
                CREATE CHARACTER <span className="ml-2">▶</span>
              </PixelButton>
            </div>
          </form>
        )}
        
        {/* Toggle between Login and Signup */}
        <div className="text-center mt-6">
          <p className="font-pixel text-sm">
            {isSigningUp ? "Already have an account?" : "New player?"} <span className="text-game-purple text-xs">[SELECT]</span><br />
            <a 
              href="#" 
              className="text-game-blue hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setIsSigningUp(!isSigningUp);
                setError(""); // Clear any errors
              }}
            >
              {isSigningUp ? "Login" : "Create Account"}
            </a>
          </p>
        </div>
        
        {/* Game Console Hint */}
        <div className="mt-8 bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300">
          <p className="font-pixel text-xs text-center text-gray-600">
            Press any key to continue...
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center mt-8 text-game-white text-xs font-pixel">
        EvoMatch • Share Your Passion
      </footer>
    </div>
  );
};

export default LoginPage;
