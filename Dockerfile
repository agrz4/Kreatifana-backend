# STEP 1: Gunakan image dasar Node.js
# Memilih versi Node.js yang sesuai dan base image Alpine yang ringan.
FROM node:18-alpine

# STEP 2: Tentukan direktori kerja di dalam container
WORKDIR /app

# STEP 3: Salin package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan Docker cache layer. Jika dependensi tidak berubah, langkah instalasi tidak perlu diulang.
COPY package.json ./
COPY package-lock.json ./ # <--- PENTING: Kembali ke package-lock.json untuk NPM

# STEP 4: Instal semua dependensi Node.js menggunakan NPM
# Gunakan --production jika Anda hanya ingin menginstal dependensi yang dibutuhkan di runtime.
RUN npm install --production # <--- PENTING: Kembali ke npm install

# STEP 5: Salin semua kode aplikasi dari host ke direktori kerja di container
COPY . .

# STEP 6: Generate Prisma Client (PENTING untuk Prisma)
# Ini memastikan bahwa Prisma Client yang dibutuhkan oleh aplikasi Anda sudah digenerate
# di dalam image Docker saat image itu dibangun.
RUN npx prisma generate

# STEP 7: Expose port yang digunakan aplikasi Express Anda
# PASTIKAN ini sesuai dengan PORT yang Anda definisikan di aplikasi Express Anda (misalnya process.env.PORT || 3000).
EXPOSE 3000

# STEP 8: Tentukan perintah yang akan dijalankan saat container dimulai
# Jika di package.json Anda ada "start": "node src/server.js"
CMD ["npm", "start"] # <--- PENTING: Kembali ke npm start