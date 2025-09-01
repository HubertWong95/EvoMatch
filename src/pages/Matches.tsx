import { useState, useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import Navbar from "@/components/Navbar";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import { getCurrentUser, updateUser, getUsers } from "@/lib/userService";
import { Message } from "@/components/MessageBox";
import { UserProfile } from "@/mock/mockProfiles";

const MatchesPage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    // Load matches from current user's matching IDs
    if (currentUser.matching && currentUser.matching.length > 0) {
      // Get all users to find matches by ID
      const allUsers = getUsers();
      
      // Find full user profiles for each matching ID
      const matchedProfiles = currentUser.matching
        .map((id: string) => allUsers.find(user => user.id === id))
        .filter((user): user is UserProfile => !!user);
      
      setMatches(matchedProfiles);
    }
  }, [currentUser, navigate]);

  const handleRemove = (id: string) => {
    // 1. Update local state
    setMatches((prev) => prev.filter((profile) => profile.id !== id));
    
    // 2. Update user's matching data
    if (currentUser && currentUser.matching) {
      // Filter out the removed ID from the matching array
      const updatedMatching = currentUser.matching.filter((matchId: string) => matchId !== id);
      
      // Create updated user object
      const updatedUser = {
        ...currentUser,
        matching: updatedMatching
      };
      
      // Update user data in storage
      updateUser(updatedUser);
      
      // Update local current user state
      setCurrentUser(updatedUser);
    }
  };

  const handleSelectConversation = (id: string) => {
    const partner = matches.find((profile) => profile.id === id);
    if (partner) {
      setSelectedPartner(partner);
      setMessages([]);
    }
  };

  const handleSendMessage = (text: string) => {
    if (selectedPartner) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: "current-user",
        receiverId: selectedPartner.id,
        text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
    }
  };

  return (
    <>
      <Layout />
      <Navbar />
      <div className="flex flex-col items-center text-center px-4 py-6">
        <h1 className="font-pixel text-4xl text-game-white mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
          Your Matches
        </h1>
        <p className="text-game-white font-pixel text-sm mb-6">
          People who share your hobbies
        </p>

        <div className="w-full max-w-md space-y-6 mb-10">
          {matches.length > 0 ? (
            matches.map((match) => (
              <ProfileCard
                key={match.id}
                profile={match}
                showActions={false}
                showConnect={true}
                onMessage={handleSelectConversation}
                onRemove={handleRemove} // Pass the onRemove prop
              />
            ))
          ) : (
            <div className="pixel-card flex flex-col items-center justify-center p-8">
              <h2 className="font-pixel text-xl text-game-white mb-4">
                No matches yet!
              </h2>
              <p className="text-game-white text-center mb-6">
                Keep exploring profiles to find people who share your interests.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedPartner && (
        <ChatWidget
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      )}
    </>
  );
};

export default MatchesPage;
