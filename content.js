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
  title: "Opensource Tools",
  hint: "Opensource Tools by Rinaldisign",
};

export const cards = [
  {
    name: "GRABBER",
    photo: "assets/tool-1.jpg",
    threads: "https://www.threads.com/share/BmMohARefc/",
    description:
      "Tools untuk mendownload file video dari website apapun, powerfull menembus iklan, prinsipnya selama ada video di page itu, maka bisa di download, mencari dan mendownload file video otomatis, dan auto convert ke mp4.",
  },
  {
    name: "ATM",
    photo: "assets/tool-2.jpg",
    threads: "https://www.threads.com/share/EAb6nVgyh/",
    description:
      "untuk ATM (amati tiru modifikasi) desain website, outputnya .md / .zip yang bisa dijadikan referensi untuk vibe coding di Claude. pakai ini dan ucapkan selamat tinggal untuk kata AI Slop.",
  },
  {
    name: "ArtCraft Hub",
    photo: "assets/tool-3.jpg",
    threads: "https://rinaldisign.com/craft/",
    description:
      "Kumpulan project Artcraft dalam 1 halaman, semua opensource dan bisa langsung di jalankan di browser.",
  },
];
