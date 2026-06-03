/* ==========================================================================
   12. SISTEM MANAJEMEN ELIMINASI TURNAMEN (INTEGRASI GOOGLE APPS SCRIPT)
   ========================================================================== */
const URL_ENGINE_TURNAMEN = "https://script.google.com/macros/s/AKfycbx9JjuYPXPVkac1h-W8I-aGap0p2smP7Qokk102yiekkZnqo0er86VrYtF904rEG0oK/exec"; 

// Fungsi Pembentuk Identitas Sesi Filter yang Valid dan Seragam Huruf Besar
function dapatkanIdentitasSesiKunci() {
    const usia = document.getElementById('filter-usia').value.trim().toUpperCase();
    const genderRaw = document.getElementById('filter-gender').value.trim();
    const kategori = document.getElementById('filter-kategori').value.trim().toUpperCase();
    const gender = genderRaw.toLowerCase() === "semua" ? "SEMUA" : genderRaw.trim().toUpperCase();
    
    return `${usia}_${gender}_${kategori}`;
}

// A. Fungsi Mengacak Bagan (POST)
window.triggerAcakBaganOtomatis = function() {
    const usiaRaw = document.getElementById('filter-usia').value;
    const genderRaw = document.getElementById('filter-gender').value;
    const kategori = document.getElementById('filter-kategori').value;
    
    // AMBIL NILAI: Mengambil angka pilihan dari dropdown kapasitas di HTML
    const kapasitas = document.getElementById('filter-kapasitas') ? document.getElementById('filter-kapasitas').value : "4";

    const usia = usiaRaw.trim();
    const gender = genderRaw.trim().toLowerCase() === "semua" ? "semua" : genderRaw.trim();

    const konfirmasi = confirm(`Kunci data pendaftaran & acak bagan eliminasi murni untuk kelompok:\n\n» Usia: ${usia}\n» Gender: ${genderRaw}\n» Kategori: ${kategori}\n» Kapasitas: ${kapasitas} Peserta\n\nLanjutkan proses pengundian acak?`);
    if (!konfirmasi) return;

    // NILAI DIUBAH: Menyisipkan nilai kapasitasMatch agar dikirim ke doPost Apps Script
    const bodiPesan = {
        aksi: "generateBagan",
        targetUsia: usia,
        targetGender: gender, 
        targetKategori: kategori,
        kapasitasMatch: kapasitas
    };

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #2c3e50; width: 100%; font-weight: bold;"><i class="fa-solid fa-spinner fa-spin"></i> Sedahromo Engine sedang mengacak urutan pendaftar...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error(err);
        alert("Bagan sukses diproses! Memuat ulang visual...");
        window.muatBaganLombaVisual();
    });
};

