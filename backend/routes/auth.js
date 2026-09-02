import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "bookwise_secret_key_2026";

// ======================================================
// REGISTER USER
// ======================================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [normalizedEmail],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
        INSERT INTO users
          (name, email, password, role)
        VALUES
          ($1, $2, $3, 'user')
        RETURNING id, name, email, role
      `,
      [name.trim(), normalizedEmail, hashedPassword],
    );

    const user = newUser.rows[0];

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user,
    });
  } catch (err) {
    console.error("Register Error:", err);

    return res.status(500).json({
      success: false,
      error: "Registration failed.",
    });
  }
});

// ======================================================
// LOGIN USER / ADMIN
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          password,
          role
        FROM users
        WHERE LOWER(email) = $1
      `,
      [normalizedEmail],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);

    return res.status(500).json({
      success: false,
      error: "Login failed.",
    });
  }
});
export default router;