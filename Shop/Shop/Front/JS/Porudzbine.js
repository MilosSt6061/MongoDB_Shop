const API_URL = "http://localhost:5062/api";

export class Porudzbine {
    constructor(host, onLogout, onNavigate) {
        this.host       = host;
        this.onLogout   = onLogout;
        this.onNavigate = onNavigate || (() => {});
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

        // HEADER
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
            { label: "KORPA",         icon: "fa-shopping-cart", active: false, action: () => this.onNavigate("korpa") },
            { label: "PORUDŽBINE",    icon: "fa-list-alt",      active: true,  action: () => {} },
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

        // MAIN
        const main = document.createElement("div");
        main.className = "profil-main";
        pageWrapper.appendChild(main);

        // Naslov
        const pageTitle = document.createElement("div");
        pageTitle.className = "profil-page-title";
        pageTitle.innerHTML = `
            <div class="profil-avatar">
                <i class="fas fa-list-alt"></i>
            </div>
            <div>
                <h1 class="profil-ime-display">Moje porudžbine</h1>
                <p class="profil-sub">Pratite status svojih porudžbina</p>
            </div>
        `;
        main.appendChild(pageTitle);

        // Kartica
        const card = document.createElement("div");
        card.className = "profil-card";
        card.style.gridColumn = "1 / -1";
        card.innerHTML = `
            <div id="porudzbine-content">
                <div class="profil-msg profil-msg--loading" style="display:flex">
                    <i class="fas fa-spinner fa-spin"></i> Ucitavanje porudzbina...
                </div>
            </div>
        `;
        main.appendChild(card);

        // FOOTER
        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadrzana.</div>
            </div>
        `;
        pageWrapper.appendChild(footer);

        await this.ucitajPorudzbine(card.querySelector("#porudzbine-content"));
    }

    async ucitajPorudzbine(container) {
        const username = this.userData?.username;
        try {
            const res = await fetch(`${API_URL}/Porudzbina/Porudzbine/${username}`, {
                headers: this.headers
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const porudzbine = await res.json();

            if (porudzbine.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:var(--text-dim)">
                        <i class="fas fa-box-open" style="font-size:2.5rem;margin-bottom:12px;display:block"></i>
                        <p style="color:var(--text-muted)">Nemate nijednu porudzbinu.</p>
                        <button class="korpa-shop-btn" style="margin:16px auto 0" id="btn-kupovina">
                            <i class="fas fa-th-large"></i> Pogledaj proizvode
                        </button>
                    </div>
                `;
                container.querySelector("#btn-kupovina").onclick = () => this.onNavigate("proizvodi");
                return;
            }

            porudzbine.sort((a, b) => new Date(b.vremeKreiranja) - new Date(a.vremeKreiranja));

            container.innerHTML = "";
            porudzbine.forEach(p => container.appendChild(this.renderPorudzbina(p)));

        } catch (err) {
            container.innerHTML = `
                <div class="profil-msg profil-msg--error" style="display:flex">
                    <i class="fas fa-exclamation-circle"></i> Nije moguce ucitati porudzbine: ${err.message}
                </div>
            `;
        }
    }

    renderPorudzbina(p) {
        const statusMapa = {
            "NA_CEKANJU":  { label: "Na čekanju",  cls: "status-cekanje"    },
            "PRIHVACENA":  { label: "Prihvaćena",  cls: "status-prihvacena" },
            "ODBIJENA":    { label: "Odbijena",     cls: "status-odbijena"   },
            "POSLATA":     { label: "Poslata",      cls: "status-poslata"    },
            "OTKAZANA":    { label: "Otkazana",     cls: "status-odbijena"   },
            "DOSTAVLJENA": { label: "Dostavljena",  cls: "status-dostavljena"},
            "VRACENA":     { label: "Vraćena",      cls: "status-cekanje"    },
        };

        const st    = statusMapa[p.status] ?? { label: p.status, cls: "status-cekanje" };
        const datum = new Date(p.vremeKreiranja).toLocaleDateString("sr-RS", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });

        const stavkeHTML = p.stavke.map(s => `
            <div class="porudzbina-stavka">
                <span class="porudzbina-stavka-naziv">${s.proizvodINaziv}</span>
                <span class="porudzbina-stavka-kol">x${s.kolicina}</span>
                <span class="porudzbina-stavka-cena">${s.cena.toLocaleString()} rsd</span>
            </div>
        `).join("");

        const div = document.createElement("div");
        div.className = "porudzbina-item";
        div.innerHTML = `
            <div class="porudzbina-header">
                <div class="porudzbina-meta">
                    <span class="porudzbina-datum"><i class="fas fa-calendar-alt"></i> ${datum}</span>
                    <span class="porudzbina-id">ID: ${p.id?.slice(-8)}</span>
                </div>
                <span class="porudzbina-status ${st.cls}">${st.label}</span>
            </div>
            <div class="porudzbina-stavke">${stavkeHTML}</div>
            <div class="porudzbina-footer">
                <span class="porudzbina-ukupno">Ukupno: <strong>${p.ukupnaCena.toLocaleString()} rsd</strong></span>
            </div>
        `;
        return div;
    }
}