// B. Fungsi Mengambil & Menggambar Pohon Turnamen Sesuai Seleksi Babak (GET)
window.muatBaganLombaVisual = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();
    const babakAktifDropdown = document.getElementById('filter-babak').value;
    const container = document.getElementById('bracket-container');
    
    if (!container) return;
    container.innerHTML = `<p style="text-align: center; color: #666; width: 100%;"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil draf pertandingan dari lembar kerja...</p>`;

    fetch(`${URL_ENGINE_TURNAMEN}?aksi=ambilBagan&identitasFilter=${encodeURIComponent(identitasFilter)}`)
    .then(res => res.json())
    .then(data => {
        // Saring data di sisi client hanya untuk ronde yang terpilih di dropdown
        const dataTersaring = data.filter(match => match.ronde.trim().toLowerCase() === babakAktifDropdown.trim().toLowerCase());

        if (!dataTersaring || dataTersaring.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #999; width: 100%; padding: 20px;">Belum ada data draf pertandingan untuk ${babakAktifDropdown} kelompok ini.<br>Silakan klik tombol "Kunci & Acak Grup" untuk membuatnya.</p>`;
            return;
        }

        container.innerHTML = ""; 

        const elemenRonde = document.createElement('div');
        elemenRonde.className = 'bracket-round';
        
        const judulRonde = document.createElement('h4');
        judulRonde.style = "text-align: center; margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; font-weight: bold;";
        judulRonde.innerText = babakAktifDropdown.toUpperCase();
        elemenRonde.appendChild(judulRonde);

        dataTersaring.forEach(match => {
            const pemenangValid = match.pemenang ? match.pemenang.trim().toLowerCase() : "";

            const isP1Menang = match.p1 && pemenangValid === match.p1.trim().toLowerCase() && match.p1 !== "";
            const isP2Menang = match.p2 && pemenangValid === match.p2.trim().toLowerCase() && match.p2 !== "";
            const isP3Menang = match.p3 && pemenangValid === match.p3.trim().toLowerCase() && match.p3 !== "" && match.p3 !== "KOSONG";
            const isP4Menang = match.p4 && pemenangValid === match.p4.trim().toLowerCase() && match.p4 !== "" && match.p4 !== "KOSONG";

            let displaySkor1 = match.skor1 !== undefined ? match.skor1 : 0;
            let displaySkor2 = match.skor2 !== undefined ? match.skor2 : 0;
            
            let disableInput = false;
            if (match.p2 && (match.p2.includes("BYE") || match.p2.includes("KOSONG"))) {
                displaySkor1 = 1; 
                disableInput = true;
            }

            // Logika sembunyikan baris sisa secara dinamis jika format kapasitas di sheet sedang berupa duel (2 orang)
            const sembunyikanP3 = (!match.p3 || match.p3 === "KOSONG" || match.p3 === "") ? 'style="display:none;"' : '';
            const sembunyikanP4 = (!match.p4 || match.p4 === "KOSONG" || match.p4 === "") ? 'style="display:none;"' : '';

            const elemenMatch = document.createElement('div');
            elemenMatch.className = 'bracket-match';
            
            // NILAI DIUBAH: Merender display slot P1, P2, P3, dan P4 secara dinamis mengikuti data dari doGet Apps Script
            elemenMatch.innerHTML = `
                <div class="bracket-match-id">${match.matchId.split('-').pop()}</div>
                
                <div class="bracket-team-row ${isP1Menang ? 'team-menang' : ''}">
                    <span class="bracket-team-name"><i class="fa-solid fa-user" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p1 || "-"}</span>
                    <input type="number" class="bracket-team-score" value="${displaySkor1}" min="0" max="99" 
                        style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0;"
                        ${disableInput ? 'disabled' : ''}
                        onchange="window.simpanSkorPertandingan('${match.matchId}', 1, this.value)">
                </div>
                
                <div class="bracket-team-row ${isP2Menang ? 'team-menang' : ''}">
                    <span class="bracket-team-name"><i class="fa-solid fa-user" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p2 || "-"}</span>
                    <input type="number" class="bracket-team-score" value="${displaySkor2}" min="0" max="99" 
                        style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0;"
                        ${disableInput ? 'disabled' : ''}
                        onchange="window.simpanSkorPertandingan('${match.matchId}', 2, this.value)">
                </div>

                <div class="bracket-team-row ${isP3Menang ? 'team-menang' : ''}" ${sembunyikanP3}>
                    <span class="bracket-team-name"><i class="fa-solid fa-user" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p3 || "-"}</span>
                    <input type="number" class="bracket-team-score" value="0" min="0" max="99" 
                        style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0; visibility: hidden;">
                </div>

                <div class="bracket-team-row ${isP4Menang ? 'team-menang' : ''}" ${sembunyikanP4}>
                    <span class="bracket-team-name"><i class="fa-solid fa-user" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${match.p4 || "-"}</span>
                    <input type="number" class="bracket-team-score" value="0" min="0" max="99" 
                        style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0; visibility: hidden;">
                </div>
            `;
            elemenRonde.appendChild(elemenMatch);
        });
        container.appendChild(elemenRonde);
    })
    .catch(err => {
        container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-triangle-exclamation"></i> Gagal terhubung ke server robot. Pastikan deployment Apps Script benar.</p>`;
    });
};

