// =====================================================
// BOOKWISE BACKEND
// =====================================================

import express from "express";
import cors from "cors";
import "dotenv/config";
import crypto from "node:crypto";

import pool from "./db.js";

import authRoutes from "./routes/auth.js";

import {
  authenticateToken,
  verifyToken,
  requireAdmin,
} from "./middleware/authMiddleware.js";

import {
  invalidateCache,
  getRecommendationsForUser,
  getSimilarBooks,
} from "./services/recommendationService.js";

// =====================================================
// APP CONFIG
// =====================================================

const app = express();

const PORT = Number(process.env.PORT || 5000);

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

const ESEWA_ENV = process.env.ESEWA_ENV || "sandbox";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "";

// Password reset / Gmail SMTP configuration
// The recipient is always taken from the users table.
const RESET_TOKEN_TTL_MINUTES = Number(
  process.env.RESET_TOKEN_TTL_MINUTES || 10,
);
const RESET_CODE_TTL_MINUTES = Number(process.env.RESET_CODE_TTL_MINUTES || 10);
const RESET_MAX_ATTEMPTS = Number(process.env.RESET_MAX_ATTEMPTS || 5);
const RESET_RESEND_COOLDOWN_SECONDS = Number(
  process.env.RESET_RESEND_COOLDOWN_SECONDS || 60,
);
const REGISTER_CODE_TTL_MINUTES = Number(
  process.env.REGISTER_CODE_TTL_MINUTES || 10,
);
const REGISTER_RESEND_COOLDOWN_SECONDS = Number(
  process.env.REGISTER_RESEND_COOLDOWN_SECONDS || 60,
);
const REGISTER_MAX_ATTEMPTS = Number(process.env.REGISTER_MAX_ATTEMPTS || 5);
const RESET_DEBUG_ERRORS =
  String(
    process.env.RESET_DEBUG_ERRORS ||
      (process.env.NODE_ENV !== "production" ? "true" : "false"),
  ).toLowerCase() === "true";

// User activity log retention. Keep this defined even when the env variable is omitted.
const ACTIVITY_RETENTION_DAYS = Number(
  process.env.ACTIVITY_RETENTION_DAYS || 365,
);
const ADMIN_INVITE_CODE_TTL_MINUTES = Number(
  process.env.ADMIN_INVITE_CODE_TTL_MINUTES || 15,
);
const SUPPORT_MAX_MESSAGE_LENGTH = Number(
  process.env.SUPPORT_MAX_MESSAGE_LENGTH || 2000,
);

const GMAIL_SMTP_USER = String(process.env.GMAIL_SMTP_USER || "").trim();
// Gmail App Passwords are displayed with spaces; remove whitespace before use.
const GMAIL_SMTP_APP_PASSWORD = String(
  process.env.GMAIL_SMTP_APP_PASSWORD || "",
).replace(/\s/g, "");
const RESET_FROM_EMAIL = String(
  process.env.RESET_FROM_EMAIL || GMAIL_SMTP_USER || "",
).trim();
const RESET_FROM_NAME = String(
  process.env.RESET_FROM_NAME || "BookWise",
).trim();

const BANK_NAME = process.env.BANK_NAME || "PRABHU BANK LIMITED";
const BANK_ACCOUNT_NAME =
  process.env.BANK_ACCOUNT_NAME || "Sample BookWise Account";
const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || "1234567890";
const BANK_BRANCH = process.env.BANK_BRANCH || "Kathmandu Branch";
const BANK_SWIFT = process.env.BANK_SWIFT || "PRABNPLK";
const BANK_INSTRUCTIONS =
  process.env.BANK_INSTRUCTIONS ||
  "Transfer the exact order total and include your order number in the transfer note.";
const BTC_ADDRESS =
  process.env.BTC_ADDRESS || "1BkDzTihKuYfDvUxQU9NAx8ZEn7Kw3DR3i";
const USDT_ADDRESS =
  process.env.USDT_ADDRESS ||
  "UQBxru5dszXQc-ZE1CmEHGM04yoJsOl8upycGc46SaryEDg5";
const USDT_NETWORK = process.env.USDT_NETWORK || "TON";
const PAYMENT_TIMEOUT_MS = Number(process.env.PAYMENT_TIMEOUT_MS || 15000);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || FRONTEND_URL)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

// =====================================================
// ENVIRONMENT CHECK
// =====================================================

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not set in .env");
}

if (!GOOGLE_BOOKS_API_KEY) {
  console.warn("⚠️ GOOGLE_BOOKS_API_KEY is not set in .env");
}

if (!ESEWA_SECRET_KEY) {
  console.warn("⚠️ ESEWA_SECRET_KEY is not set in .env");
}

if (!GMAIL_SMTP_USER || !GMAIL_SMTP_APP_PASSWORD) {
  console.warn(
    "⚠️ Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD in .env.",
  );
}

if (!RESET_FROM_EMAIL) {
  console.warn("⚠️ RESET_FROM_EMAIL is not set in .env");
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin))
        return callback(null, true);
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);

  // Record successful password/admin logins without ever storing passwords.
  if (
    req.method === "POST" &&
    [
      "/api/auth/login",
      "/api/auth/register",
      "/api/admin/login",
      "/api/admin/register",
    ].includes(req.path)
  ) {
    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && payload?.user?.id) {
        logUserActivity({
          userId: payload.user.id,
          eventType: req.path.includes("/register") ? "register" : "login",
          metadata: { method: req.path.includes("/admin/") ? "admin" : "user" },
          req,
        });
      }
      return originalJson(payload);
    };
  }

  next();
});

// =====================================================
// USER ACTIVITY / AUDIT LOGGING
// =====================================================
async function logUserActivity({
  userId,
  eventType,
  bookId = null,
  metadata = {},
  req = null,
}) {
  if (!userId || !eventType) return;
  try {
    await pool.query(
      `INSERT INTO user_activity_logs
        (user_id, event_type, book_id, metadata, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, CURRENT_TIMESTAMP)`,
      [
        Number(userId),
        String(eventType),
        bookId ? Number(bookId) : null,
        JSON.stringify(metadata || {}),
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req?.socket?.remoteAddress ||
          null,
        req?.headers?.["user-agent"] || null,
      ],
    );
  } catch (error) {
    // Activity logging must never break the main BookWise feature.
    console.error("Activity log error:", error.message);
  }
}

// =====================================================
// COMMERCE / CART / ORDERS / PAYMENTS
// =====================================================

const getBookPrice = (book) => {
  const sale =
    book.sale_price_npr === null ? null : Number(book.sale_price_npr);
  const regular = Number(book.price_npr || 0);
  return sale !== null && Number.isFinite(sale) && sale > 0 ? sale : regular;
};

const signHmacSha256 = (message, secret) =>
  crypto.createHmac("sha256", secret).update(message).digest("base64");

const formatEsewaAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid eSewa amount.");
  }

  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
};

const buildEsewaSignature = (totalAmount, transactionUuid, productCode) =>
  signHmacSha256(
    `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`,
    ESEWA_SECRET_KEY,
  );

const createEsewaTransactionUuid = (orderId = "test") =>
  `BW-${orderId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

const safeJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return { response, data };
  } finally {
    clearTimeout(timer);
  }
};

const moneyToCents = (value) => Math.round(Number(value) * 100);

const decodeBase64Json = (value) => {
  const normalized = String(value || "").replace(/ /g, "+");
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
};

const verifyEsewaResponseSignature = (payload) => {
  const signedFieldNames = String(payload?.signed_field_names || "");
  const providedSignature = String(payload?.signature || "");
  if (!signedFieldNames || !providedSignature) return false;

  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${payload[field] ?? ""}`)
    .join(",");

  const expected = signHmacSha256(message, ESEWA_SECRET_KEY);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(providedSignature);
  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
};

const ensureCart = async (client, userId) => {
  const result = await client.query(
    `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `,
    [userId],
  );
  return result.rows[0].id;
};

// GET CART
app.get("/api/cart", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          ci.book_id,
          ci.quantity,
          b.title,
          b.author,
          b.cover_url,
          b.price_npr,
          b.sale_price_npr,
          b.is_for_sale
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN books b ON b.id = ci.book_id
        WHERE c.user_id = $1
        ORDER BY ci.created_at DESC
      `,
      [req.user.userId],
    );

    const items = result.rows.map((item) => {
      const unitPrice = getBookPrice(item);
      return {
        ...item,
        unit_price: unitPrice,
        subtotal: unitPrice * Number(item.quantity),
      };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    res.json({ success: true, items, total });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ success: false, error: "Failed to load cart." });
  }
});

// ADD TO CART
app.post("/api/cart/items", authenticateToken, async (req, res) => {
  const bookId = Number(req.body.book_id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid book ID." });
  }

  try {
    const bookResult = await pool.query(
      `SELECT id, title, price_npr, sale_price_npr, is_for_sale FROM books WHERE id = $1 LIMIT 1`,
      [bookId],
    );

    if (!bookResult.rows.length) {
      return res.status(404).json({ success: false, error: "Book not found." });
    }

    const book = bookResult.rows[0];
    const price = getBookPrice(book);

    if (!book.is_for_sale || price <= 0) {
      return res.status(400).json({
        success: false,
        error: "This book is not currently available for purchase.",
      });
    }

    const client = await pool.connect();
    try {
      const cartId = await ensureCart(client, req.user.userId);
      await client.query(
        `
          INSERT INTO cart_items (cart_id, book_id, quantity)
          VALUES ($1, $2, 1)
          ON CONFLICT (cart_id, book_id)
          DO UPDATE SET quantity = cart_items.quantity + 1
        `,
        [cartId, bookId],
      );
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, message: "Book added to cart." });
  } catch (error) {
    console.error("Add cart item error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to add book to cart." });
  }
});

// UPDATE CART ITEM
app.put("/api/cart/items/:bookId", authenticateToken, async (req, res) => {
  const bookId = Number(req.params.bookId);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(bookId) || bookId <= 0 || !Number.isInteger(quantity)) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid cart item." });
  }

  try {
    const cartResult = await pool.query(
      `SELECT id FROM carts WHERE user_id = $1 LIMIT 1`,
      [req.user.userId],
    );

    if (!cartResult.rows.length) {
      return res.status(404).json({ success: false, error: "Cart not found." });
    }

    if (quantity <= 0) {
      await pool.query(
        `DELETE FROM cart_items WHERE cart_id = $1 AND book_id = $2`,
        [cartResult.rows[0].id, bookId],
      );
    } else {
      await pool.query(
        `UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND book_id = $3`,
        [quantity, cartResult.rows[0].id, bookId],
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ success: false, error: "Failed to update cart." });
  }
});

// REMOVE CART ITEM
app.delete("/api/cart/items/:bookId", authenticateToken, async (req, res) => {
  const bookId = Number(req.params.bookId);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid book ID." });
  }

  try {
    await pool.query(
      `
        DELETE FROM cart_items
        WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)
          AND book_id = $2
      `,
      [req.user.userId, bookId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to remove cart item." });
  }
});

// CREATE ORDER FROM SERVER-SIDE CART PRICES
app.post("/api/orders", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartResult = await client.query(
      `
        SELECT ci.book_id, ci.quantity, b.title, b.price_npr, b.sale_price_npr, b.is_for_sale
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN books b ON b.id = ci.book_id
        WHERE c.user_id = $1
        FOR UPDATE OF ci
      `,
      [req.user.userId],
    );

    if (!cartResult.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, error: "Your cart is empty." });
    }

    let subtotal = 0;
    const items = [];

    for (const item of cartResult.rows) {
      const price = getBookPrice(item);

      if (!item.is_for_sale || price <= 0) {
        throw new Error(
          `Book \"${item.title}\" is no longer available for purchase.`,
        );
      }

      const quantity = Number(item.quantity);
      const lineTotal = price * quantity;
      subtotal += lineTotal;

      items.push({
        bookId: Number(item.book_id),
        title: item.title,
        price,
        quantity,
        subtotal: lineTotal,
      });
    }

    const orderNumber = `BW-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const orderResult = await client.query(
      `
        INSERT INTO orders (user_id, order_number, currency, subtotal, total, status)
        VALUES ($1, $2, 'NPR', $3, $3, 'pending')
        RETURNING *
      `,
      [req.user.userId, orderNumber, subtotal.toFixed(2)],
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `
          INSERT INTO order_items (order_id, book_id, title, price, quantity, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          order.id,
          item.bookId,
          item.title,
          item.price,
          item.quantity,
          item.subtotal,
        ],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, order });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    res
      .status(400)
      .json({
        success: false,
        error: error.message || "Failed to create order.",
      });
  } finally {
    client.release();
  }
});

const getOrderForUser = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [orderId, userId],
  );
  return result.rows[0] || null;
};

app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ success: false, error: "Invalid order ID." });
  }

  try {
    const result = await pool.query(
      `
        SELECT
          o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'book_id', oi.book_id,
                'title', oi.title,
                'price', oi.price,
                'quantity', oi.quantity,
                'subtotal', oi.subtotal
              ) ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items,
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.id,
                'provider', p.provider,
                'transaction_id', p.transaction_id,
                'provider_reference', p.provider_reference,
                'amount', p.amount,
                'currency', p.currency,
                'status', p.status,
                'created_at', p.created_at,
                'updated_at', p.updated_at
              ) ORDER BY p.id DESC
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          ) AS payments
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE o.id = $1 AND o.user_id = $2
        GROUP BY o.id
        LIMIT 1
      `,
      [orderId, req.user.userId],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    }

    return res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error("Get order error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load order." });
  }
});

