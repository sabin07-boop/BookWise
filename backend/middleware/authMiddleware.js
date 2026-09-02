import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bookwise_secret_key_2026";

// ======================================================
// AUTHENTICATE USER
// ======================================================

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication token missing.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);

    return res.status(401).json({
      success: false,
      error: "Invalid or expired token.",
    });
  }
};

// ======================================================
// ADMIN ONLY
// ======================================================

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required.",
    });
  }

  next();
};

// ======================================================
// BACKWARD COMPATIBILITY
// ======================================================

export const authMiddleware = authenticateToken;
export const adminMiddleware = requireAdmin;
export const verifyToken = authenticateToken;
