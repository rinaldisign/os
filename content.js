// ============================================================
//  content.js — semua isi website ada di sini.
//  Tambah kartu baru = tambah satu objek di array `cards`.
//
//  name        : nama tools
//  photo       : path foto (folder assets/ atau URL gambar)
//  threads     : link postingan Threads
//  description : kalimat keterangan (disarankan <= 120 karakter)
// ============================================================

export const site = {
  title: "Sketchbook Tools",
  hint: "geser untuk memutar · ketuk kartu untuk buka Threads",
};

export const cards = [
  {
    name: "Pensil Pintar",
    photo: "assets/tool-1.svg",
    threads: "https://www.threads.net/@instagram",
    description:
      "Contoh tools untuk mencatat ide dengan cepat. Ganti teks ini dengan keterangan tools kamu.",
  },
  {
    name: "Buku Doodle",
    photo: "assets/tool-2.svg",
    threads: "https://www.threads.net/@threads",
    description:
      "Contoh kedua: tempat menyimpan coretan, sketsa, dan rencana kecil sebelum jadi proyek besar.",
  },
];