const setPaymentResult = async ({
  orderId,
  paymentId,
  status,
  transactionId,
  providerReference,
  metadata,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paymentResult = await client.query(
      `SELECT status FROM payments WHERE id = $1 FOR UPDATE`,
      [paymentId],
    );

    if (!paymentResult.rows.length) {
      throw new Error("Payment record not found.");
    }

    const currentStatus = paymentResult.rows[0].status;

    // A verified completed payment is terminal. Never downgrade it because a
    // duplicate browser callback arrives later.
    if (currentStatus !== "completed") {
      await client.query(
        `
          UPDATE payments
          SET status = $1,
              transaction_id = COALESCE($2, transaction_id),
              provider_reference = COALESCE($3, provider_reference),
              metadata = COALESCE($4::jsonb, metadata),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `,
        [
          status,
          transactionId || null,
          providerReference || null,
          metadata ? safeJson(metadata) : null,
          paymentId,
        ],
      );
    }

    if (status === "completed") {
      const paid = await client.query(
        `
          UPDATE orders
          SET status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status <> 'paid'
          RETURNING id
        `,
        [orderId],
      );

      if (paid.rows.length) {
        await client.query(
          `
            DELETE FROM cart_items
            WHERE cart_id = (
              SELECT c.id
              FROM carts c
              JOIN orders o ON o.user_id = c.user_id
              WHERE o.id = $1
              LIMIT 1
            )
          `,
          [orderId],
        );
      }
    } else if (["failed", "canceled", "expired", "refunded"].includes(status)) {
      await client.query(
        `
          UPDATE orders
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND status <> 'paid'
        `,
        [status, orderId],
      );
    } else if (status === "pending" || status === "initiated") {
      await client.query(
        `UPDATE orders SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status <> 'paid'`,
        [orderId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// eSEWA INITIATE
app.post(
  "/api/payments/esewa/initiate",
  authenticateToken,
  async (req, res) => {
    if (!ESEWA_SECRET_KEY) {
      return res
        .status(503)
        .json({ success: false, error: "ESEWA_SECRET_KEY is not configured." });
    }

    try {
      const order = await getOrderForUser(
        Number(req.body.order_id),
        req.user.userId,
      );
      if (!order)
        return res
          .status(404)
          .json({ success: false, error: "Order not found." });
      if (order.status === "paid")
        return res
          .status(400)
          .json({ success: false, error: "Order is already paid." });

      const transactionUuid = createEsewaTransactionUuid(order.id);
      const totalAmount = formatEsewaAmount(order.total);
      const signature = buildEsewaSignature(
        totalAmount,
        transactionUuid,
        ESEWA_PRODUCT_CODE,
      );

      const fields = {
        amount: totalAmount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${BACKEND_URL}/api/payments/esewa/callback?order_id=${order.id}`,
        failure_url: `${BACKEND_URL}/api/payments/esewa/callback?order_id=${order.id}`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      };

      // Reuse an existing initiated/pending payment for this order instead of
      // creating duplicate merchant transactions when the customer retries.
      const existing = await pool.query(
        `
        SELECT id
        FROM payments
        WHERE order_id = $1
          AND provider = 'esewa'
          AND provider_reference = $2
          AND status IN ('initiated', 'pending')
        ORDER BY id DESC
        LIMIT 1
      `,
        [order.id, transactionUuid],
      );

      let paymentId;
      if (existing.rows.length) {
        paymentId = existing.rows[0].id;
        await pool.query(
          `UPDATE payments SET amount = $1, metadata = $2::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [Number(order.total), safeJson(fields), paymentId],
        );
      } else {
        const payment = await pool.query(
          `
          INSERT INTO payments (order_id, provider, provider_reference, amount, currency, status, metadata)
          VALUES ($1, 'esewa', $2, $3, 'NPR', 'initiated', $4::jsonb)
          RETURNING id
        `,
          [order.id, transactionUuid, Number(order.total), safeJson(fields)],
        );
        paymentId = payment.rows[0].id;
      }

      res.json({
        success: true,
        payment_id: paymentId,
        form_url:
          ESEWA_ENV === "production"
            ? "https://epay.esewa.com.np/api/epay/main/v2/form"
            : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
        fields,
      });
    } catch (error) {
      console.error("eSewa initiate error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to initiate eSewa payment." });
    }
  },
);

// eSEWA CALLBACK + SERVER-SIDE VERIFICATION
app.get("/api/payments/esewa/callback", async (req, res) => {
  const frontend = (status, orderId = "") =>
    `${FRONTEND_URL}/?payment=${status}&provider=esewa${orderId ? `&order=${encodeURIComponent(orderId)}` : ""}`;

  try {
    const orderId = Number(req.query.order_id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.redirect(frontend("failed"));
    }

    let callback;
    try {
      callback = req.query.data ? decodeBase64Json(req.query.data) : req.query;
    } catch (decodeError) {
      console.error("eSewa callback decode error:", decodeError);
      return res.redirect(frontend("failed", orderId));
    }

    const transactionUuid = String(callback.transaction_uuid || "");
    const productCode = String(callback.product_code || "");
    const totalAmount = Number(callback.total_amount);
    const callbackStatus = String(callback.status || "").toUpperCase();

    if (!transactionUuid || !productCode || !Number.isFinite(totalAmount)) {
      return res.redirect(frontend("failed", orderId));
    }

    const paymentResult = await pool.query(
      `
        SELECT p.*, o.total, o.status AS order_status
        FROM payments p
        JOIN orders o ON o.id = p.order_id
        WHERE p.order_id = $1 AND p.provider = 'esewa' AND p.provider_reference = $2
        ORDER BY p.id DESC
        LIMIT 1
      `,
      [orderId, transactionUuid],
    );

    if (!paymentResult.rows.length) {
      return res.redirect(frontend("failed", orderId));
    }

    const payment = paymentResult.rows[0];

    if (
      moneyToCents(totalAmount) !== moneyToCents(payment.total) ||
      productCode !== ESEWA_PRODUCT_CODE
    ) {
      await setPaymentResult({
        orderId,
        paymentId: payment.id,
        status: "failed",
        metadata: { callback, reason: "amount_or_product_mismatch" },
      });
      return res.redirect(frontend("failed", orderId));
    }

    if (!verifyEsewaResponseSignature(callback)) {
      await setPaymentResult({
        orderId,
        paymentId: payment.id,
        status: "failed",
        metadata: { callback, reason: "invalid_signature" },
      });
      return res.redirect(frontend("failed", orderId));
    }

    const statusUrl =
      ESEWA_ENV === "production"
        ? "https://epay.esewa.com.np/api/epay/transaction/status/"
        : "https://rc.esewa.com.np/api/epay/transaction/status/";

    const verificationUrl = `${statusUrl}?product_code=${encodeURIComponent(ESEWA_PRODUCT_CODE)}&total_amount=${encodeURIComponent(formatEsewaAmount(payment.total))}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
    const { response: verificationResponse, data: verification } =
      await fetchJson(verificationUrl);

    if (!verificationResponse.ok) {
      await setPaymentResult({
        orderId,
        paymentId: payment.id,
        status: "pending",
        metadata: {
          callback,
          verification,
          reason: "verification_unavailable",
        },
      });
      return res.redirect(frontend("pending", orderId));
    }

    if (
      verification.status === "COMPLETE" &&
      moneyToCents(verification.total_amount) === moneyToCents(payment.total)
    ) {
      await setPaymentResult({
        orderId,
        paymentId: payment.id,
        status: "completed",
        transactionId: callback.transaction_code || verification.ref_id,
        providerReference: transactionUuid,
        metadata: { callback, verification },
      });
      return res.redirect(frontend("success", orderId));
    }

    if (
      ["PENDING", "AMBIGUOUS"].includes(verification.status) ||
      callbackStatus === "PENDING"
    ) {
      await setPaymentResult({
        orderId,
        paymentId: payment.id,
        status: "pending",
        providerReference: transactionUuid,
        metadata: { callback, verification },
      });
      return res.redirect(frontend("pending", orderId));
    }

    const status =
      verification.status === "CANCELED"
        ? "canceled"
        : verification.status === "FULL_REFUND"
          ? "refunded"
          : "failed";
    await setPaymentResult({
      orderId,
      paymentId: payment.id,
      status,
      providerReference: transactionUuid,
      metadata: { callback, verification },
    });
    return res.redirect(frontend("failed", orderId));
  } catch (error) {
    console.error("eSewa callback error:", error);
    return res.redirect(frontend("pending"));
  }
});

// eSEWA SANDBOX DIRECT TEST
// This route is intentionally available only in sandbox mode. It does not create a BookWise order.
app.get("/api/payments/esewa/test", (req, res) => {
  if (ESEWA_ENV === "production") {
    return res
      .status(404)
      .json({
        success: false,
        error: "Sandbox test route is disabled in production.",
      });
  }

  if (!ESEWA_SECRET_KEY) {
    return res
      .status(503)
      .json({ success: false, error: "ESEWA_SECRET_KEY is not configured." });
  }

  try {
    const totalAmount = formatEsewaAmount(req.query.amount || "100");
    const transactionUuid = createEsewaTransactionUuid("TEST");
    const fields = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${BACKEND_URL}/api/payments/esewa/test-callback`,
      failure_url: `${BACKEND_URL}/api/payments/esewa/test-callback`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: buildEsewaSignature(
        totalAmount,
        transactionUuid,
        ESEWA_PRODUCT_CODE,
      ),
    };

    const formUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const inputs = Object.entries(fields)
      .map(
        ([name, value]) =>
          `<input type="hidden" name="${name}" value="${String(value).replace(/&/g, "&amp;").replace(/\"/g, "&quot;")}" />`,
      )
      .join("\n");

    res
      .type("html")
      .send(
        `<!doctype html><html><body><p>Redirecting to eSewa sandbox...</p><form id="esewa-test" method="POST" action="${formUrl}">${inputs}</form><script>document.getElementById('esewa-test').submit();</script></body></html>`,
      );
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/payments/esewa/test-callback", (req, res) => {
  res.json({ success: true, sandbox: true, callback: req.query });
});

// MANUAL PAYMENT OPTIONS (BANK TRANSFER + CRYPTO)
app.get("/api/payments/manual/options", (req, res) => {
  res.json({
    success: true,
    options: {
      bank: {
        name: BANK_NAME,
        accountName: BANK_ACCOUNT_NAME,
        accountNumber: BANK_ACCOUNT_NUMBER,
        branch: BANK_BRANCH,
        swift: BANK_SWIFT,
        instructions: BANK_INSTRUCTIONS,
      },
      btc: { address: BTC_ADDRESS },
      usdt: { address: USDT_ADDRESS, network: USDT_NETWORK },
    },
  });
});

// MANUAL PAYMENT SUBMISSION
// These methods are deliberately recorded as pending. A bank/crypto transfer
// cannot be considered paid merely because a customer clicked a button.
// An admin must verify the transfer before the order is marked completed.
app.post("/api/payments/manual/submit", authenticateToken, async (req, res) => {
  const allowedProviders = new Set(["bank", "btc", "usdt"]);
  const provider = String(req.body.provider || "").toLowerCase();
  const reference = String(req.body.reference || "")
    .trim()
    .slice(0, 255);

  if (!allowedProviders.has(provider)) {
    return res
      .status(400)
      .json({ success: false, error: "Unsupported manual payment method." });
  }

  if (provider === "bank" && !reference) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Bank transaction/reference number is required.",
      });
  }

  try {
    const order = await getOrderForUser(
      Number(req.body.order_id),
      req.user.userId,
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    if (order.status === "paid")
      return res
        .status(400)
        .json({ success: false, error: "Order is already paid." });

    const providerReference = `${provider.toUpperCase()}-${order.id}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const payment = await pool.query(
      `
        INSERT INTO payments (order_id, provider, provider_reference, transaction_id, amount, currency, status, metadata)
        VALUES ($1, $2, $3, $4, $5, 'NPR', 'pending', $6::jsonb)
        RETURNING id, provider, provider_reference, transaction_id, amount, currency, status
      `,
      [
        order.id,
        provider,
        providerReference,
        reference || null,
        Number(order.total),
        safeJson({
          submittedByUser: true,
          reference: reference || null,
          submittedAt: new Date().toISOString(),
          instructions:
            provider === "bank"
              ? BANK_INSTRUCTIONS
              : provider === "usdt"
                ? `Send USDT over ${USDT_NETWORK} only.`
                : "Send BTC to the displayed address only.",
        }),
      ],
    );

    await pool.query(
      `UPDATE orders SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status <> 'paid'`,
      [order.id],
    );

    return res.json({
      success: true,
      payment: payment.rows[0],
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: "pending",
      },
      message: "Payment submitted and is awaiting manual verification.",
    });
  } catch (error) {
    console.error("Manual payment submission error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Could not submit manual payment." });
  }
});

// ADMIN MANUAL PAYMENT VERIFICATION
app.post(
  "/api/admin/payments/:id/verify",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    const paymentId = Number(req.params.id);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid payment ID." });
    }

    try {
      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE id = $1 LIMIT 1`,
        [paymentId],
      );
      if (!paymentResult.rows.length)
        return res
          .status(404)
          .json({ success: false, error: "Payment not found." });
      const payment = paymentResult.rows[0];
      if (!["bank", "btc", "usdt"].includes(payment.provider)) {
        return res
          .status(400)
          .json({
            success: false,
            error: "Only manual payments can be verified here.",
          });
      }

      await setPaymentResult({
        orderId: payment.order_id,
        paymentId: payment.id,
        status: "completed",
        transactionId: payment.transaction_id || null,
        providerReference: payment.provider_reference,
        metadata: {
          verifiedByAdmin: req.user.userId,
          verifiedAt: new Date().toISOString(),
        },
      });

      return res.json({
        success: true,
        message: "Payment verified and order marked paid.",
      });
    } catch (error) {
      console.error("Manual payment verification error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Could not verify payment." });
    }
  },
);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BookWise backend is running!",
    version: "1.0.0",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "BookWise API is healthy",
      database: "connected",
      google_books_api: GOOGLE_BOOKS_API_KEY ? "configured" : "not configured",
      password_reset_email:
        GMAIL_SMTP_USER && GMAIL_SMTP_APP_PASSWORD && RESET_FROM_EMAIL
          ? "gmail-smtp-configured"
          : "not configured",
      password_reset_sender: RESET_FROM_EMAIL || "not configured",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(500).json({
      success: false,
      message: "BookWise API is running but database is unavailable",
      database: "disconnected",
    });
  }
});

// =====================================================
// PASSWORD RESET
// =====================================================

async function loadBcrypt() {
  try {
    const mod = await import("bcryptjs");
    return mod.default || mod;
  } catch {
    const mod = await import("bcrypt");
    return mod.default || mod;
  }
}