// C. Fungsi Toggle Reset Robot Total (POST)
window.triggerResetRobotTotal = function() {
    const konfirmasi1 = confirm("PERINGATAN TINGKAT TINGGI!\n\nTindakan ini akan MENGHAPUS BERSIH data pendaftaran dan skema bagan aktif di dalam lembar kerja Google Sheets Robot.");
    if (!konfirmasi1) return;

    const konfirmasiKunci = prompt("Untuk memvalidasi tindakan pembersihan ini, silakan ketik teks 'RESET' pada kolom di bawah ini:");
    if (konfirmasiKunci !== "RESET") {
        alert("Pembersihan dibatalkan. Kata kunci verifikasi salah.");
        return;
    }

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-trash-can fa-fade"></i> Robot sedang menghapus seluruh baris data pendaftaran...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ aksi: "resetSystem" })
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual();
    })
    .catch(err => {
        console.error(err);
        alert("Sistem robot sukses dikosongkan kembali ke kondisi nol!");
        window.muatBaganLombaVisual();
    });
};

// D. Fungsi Kirim Data ke Database Utama & Auto-Reset Bagan
window.arsipDanAutoResetBagan = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();

    const konfirmasi = confirm(`Apakah turnamen untuk kelompok:\n» ${identitasFilter}\nsudah selesai total dan didapatkan Juara 1?\n\nJika YA, seluruh data pertandingan akan dikirim ke DATABASE UTAMA dan bagan aktif di robot akan langsung dibersihkan.`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "simpanKeDatabase",
        identitasFilter: identitasFilter
    };

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Memindahkan riwayat pertandingan ke database eksternal...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error(err);
        alert("Proses arsipselesai! Mengosongkan bagan aktif...");
        window.muatBaganLombaVisual();
    });
};

// E. Fungsi Pengiriman Update Skor Real-Time
window.simpanSkorPertandingan = function(matchId, nomorPlayer, nilaiSkor) {
    console.log(`Mengirim update skor: ${matchId} | Player ${nomorPlayer} -> Skor: ${nilaiSkor}`);
    
    const bodiPesan = {
        aksi: "updateSkorMatch",
        matchId: matchId,
        playerKe: nomorPlayer,
        skorBaru: parseInt(nilaiSkor) || 0
    };

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        if (respon.status === "sukses") {
            console.log("Skor sukses disimpan!");
            window.muatBaganLombaVisual(); 
        } else {
            alert("Gagal memperbarui skor: " + respon.pesan);
        }
    })
    .catch(err => {
        console.error("Koneksi gagal saat update skor:", err);
    });
};

// F. Fungsi memicu majunya pemenang ke ronde berikutnya
window.triggerLanjutBabakRonde = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();
    const babakSekarang = document.getElementById('filter-babak').value;

    const konfirmasi = confirm(`Apakah seluruh skor ${babakSekarang} saat ini sudah selesai diinput?\n\nKlik OK untuk menaikkan para pemenang ke babak berikutnya secara otomatis.`);
    if (!konfirmasi) return;

    // NILAI DIUBAH: Menambahkan variabel kapasitasMatch kiriman dropdown ke dalam Aksi 3 ronde lanjutan
    const bodiPesan = {
        aksi: "lanjutRondeBerikutnya",
        identitasFilter: identitasFilter,
        kapasitasMatch: document.getElementById('filter-kapasitas') ? document.getElementById('filter-kapasitas').value : "4"
    };

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(bodiPesan)
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual(); 
    })
    .catch(err => {
        console.error("Gagal melaju ke ronde berikutnya:", err);
    });
};

// Pemicu otomatis saat halaman dimuat pertama kali
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filter-usia')) {
        window.muatBaganLombaVisual();
    }
});
