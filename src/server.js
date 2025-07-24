require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const { protect } = require("./middleware/authMiddleware");
const { errorHandler } = require("./middleware/errorMiddleware");
const multer = require("multer");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const tagRoutes = require("./routes/tagRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// --- PENANGANAN UPLOAD FILE (PENTING UNTUK PRODUKSI) ---
// Jika Anda menggunakan layanan cloud (Cloudinary/S3) untuk upload,
// kode di bawah ini harus DIHAPUS atau DIKOMENTARI di lingkungan produksi
// karena file tidak akan disimpan di disk server Railway.
// Logika upload Anda di route/controller produk juga harus diubah
// untuk mengunggah langsung ke layanan cloud tersebut.
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory at: ${uploadsDir}`);
}
app.use("/uploads", express.static(uploadsDir));
console.log(`Serving static files from: ${uploadsDir} at /uploads URL`);
// --- AKHIR PENANGANAN UPLOAD FILE ---


// 1) Global middleware
// --- PENGATURAN CORS DINAMIS (PENTING!) ---
const allowedOrigins = [
  "http://localhost:5173", // URL frontend lokal Anda (Vite default)
  // Ganti dengan URL ASLI frontend Vercel Anda setelah deploy
  "https://nama-aplikasi-anda.vercel.app",
  // Ganti dengan URL ASLI backend Railway Anda setelah deploy
  // "https://your-backend-xxxx.up.railway.app", // Akan ditambahkan setelah deploy pertama ke Railway
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // Gunakan corsOptions yang dinamis
// --- AKHIR PENGATURAN CORS DINAMIS ---


app.use(express.json()); // Untuk parsing body JSON
app.use(express.urlencoded({ extended: true })); // Untuk parsing URL-encoded body
app.use(morgan("dev")); // Untuk produksi, pertimbangkan `morgan('combined')` atau nonaktifkan jika platform hosting menyediakan logging.

// 2) Public routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);

// 3) Product routes (dengan autentikasi diterapkan di productRoutes.js)
app.use("/api/products", productRoutes);

// 4) Protected routes (Hanya route yang benar-benar butuh JWT)
app.use("/api/users", protect, userRoutes);
app.use("/api/reviews", protect, reviewRoutes);
app.use("/api/favorites", protect, favoriteRoutes);
app.use("/api/purchases", protect, purchaseRoutes);

// 5) Base healthcheck
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Digital Marketplace API" });
});

// 6) Error handler (harus paling akhir setelah semua rute)
// --- Penanganan Error Multer Spesifik ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err.code, err.message);
    let message = `File upload error: ${err.message}`;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum 10MB allowed.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected field for file upload: ${err.field}.`;
    }
    return res.status(400).json({ success: false, message: message });
  }
  // Lanjutkan ke error handler umum jika bukan error Multer
  errorHandler(err, req, res, next);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});