async function getPasswordColumn() {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name IN ('password_hash', 'password')
    ORDER BY CASE column_name WHEN 'password_hash' THEN 1 ELSE 2 END
    LIMIT 1
  `);
  return result.rows[0]?.column_name || "password_hash";
}

function hashResetValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function createFiveDigitCode() {
  return String(crypto.randomInt(10000, 100000));
}

function createResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

async function sendResetCodeEmail({ email, name, code }) {
  if (!GMAIL_SMTP_USER || !GMAIL_SMTP_APP_PASSWORD) {
    throw new Error(
      "Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.",
    );
  }

  if (!RESET_FROM_EMAIL) {
    throw new Error("RESET_FROM_EMAIL is not configured.");
  }

  let nodemailer;
  try {
    const mod = await import("nodemailer");
    nodemailer = mod.default || mod;
  } catch {
    throw new Error("Nodemailer is not installed. Run: npm install nodemailer");
  }

  const safeName = escapeHtml(name || "there");
  const safeCode = escapeHtml(code);
  const safeExpiry = escapeHtml(RESET_CODE_TTL_MINUTES);
  const subject = `${code} is your BookWise password reset code`;
  const textContent = [
    `Hello ${name || "there"},`,
    "",
    `Your BookWise password reset code is: ${code}`,
    "",
    `This code expires in ${RESET_CODE_TTL_MINUTES} minutes and can be used only once.`,
    "If you did not request a password reset, you can safely ignore this email.",
  ].join("\n");
  const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><div style="padding:28px;border:1px solid #e5e7eb;border-radius:16px"><h2 style="margin:0 0 10px">Reset your BookWise password</h2><p>Hello ${safeName},</p><p>Use this 5-digit verification code to continue:</p><div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;padding:18px;background:#f8fafc;border-radius:12px;margin:20px 0">${safeCode}</div><p>This code expires in <strong>${safeExpiry} minutes</strong> and can be used only once.</p><p style="color:#64748b;font-size:13px">If you did not request a password reset, you can safely ignore this email.</p></div></div>`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: GMAIL_SMTP_USER,
      pass: GMAIL_SMTP_APP_PASSWORD,
    },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"${RESET_FROM_NAME}" <${RESET_FROM_EMAIL}>`,
    to: email,
    replyTo: RESET_FROM_EMAIL,
    subject,
    text: textContent,
    html: htmlContent,
  });

  console.log(
    `Password reset email sent through Gmail SMTP to ${email}. messageId=${info.messageId || "unknown"}`,
  );
  return {
    delivered: true,
    mode: "gmail-smtp",
    messageId: info.messageId || null,
  };
}

app.get("/api/auth/email-provider-test", async (req, res) => {
  const to = String(req.query.to || "")
    .trim()
    .toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res
      .status(400)
      .json({ success: false, error: "Provide a valid ?to=email address." });
  }

  try {
    const result = await sendResetCodeEmail({
      email: to,
      name: "BookWise Test User",
      code: "12345",
    });
    return res.json({
      success: true,
      message: "Test email accepted by the configured provider.",
      provider: result,
    });
  } catch (error) {
    console.error("Email provider test error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// EMAIL VERIFICATION FOR NEW USER REGISTRATION
// =====================================================

async function sendRegistrationVerificationEmail({ email, name, code }) {
  if (!GMAIL_SMTP_USER || !GMAIL_SMTP_APP_PASSWORD) {
    throw new Error(
      "Gmail SMTP is not configured. Set GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.",
    );
  }
  if (!RESET_FROM_EMAIL) {
    throw new Error("RESET_FROM_EMAIL is not configured.");
  }

  let nodemailer;
  try {
    const mod = await import("nodemailer");
    nodemailer = mod.default || mod;
  } catch {
    throw new Error("Nodemailer is not installed. Run: npm install nodemailer");
  }

  const safeName = escapeHtml(name || "there");
  const safeCode = escapeHtml(code);
  const safeExpiry = escapeHtml(REGISTER_CODE_TTL_MINUTES);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: GMAIL_SMTP_USER,
      pass: GMAIL_SMTP_APP_PASSWORD,
    },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"${RESET_FROM_NAME}" <${RESET_FROM_EMAIL}>`,
    to: email,
    replyTo: RESET_FROM_EMAIL,
    subject: `${code} is your BookWise email verification code`,
    text: [
      `Hello ${name || "there"},`,
      "",
      `Your BookWise email verification code is: ${code}`,
      "",
      `This code expires in ${REGISTER_CODE_TTL_MINUTES} minutes and can be used only once.`,
      "If you did not try to create a BookWise account, you can safely ignore this email.",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033"><div style="padding:28px;border:1px solid #e5e7eb;border-radius:16px"><h2 style="margin:0 0 10px">Verify your BookWise email</h2><p>Hello ${safeName},</p><p>Use this 5-digit code to verify your email and finish creating your BookWise account:</p><div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;padding:18px;background:#f8fafc;border-radius:12px;margin:20px 0">${safeCode}</div><p>This code expires in <strong>${safeExpiry} minutes</strong> and can only be used once.</p><p style="color:#64748b;font-size:13px">If you did not try to create a BookWise account, you can safely ignore this email.</p></div></div>`,
  });

  console.log(
    `Registration verification email sent through Gmail SMTP to ${email}. messageId=${info.messageId || "unknown"}`,
  );
  return {
    delivered: true,
    mode: "gmail-smtp",
    messageId: info.messageId || null,
  };
}

const startUserRegistration = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (name.length < 2) {
    return res
      .status(400)
      .json({ success: false, error: "Name must be at least 2 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Password must be at least 8 characters.",
      });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    if (existing.rows.length) {
      return res
        .status(409)
        .json({
          success: false,
          error:
            "An account with this email already exists. Please log in instead.",
        });
    }

    const previous = await pool.query(
      `SELECT created_at FROM registration_email_verifications WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (previous.rows.length) {
      const elapsed =
        (Date.now() - new Date(previous.rows[0].created_at).getTime()) / 1000;
      if (elapsed < REGISTER_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.max(
          1,
          Math.ceil(REGISTER_RESEND_COOLDOWN_SECONDS - elapsed),
        );
        return res.status(429).json({
          success: false,
          error: `Please wait ${wait} seconds before requesting another verification code.`,
        });
      }
    }

    const bcrypt = await loadBcrypt();
    const passwordHash = await bcrypt.hash(password, 12);
    const code = createFiveDigitCode();
    const codeHash = hashResetValue(code);

    await pool.query(
      `INSERT INTO registration_email_verifications
        (email, name, password_hash, code_hash, attempts, created_at, expires_at)
       VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($5 || ' minutes')::interval)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         code_hash = EXCLUDED.code_hash,
         attempts = 0,
         created_at = CURRENT_TIMESTAMP,
         expires_at = EXCLUDED.expires_at`,
      [email, name, passwordHash, codeHash, String(REGISTER_CODE_TTL_MINUTES)],
    );

    try {
      await sendRegistrationVerificationEmail({ email, name, code });
    } catch (emailError) {
      await pool
        .query(
          "DELETE FROM registration_email_verifications WHERE LOWER(email) = LOWER($1)",
          [email],
        )
        .catch(() => {});
      throw emailError;
    }

    return res.json({
      success: true,
      message: `A 5-digit verification code has been sent to ${email}.`,
      expiresInMinutes: REGISTER_CODE_TTL_MINUTES,
    });
  } catch (error) {
    console.error("Registration verification email error:", error);
    return res.status(500).json({
      success: false,
      error: RESET_DEBUG_ERRORS
        ? error.message
        : "Unable to send the verification code right now.",
    });
  }
};

// Keep the legacy registration endpoint compatible while enforcing email verification.
// No account is created by this endpoint; it only sends the verification code.
app.post("/api/auth/register", startUserRegistration);
app.post("/api/auth/register/start", startUserRegistration);

app.post("/api/auth/register/verify", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, error: "Enter a valid email address." });
  }
  if (!/^\d{5}$/.test(code)) {
    return res
      .status(400)
      .json({ success: false, error: "Enter the 5-digit verification code." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pendingResult = await client.query(
      `SELECT email, name, password_hash, code_hash, attempts, expires_at
       FROM registration_email_verifications
       WHERE LOWER(email) = LOWER($1)
       FOR UPDATE`,
      [email],
    );

    if (!pendingResult.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          success: false,
          error:
            "No active verification request was found. Please register again.",
        });
    }

    const pending = pendingResult.rows[0];
    if (new Date(pending.expires_at).getTime() <= Date.now()) {
      await client.query(
        "DELETE FROM registration_email_verifications WHERE LOWER(email) = LOWER($1)",
        [email],
      );
      await client.query("COMMIT");
      return res
        .status(400)
        .json({
          success: false,
          error:
            "The verification code has expired. Please request a new code.",
        });
    }

    if (Number(pending.attempts) >= REGISTER_MAX_ATTEMPTS) {
      await client.query("ROLLBACK");
      return res
        .status(429)
        .json({
          success: false,
          error:
            "Too many incorrect attempts. Please request a new verification code.",
        });
    }

    if (hashResetValue(code) !== pending.code_hash) {
      await client.query(
        "UPDATE registration_email_verifications SET attempts = attempts + 1 WHERE LOWER(email) = LOWER($1)",
        [email],
      );
      await client.query("COMMIT");
      return res
        .status(400)
        .json({ success: false, error: "Incorrect verification code." });
    }

    const existing = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    if (existing.rows.length) {
      await client.query(
        "DELETE FROM registration_email_verifications WHERE LOWER(email) = LOWER($1)",
        [email],
      );
      await client.query("COMMIT");
      return res
        .status(409)
        .json({
          success: false,
          error:
            "An account with this email already exists. Please log in instead.",
        });
    }

    const roleColumn = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
      LIMIT 1
    `);
    const passwordColumnResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
        AND column_name IN ('password_hash', 'password')
      ORDER BY CASE column_name WHEN 'password_hash' THEN 1 ELSE 2 END
      LIMIT 1
    `);
    const passwordColumn =
      passwordColumnResult.rows[0]?.column_name || "password_hash";

    let inserted;
    if (roleColumn.rows.length) {
      inserted = await client.query(
        `INSERT INTO users (name, email, ${passwordColumn}, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, name, email, role`,
        [pending.name, pending.email, pending.password_hash],
      );
    } else {
      inserted = await client.query(
        `INSERT INTO users (name, email, ${passwordColumn})
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [pending.name, pending.email, pending.password_hash],
      );
      inserted.rows[0].role = "user";
    }

    await client.query(
      "DELETE FROM registration_email_verifications WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    await client.query("COMMIT");

    const safeUser = inserted.rows[0];
    const token = await signUserJwt(safeUser);

    await logUserActivity({
      userId: safeUser.id,
      eventType: "register",
      metadata: { method: "email_verified" },
      req,
    });

    return res.status(201).json({
      success: true,
      token,
      user: safeUser,
      message:
        "Email verified successfully. Your BookWise account has been created.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Registration verification error:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({
          success: false,
          error:
            "An account with this email already exists. Please log in instead.",
        });
    }
    return res.status(500).json({
      success: false,
      error: RESET_DEBUG_ERRORS
        ? error.message
        : "Unable to verify your email right now.",
    });
  } finally {
    client.release();
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const generic = {
    success: true,
    message:
      "If an account with that email exists, a 5-digit verification code has been sent.",
  };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.json(generic);

  try {
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    if (!userResult.rows.length) return res.json(generic);

    const user = userResult.rows[0];

    // Prevent accidental rapid-fire reset emails for the same account.
    const recentReset = await pool.query(
      `SELECT created_at FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [user.id],
    );
    if (recentReset.rows.length) {
      const createdAt = new Date(recentReset.rows[0].created_at).getTime();
      const elapsedSeconds = (Date.now() - createdAt) / 1000;
      if (elapsedSeconds < RESET_RESEND_COOLDOWN_SECONDS) {
        return res.json(generic);
      }
    }

    const code = createFiveDigitCode();
    const codeHash = hashResetValue(code);

    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < CURRENT_TIMESTAMP",
      [user.id],
    );
    const inserted = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, code_hash, expires_at, attempts) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + ($4 || ' minutes')::interval, 0) RETURNING id`,
      [
        user.id,
        hashResetValue(createResetToken()),
        codeHash,
        String(RESET_CODE_TTL_MINUTES),
      ],
    );

    try {
      await sendResetCodeEmail({ email: user.email, name: user.name, code });
    } catch (emailError) {
      await pool
        .query("DELETE FROM password_reset_tokens WHERE id = $1", [
          inserted.rows[0].id,
        ])
        .catch(() => {});
      throw emailError;
    }

    return res.json(generic);
  } catch (error) {
    console.error("Forgot password error:", error);
    if (RESET_DEBUG_ERRORS) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to send password reset email.",
      });
    }
    return res.json(generic);
  }
});

app.post("/api/auth/verify-reset-code", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const code = String(req.body?.code || "").trim();
  if (!email || !/^\d{5}$/.test(code))
    return res
      .status(400)
      .json({ success: false, error: "Enter the 5-digit verification code." });

  try {
    const result = await pool.query(
      `SELECT prt.id, prt.user_id, prt.code_hash, prt.attempts, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE LOWER(u.email) = LOWER($1) AND prt.used_at IS NULL AND prt.expires_at > CURRENT_TIMESTAMP
       ORDER BY prt.created_at DESC LIMIT 1`,
      [email],
    );
    if (!result.rows.length)
      return res
        .status(400)
        .json({
          success: false,
          error:
            "The code is invalid or has expired. Please request a new code.",
        });

    const row = result.rows[0];
    if (Number(row.attempts) >= RESET_MAX_ATTEMPTS)
      return res
        .status(429)
        .json({
          success: false,
          error: "Too many incorrect attempts. Please request a new code.",
        });

    if (hashResetValue(code) !== row.code_hash) {
      await pool.query(
        "UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = $1",
        [row.id],
      );
      return res
        .status(400)
        .json({ success: false, error: "Incorrect verification code." });
    }

    const resetToken = createResetToken();
    await pool.query(
      "UPDATE password_reset_tokens SET verified_at = CURRENT_TIMESTAMP, token_hash = $1 WHERE id = $2",
      [hashResetValue(resetToken), row.id],
    );
    return res.json({
      success: true,
      resetToken,
      message: "Code verified. You can now create a new password.",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to verify the code right now." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");
  if (!token || token.length < 32 || password.length < 8) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          "A valid verification session and a password of at least 8 characters are required.",
      });
  }

  try {
    const tokenHash = hashResetValue(token);
    const result = await pool.query(
      `SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND verified_at IS NOT NULL AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1`,
      [tokenHash],
    );
    if (!result.rows.length)
      return res
        .status(400)
        .json({
          success: false,
          error: "This password reset session is invalid or has expired.",
        });

    const bcrypt = await loadBcrypt();
    const passwordHash = await bcrypt.hash(password, 12);
    const passwordColumn = await getPasswordColumn();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE users SET ${passwordColumn} = $1 WHERE id = $2`,
        [passwordHash, result.rows[0].user_id],
      );
      await client.query(
        "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1",
        [result.rows[0].id],
      );
      await client.query(
        "DELETE FROM password_reset_tokens WHERE user_id = $1 AND id <> $2",
        [result.rows[0].user_id, result.rows[0].id],
      );
      await client.query("COMMIT");
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }

    return res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to reset password right now." });
  }
});

// =====================================================
// ADMIN PORTAL: LOGIN / INVITES / REGISTRATION
// =====================================================

async function signUserJwt(user) {
  const jwt = await import("jsonwebtoken");
  return jwt.default.sign(
    {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

async function verifyPasswordAgainstUser(user, password) {
  const bcrypt = await loadBcrypt();
  const passwordColumn = await getPasswordColumn();
  const hash = user[passwordColumn];
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function createSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

app.post("/api/admin/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required." });

  try {
    const passwordColumn = await getPasswordColumn();
    const result = await pool.query(
      `SELECT id, name, email, role, ${passwordColumn} AS password_value FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (!result.rows.length)
      return res
        .status(401)
        .json({ success: false, error: "Invalid admin credentials." });
    const user = result.rows[0];
    if (user.role !== "admin")
      return res
        .status(403)
        .json({
          success: false,
          error: "This account is not an administrator.",
        });

    const bcrypt = await loadBcrypt();
    const valid = await bcrypt.compare(password, user.password_value || "");
    if (!valid)
      return res
        .status(401)
        .json({ success: false, error: "Invalid admin credentials." });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = await signUserJwt(safeUser);
    return res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.error("Admin login error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Admin login failed." });
  }
});

