const API_URL = "http://localhost:5062/api";
const PER_PAGE = 12;

export class SviProizvodi {
    constructor(host, onLogout, onNavigate) {
        this.host           = host;
        this.onLogout       = onLogout;
        this.onNavigate     = onNavigate || (() => {});
        this.proizvodi      = [];
        this.sortirani      = [];
        this.katMapa        = {}; // id → naziv kategorije
        this.kolicinaMapa   = {}; // proizvodID → kolicina na stanju
        this.aktivnaKat     = "sve";
        this.sortRedosljed  = null;
        this.trenutnaStr    = 1;
        this.headers        = {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token")
                ? { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                : {})
        };
    }

    async draw() {
        this.host.innerHTML = "";

        const pageWrapper = document.createElement("div");
        pageWrapper.className = "sp-page-wrapper";
        this.host.appendChild(pageWrapper);

        //  1. HEADER 
        const header = document.createElement("div");
        header.className = "sp-header";

        const brand = document.createElement("div");
        brand.className = "sp-brand";
        brand.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP';

        const headerNav = document.createElement("div");
        headerNav.className = "sp-header-nav";

        const navItems = [
            { label: "SVI PROIZVODI",  icon: "fa-th-large",      active: true,  action: () => this.draw() },
            { label: "MOJ PROFIL",     icon: "fa-user-circle",   active: false, action: () => this.onNavigate("profil") },
            { label: "KORPA",          icon: "fa-shopping-cart", active: false, action: () => this.onNavigate("korpa") },
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

        //  2. TOOLBAR 
        const toolbar = document.createElement("div");
        toolbar.className = "sp-toolbar";

        const sortGroup = document.createElement("div");
        sortGroup.className = "sp-sort-group";

        const sortLabel = document.createElement("span");
        sortLabel.className = "sp-toolbar-label";
        sortLabel.innerText = "SORTIRAJ:";

        const btnAsc = document.createElement("button");
        btnAsc.className = "sp-sort-btn";
        btnAsc.id = "sort-asc";
        btnAsc.innerHTML = '<i class="fas fa-arrow-up"></i> Najjeftinije';
        btnAsc.onclick = () => this.setSort("asc");

        const btnDesc = document.createElement("button");
        btnDesc.className = "sp-sort-btn";
        btnDesc.id = "sort-desc";
        btnDesc.innerHTML = '<i class="fas fa-arrow-down"></i> Najskuplje';
        btnDesc.onclick = () => this.setSort("desc");

        const btnReset = document.createElement("button");
        btnReset.className = "sp-sort-btn sp-sort-reset";
        btnReset.innerHTML = '<i class="fas fa-times"></i>';
        btnReset.title = "Ukloni sortiranje";
        btnReset.onclick = () => this.setSort(null);

        sortGroup.appendChild(sortLabel);
        sortGroup.appendChild(btnAsc);
        sortGroup.appendChild(btnDesc);
        sortGroup.appendChild(btnReset);

        const filterGroup = document.createElement("div");
        filterGroup.className = "sp-filter-group";

        const filterLabel = document.createElement("span");
        filterLabel.className = "sp-toolbar-label";
        filterLabel.innerText = "KATEGORIJA:";

        const select = document.createElement("select");
        select.className = "sp-cat-select";
        select.id = "sp-kategorija-select";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "sve";
        defaultOpt.innerText = "Sve kategorije";
        select.appendChild(defaultOpt);

        select.onchange = async () => {
            this.aktivnaKat    = select.value;
            this.trenutnaStr   = 1;
            this.sortRedosljed = null;
            this.updateSortBtns();
            await this.ucitajProizvode();
        };

        filterGroup.appendChild(filterLabel);
        filterGroup.appendChild(select);
        toolbar.appendChild(sortGroup);
        toolbar.appendChild(filterGroup);
        pageWrapper.appendChild(toolbar);

        //  3. INFO BAR 
        const infoBar = document.createElement("div");
        infoBar.className = "sp-info-bar";
        infoBar.id = "sp-info-bar";
        pageWrapper.appendChild(infoBar);

        //  4. CONTENT 
        const content = document.createElement("div");
        content.className = "sp-content";

        const grid = document.createElement("div");
        grid.className = "sp-grid";
        grid.id = "sp-grid";

        const pagination = document.createElement("div");
        pagination.className = "sp-pagination";
        pagination.id = "sp-pagination";

        content.appendChild(grid);
        content.appendChild(pagination);
        pageWrapper.appendChild(content);

        //  5. FOOTER
        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadržana.</div>
            </div>
        `;
        pageWrapper.appendChild(footer);

        //  6. UČITAJ 
        await this.ucitajKategorije(select);
        await this.ucitajProizvode();
    }

    //  UČITAJ KATEGORIJE 
    async ucitajKategorije(selectEl) {
        try {
            const res = await fetch(`${API_URL}/Kategorija/VratiSveKategorije`, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const kategorije = await res.json();

            this.katMapa = {};
            kategorije.forEach(kat => {
                this.katMapa[kat.id] = kat.naziv;
                const opt = document.createElement("option");
                opt.value = kat.id;
                opt.innerText = kat.naziv;
                selectEl.appendChild(opt);
            });
        } catch (err) {
            console.warn("Nije moguće učitati kategorije:", err.message);
        }
    }

    //  UČITAJ PROIZVODE 
    async ucitajProizvode() {
        const grid = document.getElementById("sp-grid");
        grid.innerHTML = `
            <div class="sp-loading">
                <i class="fas fa-spinner fa-spin"></i> Učitavanje proizvoda...
            </div>
        `;

        try {
            const url = this.aktivnaKat === "sve"
                ? `${API_URL}/Proizvod/VratiSveProizvode`
                : `${API_URL}/Proizvod/VratiSveProizvodePoKategoriji/${this.aktivnaKat}`;

            const res = await fetch(url, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            this.proizvodi = await res.json();

            // Učitaj količine za sve proizvode paralelno
            await this.ucitajKolicine(this.proizvodi);

            this.applySort();

        } catch (err) {
            console.error("Greška pri učitavanju:", err);
            grid.innerHTML = `
                <div class="sp-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nije moguće učitati proizvode.</p>
                    <small>${err.message}</small>
                </div>
            `;
        }
    }

    //  UČITAJ KOLIČINE PARALELNO 
    async ucitajKolicine(proizvodi) {
        this.kolicinaMapa = {};
        try {
            const rezultati = await Promise.all(
                proizvodi.map(p =>
                    fetch(`${API_URL}/Inventar/VratiUkupnuKolicinuZaProizvod/${p.id}`, { headers: this.headers })
                        .then(r => r.ok ? r.json() : 0)
                        .catch(() => 0)
                )
            );
            proizvodi.forEach((p, i) => {
                this.kolicinaMapa[p.id] = rezultati[i];
            });
        } catch (err) {
            console.warn("Nije moguce ucitati kolicine:", err.message);
        }
    }

    //  SORT 
    applySort() {
        let rezultat = [...this.proizvodi];
        if (this.sortRedosljed === "asc")  rezultat.sort((a, b) => a.cena - b.cena);
        if (this.sortRedosljed === "desc") rezultat.sort((a, b) => b.cena - a.cena);
        this.sortirani = rezultat;
        this.renderGrid();
        this.renderPaginacija();
        this.renderInfoBar();
        this.updateSortBtns();
    }

    setSort(smjer) {
        this.sortRedosljed = smjer === this.sortRedosljed ? null : smjer;
        this.trenutnaStr   = 1;
        this.applySort();
    }

    //  RENDER GRID 
    renderGrid() {
        const grid = document.getElementById("sp-grid");
        grid.innerHTML = "";

        const start    = (this.trenutnaStr - 1) * PER_PAGE;
        const stranica = this.sortirani.slice(start, start + PER_PAGE);

        if (stranica.length === 0) {
            grid.innerHTML = `
                <div class="sp-empty">
                    <i class="fas fa-box-open"></i>
                    <p>Nema proizvoda za odabranu kategoriju.</p>
                </div>
            `;
            return;
        }

        stranica.forEach((p, i) => {
            const card = document.createElement("div");
            card.className = "sp-card";
            card.style.animationDelay = `${i * 0.04}s`;

            const cena      = p.cena  ?? 0;
            const naziv     = p.naziv ?? "Nepoznat proizvod";
            const opis      = p.opis  ?? "";
            const katNaziv  = this.katMapa[p.kategorijaID] ?? "";
            const kolicina  = this.kolicinaMapa[p.id] ?? 0;

            const opisKratak = opis.length > 80 ? opis.slice(0, 80) + "…" : opis;

            const stanjeKlasa = kolicina === 0 ? "sp-stanje-nema" : kolicina <= 5 ? "sp-stanje-malo" : "sp-stanje-ima";
            const stanjeTekst = kolicina === 0 ? "Nema na stanju" : kolicina <= 5 ? `Samo ${kolicina} kom` : `${kolicina} na stanju`;

            card.innerHTML = `
                <div class="sp-card-img">
                    <img src="Slike/Proizvodi.png" alt="${naziv}"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>'" />
                    <span class="sp-stanje-badge ${stanjeKlasa}">${stanjeTekst}</span>
                </div>
                <div class="sp-card-body">
                    ${katNaziv ? `<div class="sp-card-kat">${katNaziv}</div>` : ""}
                    <div class="sp-card-naziv">${naziv}</div>
                    ${opisKratak ? `<div class="sp-card-opis">${opisKratak}</div>` : ""}
                    <div class="sp-card-footer">
                        <div class="sp-card-cena">${parseFloat(cena).toFixed(2)} rsd</div>
                        <button class="sp-card-btn" ${kolicina === 0 ? "disabled" : ""}>
                            <i class="fas fa-cart-plus"></i> Dodaj
                        </button>
                    </div>
                </div>
            `;

            card.querySelector(".sp-card-btn").onclick = async (e) => {
                e.stopPropagation();
                await this.dodajUKorpu(p, card.querySelector(".sp-card-btn"));
            };

            // Klik na karticu → detalji modal
            card.onclick = () => this.drawDetalji(p);
            grid.appendChild(card);
        });
    }

    //  DETALJI MODAL 
    drawDetalji(p) {
        const old = document.getElementById("sp-detalji-overlay");
        if (old) old.remove();

        const cena     = p.cena  ?? 0;
        const naziv    = p.naziv ?? "Nepoznat proizvod";
        const opis     = p.opis  ?? "Nema opisa.";
        const katNaziv = this.katMapa[p.kategorijaID] ?? "";
        const kolicina  = this.kolicinaMapa[p.id] ?? 0;
        const stanjeKlasa = kolicina === 0 ? "sp-stanje-nema" : kolicina <= 5 ? "sp-stanje-malo" : "sp-stanje-ima";
        const stanjeTekst = kolicina === 0 ? "Nema na stanju" : kolicina <= 5 ? `Samo ${kolicina} kom` : `${kolicina} na stanju`;

        const overlay = document.createElement("div");
        overlay.id = "sp-detalji-overlay";
        overlay.className = "sp-detalji-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement("div");
        modal.className = "sp-detalji-modal";

        modal.innerHTML = `
            <button class="sp-detalji-close" id="sp-detalji-close">
                <i class="fas fa-times"></i>
            </button>
            <div class="sp-detalji-img">
                <img src="Slike/Proizvodi.png" alt="${naziv}"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-box\\'></i>'" />
            </div>
            <div class="sp-detalji-body">
                ${katNaziv ? `<div class="sp-detalji-kat">${katNaziv}</div>` : ""}
                <h2 class="sp-detalji-naziv">${naziv}</h2>
                <p class="sp-detalji-opis">${opis}</p>
                <div class="sp-detalji-footer">
                    <div class="sp-detalji-cena">${parseFloat(cena).toFixed(2)} rsd</div>
                    <span class="sp-stanje-badge sp-stanje-badge--lg ${stanjeKlasa}">${stanjeTekst}</span>
                    <button class="sp-card-btn sp-detalji-btn" ${kolicina === 0 ? "disabled" : ""}>
                        <i class="fas fa-cart-plus"></i> Dodaj u korpu
                    </button>
                </div>
            </div>
        `;

        modal.querySelector("#sp-detalji-close").onclick = () => overlay.remove();
        modal.querySelector(".sp-detalji-btn").onclick = async () => {
            await this.dodajUKorpu(p, modal.querySelector(".sp-detalji-btn"));
        };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add("sp-detalji-visible");
            modal.classList.add("sp-detalji-in");
        });
    }

    //  RENDER PAGINACIJA 
    renderPaginacija() {
        const container = document.getElementById("sp-pagination");
        container.innerHTML = "";
        const ukupnoStr = Math.ceil(this.sortirani.length / PER_PAGE);
        if (ukupnoStr <= 1) return;

        const mkBtn = (label, page, disabled = false, active = false) => {
            const btn = document.createElement("button");
            btn.className = "sp-page-btn" + (active ? " sp-page-active" : "");
            btn.innerHTML = label;
            btn.disabled  = disabled;
            btn.onclick   = () => {
                this.trenutnaStr = page;
                this.renderGrid();
                this.renderPaginacija();
                this.renderInfoBar();
                window.scrollTo({ top: 0, behavior: "smooth" });
            };
            return btn;
        };

        container.appendChild(mkBtn("&laquo;", 1, this.trenutnaStr === 1));
        container.appendChild(mkBtn("&lsaquo;", this.trenutnaStr - 1, this.trenutnaStr === 1));

        const range   = 2;
        const pocetak = Math.max(1, this.trenutnaStr - range);
        const kraj    = Math.min(ukupnoStr, this.trenutnaStr + range);

        if (pocetak > 1) {
            container.appendChild(mkBtn("1", 1));
            if (pocetak > 2) {
                const d = document.createElement("span");
                d.className = "sp-page-dots"; d.innerText = "…";
                container.appendChild(d);
            }
        }

        for (let i = pocetak; i <= kraj; i++) {
            container.appendChild(mkBtn(i, i, false, i === this.trenutnaStr));
        }

        if (kraj < ukupnoStr) {
            if (kraj < ukupnoStr - 1) {
                const d = document.createElement("span");
                d.className = "sp-page-dots"; d.innerText = "…";
                container.appendChild(d);
            }
            container.appendChild(mkBtn(ukupnoStr, ukupnoStr));
        }

        container.appendChild(mkBtn("&rsaquo;", this.trenutnaStr + 1, this.trenutnaStr === ukupnoStr));
        container.appendChild(mkBtn("&raquo;", ukupnoStr, this.trenutnaStr === ukupnoStr));
    }

    //  INFO BAR 
    renderInfoBar() {
        const bar    = document.getElementById("sp-info-bar");
        const ukupno = this.sortirani.length;
        if (ukupno === 0) { bar.innerHTML = ""; return; }
        const start = (this.trenutnaStr - 1) * PER_PAGE + 1;
        const end   = Math.min(this.trenutnaStr * PER_PAGE, ukupno);
        bar.innerHTML = `Prikazano <strong>${start}–${end}</strong> od <strong>${ukupno}</strong> proizvoda`;
    }

    //  SORT BUTTONS STATE 
    updateSortBtns() {
        document.getElementById("sort-asc") ?.classList.toggle("sp-sort-active", this.sortRedosljed === "asc");
        document.getElementById("sort-desc")?.classList.toggle("sp-sort-active", this.sortRedosljed === "desc");
    }

    //  DODAJ U KORPU 
    async dodajUKorpu(p, btn) {
        const userData = (() => {
            try { return JSON.parse(localStorage.getItem("user")); }
            catch { return null; }
        })();
        const username = userData?.username;
        if (!username) return;

        const originalHTML = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        const stavka = {
            proizvodID:     p.id,
            proizvodINaziv: p.naziv,
            kolicina:       1,
            cena:           p.cena
        };

        try {
            const res = await fetch(`${API_URL}/Korpa/DodajUKorpu/${username}`, {
                method:  "POST",
                headers: this.headers,
                body:    JSON.stringify(stavka)
            });

            if (res.ok) {
                btn.innerHTML = '<i class="fas fa-check"></i> Dodato!';
                btn.classList.add("sp-btn-added");

                // Smanji inventar za 1 i re-fetch tacnu vrednost
                const trenutna = this.kolicinaMapa[p.id] ?? 0;
                const nova     = Math.max(0, trenutna - 1);
                try {
                    await fetch(`${API_URL}/Inventar/IzmeniKolicinuProizvoda/${p.id}/${nova}`, {
                        method: "PUT", headers: this.headers
                    });
                    this.kolicinaMapa[p.id] = nova;
                } catch { /* nastavi bez greske */ }

                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.disabled  = (this.kolicinaMapa[p.id] ?? 0) === 0;
                    btn.classList.remove("sp-btn-added");
                    this.renderGrid();
                }, 1000);
            } else {
                btn.innerHTML = '<i class="fas fa-times"></i> Greska';
                btn.classList.add("sp-btn-error");
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.disabled  = false;
                    btn.classList.remove("sp-btn-error");
                }, 2000);
            }
        } catch {
            btn.innerHTML = '<i class="fas fa-times"></i> Greska';
            setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
        }
    }
}