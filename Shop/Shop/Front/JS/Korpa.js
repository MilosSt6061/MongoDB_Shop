const API_URL = "http://localhost:5062/api";

export class Korpa {
    constructor(host, onLogout, onNavigate) {
        this.host       = host;
        this.onLogout   = onLogout;
        this.onNavigate = onNavigate || (() => {});
        this.korpa      = null;
        this.headers    = {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
                ? { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                : {})
        };
        this.userData = (() => {
            try { return JSON.parse(localStorage.getItem("user")); }
            catch { return null; }
        })();
    }

    async draw() {
        this.host.innerHTML = "";

        const pageWrapper = document.createElement("div");
        pageWrapper.className = "sp-page-wrapper";
        this.host.appendChild(pageWrapper);

        const header = document.createElement("div");
        header.className = "sp-header";

        const brand = document.createElement("div");
        brand.className = "sp-brand";
        brand.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP';

        const headerNav = document.createElement("div");
        headerNav.className = "sp-header-nav";

        const navItems = [
            { label: "SVI PROIZVODI", icon: "fa-th-large",      active: false, action: () => this.onNavigate("proizvodi") },
            { label: "MOJ PROFIL",    icon: "fa-user-circle",   active: false, action: () => this.onNavigate("profil") },
            { label: "KORPA",         icon: "fa-shopping-cart", active: true,  action: () => {} },
            { label: "PORUDŽBINE",    icon: "fa-list-alt",      active: false, action: () => this.onNavigate("porudzbine") },
        ];

        navItems.forEach(item => {
            const btn = document.createElement("button");
            btn.className = "sp-nav-btn" + (item.active ? " sp-nav-active" : "");
            btn.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
            btn.onclick = item.action;
            headerNav.appendChild(btn);
        });

        const logoutBtn = document.createElement("button");
        logoutBtn.className = "sp-nav-btn sp-nav-logout";
        logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> ODJAVI SE`;
        logoutBtn.onclick = () => { localStorage.clear(); this.onLogout(); };

        headerNav.appendChild(logoutBtn);
        header.appendChild(brand);
        header.appendChild(headerNav);
        pageWrapper.appendChild(header);

        const main = document.createElement("div");
        main.className = "korpa-main";
        main.id = "korpa-main";
        pageWrapper.appendChild(main);

        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadrzana.</div>
            </div>
        `;
        pageWrapper.appendChild(footer);

        await this.ucitajKorpu();
    }