app.post(
  "/api/admin/invite-codes",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const code = createSixDigitCode();
      const codeHash = hashResetValue(code);
      await pool.query(
        "UPDATE admin_invite_codes SET used_at = CURRENT_TIMESTAMP WHERE created_by = $1 AND used_at IS NULL",
        [req.user.userId],
      );
      await pool.query(
        `INSERT INTO admin_invite_codes (code_hash, created_by, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 || ' minutes')::interval)`,
        [codeHash, req.user.userId, String(ADMIN_INVITE_CODE_TTL_MINUTES)],
      );
      return res.json({
        success: true,
        code,
        expiresInMinutes: ADMIN_INVITE_CODE_TTL_MINUTES,
        message:
          "Invite code generated. Share it securely with the new administrator.",
      });
    } catch (error) {
      console.error("Admin invite generation error:", error);
      return res
        .status(500)
        .json({
          success: false,
          error: "Unable to generate admin invite code.",
        });
    }
  },
);

app.post("/api/admin/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const inviteCode = String(req.body?.inviteCode || "").trim();

  if (name.length < 2)
    return res
      .status(400)
      .json({ success: false, error: "Name must be at least 2 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res
      .status(400)
      .json({ success: false, error: "Enter a valid email address." });
  if (password.length < 8)
    return res
      .status(400)
      .json({
        success: false,
        error: "Password must be at least 8 characters.",
      });
  if (!/^\d{6}$/.test(inviteCode))
    return res
      .status(400)
      .json({
        success: false,
        error: "Enter the 6-digit administrator invite code.",
      });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invite = await client.query(
      `SELECT id, code_hash, created_by FROM admin_invite_codes WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
    );
    if (
      !invite.rows.length ||
      invite.rows[0].code_hash !== hashResetValue(inviteCode)
    ) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({
          success: false,
          error: "Invalid or expired administrator invite code.",
        });
    }

    const existing = await client.query(
      "SELECT id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email],
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          success: false,
          error: "An account with this email already exists.",
        });
    }

    const bcrypt = await loadBcrypt();
    const passwordHash = await bcrypt.hash(password, 12);
    const passwordColumn = await getPasswordColumn();
    const inserted = await client.query(
      `INSERT INTO users (name, email, ${passwordColumn}, role) VALUES ($1, $2, $3, 'admin') RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );
    await client.query(
      "UPDATE admin_invite_codes SET used_at = CURRENT_TIMESTAMP, used_by = $1 WHERE id = $2",
      [inserted.rows[0].id, invite.rows[0].id],
    );
    await client.query("COMMIT");

    const safeUser = inserted.rows[0];
    const token = await signUserJwt(safeUser);
    return res
      .status(201)
      .json({
        success: true,
        token,
        user: safeUser,
        message: "Administrator account created successfully.",
      });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Admin registration error:", error);
    if (error.code === "23505")
      return res
        .status(409)
        .json({
          success: false,
          error: "An account with this email already exists.",
        });
    return res
      .status(500)
      .json({ success: false, error: "Administrator registration failed." });
  } finally {
    client.release();
  }
});

app.get(
  "/api/admin/invite-status",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT created_at, expires_at FROM admin_invite_codes WHERE created_by = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1`,
        [req.user.userId],
      );
      res.json({
        success: true,
        active: result.rows.length > 0,
        invite: result.rows[0] || null,
      });
    } catch (error) {
      console.error("Admin invite status error:", error);
      res
        .status(500)
        .json({ success: false, error: "Unable to load invite status." });
    }
  },
);

// =====================================================
// CUSTOMER SUPPORT CHAT
// =====================================================
// Support uses dedicated BookWise tables so older/partially-created support
// tables cannot break the live chat. Registered users are identified from the
// database; guests are identified by a browser visitor token.

async function getOptionalUser(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  try {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET,
    );
    return decoded;
  } catch {
    return null;
  }
}

async function ensureSupportRuntimeSchema() {
  // Use one canonical table pair for the live chat. Older BookWise builds may
  // already have partially-created support tables, so every required column
  // is added defensively before indexes are created.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookwise_support_conversations (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      visitor_token VARCHAR(128),
      customer_name VARCHAR(255) NOT NULL DEFAULT 'Guest customer',
      customer_email VARCHAR(320),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE bookwise_support_conversations
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS visitor_token VARCHAR(128),
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(320),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);
  await pool.query(`
    UPDATE bookwise_support_conversations
    SET customer_name = COALESCE(NULLIF(customer_name, ''), 'Guest customer')
    WHERE customer_name IS NULL OR customer_name = ''
  `);
  await pool.query(`
    UPDATE bookwise_support_conversations c
    SET customer_name = u.name, customer_email = u.email
    FROM users u
    WHERE c.user_id = u.id
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_bw_support_conversation_user
    ON bookwise_support_conversations(user_id)
    WHERE user_id IS NOT NULL
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_bw_support_conversation_visitor
    ON bookwise_support_conversations(visitor_token)
    WHERE user_id IS NULL AND visitor_token IS NOT NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookwise_support_messages (
      id BIGSERIAL PRIMARY KEY,
      conversation_id BIGINT NOT NULL REFERENCES bookwise_support_conversations(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL,
      sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      message TEXT NOT NULL,
      is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
      is_read_by_customer BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE bookwise_support_messages
      ADD COLUMN IF NOT EXISTS conversation_id BIGINT,
      ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS sender_user_id INTEGER,
      ADD COLUMN IF NOT EXISTS message TEXT,
      ADD COLUMN IF NOT EXISTS is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_read_by_customer BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bw_support_messages_conversation
    ON bookwise_support_messages(conversation_id, created_at, id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bw_support_messages_admin_unread
    ON bookwise_support_messages(conversation_id)
    WHERE sender_type = 'customer' AND is_read_by_admin = false
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bw_support_messages_customer_unread
    ON bookwise_support_messages(conversation_id)
    WHERE sender_type = 'admin' AND is_read_by_customer = false
  `);
}

app.get("/api/support/health", async (req, res) => {
  try {
    await ensureSupportRuntimeSchema();
    return res.json({ success: true, service: "customer-support" });
  } catch (error) {
    console.error("Support health error:", error);
    return res.status(500).json({
      success: false,
      error: "Customer support database is not ready.",
      ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
    });
  }
});

app.post("/api/support/conversations", async (req, res) => {
  const user = await getOptionalUser(req);

  if (user?.role === "admin") {
    return res.status(403).json({
      success: false,
      error: "Administrators cannot start customer support conversations.",
    });
  }

  const suppliedVisitorToken = String(
    req.body?.visitorToken || req.headers["x-support-visitor"] || "",
  ).trim();
  const visitorToken =
    suppliedVisitorToken || (user?.userId ? `user-${user.userId}` : "");
  const message = String(req.body?.message || "").trim();

  if (!user?.userId && visitorToken.length < 16) {
    return res.status(400).json({
      success: false,
      error:
        "A support session is required. Please refresh the page and try again.",
    });
  }

  if (!message || message.length > SUPPORT_MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Message must be between 1 and ${SUPPORT_MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  try {
    await ensureSupportRuntimeSchema();

    let customer = null;
    if (user?.userId) {
      const customerResult = await pool.query(
        `SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1`,
        [Number(user.userId)],
      );
      if (!customerResult.rows.length) {
        return res.status(401).json({
          success: false,
          error: "Your login session is no longer valid. Please login again.",
        });
      }
      customer = customerResult.rows[0];
      if (customer.role === "admin") {
        return res.status(403).json({
          success: false,
          error: "Administrators cannot start customer support conversations.",
        });
      }
    }

    const existing = customer
      ? await pool.query(
          `SELECT id FROM bookwise_support_conversations WHERE user_id = $1 LIMIT 1`,
          [customer.id],
        )
      : await pool.query(
          `SELECT id FROM bookwise_support_conversations
           WHERE user_id IS NULL AND visitor_token = $1 LIMIT 1`,
          [visitorToken],
        );

    let conversationId;
    if (existing.rows.length) {
      conversationId = existing.rows[0].id;
      await pool.query(
        `UPDATE bookwise_support_conversations
         SET customer_name = $1,
             customer_email = $2,
             visitor_token = COALESCE($3, visitor_token),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          customer?.name || "Guest customer",
          customer?.email || null,
          visitorToken || null,
          conversationId,
        ],
      );
    } else {
      const created = await pool.query(
        `INSERT INTO bookwise_support_conversations
          (user_id, visitor_token, customer_name, customer_email)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          customer?.id || null,
          visitorToken || null,
          customer?.name || "Guest customer",
          customer?.email || null,
        ],
      );
      conversationId = created.rows[0].id;
    }

    const msg = await pool.query(
      `INSERT INTO bookwise_support_messages
        (conversation_id, sender_type, sender_user_id, message, is_read_by_admin, is_read_by_customer)
       VALUES ($1, 'customer', $2, $3, false, true)
       RETURNING id, sender_type, sender_user_id, message, created_at`,
      [conversationId, customer?.id || null, message],
    );

    await pool.query(
      `UPDATE bookwise_support_conversations
       SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId],
    );

    if (customer?.id) {
      await logUserActivity({
        userId: customer.id,
        eventType: "support_message",
        metadata: { conversationId: String(conversationId) },
        req,
      });
    }

    return res.status(201).json({
      success: true,
      conversationId: String(conversationId),
      customer: customer
        ? { id: customer.id, name: customer.name, email: customer.email }
        : null,
      message: msg.rows[0],
    });
  } catch (error) {
    console.error("Create support conversation error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to start support chat.",
      ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
    });
  }
});

app.get("/api/support/conversations/:id", async (req, res) => {
  const user = await getOptionalUser(req);
  if (user?.role === "admin") {
    return res.status(403).json({
      success: false,
      error: "Administrators cannot use the customer chat view.",
    });
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid conversation." });
  }

  try {
    await ensureSupportRuntimeSchema();
    const conversation = await pool.query(
      `SELECT c.id, c.user_id, c.visitor_token,
              COALESCE(u.name, c.customer_name, 'Guest customer') AS customer_name,
              COALESCE(u.email, c.customer_email) AS customer_email,
              c.created_at, c.updated_at
       FROM bookwise_support_conversations c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 LIMIT 1`,
      [id],
    );

    if (!conversation.rows.length) {
      return res
        .status(404)
        .json({ success: false, error: "Conversation not found." });
    }

    const row = conversation.rows[0];
    const visitorToken = String(req.headers["x-support-visitor"] || "");
    const ownsConversation = user?.userId
      ? Number(row.user_id) === Number(user.userId)
      : !row.user_id && row.visitor_token === visitorToken;

    if (!ownsConversation) {
      return res.status(403).json({
        success: false,
        error: "You do not have access to this conversation.",
      });
    }

    const messages = await pool.query(
      `SELECT id, sender_type, sender_user_id, message, created_at
       FROM bookwise_support_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC, id ASC`,
      [id],
    );

    await pool.query(
      `UPDATE bookwise_support_messages
       SET is_read_by_customer = true
       WHERE conversation_id = $1 AND sender_type = 'admin'`,
      [id],
    );

    return res.json({
      success: true,
      conversation: row,
      messages: messages.rows,
    });
  } catch (error) {
    console.error("Get support conversation error:", error);
    return res.status(500).json({
      success: false,
      error: "Unable to load support chat.",
      ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
    });
  }
});

app.get(
  "/api/admin/support/conversations",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      await ensureSupportRuntimeSchema();
      const result = await pool.query(`
      SELECT c.id, c.user_id, c.visitor_token,
             COALESCE(u.name, c.customer_name, 'Guest customer') AS customer_name,
             COALESCE(u.email, c.customer_email) AS customer_email,
             c.created_at, c.updated_at,
             COALESCE((SELECT message FROM bookwise_support_messages m
                       WHERE m.conversation_id = c.id
                       ORDER BY m.created_at DESC, m.id DESC LIMIT 1), '') AS last_message,
             COALESCE((SELECT COUNT(*) FROM bookwise_support_messages m
                       WHERE m.conversation_id = c.id
                         AND m.sender_type = 'customer'
                         AND m.is_read_by_admin = false), 0)::integer AS unread_count
      FROM bookwise_support_conversations c
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.updated_at DESC, c.id DESC
    `);
      return res.json({ success: true, conversations: result.rows });
    } catch (error) {
      console.error("Admin support conversations error:", error);
      return res.status(500).json({
        success: false,
        error: "Unable to load support conversations.",
        ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
      });
    }
  },
);

