import { Pocetna }     from "./Pocetna.js";
import { SviProizvodi } from "./SviProizvodi.js";
import { MojProfil }   from "./MojProfil.js";
import { Korpa }       from "./Korpa.js";
import { AdminPanel }  from "./AdminPanel.js";

const app = document.getElementById("app");
const pocetna = new Pocetna(app, onLoginSuccess);

function onLoginSuccess(user) {
    console.log("Korisnik prijavljen:", user.username, "| Rola:", user.role);
    if (user.role === "admin") {
        navigate("admin");
    } else {
        navigate("proizvodi");
    }
}

function onLogout() {
    pocetna.draw();
}

function navigate(stranica) {
    if (stranica === "proizvodi") {
        new SviProizvodi(app, onLogout, navigate).draw();
    } else if (stranica === "profil") {
        new MojProfil(app, onLogout, navigate).draw();
    } else if (stranica === "korpa") {
        new Korpa(app, onLogout, navigate).draw();
    } else if (stranica === "admin") {
        new AdminPanel(app, onLogout).draw();
    }
}

if (localStorage.getItem("token")) {
    const userData = (() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();
    navigate(userData?.role === "admin" ? "admin" : "proizvodi");
} else {
    pocetna.draw();
}