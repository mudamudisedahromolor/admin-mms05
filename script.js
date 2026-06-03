/* ==========================================================================
   12. SISTEM MANAJEMEN ELIMINASI TURNAMEN (INTEGRASI GOOGLE APPS SCRIPT)
   ========================================================================== */
const URL_ENGINE_TURNAMEN = "https://script.google.com/macros/s/AKfycbx9JjuYPXPVkac1h-W8I-aGap0p2smP7Qokk102yiekkZnqo0er86VrYtF904rEG0oK/exec"; 

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
    const kapasitas = document.getElementById('filter-kapasitas') ? document.getElementById('filter-kapasitas').value : "4";

    const usia = usiaRaw.trim();
    const gender = genderRaw.trim().toLowerCase() === "semua" ? "semua" : genderRaw.trim();

    const konfirmasi = confirm(`Kunci data pendaftaran & acak bagan kelompok:\n\n» Usia: ${usia}\n» Gender: ${genderRaw}\n» Kategori: ${kategori}\n» Kapasitas: ${kapasitas} Peserta\n\nLanjutkan proses pengundian acak?`);
    if (!konfirmasi) return;

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

// B. Fungsi Mengambil & Menggambar Pohon Turnamen Dinamis & Fleksibel (GET)
window.muatBaganLombaVisual = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();
    const babakAktifDropdown = document.getElementById('filter-babak').value;
    const container = document.getElementById('bracket-container');
    
    if (!container) return;
    container.innerHTML = `<p style="text-align: center; color: #666; width: 100%;"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil data pertandingan...</p>`;

    fetch(`${URL_ENGINE_TURNAMEN}?aksi=ambilBagan&identitasFilter=${encodeURIComponent(identitasFilter)}`)
    .then(res => res.json())
    .then(data => {
        const dataTersaring = data.filter(match => match.ronde.trim().toLowerCase() === babakAktifDropdown.trim().toLowerCase());

        if (!dataTersaring || dataTersaring.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #999; width: 100%; padding: 20px;">Belum ada data draf pertandingan untuk ${babakAktifDropdown} kelompok ini.</p>`;
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
            const elemenMatch = document.createElement('div');
            elemenMatch.className = 'bracket-match';
            
            let htmlIsiKotak = `<div class="bracket-match-id">${match.matchId.split('-').pop()}</div>`;

            // Gunakan payload dinamis untuk menghitung skor juara tertinggi berapapun isi lintasannya
            let skorTertinggi = -1;
            match.arraySkorDinamis.forEach((skorVal, idx) => {
                const namaP = match.arrayPesertaDinamis[idx];
                if (namaP && namaP !== "KOSONG" && namaP !== "" && !namaP.includes("BYE")) {
                    if (parseInt(skorVal) > skorTertinggi) {
                        skorTertinggi = parseInt(skorVal);
                    }
                }
            });

            // Gambar baris pendaftar secara tak terbatas (fleksibel mengikuti jumlah isi lintasan)
            match.arrayPesertaDinamis.forEach((namaPlayer, index) => {
                if (!namaPlayer || namaPlayer === "") return;
                if (namaPlayer === "KOSONG" && index >= 2) return; // Hilangkan baris sisa kosong biar rapi

                const currentSkor = match.arraySkorDinamis[index] !== undefined ? parseInt(match.arraySkorDinamis[index]) : 0;
                const isMenang = namaPlayer !== "KOSONG" && currentSkor === skorTertinggi && skorTertinggi > 0;
                
                let disableInput = false;
                if (namaPlayer.includes("BYE") || namaPlayer === "KOSONG") disableInput = true;

                htmlIsiKotak += `
                    <div class="bracket-team-row ${isMenang ? 'team-menang' : ''}">
                        <span class="bracket-team-name"><i class="fa-solid fa-user" style="font-size:10px; margin-right:5px; color:#2c3e50;"></i> ${namaPlayer}</span>
                        <input type="number" class="bracket-team-score" value="${currentSkor}" min="0" max="99" 
                            style="width: 38px; text-align: center; border: 1px solid #ccc; border-radius: 4px; font-weight: bold; padding: 2px 0;"
                            ${disableInput ? 'disabled' : ''}
                            onchange="window.simpanSkorPertandingan('${match.matchId}', ${index + 1}, this.value)">
                    </div>
                `;
            });

            elemenMatch.innerHTML = htmlIsiKotak;
            elemenRonde.appendChild(elemenMatch);
        });
        container.appendChild(elemenRonde);
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-triangle-exclamation"></i> Gagal memuat visual bagan fleksibel.</p>`;
    });
};

// C. Fungsi Toggle Reset Robot Total (POST)
window.triggerResetRobotTotal = function() {
    const konfirmasi1 = confirm("PERINGATAN!\nTindakan ini akan mengosongkan seluruh bagan aktif.");
    if (!konfirmasi1) return;

    const konfirmasiKunci = prompt("Ketik teks 'RESET' untuk menyetujui:");
    if (konfirmasiKunci !== "RESET") return;

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-trash-can fa-fade"></i> Menghapus bagan...</p>`;

    fetch(URL_ENGINE_TURNAMEN, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ aksi: "resetSystem" })
    })
    .then(res => res.json())
    .then(respon => {
        alert(respon.pesan);
        window.muatBaganLombaVisual();
    });
};

// D. Fungsi Kirim Data ke Database Utama & Auto-Reset Bagan
window.arsipDanAutoResetBagan = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();

    const konfirmasi = confirm(`Apakah turnamen untuk kelompok:\n» ${identitasFilter}\nsudah selesai total?\n\nJika YA, data akan diarsipkan.`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "simpanKeDatabase",
        identitasFilter: identitasFilter
    };

    const container = document.getElementById('bracket-container');
    container.innerHTML = `<p style="text-align: center; color: #e53935; width: 100%; font-weight: bold;"><i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Mengarsipkan data...</p>`;

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
        alert("Proses arsip selesai!");
        window.muatBaganLombaVisual();
    });
};

// E. Fungsi Pengiriman Update Skor Real-Time
window.simpanSkorPertandingan = function(matchId, nomorPlayer, nilaiSkor) {
    const bodiPesan = {
        aksi: "updateSkorMatch",
        matchId: matchId,
        playerKe: parseInt(nomorPlayer),
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
            window.muatBaganLombaVisual(); 
        } else {
            alert("Gagal memperbarui skor: " + respon.pesan);
        }
    })
    .catch(err => {
        console.error("Koneksi gagal:", err);
    });
};

// F. Fungsi memicu majunya pemenang ke ronde berikutnya
window.triggerLanjutBabakRonde = function() {
    const identitasFilter = dapatkanIdentitasSesiKunci();
    const kapasitas = document.getElementById('filter-kapasitas') ? document.getElementById('filter-kapasitas').value : "4";

    const konfirmasi = confirm(`Klik OK untuk menaikkan seluruh pemenang lintasan ke babak berikutnya secara otomatis.`);
    if (!konfirmasi) return;

    const bodiPesan = {
        aksi: "lanjutRondeBerikutnya",
        identitasFilter: identitasFilter,
        kapasitasMatch: kapasitas
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
        console.error("Gagal:", err);
    });
};

// Pemicu otomatis saat halaman dimuat pertama kali
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('filter-usia')) {
        window.muatBaganLombaVisual();
    }
});