app.get(
  "/api/admin/support/conversations/:id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation." });
    }

    try {
      await ensureSupportRuntimeSchema();
      const conversation = await pool.query(
        `SELECT c.id, c.user_id, c.visitor_token,
              COALESCE(u.name, c.customer_name, 'Guest customer') AS customer_name,
              COALESCE(u.email, c.customer_email) AS customer_email,
              c.created_at, c.updated_at
       FROM bookwise_support_conversations c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 LIMIT 1`,
        [id],
      );
      if (!conversation.rows.length) {
        return res
          .status(404)
          .json({ success: false, error: "Conversation not found." });
      }

      const messages = await pool.query(
        `SELECT id, sender_type, sender_user_id, message, created_at
       FROM bookwise_support_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC, id ASC`,
        [id],
      );

      await pool.query(
        `UPDATE bookwise_support_messages
       SET is_read_by_admin = true
       WHERE conversation_id = $1 AND sender_type = 'customer'`,
        [id],
      );

      return res.json({
        success: true,
        conversation: conversation.rows[0],
        messages: messages.rows,
      });
    } catch (error) {
      console.error("Admin support conversation error:", error);
      return res.status(500).json({
        success: false,
        error: "Unable to load conversation.",
        ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
      });
    }
  },
);

app.post(
  "/api/admin/support/conversations/:id/messages",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const message = String(req.body?.message || "").trim();
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid conversation." });
    }
    if (!message || message.length > SUPPORT_MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Message must be between 1 and ${SUPPORT_MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    try {
      await ensureSupportRuntimeSchema();
      const exists = await pool.query(
        `SELECT id FROM bookwise_support_conversations WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (!exists.rows.length) {
        return res
          .status(404)
          .json({ success: false, error: "Conversation not found." });
      }

      const adminResult = await pool.query(
        `SELECT id, name, email, role FROM users WHERE id = $1 LIMIT 1`,
        [req.user.userId],
      );
      if (!adminResult.rows.length || adminResult.rows[0].role !== "admin") {
        return res
          .status(403)
          .json({ success: false, error: "Admin access required." });
      }
      const admin = adminResult.rows[0];

      const inserted = await pool.query(
        `INSERT INTO bookwise_support_messages
        (conversation_id, sender_type, sender_user_id, message, is_read_by_admin, is_read_by_customer)
       VALUES ($1, 'admin', $2, $3, true, false)
       RETURNING id, sender_type, sender_user_id, message, created_at`,
        [id, admin.id, message],
      );

      await pool.query(
        `UPDATE bookwise_support_conversations
       SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id],
      );

      return res.status(201).json({
        success: true,
        message: inserted.rows[0],
        admin: { id: admin.id, name: admin.name, email: admin.email },
      });
    } catch (error) {
      console.error("Admin support reply error:", error);
      return res.status(500).json({
        success: false,
        error: "Unable to send support reply.",
        ...(RESET_DEBUG_ERRORS ? { detail: error.message } : {}),
      });
    }
  },
);

// AUTH
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// GOOGLE BOOK NORMALIZER
// =====================================================

function normalizeGoogleBook(item) {
  const info = item?.volumeInfo || {};

  let publishedYear = null;

  if (info.publishedDate) {
    const year = Number(String(info.publishedDate).slice(0, 4));

    if (Number.isInteger(year)) {
      publishedYear = year;
    }
  }

  return {
    google_id: item?.id || null,

    title: info.title || "Unknown title",

    author: Array.isArray(info.authors)
      ? info.authors.join(", ")
      : "Unknown author",

    description: info.description || "",

    cover_url:
      info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null,

    published_year: publishedYear,

    publisher: info.publisher || null,

    categories: Array.isArray(info.categories) ? info.categories : [],

    page_count: info.pageCount || null,

    language: info.language || null,

    average_rating: Number(info.averageRating || 0),

    ratings_count: Number(info.ratingsCount || 0),

    preview_link: info.previewLink || null,

    info_link: info.infoLink || null,
  };
}

// =====================================================
// GOOGLE BOOKS API HELPER
// =====================================================

async function fetchGoogleBooks({
  q,
  startIndex = 0,
  maxResults = 20,
  orderBy = "relevance",
}) {
  if (!GOOGLE_BOOKS_API_KEY) {
    throw new Error("GOOGLE_BOOKS_API_KEY is not configured");
  }

  const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes");

  googleUrl.searchParams.set("q", q);

  googleUrl.searchParams.set("startIndex", String(startIndex));

  googleUrl.searchParams.set("maxResults", String(maxResults));

  googleUrl.searchParams.set("orderBy", orderBy);

  googleUrl.searchParams.set("printType", "books");

  googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

  const response = await fetch(googleUrl.toString());

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Books API error:", data);

    const error = new Error(
      data?.error?.message || "Google Books API request failed",
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

// =====================================================
// ENSURE BOOK EXISTS IN DATABASE
// =====================================================

async function ensureBookInDatabase(identifier) {
  if (
    identifier === undefined ||
    identifier === null ||
    String(identifier).trim() === ""
  ) {
    throw new Error("Book identifier is required");
  }

  const value = String(identifier).trim();

  // ---------------------------------------------------
  // 1. LOCAL POSTGRESQL BOOK ID
  // ---------------------------------------------------

  if (/^\d+$/.test(value)) {
    const localResult = await pool.query(
      `
          SELECT
            id,
            google_book_id,
            title,
            author,
            description,
            cover_url,
            published_year,
            average_rating,
            price_npr,
            sale_price_npr,
            is_for_sale,
            created_at
          FROM books
          WHERE id = $1
          LIMIT 1;
        `,
      [Number(value)],
    );

    if (localResult.rows.length > 0) {
      return localResult.rows[0];
    }
  }

  // ---------------------------------------------------
  // 2. GOOGLE BOOK ID ALREADY EXISTS
  // ---------------------------------------------------

  const googleResult = await pool.query(
    `
        SELECT
          id,
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          price_npr,
          sale_price_npr,
          is_for_sale,
          created_at
        FROM books
        WHERE google_book_id = $1
        LIMIT 1;
      `,
    [value],
  );

  if (googleResult.rows.length > 0) {
    return googleResult.rows[0];
  }

  // ---------------------------------------------------
  // 3. CHECK GOOGLE API KEY
  // ---------------------------------------------------

  if (!GOOGLE_BOOKS_API_KEY) {
    throw new Error("Google Books API key is not configured");
  }

  // ---------------------------------------------------
  // 4. FETCH GOOGLE BOOK
  // ---------------------------------------------------

  const googleUrl = new URL(
    `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(value)}`,
  );

  googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

  const response = await fetch(googleUrl.toString());

  const data = await response.json();

  if (!response.ok) {
    console.error("Google Books import error:", data);

    const error = new Error(
      data?.error?.message || "Failed to fetch Google Book",
    );

    error.status = response.status;

    throw error;
  }

  const book = normalizeGoogleBook(data);

  const title = book.title;
  const author = book.author;
  const description = book.description;
  const coverUrl = book.cover_url;
  const publishedYear = book.published_year;
  const averageRating = book.average_rating;

  // ---------------------------------------------------
  // 5. CHECK TITLE + AUTHOR
  // ---------------------------------------------------

  const existingTitleAuthor = await pool.query(
    `
        SELECT
          id,
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          price_npr,
          sale_price_npr,
          is_for_sale,
          created_at
        FROM books
        WHERE title = $1
          AND author = $2
        LIMIT 1;
      `,
    [title, author],
  );

  if (existingTitleAuthor.rows.length > 0) {
    const existing = existingTitleAuthor.rows[0];

    if (!existing.google_book_id) {
      const updateResult = await pool.query(
        `
            UPDATE books
            SET
              google_book_id = $1,

              description = COALESCE(
                NULLIF(description, ''),
                $2
              ),

              cover_url = COALESCE(
                cover_url,
                $3
              ),

              published_year = COALESCE(
                published_year,
                $4
              ),

              average_rating = CASE
                WHEN average_rating IS NULL
                  OR average_rating = 0
                THEN $5
                ELSE average_rating
              END

            WHERE id = $6

            RETURNING
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at;
          `,
        [
          value,
          description,
          coverUrl,
          publishedYear,
          averageRating,
          existing.id,
        ],
      );

      invalidateCache();

      return updateResult.rows[0];
    }

    return existing;
  }

  // ---------------------------------------------------
  // 6. INSERT GOOGLE BOOK
  // ---------------------------------------------------

  const insertResult = await pool.query(
    `
        INSERT INTO books
        (
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          price_npr,
          sale_price_npr,
          is_for_sale,
          created_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          500,
          NULL,
          true,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT (google_book_id)
        WHERE google_book_id IS NOT NULL

        DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          description = EXCLUDED.description,
          cover_url = EXCLUDED.cover_url,
          published_year = EXCLUDED.published_year

        RETURNING
          id,
          google_book_id,
          title,
          author,
          description,
          cover_url,
          published_year,
          average_rating,
          price_npr,
          sale_price_npr,
          is_for_sale,
          created_at;
      `,
    [value, title, author, description, coverUrl, publishedYear, averageRating],
  );

  invalidateCache();

  return insertResult.rows[0];
}

// =====================================================
// GET ALL LOCAL BOOKS
// =====================================================

app.get("/api/books", async (req, res) => {
  try {
    const hasLimit = req.query.limit !== undefined;

    const hasOffset = req.query.offset !== undefined;

    let limit = null;
    let offset = 0;

    if (hasLimit) {
      limit = Number(req.query.limit);

      if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
        return res.status(400).json({
          success: false,
          error: "limit must be an integer between 1 and 500",
        });
      }
    }

    if (hasOffset) {
      offset = Number(req.query.offset);

      if (!Number.isInteger(offset) || offset < 0) {
        return res.status(400).json({
          success: false,
          error: "offset must be a non-negative integer",
        });
      }
    }

    const countResult = await pool.query(`
          SELECT COUNT(*)::integer AS total
          FROM books;
        `);

    const totalBooks = countResult.rows[0].total;

    let result;

    if (hasLimit) {
      result = await pool.query(
        `
              SELECT
                id,
                google_book_id,
                title,
                author,
                description,
                cover_url,
                published_year,
                average_rating,
                price_npr,
                sale_price_npr,
                is_for_sale,
                created_at
              FROM books
              ORDER BY id ASC
              LIMIT $1
              OFFSET $2;
            `,
        [limit, offset],
      );
    } else {
      result = await pool.query(`
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at
            FROM books
            ORDER BY id ASC;
          `);
    }

    res.json({
      success: true,
      count: result.rows.length,
      total: totalBooks,
      books: result.rows,

      pagination: {
        limit: hasLimit ? limit : totalBooks,

        offset,

        hasMore: hasLimit ? offset + result.rows.length < totalBooks : false,
      },
    });
  } catch (error) {
    console.error("Get all books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch books",
    });
  }
});

// =====================================================
// GET SINGLE LOCAL BOOK
// =====================================================

app.get("/api/books/:id", async (req, res) => {
  const bookId = Number(req.params.id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
    });
  }

  try {
    const result = await pool.query(
      `
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at
            FROM books
            WHERE id = $1
            LIMIT 1;
          `,
      [bookId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Get single book error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch book",
    });
  }
});

// =====================================================
// SIMILAR BOOKS
// =====================================================

app.get("/api/books/:id/similar", async (req, res) => {
  const identifier = String(req.params.id || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const similar = await getSimilarBooks(book.id, {
      limit: 10,
    });

    if (similar === null) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      book_id: book.id,
      count: similar.length,
      similar_books: similar,
    });
  } catch (error) {
    console.error("Similar books error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch similar books",
    });
  }
});

// =====================================================
// GOOGLE BOOKS BROWSE
// =====================================================

app.get("/api/google-books/browse", async (req, res) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Google Books API key is not configured",
    });
  }

  try {
    const q = String(req.query.q || "books").trim();

    const startIndex = Number(req.query.startIndex ?? 0);

    const maxResults = Number(req.query.maxResults ?? 20);

    const orderBy = String(req.query.orderBy || "relevance");

    if (!Number.isInteger(startIndex) || startIndex < 0) {
      return res.status(400).json({
        success: false,
        error: "startIndex must be a non-negative integer",
      });
    }

    if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 40) {
      return res.status(400).json({
        success: false,
        error: "maxResults must be between 1 and 40",
      });
    }

    const safeOrderBy = ["relevance", "newest"].includes(orderBy)
      ? orderBy
      : "relevance";

    const data = await fetchGoogleBooks({
      q,
      startIndex,
      maxResults,
      orderBy: safeOrderBy,
    });

    const books = (data.items || []).map(normalizeGoogleBook);

    const total = Number(data.totalItems || 0);

    res.json({
      success: true,
      source: "google_books",
      query: q,
      total,
      count: books.length,
      startIndex,
      maxResults,
      orderBy: safeOrderBy,

      hasMore: startIndex + books.length < total,

      books,
    });
  } catch (error) {
    console.error("Google Books browse error:", error);

    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to fetch books from Google Books",
    });
  }
});

// =====================================================
// GOOGLE BOOK DETAILS
// =====================================================

app.get("/api/google-books/:googleBookId", async (req, res) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Google Books API key is not configured",
    });
  }

  const googleBookId = String(req.params.googleBookId || "").trim();

  if (!googleBookId) {
    return res.status(400).json({
      success: false,
      error: "Google book ID is required",
    });
  }

  try {
    const googleUrl = new URL(
      `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(
        googleBookId,
      )}`,
    );

    googleUrl.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

    const response = await fetch(googleUrl.toString());

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || "Google Books request failed",
      });
    }

    res.json({
      success: true,
      source: "google_books",
      book: normalizeGoogleBook(data),
      raw: data,
    });
  } catch (error) {
    console.error("Google Books details error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch Google Books details",
    });
  }
});

// =====================================================
// IMPORT GOOGLE BOOK
// =====================================================

app.post(
  ["/api/google-books/import", "/api/books/import-google"],
  async (req, res) => {
    if (!GOOGLE_BOOKS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "Google Books API key is not configured",
      });
    }

    const googleBookId = String(
      req.body?.google_book_id || req.body?.googleBookId || "",
    ).trim();

    if (!googleBookId) {
      return res.status(400).json({
        success: false,
        error: "google_book_id is required",
      });
    }

    try {
      const existingResult = await pool.query(
        `
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at
            FROM books
            WHERE google_book_id = $1
            LIMIT 1;
          `,
        [googleBookId],
      );

      if (existingResult.rows.length > 0) {
        return res.json({
          success: true,
          imported: false,
          already_exists: true,
          source: "database",
          book: existingResult.rows[0],
        });
      }

      const book = await ensureBookInDatabase(googleBookId);

      res.status(201).json({
        success: true,
        imported: true,
        already_exists: false,
        source: "google_books",
        message: "Google book imported into database",
        book,
      });
    } catch (error) {
      console.error("Google book import error:", error);

      res.status(500).json({
        success: false,
        error: error.message || "Failed to import Google book",
      });
    }
  },
);

