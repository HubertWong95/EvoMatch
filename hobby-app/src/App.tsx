import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
// import Login from "./pages/Login";
import Login from "./pages/Login_with_api";
// import Discover from "./pages/Discover";
import Discover from "./pages/Discover_with_api";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