    async ucitajKorpu() {
        const main = document.getElementById("korpa-main");
        main.innerHTML = `
            <div class="korpa-loading">
                <i class="fas fa-spinner fa-spin"></i> Ucitavanje korpe...
            </div>
        `;

        try {
            const username = this.userData?.username;
            const res = await fetch(`${API_URL}/Korpa/Korpa/${username}`, {
                headers: this.headers
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.korpa = await res.json();
            this.renderKorpa();

        } catch (err) {
            main.innerHTML = `
                <div class="korpa-empty">
                    <i class="fas fa-exclamation-triangle" style="color:var(--red)"></i>
                    <p>Nije moguce ucitati korpu.</p>
                    <small>${err.message}</small>
                </div>
            `;
        }
    }

    renderKorpa() {
        const main = document.getElementById("korpa-main");
        main.innerHTML = "";

        const stavke = this.korpa?.stavke ?? [];

        const titleRow = document.createElement("div");
        titleRow.className = "korpa-title-row";
        titleRow.innerHTML = `
            <div class="korpa-title">
                <i class="fas fa-shopping-cart"></i>
                Moja korpa
                <span class="korpa-count">${stavke.length} ${stavke.length === 1 ? "artikal" : "artikala"}</span>
            </div>
        `;

        if (stavke.length > 0) {
            const ocistiBtn = document.createElement("button");
            ocistiBtn.className = "korpa-ocisti-btn";
            ocistiBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Ocisti korpu';
            ocistiBtn.onclick = () => this.ocistiKorpu(ocistiBtn);
            titleRow.appendChild(ocistiBtn);
        }

        main.appendChild(titleRow);

        if (stavke.length === 0) {
            main.innerHTML += `
                <div class="korpa-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Vasa korpa je prazna.</p>
                    <button class="korpa-shop-btn" id="korpa-shop-btn">
                        <i class="fas fa-th-large"></i> Pogledaj proizvode
                    </button>
                </div>
            `;
            document.getElementById("korpa-shop-btn")?.addEventListener("click", () => this.onNavigate("proizvodi"));
            return;
        }

        const layout = document.createElement("div");
        layout.className = "korpa-layout";

        const lista = document.createElement("div");
        lista.className = "korpa-lista";

        stavke.forEach(s => {
            const row = document.createElement("div");
            row.className = "korpa-row";
            row.id = `korpa-row-${s.id}`;

            const cenaPoKom = s.kolicina > 0 ? Math.round(s.cena / s.kolicina) : s.cena;

            row.innerHTML = `
                <div class="korpa-row-img">
                    <img src="Slike/Proizvodi.png" alt="${s.proizvodINaziv}"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>'" />
                </div>
                <div class="korpa-row-info">
                    <div class="korpa-row-naziv">${s.proizvodINaziv}</div>
                    <div class="korpa-row-cena-kom">${cenaPoKom.toLocaleString()} rsd / kom</div>
                </div>
                <div class="korpa-row-right">
                    <div class="korpa-qty-controls">
                        <button class="korpa-qty-btn korpa-qty-minus">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="korpa-qty-num">${s.kolicina}</span>
                        <button class="korpa-qty-btn korpa-qty-plus">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="korpa-row-ukupno">${s.cena.toLocaleString()} rsd</div>
                    <button class="korpa-ukloni-btn">
                        <i class="fas fa-trash"></i> Ukloni sve
                    </button>
                </div>
            `;

            row.querySelector(".korpa-qty-minus").onclick = async () => {
            await this.izmeniKolicinu(s, s.kolicina - 1, row);
            };

            row.querySelector(".korpa-qty-plus").onclick = async () => {
            await this.dodajJedan(s, row);
            };

            row.querySelector(".korpa-ukloni-btn").onclick = async () => {
            await this.izmeniKolicinu(s, 0, row);
            };

            lista.appendChild(row);
        });

        const summary = document.createElement("div");
        summary.className = "korpa-summary";
        summary.id = "korpa-summary";

        this.renderSummary(summary, stavke);

        layout.appendChild(lista);
        layout.appendChild(summary);
        main.appendChild(layout);
    }

    renderSummary(container, stavke) {
        const ukupno   = stavke.reduce((acc, s) => acc + s.cena, 0);
        const brStavki = stavke.reduce((acc, s) => acc + s.kolicina, 0);

        container.innerHTML = `
            <div class="korpa-summary-title">
                <i class="fas fa-receipt"></i> Pregled porudzbine
            </div>
            <div class="korpa-summary-rows">
                <div class="korpa-summary-row">
                    <span>Artikala ukupno</span>
                    <span>${brStavki} kom</span>
                </div>
                <div class="korpa-summary-row">
                    <span>Vrednost</span>
                    <span>${ukupno.toLocaleString()} rsd</span>
                </div>
                <div class="korpa-summary-row korpa-summary-divider"></div>
                <div class="korpa-summary-row korpa-summary-total">
                    <span>Ukupno za placanje</span>
                    <span>${ukupno.toLocaleString()} rsd</span>
                </div>
            </div>
            <button class="korpa-poruci-btn" id="korpa-poruci-btn">
                <i class="fas fa-check-circle"></i> PORUCI
            </button>
            <button class="korpa-nastavi-btn" id="korpa-nastavi-btn">
                <i class="fas fa-arrow-left"></i> Nastavi kupovinu
            </button>
        `;

        container.querySelector("#korpa-nastavi-btn").onclick = () => this.onNavigate("proizvodi");
        container.querySelector("#korpa-poruci-btn").onclick  = () => this.poruci();
    }

    async poruci() {
        const btn = document.getElementById("korpa-poruci-btn");
        if (!btn) return;
        const username = this.userData?.username;
        if (!username) return;

        if (!confirm("Da li ste sigurni da zelite da porudzbinu?")) return;

        const original = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Slanje...';

        try {
            const res = await fetch(`${API_URL}/Porudzbina/Poruci/${username}`, {
                method:  "POST",
                headers: this.headers
            });

            if (res.ok) {
                this.prikaziUspeh();
            } else {
                const err = await res.text();
                alert(`Greska: ${err}`);
                btn.innerHTML = original;
                btn.disabled  = false;
            }
        } catch {
            alert("Serverska greska. Pokusajte ponovo.");
            btn.innerHTML = original;
            btn.disabled  = false;
        }
    }

    prikaziUspeh() {
        const main = document.getElementById("korpa-main");
        main.innerHTML = `
            <div class="korpa-uspeh">
                <div class="korpa-uspeh-icon"><i class="fas fa-check-circle"></i></div>
                <h2 class="korpa-uspeh-title">Porudzbina uspesno kreirana!</h2>
                <p class="korpa-uspeh-sub">Vasa porudzbina ceka obradu. Pratite status u profilu.</p>
                <div class="korpa-uspeh-btns">
                    <button class="korpa-poruci-btn" id="btn-moje-porudzbine" style="width:auto;padding:12px 28px">
                        <i class="fas fa-list-alt"></i> Moje porudzbine
                    </button>
                    <button class="korpa-nastavi-btn" id="btn-nastavi" style="width:auto;padding:12px 28px">
                        <i class="fas fa-th-large"></i> Nastavi kupovinu
                    </button>
                </div>
            </div>
        `;
        document.getElementById("btn-moje-porudzbine").onclick = () => this.onNavigate("porudzbine");
        document.getElementById("btn-nastavi").onclick         = () => this.onNavigate("proizvodi");
    }

    async izmeniKolicinu(stavka, novaKol, row) {
        const username   = this.userData?.username;
        const proizvodID = stavka.proizvodID ?? stavka.ProizvodID ?? "";

        row.querySelectorAll("button").forEach(b => b.disabled = true);

        try {
            const url = `${API_URL}/Korpa/UkloniIzKorpu?proizvodid=${encodeURIComponent(proizvodID)}&num=${novaKol}`;
            const res = await fetch(url, {
                method:  "POST",
                headers: this.headers,
                body:    JSON.stringify(username)
            });

            if (res.ok) {
                if (novaKol === 0) {
                    row.classList.add("korpa-row-removing");
                    setTimeout(() => this.ucitajKorpu(), 350);
                } else {
                    await this.ucitajKorpu();
                }
            } else {
                const err = await res.text();
                console.error("Greska izmene kolicine:", err);
                row.querySelectorAll("button").forEach(b => b.disabled = false);
            }
        } catch (err) {
            console.error("Greska:", err);
            row.querySelectorAll("button").forEach(b => b.disabled = false);
        }
    }

    async dodajJedan(stavka, row) {
        row.querySelectorAll("button").forEach(b => b.disabled = true);

        const cenaPoKom = stavka.kolicina > 0
            ? Math.round(stavka.cena / stavka.kolicina)
            : stavka.cena;

        try {
            const res = await fetch(
                `${API_URL}/Korpa/DodajUKorpu/${this.userData?.username}`, {
                method:  "POST",
                headers: this.headers,
                body: JSON.stringify({
                    proizvodID:     stavka.proizvodID,
                    proizvodINaziv: stavka.proizvodINaziv,
                    kolicina:       1,
                    cena:           cenaPoKom
                })
            });

            if (res.ok) {
                await this.ucitajKorpu();
            } else {
                const err = await res.text();
                console.error("Greska dodavanja:", err);
                row.querySelectorAll("button").forEach(b => b.disabled = false);
            }
        } catch (err) {
            console.error("Greska:", err);
            row.querySelectorAll("button").forEach(b => b.disabled = false);
        }
    }

    async ocistiKorpu(btn) {
        if (!confirm("Da li ste sigurni da zelite da ocistite korpu?")) return;

        const username = this.userData?.username;
        const original = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Brisanje...';

        try {
            const res = await fetch(`${API_URL}/Korpa/OcistiKorpu/${username}`, {
                method:  "DELETE",
                headers: this.headers
            });

            if (res.ok) {
                await this.ucitajKorpu();
            } else {
                btn.innerHTML = original;
                btn.disabled  = false;
            }
        } catch {
            btn.innerHTML = original;
            btn.disabled  = false;
        }
    }
}