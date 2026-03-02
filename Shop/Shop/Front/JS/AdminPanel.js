const API_URL = "http://localhost:5062/api";

export class AdminPanel {
    constructor(host, onLogout) {
        this.host       = host;
        this.onLogout   = onLogout;
        this.aktivniTab = "proizvodi"; // "proizvodi" | "korisnici"
        this.kategorije = [];
        this.headers    = {
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

        //  HEADER 
        const header = document.createElement("div");
        header.className = "sp-header";

        const brand = document.createElement("div");
        brand.className = "sp-brand";
        brand.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP <span class="admin-badge">ADMIN</span>';

        const headerNav = document.createElement("div");
        headerNav.className = "sp-header-nav";

        const tabItems = [
            { label: "PROIZVODI", icon: "fa-box",       tab: "proizvodi" },
            { label: "KORISNICI", icon: "fa-users",     tab: "korisnici" },
        ];

        tabItems.forEach(item => {
            const btn = document.createElement("button");
            btn.className = "sp-nav-btn" + (this.aktivniTab === item.tab ? " sp-nav-active" : "");
            btn.id = `admin-tab-${item.tab}`;
            btn.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
            btn.onclick = () => this.switchTab(item.tab);
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

        //  MAIN CONTENT 
        const main = document.createElement("div");
        main.className = "admin-main";
        main.id = "admin-main";
        pageWrapper.appendChild(main);

        //  FOOTER 
        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadrzana.</div>
            </div>
        `;
        pageWrapper.appendChild(footer);

        // Ucitaj kategorije pa prikazi tab
        await this.ucitajKategorije();
        this.renderTab();
    }

    switchTab(tab) {
        this.aktivniTab = tab;
        document.querySelectorAll("[id^='admin-tab-']").forEach(b => b.classList.remove("sp-nav-active"));
        document.getElementById(`admin-tab-${tab}`)?.classList.add("sp-nav-active");
        this.renderTab();
    }

    renderTab() {
        if (this.aktivniTab === "proizvodi") this.renderProizvodi();
        else this.renderKorisnici();
    }

    //  TAB: PROIZVODI
    async renderProizvodi() {
        const main = document.getElementById("admin-main");
        main.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Ucitavanje...</div>`;

        try {
            const res = await fetch(`${API_URL}/Proizvod/VratiSveProizvode`, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const proizvodi = await res.json();

            main.innerHTML = "";

            //  TOOLBAR 
            const toolbar = document.createElement("div");
            toolbar.className = "admin-toolbar";

            const titleEl = document.createElement("div");
            titleEl.className = "admin-section-title";
            titleEl.innerHTML = `<i class="fas fa-box"></i> Proizvodi <span class="admin-count">${proizvodi.length}</span>`;

            const dodajBtn = document.createElement("button");
            dodajBtn.className = "admin-add-btn";
            dodajBtn.innerHTML = '<i class="fas fa-plus"></i> Dodaj proizvod';
            dodajBtn.onclick = () => this.drawProizvodModal(null);

            toolbar.appendChild(titleEl);
            toolbar.appendChild(dodajBtn);
            main.appendChild(toolbar);

            //  TABELA 
            const tableWrap = document.createElement("div");
            tableWrap.className = "admin-table-wrap";

            if (proizvodi.length === 0) {
                tableWrap.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-box-open"></i>
                        <p>Nema proizvoda. Dodaj prvi!</p>
                    </div>`;
            } else {
                const table = document.createElement("table");
                table.className = "admin-table";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Naziv</th>
                            <th>Kategorija</th>
                            <th>Cena</th>
                            <th>Opis</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                `;
                const tbody = document.createElement("tbody");

                const kolicine = await Promise.all(
                    proizvodi.map(p =>
                        fetch(`${API_URL}/Inventar/VratiUkupnuKolicinuZaProizvod/${p.id}`, { headers: this.headers })
                            .then(r => r.ok ? r.json() : 0).catch(() => 0)
                    )
                );

                proizvodi.forEach((p, i) => {
                    const katNaziv = this.kategorije.find(k => k.id === p.kategorijaID)?.naziv ?? "—";
                    const kolicina = kolicine[i];
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td class="admin-td-naziv">${p.naziv}</td>
                        <td><span class="admin-kat-tag">${katNaziv}</span></td>
                        <td class="admin-td-cena">${p.cena.toLocaleString()} rsd</td>
                        <td class="admin-td-opis">${p.opis || "—"}</td>
                        <td class="admin-td-akcije">
                            <span class="admin-kolicina ${kolicina === 0 ? "admin-kol-nema" : kolicina <= 5 ? "admin-kol-malo" : "admin-kol-ima"}">
                                <i class="fas fa-layer-group"></i> ${kolicina}
                            </span>
                            <button class="admin-btn admin-btn-edit" title="Izmeni">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-btn admin-btn-delete" title="Obrisi">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;

                    tr.querySelector(".admin-btn-edit").onclick   = () => this.drawProizvodModal(p, kolicina);
                    tr.querySelector(".admin-btn-delete").onclick = () => this.obrisiProizvod(p, tr);

                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                tableWrap.appendChild(table);
            }

            main.appendChild(tableWrap);

        } catch (err) {
            document.getElementById("admin-main").innerHTML = `
                <div class="admin-error"><i class="fas fa-exclamation-triangle"></i> ${err.message}</div>`;
        }
    }

    //  DODAJ / IZMENI PROIZVOD 
    drawProizvodModal(p, trenutnaKolicina = 0) {
        const stari = document.getElementById("admin-modal-overlay");
        if (stari) stari.remove();

        const jeNovi = p === null;
        const overlay = document.createElement("div");
        overlay.id = "admin-modal-overlay";
        overlay.className = "modal-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement("div");
        modal.className = "modal-box admin-modal-box";

        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close";
        closeBtn.innerHTML = "&times;";
        closeBtn.onclick = () => overlay.remove();

        const title = document.createElement("h2");
        title.className = "modal-title";
        title.innerHTML = jeNovi
            ? '<i class="fas fa-plus-circle"></i> Dodaj proizvod'
            : '<i class="fas fa-edit"></i> Izmeni proizvod';

        const katOptions = this.kategorije.map(k =>
            `<option value="${k.id}" ${p?.kategorijaID === k.id ? "selected" : ""}>${k.naziv}</option>`
        ).join("");

        modal.innerHTML = `
            <button class="modal-close" id="admin-modal-close">&times;</button>
            <h2 class="modal-title">
                <i class="fas ${jeNovi ? "fa-plus-circle" : "fa-edit"}"></i>
                ${jeNovi ? "Dodaj proizvod" : "Izmeni proizvod"}
            </h2>
            <form class="modal-form admin-modal-form" id="admin-proizvod-form">
                <div class="profil-form-group">
                    <label><i class="fas fa-tag"></i> Naziv</label>
                    <input type="text" id="adm-naziv" value="${p?.naziv || ""}" placeholder="Naziv proizvoda" required />
                </div>
                <div class="profil-form-group">
                    <label><i class="fas fa-align-left"></i> Opis</label>
                    <textarea id="adm-opis" placeholder="Opis proizvoda" rows="3">${p?.opis || ""}</textarea>
                </div>
                <div class="admin-form-row">
                    <div class="profil-form-group">
                        <label><i class="fas fa-coins"></i> Cena (rsd)</label>
                        <input type="number" id="adm-cena" value="${p?.cena || ""}" placeholder="0" min="0" required />
                    </div>
                    <div class="profil-form-group">
                        <label><i class="fas fa-layer-group"></i> Kolicina na stanju</label>
                        <input type="number" id="adm-kolicina" value="${jeNovi ? "" : trenutnaKolicina}" placeholder="0" min="0" required />
                    </div>
                </div>
                <div class="profil-form-group">
                    <label><i class="fas fa-th-large"></i> Kategorija</label>
                    <select id="adm-kategorija" class="sp-cat-select" style="border-radius:8px; width:100%">
                        <option value="">-- Izaberi kategoriju --</option>
                        ${katOptions}
                    </select>
                </div>
                <div class="profil-msg" id="adm-msg" style="display:none"></div>
                <button type="submit" class="profil-save-btn" style="margin-top:8px">
                    <i class="fas fa-save"></i> ${jeNovi ? "DODAJ PROIZVOD" : "SACUVAJ IZMENE"}
                </button>
            </form>
        `;

        modal.querySelector("#admin-modal-close").onclick = () => overlay.remove();

        modal.querySelector("#admin-proizvod-form").onsubmit = async (e) => {
            e.preventDefault();
            await this.sacuvajProizvod(p, modal);
        };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add("modal-visible");
            modal.classList.add("modal-in");
        });
    }

    async sacuvajProizvod(postojeci, modal) {
        const msgEl    = modal.querySelector("#adm-msg");
        const naziv    = modal.querySelector("#adm-naziv").value.trim();
        const opis     = modal.querySelector("#adm-opis").value.trim();
        const cena     = parseInt(modal.querySelector("#adm-cena").value);
        const kolicina = parseInt(modal.querySelector("#adm-kolicina").value);
        const katID    = modal.querySelector("#adm-kategorija").value;

        if (!naziv || isNaN(cena) || isNaN(kolicina) || !katID) {
            this.setAdmMsg(msgEl, "error", "Sva polja su obavezna.");
            return;
        }

        this.setAdmMsg(msgEl, "loading", "Cuvanje...");

        const jeNovi = postojeci === null;

        try {
            if (jeNovi) {
                //  sa kolicinom u URL
                const noviProizvod = { naziv, opis, cena, kategorijaID: katID };
                const res = await fetch(`${API_URL}/Proizvod/KreirajProizvodInvetar/${kolicina}`, {
                    method:  "POST",
                    headers: this.headers,
                    body:    JSON.stringify(noviProizvod)
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                //  izmena proizvoda
                const izmenjeni = { id: postojeci.id, naziv, opis, cena, kategorijaID: katID };
                const res = await fetch(`${API_URL}/Proizvod/IzmeniProizvod`, {
                    method:  "PUT",
                    headers: this.headers,
                    body:    JSON.stringify(izmenjeni)
                });
                if (!res.ok) throw new Error(await res.text());

                // Izmeni kolicinu u inventaru
                const invRes = await fetch(`${API_URL}/Inventar/IzmeniKolicinuProizvoda/${postojeci.id}/${kolicina}`, {
                    method: "PUT", headers: this.headers
                });
                if (!invRes.ok) throw new Error(await invRes.text());
            }

            this.setAdmMsg(msgEl, "success", jeNovi ? "Proizvod dodat!" : "Izmene sacuvane!");
            setTimeout(() => {
                document.getElementById("admin-modal-overlay")?.remove();
                this.renderProizvodi();
            }, 800);

        } catch (err) {
            this.setAdmMsg(msgEl, "error", `Greska: ${err.message}`);
        }
    }

    async obrisiProizvod(p, tr) {
        if (!confirm(`Obrisati "${p.naziv}"?`)) return;

        tr.style.opacity = "0.4";
        tr.style.pointerEvents = "none";

        try {
            const res = await fetch(`${API_URL}/Proizvod/ObrisiProizvodInventar/${p.id}`, {
                method: "DELETE", headers: this.headers
            });

            if (res.ok) {
                tr.classList.add("admin-row-removing");
                setTimeout(() => this.renderProizvodi(), 350);
            } else {
                const err = await res.text();
                alert(`Greska: ${err}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    //  TAB: KORISNICI
    async renderKorisnici() {
        const main = document.getElementById("admin-main");
        main.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Ucitavanje...</div>`;

        try {
            const res = await fetch(`${API_URL}/Korisnik/SviKorisnici`, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const korisnici = await res.json();

            main.innerHTML = "";

            const toolbar = document.createElement("div");
            toolbar.className = "admin-toolbar";
            toolbar.innerHTML = `
                <div class="admin-section-title">
                    <i class="fas fa-users"></i> Korisnici
                    <span class="admin-count">${korisnici.length}</span>
                </div>
            `;
            main.appendChild(toolbar);

            const tableWrap = document.createElement("div");
            tableWrap.className = "admin-table-wrap";

            if (korisnici.length === 0) {
                tableWrap.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-users-slash"></i>
                        <p>Nema registrovanih korisnika.</p>
                    </div>`;
            } else {
                const table = document.createElement("table");
                table.className = "admin-table";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Ime</th>
                            <th>Prezime</th>
                            <th>Email</th>
                            <th>Telefon</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                `;
                const tbody = document.createElement("tbody");
                const userData = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

                korisnici.forEach(k => {
                    const tr = document.createElement("tr");
                    const jeTrenutni = k.username === userData?.username;

                    tr.innerHTML = `
                        <td><strong>${k.username || "—"}</strong></td>
                        <td>${k.name || "—"}</td>
                        <td>${k.lastname || "—"}</td>
                        <td>${k.email || "—"}</td>
                        <td>${k.number || "—"}</td>
                        <td class="admin-td-akcije">
                            <button class="admin-btn admin-btn-delete" title="Obrisi korisnika"
                                ${jeTrenutni ? "disabled" : ""}>
                                <i class="fas fa-user-times"></i>
                            </button>
                        </td>
                    `;

                    if (!jeTrenutni) {
                        tr.querySelector(".admin-btn-delete").onclick = () => this.obrisiKorisnika(k, tr);
                    }

                    tbody.appendChild(tr);
                });

                table.appendChild(tbody);
                tableWrap.appendChild(table);
            }

            main.appendChild(tableWrap);

        } catch (err) {
            document.getElementById("admin-main").innerHTML = `
                <div class="admin-error"><i class="fas fa-exclamation-triangle"></i> ${err.message}</div>`;
        }
    }

    async obrisiKorisnika(k, tr) {
        if (!confirm(`Obrisati korisnika "${k.username}"?`)) return;

        tr.style.opacity = "0.4";
        tr.style.pointerEvents = "none";

        try {
            const res = await fetch(`${API_URL}/Korisnik/DeleteAccount`, {
                method:  "DELETE",
                headers: this.headers,
                body:    JSON.stringify(k.username)
            });

            if (res.ok) {
                tr.classList.add("admin-row-removing");
                setTimeout(() => this.renderKorisnici(), 350);
            } else {
                const err = await res.text();
                alert(`Greska: ${err}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    //  UCITAJ KATEGORIJE 
    async ucitajKategorije() {
        try {
            const res = await fetch(`${API_URL}/Kategorija/VratiSveKategorije`, { headers: this.headers });
            if (res.ok) this.kategorije = await res.json();
        } catch { /* nastavi bez kategorija */ }
    }

    //  HELPER 
    setAdmMsg(el, type, text) {
        const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", loading: "fa-spinner fa-spin" };
        el.className = `profil-msg profil-msg--${type}`;
        el.innerHTML = `<i class="fas ${icons[type]}"></i> ${text}`;
        el.style.display = "flex";
    }
}