// =====================================================
// SEARCH DATABASE + GOOGLE BOOKS
// =====================================================

app.get("/api/discover/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Search query is required",
    });
  }

  try {
    const databaseResult = await pool.query(
      `
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at
            FROM books
            WHERE
              title ILIKE $1
              OR author ILIKE $1
              OR description ILIKE $1
            ORDER BY
              average_rating DESC NULLS LAST,
              title ASC
            LIMIT 50;
          `,
      [`%${query}%`],
    );

    const databaseBooks = databaseResult.rows.map((book) => ({
      ...book,
      source: "database",
      google_id: book.google_book_id || null,
      imported: true,
    }));

    let googleBooks = [];

    if (GOOGLE_BOOKS_API_KEY) {
      try {
        const googleData = await fetchGoogleBooks({
          q: query,
          startIndex: 0,
          maxResults: 20,
          orderBy: "relevance",
        });

        googleBooks = (googleData.items || []).map(normalizeGoogleBook);
      } catch (googleError) {
        console.error("Google search error:", googleError);

        googleBooks = [];
      }
    }

    const googleIds = googleBooks.map((book) => book.google_id).filter(Boolean);

    let importedMap = new Map();

    if (googleIds.length > 0) {
      const importedResult = await pool.query(
        `
              SELECT
                id,
                google_book_id,
                title,
                author,
                description,
                cover_url,
                published_year,
                average_rating,
                price_npr,
                sale_price_npr,
                is_for_sale,
                created_at
              FROM books
              WHERE google_book_id =
                ANY($1::text[]);
            `,
        [googleIds],
      );

      importedMap = new Map(
        importedResult.rows.map((book) => [book.google_book_id, book]),
      );
    }

    const formattedGoogleBooks = googleBooks.map((book) => {
      const imported = importedMap.get(book.google_id);

      if (imported) {
        return {
          ...book,
          source: "database",
          imported: true,
          id: imported.id,
          google_book_id: imported.google_book_id,
          database_book: imported,
        };
      }

      return {
        ...book,
        source: "google_books",
        imported: false,
        id: null,
        google_book_id: book.google_id,
      };
    });

    const databaseGoogleIds = new Set(
      databaseBooks.map((book) => book.google_book_id).filter(Boolean),
    );

    const externalGoogleBooks = formattedGoogleBooks.filter(
      (book) => !databaseGoogleIds.has(book.google_id),
    );

    const books = [...databaseBooks, ...externalGoogleBooks];

    res.json({
      success: true,
      query,
      count: books.length,
      database_count: databaseBooks.length,
      google_count: externalGoogleBooks.length,
      google_books_api: GOOGLE_BOOKS_API_KEY ? "available" : "not_configured",
      books,
    });
  } catch (error) {
    console.error("Search books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to search books",
    });
  }
});

// =====================================================
// GENRES
// =====================================================

app.get("/api/genres", async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            id,
            name
          FROM genres
          ORDER BY id ASC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      genres: result.rows,
    });
  } catch (error) {
    console.error("Genres error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch genres",
    });
  }
});

// =====================================================
// FAVORITES
// =====================================================

// GET FAVORITES

app.get("/api/favorites", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
            SELECT
              favorites.id AS favorite_id,
              favorites.user_id,
              favorites.book_id,
              favorites.created_at,

              books.google_book_id,
              books.title,
              books.author,
              books.description,
              books.cover_url,
              books.published_year,
              books.average_rating

            FROM favorites

            INNER JOIN books
              ON books.id =
                 favorites.book_id

            WHERE favorites.user_id = $1

            ORDER BY
              favorites.created_at DESC;
          `,
      [userId],
    );

    res.json({
      success: true,
      count: result.rows.length,
      favorites: result.rows,
    });
  } catch (error) {
    console.error("Favorites error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch favorites",
    });
  }
});

// =====================================================
// GET WHO FAVORITED A BOOK (public)
// =====================================================
//
// GET /api/books/:id/favorites
//
// Returns the list of users who favorited a given book,
// plus the total count. Accepts a local numeric ID or a
// Google Books ID (auto-resolves/imports via
// ensureBookInDatabase, same as ratings/comments).
// =====================================================

app.get("/api/books/:id/favorites", async (req, res) => {
  const identifier = String(req.params.id || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Book ID is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            SELECT
              favorites.user_id,
              favorites.created_at,
              users.name AS user_name

            FROM favorites

            INNER JOIN users
              ON users.id =
                 favorites.user_id

            WHERE favorites.book_id = $1

            ORDER BY
              favorites.created_at DESC;
          `,
      [book.id],
    );

    res.json({
      success: true,

      book_id: book.id,

      google_book_id: book.google_book_id || null,

      count: result.rows.length,

      favorited_by: result.rows,
    });
  } catch (error) {
    console.error("Get book favorites error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch favorites for this book",
    });
  }
});

// ADD FAVORITE

app.post("/api/favorites", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const identifier = String(
    req.body?.book_id ||
      req.body?.google_book_id ||
      req.body?.googleBookId ||
      "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    const existingFavorite = await pool.query(
      `
            SELECT id
            FROM favorites
            WHERE user_id = $1
              AND book_id = $2
            LIMIT 1;
          `,
      [userId, bookId],
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Book is already in favorites",
      });
    }

    const result = await pool.query(
      `
            INSERT INTO favorites
            (
              user_id,
              book_id,
              created_at
            )
            VALUES
            (
              $1,
              $2,
              CURRENT_TIMESTAMP
            )
            RETURNING
              id,
              user_id,
              book_id,
              created_at;
          `,
      [userId, bookId],
    );

    await logUserActivity({
      userId,
      eventType: "favorite_add",
      bookId,
      metadata: { title: book.title },
      req,
    });

    res.status(201).json({
      success: true,
      message: "Book added to favorites",

      favorite: result.rows[0],

      book: {
        id: book.id,
        google_book_id: book.google_book_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      },
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add favorite",
    });
  }
});

// REMOVE FAVORITE

app.delete("/api/favorites/:bookId", authenticateToken, async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  const userId = req.user.userId;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Invalid book ID",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            DELETE FROM favorites

            WHERE user_id = $1
              AND book_id = $2

            RETURNING
              id,
              user_id,
              book_id,
              created_at;
          `,
      [userId, book.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Favorite not found",
      });
    }

    await logUserActivity({
      userId,
      eventType: "favorite_remove",
      bookId: book.id,
      metadata: { title: book.title },
      req,
    });

    res.json({
      success: true,
      message: "Book removed from favorites",
      favorite: result.rows[0],
    });
  } catch (error) {
    console.error("Remove favorite error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to remove favorite",
    });
  }
});

// =====================================================
// RATINGS
// =====================================================

// GET RATINGS
//
// Now also returns `raters`: the list of every individual
// rating on this book (who rated it, what they gave it, and
// when), so the frontend can show a per-user breakdown like
// "Alice — 4/5" instead of just the aggregate average.

app.get("/api/ratings/:bookId", async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Book ID is required",
    });
  }

  let userId = null;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const jwt = await import("jsonwebtoken");

      const token = authHeader.split(" ")[1];

      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

      userId = decoded.userId || decoded.id || null;
    } catch {
      userId = null;
    }
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    const result = await pool.query(
      `
            SELECT

              COUNT(*)::integer
                AS total_ratings,

              COALESCE(
                ROUND(
                  AVG(rating)::numeric,
                  1
                ),
                0
              ) AS average_rating,

              COUNT(*) FILTER (
                WHERE rating = 1
              )::integer AS rating_1,

              COUNT(*) FILTER (
                WHERE rating = 2
              )::integer AS rating_2,

              COUNT(*) FILTER (
                WHERE rating = 3
              )::integer AS rating_3,

              COUNT(*) FILTER (
                WHERE rating = 4
              )::integer AS rating_4,

              COUNT(*) FILTER (
                WHERE rating = 5
              )::integer AS rating_5

            FROM ratings

            WHERE book_id = $1;
          `,
      [bookId],
    );

    // -----------------------------------------------
    // INDIVIDUAL RATERS
    // -----------------------------------------------

    const ratersResult = await pool.query(
      `
            SELECT
              ratings.user_id,
              ratings.rating,
              ratings.created_at,
              users.name AS user_name

            FROM ratings

            INNER JOIN users
              ON users.id =
                 ratings.user_id

            WHERE ratings.book_id = $1

            ORDER BY
              ratings.created_at DESC;
          `,
      [bookId],
    );

    let userRating = null;

    if (userId) {
      const userRatingResult = await pool.query(
        `
              SELECT
                id,
                rating,
                created_at
              FROM ratings
              WHERE user_id = $1
                AND book_id = $2
              LIMIT 1;
            `,
        [userId, bookId],
      );

      if (userRatingResult.rows.length > 0) {
        userRating = Number(userRatingResult.rows[0].rating);
      }
    }

    const row = result.rows[0] || {};

    res.json({
      success: true,

      book_id: bookId,

      google_book_id: book.google_book_id || null,

      total_ratings: Number(row.total_ratings || 0),

      average_rating: Number(row.average_rating || 0),

      rating_1: Number(row.rating_1 || 0),

      rating_2: Number(row.rating_2 || 0),

      rating_3: Number(row.rating_3 || 0),

      rating_4: Number(row.rating_4 || 0),

      rating_5: Number(row.rating_5 || 0),

      user_rating: userRating,

      raters: ratersResult.rows,
    });
  } catch (error) {
    console.error("Get ratings error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch ratings",
    });
  }
});

// ADD OR UPDATE RATING

app.post("/api/ratings", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const { book_id, google_book_id, googleBookId, rating } = req.body;

  const newRating = Number(rating);

  if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) {
    return res.status(400).json({
      success: false,
      error: "Rating must be between 1 and 5",
    });
  }

  const identifier = String(
    book_id || google_book_id || googleBookId || "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const bookId = book.id;

    const googleId = book.google_book_id || null;

    const existingResult = await pool.query(
      `
            SELECT id
            FROM ratings
            WHERE user_id = $1
              AND book_id = $2
            LIMIT 1;
          `,
      [userId, bookId],
    );

    let result;
    let wasUpdated = false;

    if (existingResult.rows.length > 0) {
      result = await pool.query(
        `
              UPDATE ratings

              SET
                rating = $1,
                google_book_id = $2,
                created_at =
                  CURRENT_TIMESTAMP

              WHERE id = $3
                AND user_id = $4

              RETURNING
                id,
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at;
            `,
        [newRating, googleId, existingResult.rows[0].id, userId],
      );

      wasUpdated = true;
    } else {
      result = await pool.query(
        `
              INSERT INTO ratings
              (
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at
              )
              VALUES
              (
                $1,
                $2,
                $3,
                $4,
                CURRENT_TIMESTAMP
              )

              RETURNING
                id,
                user_id,
                book_id,
                google_book_id,
                rating,
                created_at;
            `,
        [userId, bookId, googleId, newRating],
      );
    }

    const averageResult = await pool.query(
      `
            SELECT
              COALESCE(
                ROUND(
                  AVG(rating)::numeric,
                  1
                ),
                0
              ) AS average_rating
            FROM ratings
            WHERE book_id = $1;
          `,
      [bookId],
    );

    const averageRating = Number(averageResult.rows[0]?.average_rating || 0);

    await pool.query(
      `
          UPDATE books

          SET average_rating = $1

          WHERE id = $2;
        `,
      [averageRating, bookId],
    );

    invalidateCache();
    await logUserActivity({
      userId,
      eventType: wasUpdated ? "rating_update" : "rating_add",
      bookId,
      metadata: { rating: newRating, title: book.title },
      req,
    });

    res.json({
      success: true,

      message: wasUpdated
        ? "Rating updated successfully"
        : "Rating submitted successfully",

      rating: result.rows[0],

      user_rating: newRating,

      book_id: bookId,

      google_book_id: googleId,

      average_rating: averageRating,
    });
  } catch (error) {
    console.error("Save rating error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to save rating",
    });
  }
});

// =====================================================
// COMMENTS
// =====================================================

// GET COMMENTS

app.get("/api/comments/:bookId", async (req, res) => {
  const identifier = String(req.params.bookId || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "Book ID is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            SELECT
              comments.id,
              comments.user_id,
              comments.book_id,
              comments.comment,
              comments.created_at,
              users.name AS user_name

            FROM comments

            INNER JOIN users
              ON users.id =
                 comments.user_id

            WHERE comments.book_id = $1

            ORDER BY
              comments.created_at DESC;
          `,
      [book.id],
    );

    res.json({
      success: true,

      book_id: book.id,

      google_book_id: book.google_book_id || null,

      count: result.rows.length,

      comments: result.rows,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch comments",
    });
  }
});

// ADD COMMENT

app.post("/api/comments", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const { book_id, google_book_id, googleBookId, comment } = req.body;

  const identifier = String(
    book_id || google_book_id || googleBookId || "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  if (!comment || !String(comment).trim()) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot be empty",
    });
  }

  const cleanComment = String(comment).trim();

  if (cleanComment.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot exceed 1000 characters",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            INSERT INTO comments
            (
              user_id,
              book_id,
              comment,
              created_at
            )

            VALUES
            (
              $1,
              $2,
              $3,
              CURRENT_TIMESTAMP
            )

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [userId, book.id, cleanComment],
    );

    const userResult = await pool.query(
      `
            SELECT
              id,
              name
            FROM users
            WHERE id = $1;
          `,
      [userId],
    );

    await logUserActivity({
      userId,
      eventType: "comment_add",
      bookId: book.id,
      metadata: { title: book.title, commentId: result.rows[0].id },
      req,
    });

    res.status(201).json({
      success: true,

      message: "Comment added successfully",

      comment: {
        ...result.rows[0],

        user_name: userResult.rows[0]?.name || "User",
      },

      book_id: book.id,

      google_book_id: book.google_book_id || null,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add comment",
    });
  }
});

// UPDATE COMMENT

