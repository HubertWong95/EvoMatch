import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "@/components/PixelButton";
import Layout from "@/components/Layout";
import WebcamCapture from "@/components/WebcamCapture";
import { generatePixelAvatar } from "@/utils/generatePixelAvatar";
import { loginUser, registerUser, User } from "@/lib/userService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Signup fields
  const [name, setName] = useState("New Player");
  const [age, setAge] = useState("25");
  const [location, setLocation] = useState("Game World");
  const [bio, setBio] = useState("Tell others about yourself...");
  const [rememberMe, setRememberMe] = useState(false);

  // Avatar related
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const user = loginUser(username, password);
      if (user) {
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

    if (!username.trim() || !password.trim() || !name.trim()) {
      setError("Please fill in required fields");
      return;
    }

    try {
      const newUser: Omit<User, "id"> = {
        username,
        password,
        name,
        age,
        location,
        bio,
        hobbies: ["Gaming"], // Default hobby
        avatar,
      };

      registerUser(newUser); // Automatically stores current user
      navigate("/profile"); // Redirects to profile page
    } catch (error: any) {
      setError(error.message || "An error occurred during signup");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <Layout />

      <div className="text-center mb-5">
        <h1 className="font-pixel text-5xl text-game-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          EvoMatch
        </h1>
        <p className="text-game-white font-pixel text-md">
          Find friends with shared interests!
        </p>
      </div>

      <div className="bg-white border-4 border-black rounded-lg p-8 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 font-pixel text-sm">
            {error}
          </div>
        )}

        {!isSigningUp ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="font-pixel text-xl text-center mb-4">LOGIN</h2>

            {/* Username */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pixel-input w-full h-12 font-pixel p-3 border-2 border-gray-300 rounded-md"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input w-full h-12 font-pixel p-3 border-2 border-gray-300 rounded-md"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 mr-2 accent-game-green"
              />
              <label htmlFor="remember" className="font-pixel text-xs">
                Remember me
              </label>
            </div>

            <PixelButton type="submit" className="w-full">
              START GAME <span className="ml-2">▶</span>
            </PixelButton>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <h2 className="font-pixel text-xl text-center mb-4">NEW PLAYER</h2>

            {/* Username */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pixel-input w-full h-10 font-pixel p-3 border-2 border-gray-300 rounded-md"
                placeholder="Choose a username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-input w-full h-10 font-pixel p-3 border-2 border-gray-300 rounded-md"
                placeholder="Create a password"
              />
            </div>

            {/* Name */}
            <div>
              <label className="font-pixel text-sm block mb-2 text-game-black">
                NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pixel-input w-full h-10 font-pixel p-3 border-2 border-gray-300 rounded-md"
                placeholder="Your display name"
              />
            </div>

            {/* Age & Location */}
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="font-pixel text-sm block mb-2 text-game-black">
                  AGE
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="pixel-input w-full h-10 font-pixel p-3 border-2 border-gray-300 rounded-md"
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
                  className="pixel-input w-full h-10 font-pixel p-3 border-2 border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Avatar Section */}
            <div className="text-center">
              {avatar && (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-lg border-2 border-black mx-auto mb-2"
                />
              )}
              <PixelButton type="button" onClick={() => setShowCamera(true)}>
                {avatar ? "Retake Avatar" : "Take Avatar Photo"}
              </PixelButton>
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
                Remember me
              </label>
            </div>

            <PixelButton
              type="submit"
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? "Creating Avatar..." : "CREATE CHARACTER"}{" "}
              <span className="ml-2">▶</span>
            </PixelButton>
          </form>
        )}

        {/* Toggle Form */}
        <div className="text-center mt-6">
          <p className="font-pixel text-sm">
            {isSigningUp ? "Already have an account?" : "New player?"}{" "}
            <a
              href="#"
              className="text-game-blue hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setIsSigningUp(!isSigningUp);
                setError("");
              }}
            >
              {isSigningUp ? "Login" : "Create Account"}
            </a>
          </p>
        </div>
      </div>

      {/* Webcam Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 border-4 border-black rounded-lg shadow-lg">
            <WebcamCapture
              onCapture={async (imageDataUrl) => {
                setIsGenerating(true);
                try {
                  const pixelAvatarUrl = await generatePixelAvatar(
                    imageDataUrl
                  );
                  setAvatar(pixelAvatarUrl);
                  setShowCamera(false);
                } catch (err: any) {
                  setError("Failed to generate avatar. Try again.");
                  console.error(err);
                } finally {
                  setIsGenerating(false);
                }
              }}
            />
            <div className="text-center mt-2">
              <button
                onClick={() => setShowCamera(false)}
                className="font-pixel text-sm text-game-blue underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center mt-8 text-game-white text-xs font-pixel">
        EvoMatch • Share Your Passion
      </footer>
    </div>
  );
};

export default LoginPage;
