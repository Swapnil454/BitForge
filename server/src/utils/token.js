import jwt from "jsonwebtoken";

// Generate JWT token
export const generateToken = (user) => {
  // Create user payload with essential fields
  const payload = {
    userId: user._id || user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role || 'buyer',
    isVerified: user.isVerified
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 days
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Generate refresh token
export const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id || user.id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // 30 days
  });
};