app.put("/api/comments/:commentId", authenticateToken, async (req, res) => {
  const commentId = Number(req.params.commentId);

  const userId = req.user.userId;

  const { comment } = req.body;

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid comment ID",
    });
  }

  if (!comment || !String(comment).trim()) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot be empty",
    });
  }

  const cleanComment = String(comment).trim();

  if (cleanComment.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Comment cannot exceed 1000 characters",
    });
  }

  try {
    const result = await pool.query(
      `
            UPDATE comments

            SET
              comment = $1,
              created_at =
                CURRENT_TIMESTAMP

            WHERE id = $2
              AND user_id = $3

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [cleanComment, commentId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Comment not found or you are not allowed to update it",
      });
    }

    const userResult = await pool.query(
      `
            SELECT
              id,
              name
            FROM users
            WHERE id = $1;
          `,
      [userId],
    );

    res.json({
      success: true,

      message: "Comment updated successfully",

      comment: {
        ...result.rows[0],

        user_name: userResult.rows[0]?.name || "User",
      },
    });
  } catch (error) {
    console.error("Update comment error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update comment",
    });
  }
});

// DELETE COMMENT

app.delete("/api/comments/:commentId", authenticateToken, async (req, res) => {
  const commentId = Number(req.params.commentId);

  const userId = req.user.userId;

  if (!Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid comment ID",
    });
  }

  try {
    const result = await pool.query(
      `
            DELETE FROM comments

            WHERE id = $1
              AND user_id = $2

            RETURNING
              id,
              user_id,
              book_id,
              comment,
              created_at;
          `,
      [commentId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Comment not found or you are not allowed to delete it",
      });
    }

    res.json({
      success: true,

      message: "Comment deleted successfully",

      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to delete comment",
    });
  }
});

// =====================================================
// READING HISTORY
// =====================================================

app.post("/api/reading-history", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const identifier = String(
    req.body?.book_id ||
      req.body?.google_book_id ||
      req.body?.googleBookId ||
      "",
  ).trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: "book_id or google_book_id is required",
    });
  }

  try {
    const book = await ensureBookInDatabase(identifier);

    const result = await pool.query(
      `
            INSERT INTO reading_history
            (
              user_id,
              book_id,
              viewed_at
            )

            VALUES
            (
              $1,
              $2,
              CURRENT_TIMESTAMP
            )

            RETURNING *;
          `,
      [userId, book.id],
    );

    res.status(201).json({
      success: true,

      message: "Reading history saved",

      history: result.rows[0],

      book: {
        id: book.id,
        google_book_id: book.google_book_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      },
    });
  } catch (error) {
    console.error("Reading history error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to add reading history",
    });
  }
});

// =====================================================
// RECOMMENDATIONS
// =====================================================

app.get("/api/recommendations", authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const { type, recommendations } = await getRecommendationsForUser(userId, {
      limit: 20,
    });

    if (type === "popular") {
      const popularResult = await pool.query(`
            SELECT
              id,
              google_book_id,
              title,
              author,
              description,
              cover_url,
              published_year,
              average_rating,
              price_npr,
              sale_price_npr,
              is_for_sale
            FROM books

            ORDER BY
              average_rating DESC NULLS LAST,
              id ASC

            LIMIT 20;
          `);

      return res.json({
        success: true,
        type: "popular",

        message: "Popular books recommended for you",

        count: popularResult.rows.length,

        recommendations: popularResult.rows,
      });
    }

    res.json({
      success: true,
      type: "personalized",

      message: "Recommendations based on your activity (cosine similarity)",

      count: recommendations.length,

      recommendations,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to generate recommendations",
    });
  }
});

// =====================================================
// POPULAR BOOKS
// =====================================================

app.get("/api/discover/popular", async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            id,
            google_book_id,
            title,
            author,
            description,
            cover_url,
            published_year,
            average_rating,
            price_npr,
            sale_price_npr,
            is_for_sale
          FROM books
          ORDER BY
            average_rating DESC NULLS LAST,
            id ASC
          LIMIT 20;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("Popular books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch popular books",
    });
  }
});

// =====================================================
// ADMIN DASHBOARD
// IMPORTANT: THESE MUST BE BEFORE THE 404 HANDLER
// =====================================================

app.get("/api/admin/dashboard", verifyToken, requireAdmin, async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");

    const users = await pool.query("SELECT COUNT(*) FROM users");

    const comments = await pool.query("SELECT COUNT(*) FROM comments");

    const ratings = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      success: true,

      stats: {
        books: Number(books.rows[0].count),

        users: Number(users.rows[0].count),

        comments: Number(comments.rows[0].count),

        ratings: Number(ratings.rows[0].count),
      },

      admin: req.user?.email || req.user?.name || "Admin",
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      error: "Dashboard loading failed.",
    });
  }
});

// =====================================================
// ADMIN PAYMENTS / TRANSACTIONS
// =====================================================
// Returns payment activity for administrators without exposing
// provider secrets or raw payment metadata.
app.get("/api/admin/payments", verifyToken, requireAdmin, async (req, res) => {
  const requestedStatus = String(req.query.status || "all").toLowerCase();
  const allowedStatuses = new Set([
    "all",
    "pending",
    "completed",
    "initiated",
    "failed",
    "canceled",
    "expired",
    "refunded",
  ]);
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "all";

  try {
    const values = [];
    let where = "";

    if (status !== "all") {
      values.push(status);
      where = "WHERE p.status = $1";
    }

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.order_id,
          p.provider,
          p.transaction_id,
          p.provider_reference,
          p.amount,
          p.currency,
          p.status AS payment_status,
          p.created_at AS payment_created_at,
          p.updated_at AS payment_updated_at,
          o.order_number,
          o.status AS order_status,
          o.total AS order_total,
          o.created_at AS order_created_at,
          u.id AS user_id,
          u.name AS user_name,
          u.email AS user_email
        FROM payments p
        JOIN orders o ON o.id = p.order_id
        JOIN users u ON u.id = o.user_id
        ${where}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT 500
      `,
      values,
    );

    res.json({
      success: true,
      count: result.rows.length,
      payments: result.rows,
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch payment transactions." });
  }
});

// =====================================================
// ADMIN STATS
// =====================================================

app.get("/api/admin/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");

    const users = await pool.query("SELECT COUNT(*) FROM users");

    const comments = await pool.query("SELECT COUNT(*) FROM comments");

    const favorites = await pool.query("SELECT COUNT(*) FROM favorites");

    const ratings = await pool.query("SELECT COUNT(*) FROM ratings");

    res.json({
      success: true,

      users: Number(users.rows[0].count),

      books: Number(books.rows[0].count),

      comments: Number(comments.rows[0].count),

      favorites: Number(favorites.rows[0].count),

      ratings: Number(ratings.rows[0].count),
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin stats.",
    });
  }
});

// =====================================================
// ADMIN GET USERS
// =====================================================

app.get("/api/admin/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            u.id, u.name, u.email, u.role, u.created_at,
            COALESCE(a.login_count, 0)::integer AS login_count,
            a.last_login,
            COALESCE(a.comment_count, 0)::integer AS comment_count,
            COALESCE(a.rating_count, 0)::integer AS rating_count,
            COALESCE(a.favorite_count, 0)::integer AS favorite_count,
            COALESCE(a.support_message_count, 0)::integer AS support_message_count,
            a.last_activity
          FROM users u
          LEFT JOIN (
            SELECT user_id,
              COUNT(*) FILTER (WHERE event_type = 'login') AS login_count,
              MAX(created_at) FILTER (WHERE event_type = 'login') AS last_login,
              COUNT(*) FILTER (WHERE event_type LIKE 'comment_%') AS comment_count,
              COUNT(*) FILTER (WHERE event_type LIKE 'rating_%') AS rating_count,
              COUNT(*) FILTER (WHERE event_type LIKE 'favorite_%') AS favorite_count,
              COUNT(*) FILTER (WHERE event_type = 'support_message') AS support_message_count,
              MAX(created_at) AS last_activity
            FROM user_activity_logs
            GROUP BY user_id
          ) a ON a.user_id = u.id
          ORDER BY u.created_at DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin users.",
    });
  }
});

// =====================================================
// ADMIN GET USER ACTIVITY
// =====================================================
// =====================================================
// ADMIN GET GLOBAL USER ACTIVITY
// =====================================================
// Shows the newest user activity entries with identity,
// exact timestamp, event, book, metadata and IP.
// =====================================================
// =====================================================
// USER USAGE / TIME TRACKING
// =====================================================
app.post("/api/analytics/heartbeat", verifyToken, async (req, res) => {
  const userId = Number(req.user.userId);
  if (!Number.isInteger(userId) || userId <= 0)
    return res.status(401).json({ success: false, error: "Invalid session." });
  const activityType = String(req.body?.activityType || "page");
  const resourceKey = req.body?.resourceKey
    ? String(req.body.resourceKey).slice(0, 255)
    : null;
  const resourceName = req.body?.resourceName
    ? String(req.body.resourceName).slice(0, 500)
    : null;
  const sessionId = req.body?.sessionId ? Number(req.body.sessionId) : null;
  if (!["page", "book", "comments", "favorites", "admin_portal"].includes(activityType))
    return res
      .status(400)
      .json({ success: false, error: "Invalid activity type." });
  try {
    let row;
    if (sessionId) {
      const updated = await pool.query(
        `
        UPDATE user_usage_sessions
        SET last_heartbeat_at = CURRENT_TIMESTAMP,
            duration_seconds = GREATEST(duration_seconds, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::integer),
            resource_name = COALESCE($2, resource_name),
            ended_at = NULL
        WHERE id = $1 AND user_id = $3 AND activity_type = $4
        RETURNING id, duration_seconds
      `,
        [sessionId, resourceName, userId, activityType],
      );
      if (updated.rows.length) row = updated.rows[0];
    }
    if (!row) {
      const created = await pool.query(
        `
        INSERT INTO user_usage_sessions (user_id, activity_type, resource_key, resource_name)
        VALUES ($1,$2,$3,$4) RETURNING id, duration_seconds
      `,
        [userId, activityType, resourceKey, resourceName],
      );
      row = created.rows[0];
    }
    return res.json({
      success: true,
      sessionId: row.id,
      durationSeconds: Number(row.duration_seconds || 0),
    });
  } catch (error) {
    console.error("Usage heartbeat error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Unable to record activity." });
  }
});

app.post("/api/analytics/end", verifyToken, async (req, res) => {
  const userId = Number(req.user.userId);
  const sessionId = Number(req.body?.sessionId);
  if (!Number.isInteger(userId) || !Number.isInteger(sessionId))
    return res.status(400).json({ success: false, error: "Invalid session." });
  try {
    const result = await pool.query(
      `
      UPDATE user_usage_sessions
      SET last_heartbeat_at=CURRENT_TIMESTAMP,
          ended_at=CURRENT_TIMESTAMP,
          duration_seconds=GREATEST(duration_seconds, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-started_at))::integer)
      WHERE id=$1 AND user_id=$2
      RETURNING id,duration_seconds
    `,
      [sessionId, userId],
    );
    return res.json({ success: true, session: result.rows[0] || null });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Unable to end activity." });
  }
});

app.get(
  "/api/admin/usage-analytics",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [users, sessions, books, pages] = await Promise.all([
        pool.query(
          `SELECT
            u.id,u.name,u.email,u.role,u.created_at,
            COALESCE((SELECT COUNT(*) FROM user_usage_sessions s WHERE s.user_id=u.id),0)::integer AS sessions,
            COALESCE((SELECT SUM(s.duration_seconds) FROM user_usage_sessions s WHERE s.user_id=u.id),0)::integer AS total_seconds,
            COALESCE((SELECT SUM(s.duration_seconds) FROM user_usage_sessions s WHERE s.user_id=u.id AND s.activity_type='page' AND (s.resource_key='dashboard' OR s.resource_name='Dashboard')),0)::integer AS dashboard_seconds,
            COALESCE((SELECT SUM(s.duration_seconds) FROM user_usage_sessions s WHERE s.user_id=u.id AND s.activity_type='favorites'),0)::integer AS favorites_seconds,
            COALESCE((SELECT SUM(s.duration_seconds) FROM user_usage_sessions s WHERE s.user_id=u.id AND s.activity_type='comments'),0)::integer AS comments_seconds,
            COALESCE((SELECT SUM(s.duration_seconds) FROM user_usage_sessions s WHERE s.user_id=u.id AND s.activity_type='book'),0)::integer AS book_seconds,
            (SELECT MAX(s.last_heartbeat_at) FROM user_usage_sessions s WHERE s.user_id=u.id) AS last_seen,
            (SELECT COUNT(*) FROM user_activity_logs l WHERE l.user_id=u.id AND l.event_type='login')::integer AS login_count,
            (SELECT MAX(l.created_at) FROM user_activity_logs l WHERE l.user_id=u.id AND l.event_type='login') AS last_login,
            (SELECT MAX(l.created_at) FROM user_activity_logs l WHERE l.user_id=u.id) AS last_activity
          FROM users u
          ORDER BY last_seen DESC NULLS LAST,u.created_at DESC`,
        ),
        pool.query(
          `SELECT s.id,s.user_id,u.name AS user_name,u.email AS user_email,s.activity_type,s.resource_key,s.resource_name,s.started_at,s.ended_at,s.last_heartbeat_at,s.duration_seconds,s.metadata FROM user_usage_sessions s JOIN users u ON u.id=s.user_id ORDER BY s.started_at DESC LIMIT 1000`,
        ),
        pool.query(
          `SELECT COALESCE(resource_name,resource_key,'Unknown book') AS book, COUNT(*)::integer AS visits, COALESCE(SUM(duration_seconds),0)::integer AS total_seconds, ROUND(AVG(duration_seconds))::integer AS avg_seconds FROM user_usage_sessions WHERE activity_type='book' GROUP BY 1 ORDER BY total_seconds DESC LIMIT 100`,
        ),
        pool.query(
          `SELECT COALESCE(resource_name,resource_key,'Dashboard') AS page, COUNT(*)::integer AS visits, COALESCE(SUM(duration_seconds),0)::integer AS total_seconds, ROUND(AVG(duration_seconds))::integer AS avg_seconds FROM user_usage_sessions WHERE activity_type='page' GROUP BY 1 ORDER BY total_seconds DESC LIMIT 100`,
        ),
      ]);
      return res.json({
        success: true,
        users: users.rows,
        sessions: sessions.rows,
        books: books.rows,
        pages: pages.rows,
      });
    } catch (error) {
      console.error("Admin usage analytics error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to load usage analytics." });
    }
  },
);

app.get("/api/admin/activity", verifyToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
    const result = await pool.query(
      `
      SELECT
        l.id,
        l.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        l.event_type,
        l.book_id,
        b.title AS book_title,
        l.metadata,
        l.ip_address,
        l.user_agent,
        l.created_at
      FROM user_activity_logs l
      INNER JOIN users u ON u.id = l.user_id
      LEFT JOIN books b ON b.id = l.book_id
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT $1
    `,
      [limit],
    );

    return res.json({
      success: true,
      count: result.rows.length,
      activities: result.rows,
    });
  } catch (error) {
    console.error("Admin global activity error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load user activity." });
  }
});

