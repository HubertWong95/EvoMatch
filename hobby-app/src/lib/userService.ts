// Import initial user data from JSON file
import initialUserData from "../mock/userPassword.json";

// Types for user data
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  age: string;
  location: string;
  bio: string;
  hobbies: string[];
  avatar?: string;
  figurine?: string;
  matching?: string[]; // Array of user IDs that this user has matched with
}

// Key for localStorage
const USER_STORAGE_KEY = "userPassword_data";
const CURRENT_USER_KEY = "currentUser";

// Initialize data in localStorage if not already present
const initializeData = () => {
  if (!localStorage.getItem(USER_STORAGE_KEY)) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initialUserData));
  }
};

// Call initialization
initializeData();

// Get all users from storage
export const getUsers = (): User[] => {
  try {
    const data = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "{}");
    return data.users || [];
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

// Save users to storage (simulating file write)
export const saveUsers = (users: User[]) => {
  try {
    const data = { users };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving users:", error);
  }
};

// Authenticate user
export const loginUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );

  if (user) {
    // Store current user username
    localStorage.setItem(CURRENT_USER_KEY, user.username);
    return user;
  }

  return null;
};

// Register new user
export const registerUser = (userData: Omit<User, "id">): User => {
  const users = getUsers();

  // Check if username already exists
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === userData.username.toLowerCase()
  );

  if (existingUser) {
    throw new Error("Username already exists");
  }

  // Create new user with generated ID
  const newUser: User = {
    ...userData,
    id: (users.length + 1).toString(), // Simple ID generation
  };

  // Add to users array and save
  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);

  // Set as current user
  localStorage.setItem(CURRENT_USER_KEY, newUser.username);

  return newUser;
};

// Update user data
export const updateUser = (userData: User): User => {
  const users = getUsers();
  const updatedUsers = users.map((user) =>
    user.username === userData.username ? userData : user
  );

  saveUsers(updatedUsers);
  return userData;
};

// Get user by username
export const getUserByUsername = (username: string): User | null => {
  const users = getUsers();
  return users.find((user) => user.username === username) || null;
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  const username = localStorage.getItem(CURRENT_USER_KEY);
  if (!username) return null;

  return getUserByUsername(username);
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};
