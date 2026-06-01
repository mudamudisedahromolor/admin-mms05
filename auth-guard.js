// auth-guard.js
if (sessionStorage.getItem("statusLogin") !== "sukses") {
    alert("Akses ditolak! Silakan login terlebih dahulu melalui portal.");
    window.location.href = "index.html"; // Arahkan ke nama file portal loginmu
}