app.get(
  "/api/admin/users/:id/activity",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0)
      return res
        .status(400)
        .json({ success: false, error: "Invalid user ID." });
    try {
      const userResult = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1",
        [userId],
      );
      if (!userResult.rows.length)
        return res
          .status(404)
          .json({ success: false, error: "User not found." });
      const summary = await pool.query(
        `
      SELECT
        COUNT(*)::integer AS total_events,
        COUNT(*) FILTER (WHERE event_type = 'login')::integer AS login_count,
        COUNT(*) FILTER (WHERE event_type LIKE 'comment_%')::integer AS comment_count,
        COUNT(*) FILTER (WHERE event_type LIKE 'rating_%')::integer AS rating_count,
        COUNT(*) FILTER (WHERE event_type LIKE 'favorite_%')::integer AS favorite_count,
        MAX(created_at) FILTER (WHERE event_type = 'login') AS last_login,
        MAX(created_at) AS last_activity
      FROM user_activity_logs WHERE user_id = $1`,
        [userId],
      );
      const events = await pool.query(
        `
      SELECT l.id, l.event_type, l.book_id, b.title AS book_title, l.metadata, l.ip_address, l.user_agent, l.created_at
      FROM user_activity_logs l
      LEFT JOIN books b ON b.id = l.book_id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT 500`,
        [userId],
      );
      const usage = await pool.query(
        `SELECT activity_type, COALESCE(SUM(duration_seconds),0)::integer AS total_seconds, COUNT(*)::integer AS sessions, MAX(last_heartbeat_at) AS last_seen
         FROM user_usage_sessions WHERE user_id=$1 GROUP BY activity_type ORDER BY total_seconds DESC`,
        [userId],
      );
      const sessions = await pool.query(
        `SELECT id, activity_type, resource_key, resource_name, started_at, ended_at, last_heartbeat_at, duration_seconds
         FROM user_usage_sessions WHERE user_id=$1 ORDER BY started_at DESC LIMIT 500`,
        [userId],
      );
      return res.json({
        success: true,
        user: userResult.rows[0],
        summary: summary.rows[0],
        events: events.rows,
        usage: usage.rows,
        sessions: sessions.rows,
      });
    } catch (error) {
      console.error("Admin user activity error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to load user activity." });
    }
  },
);

// =====================================================
// ADMIN GET BOOKS
// =====================================================

app.get("/api/admin/books", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            id,
            google_book_id,
            title,
            author,
            description,
            cover_url,
            published_year,
            average_rating,
            price_npr,
            sale_price_npr,
            is_for_sale,
            created_at
          FROM books
          ORDER BY id DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error("Admin get books error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin books.",
    });
  }
});

// =====================================================
// ADMIN GET ALL COMMENTS (with book + user info)
// =====================================================
//
// GET /api/admin/comments
//
// Returns every comment in the system, joined with the
// book it was left on and the user who left it, so the
// admin dashboard can show "who commented, what they said,
// and on which book" in one list.
// =====================================================

app.get("/api/admin/comments", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            comments.id,
            comments.comment,
            comments.created_at,

            comments.book_id,
            books.title AS book_title,
            books.author AS book_author,
            books.cover_url AS book_cover_url,
            books.google_book_id AS book_google_id,

            comments.user_id,
            users.name AS user_name,
            users.email AS user_email

          FROM comments

          INNER JOIN books
            ON books.id = comments.book_id

          INNER JOIN users
            ON users.id = comments.user_id

          ORDER BY comments.created_at DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      comments: result.rows,
    });
  } catch (error) {
    console.error("Admin get comments error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin comments.",
    });
  }
});

// =====================================================
// ADMIN GET ALL FAVORITES (with book + user info)
// =====================================================
//
// GET /api/admin/favorites
//
// Returns every favorite in the system, joined with the
// book that was favorited and the user who favorited it.
// =====================================================

app.get("/api/admin/favorites", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            favorites.id,
            favorites.created_at,

            favorites.book_id,
            books.title AS book_title,
            books.author AS book_author,
            books.cover_url AS book_cover_url,
            books.google_book_id AS book_google_id,

            favorites.user_id,
            users.name AS user_name,
            users.email AS user_email

          FROM favorites

          INNER JOIN books
            ON books.id = favorites.book_id

          INNER JOIN users
            ON users.id = favorites.user_id

          ORDER BY favorites.created_at DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      favorites: result.rows,
    });
  } catch (error) {
    console.error("Admin get favorites error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin favorites.",
    });
  }
});

// =====================================================
// ADMIN GET ALL RATINGS (with book + user info)
// =====================================================
//
// GET /api/admin/ratings
//
// Returns every rating in the system, joined with the book
// that was rated and the user who rated it.
// =====================================================

app.get("/api/admin/ratings", verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
          SELECT
            ratings.id,
            ratings.rating,
            ratings.created_at,

            ratings.book_id,
            books.title AS book_title,
            books.author AS book_author,
            books.cover_url AS book_cover_url,
            books.google_book_id AS book_google_id,

            ratings.user_id,
            users.name AS user_name,
            users.email AS user_email

          FROM ratings

          INNER JOIN books
            ON books.id = ratings.book_id

          INNER JOIN users
            ON users.id = ratings.user_id

          ORDER BY ratings.created_at DESC;
        `);

    res.json({
      success: true,
      count: result.rows.length,
      ratings: result.rows,
    });
  } catch (error) {
    console.error("Admin get ratings error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch admin ratings.",
    });
  }
});

// =====================================================
// ADMIN ADD BOOK
// =====================================================

app.post("/api/admin/books", verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      cover_url,
      published_year,
      price_npr,
      sale_price_npr,
      is_for_sale,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book title is required.",
      });
    }

    if (!author || !String(author).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book author is required.",
      });
    }

    const result = await pool.query(
      `
            INSERT INTO books
            (
              title,
              author,
              description,
              cover_url,
              published_year,
              price_npr,
              sale_price_npr,
              is_for_sale,
              created_at
            )

            VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              CURRENT_TIMESTAMP
            )

            RETURNING *;
          `,
      [
        String(title).trim(),
        String(author).trim(),
        description ? String(description).trim() : "",
        cover_url ? String(cover_url).trim() : null,
        published_year ? Number(published_year) : null,
        Number(price_npr ?? 500),
        sale_price_npr === null ||
        sale_price_npr === undefined ||
        sale_price_npr === ""
          ? null
          : Number(sale_price_npr),
        is_for_sale === undefined ? true : Boolean(is_for_sale),
      ],
    );

    invalidateCache();

    res.status(201).json({
      success: true,
      message: "Book created successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Admin add book error:", error);

    res.status(500).json({
      success: false,
      error: "Book creation failed.",
    });
  }
});

// =====================================================
// ADMIN UPDATE BOOK
// =====================================================

app.put("/api/admin/books/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid book ID.",
      });
    }

    const {
      title,
      author,
      description,
      cover_url,
      published_year,
      price_npr,
      sale_price_npr,
      is_for_sale,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book title is required.",
      });
    }

    if (!author || !String(author).trim()) {
      return res.status(400).json({
        success: false,
        error: "Book author is required.",
      });
    }

    const result = await pool.query(
      `
            UPDATE books

            SET
              title = $1,
              author = $2,
              description = $3,
              cover_url = $4,
              published_year = $5,
              price_npr = $6,
              sale_price_npr = $7,
              is_for_sale = $8

            WHERE id = $9

            RETURNING *;
          `,
      [
        String(title).trim(),
        String(author).trim(),
        description ? String(description).trim() : "",
        cover_url ? String(cover_url).trim() : null,
        published_year ? Number(published_year) : null,
        Number(price_npr ?? 0),
        sale_price_npr === null ||
        sale_price_npr === undefined ||
        sale_price_npr === ""
          ? null
          : Number(sale_price_npr),
        Boolean(is_for_sale),
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Book not found.",
      });
    }

    invalidateCache();

    res.json({
      success: true,
      message: "Book updated successfully.",
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Admin update book error:", error);

    res.status(500).json({
      success: false,
      error: "Book update failed.",
    });
  }
});

// =====================================================
// ADMIN DELETE BOOK
// =====================================================

app.delete(
  "/api/admin/books/:id",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid book ID.",
        });
      }

      const result = await pool.query(
        `
            DELETE FROM books
            WHERE id = $1
            RETURNING id;
          `,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Book not found.",
        });
      }

      invalidateCache();

      res.json({
        success: true,
        message: "Book deleted successfully.",
        book_id: id,
      });
    } catch (error) {
      console.error("Admin delete book error:", error);

      res.status(500).json({
        success: false,
        error: "Book deletion failed.",
      });
    }
  },
);

// =====================================================
// 404 HANDLER
// THIS MUST COME AFTER ALL ROUTES
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// =====================================================
// ADMIN + SUPPORT DATABASE SCHEMA
// =====================================================
// Keep this schema bootstrap in the backend so a fresh database or an
// older BookWise database can start without requiring a separate manual
// migration step for the admin portal and customer support features.
async function ensureAdminSupportSchema() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS registration_email_verifications (
        email VARCHAR(320) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        code_hash VARCHAR(64) NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);

    await client.query(`
      ALTER TABLE registration_email_verifications
        ADD COLUMN IF NOT EXISTS name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64),
        ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_registration_verification_expires
      ON registration_email_verifications(expires_at)
    `);

    await client.query(`
      DELETE FROM registration_email_verifications
      WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_invite_codes (
        id BIGSERIAL PRIMARY KEY,
        code_hash VARCHAR(64) NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE admin_invite_codes
        ADD COLUMN IF NOT EXISTS code_hash VARCHAR(64),
        ADD COLUMN IF NOT EXISTS created_by INTEGER,
        ADD COLUMN IF NOT EXISTS used_by INTEGER,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS used_at TIMESTAMP
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_invite_codes_active
      ON admin_invite_codes (created_by, expires_at)
      WHERE used_at IS NULL
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(64) NOT NULL,
        book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_user_activity_user_time ON user_activity_logs(user_id, created_at DESC, id DESC)`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_user_activity_event ON user_activity_logs(event_type, created_at DESC)`,
    );

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_usage_sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('page','book','comments','favorites','admin_portal')),
        resource_key VARCHAR(255),
        resource_name VARCHAR(500),
        started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMPTZ,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE user_usage_sessions DROP CONSTRAINT IF EXISTS user_usage_sessions_activity_type_check
    `);
    await client.query(`
      ALTER TABLE user_usage_sessions ADD CONSTRAINT user_usage_sessions_activity_type_check
      CHECK (activity_type IN ('page','book','comments','favorites','admin_portal'))
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_user_time ON user_usage_sessions(user_id, started_at DESC)`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_usage_type_resource ON user_usage_sessions(activity_type, resource_key, started_at DESC)`,
    );
    if (
      Number.isFinite(ACTIVITY_RETENTION_DAYS) &&
      ACTIVITY_RETENTION_DAYS > 0
    ) {
      await client.query(
        `DELETE FROM user_activity_logs WHERE created_at < CURRENT_TIMESTAMP - ($1 || ' days')::interval`,
        [String(ACTIVITY_RETENTION_DAYS)],
      );
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        visitor_token VARCHAR(128),
        customer_name VARCHAR(255),
        customer_email VARCHAR(320),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (user_id IS NOT NULL OR visitor_token IS NOT NULL)
      )
    `);

    await client.query(`
      ALTER TABLE support_conversations
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS visitor_token VARCHAR(128),
        ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS customer_email VARCHAR(320),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_support_conversations_user
      ON support_conversations(user_id)
      WHERE user_id IS NOT NULL
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_support_conversations_visitor
      ON support_conversations(visitor_token)
      WHERE user_id IS NULL AND visitor_token IS NOT NULL
    `);

    // Repair identity on conversations created by earlier versions.
    // Registered customers are always shown with their current username/email.
    await client.query(`
      UPDATE support_conversations c
      SET customer_name = u.name,
          customer_email = u.email
      FROM users u
      WHERE c.user_id = u.id
        AND (c.customer_name IS DISTINCT FROM u.name
             OR c.customer_email IS DISTINCT FROM u.email)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'admin')),
        sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL CHECK (length(trim(message)) > 0),
        is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
        is_read_by_customer BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      ALTER TABLE support_messages
        ADD COLUMN IF NOT EXISTS conversation_id BIGINT,
        ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20),
        ADD COLUMN IF NOT EXISTS sender_user_id INTEGER,
        ADD COLUMN IF NOT EXISTS message TEXT,
        ADD COLUMN IF NOT EXISTS is_read_by_admin BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_read_by_customer BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
      ON support_messages(conversation_id, created_at, id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_admin_unread
      ON support_messages(conversation_id)
      WHERE sender_type = 'customer' AND is_read_by_admin = false
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_customer_unread
      ON support_messages(conversation_id)
      WHERE sender_type = 'admin' AND is_read_by_customer = false
    `);

    // Compatibility for password-reset databases created by older versions.
    // This also prevents the historical `used_at does not exist` crash.
    const passwordResetTable = await client.query(`
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
      LIMIT 1
    `);

    if (passwordResetTable.rows.length) {
      await client.query(`
        ALTER TABLE password_reset_tokens
          ADD COLUMN IF NOT EXISTS used_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0
      `);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// =====================================================
// START SERVER
// =====================================================

async function startServer() {
  try {
    await ensureAdminSupportSchema();
    await ensureSupportRuntimeSchema();
    console.log("✅ Admin/support database schema is ready.");
  } catch (error) {
    console.error("❌ Failed to prepare admin/support database schema:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log("========================================");

    console.log("📚 BookWise API");

    console.log("========================================");

    console.log(`🚀 Server: http://localhost:${PORT}`);

    console.log(`❤️ Health: http://localhost:${PORT}/api/health`);

    console.log(`📚 Books: http://localhost:${PORT}/api/books`);

    console.log(
      `🔎 Search: http://localhost:${PORT}/api/discover/search?q=harry+potter`,
    );

    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);

    console.log(`🛡️ Admin: http://localhost:${PORT}/api/admin/dashboard`);

    console.log(
      `🌐 Google Books: ${
        GOOGLE_BOOKS_API_KEY ? "configured" : "NOT CONFIGURED"
      }`,
    );

    console.log("========================================");
  });
}

startServer();
