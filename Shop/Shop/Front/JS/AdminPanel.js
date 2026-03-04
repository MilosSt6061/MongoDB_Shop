const API_URL = "http://localhost:5062/api";

export class AdminPanel {
    constructor(host, onLogout) {
        this.host       = host;
        this.onLogout   = onLogout;
        this.aktivniTab = "proizvodi";
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

        // HEADER
        const header = document.createElement("div");
        header.className = "sp-header";

        const brand = document.createElement("div");
        brand.className = "sp-brand";
        brand.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP <span class="admin-badge">ADMIN</span>';

        const headerNav = document.createElement("div");
        headerNav.className = "sp-header-nav";

        const tabItems = [
            { label: "PROIZVODI",  icon: "fa-box",       tab: "proizvodi"  },
            { label: "KATEGORIJE", icon: "fa-th-large",  tab: "kategorije" },
            { label: "PORUDŽBINE", icon: "fa-list-alt",  tab: "porudzbine" },
            { label: "KORISNICI",  icon: "fa-users",     tab: "korisnici"  },
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

        const main = document.createElement("div");
        main.className = "admin-main";
        main.id = "admin-main";
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
        if      (this.aktivniTab === "proizvodi")  this.renderProizvodi();
        else if (this.aktivniTab === "kategorije") this.renderKategorije();
        else if (this.aktivniTab === "porudzbine") this.renderPorudzbine();
        else if (this.aktivniTab === "korisnici")  this.renderKorisnici();
    }

    // ================================================================
    // TAB: PROIZVODI
    // ================================================================
    async renderProizvodi() {
        const main = document.getElementById("admin-main");
        main.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Ucitavanje...</div>`;

        try {
            const res = await fetch(`${API_URL}/Proizvod/VratiSveProizvode`, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const proizvodi = await res.json();

            main.innerHTML = "";

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

    drawProizvodModal(p, trenutnaKolicina = 0) {
        const stari = document.getElementById("admin-modal-overlay");
        if (stari) stari.remove();

        const jeNovi = p === null;

        const katOptions = this.kategorije.map(k =>
            `<option value="${k.id}" ${p?.kategorijaID === k.id ? "selected" : ""}>${k.naziv}</option>`
        ).join("");

        const overlay = document.createElement("div");
        overlay.id = "admin-modal-overlay";
        overlay.className = "modal-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement("div");
        modal.className = "modal-box admin-modal-box";
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
                const res = await fetch(`${API_URL}/Proizvod/KreirajProizvodInvetar/${kolicina}`, {
                    method:  "POST",
                    headers: this.headers,
                    body:    JSON.stringify({ naziv, opis, cena, kategorijaID: katID })
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(`${API_URL}/Proizvod/IzmeniProizvod`, {
                    method:  "PUT",
                    headers: this.headers,
                    body:    JSON.stringify({ id: postojeci.id, naziv, opis, cena, kategorijaID: katID })
                });

                const invRes = await fetch(`${API_URL}/Inventar/IzmeniKolicinuProizvoda/${postojeci.id}/${kolicina}`, {
                    method: "PUT", headers: this.headers
                });
                if (!res.ok && !invRes.ok) throw new Error("Izmene neuspesno izvrsene!");
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
                alert(`Greska: ${await res.text()}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    // ================================================================
    // TAB: KATEGORIJE
    // ================================================================
    async renderKategorije() {
        const main = document.getElementById("admin-main");
        main.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Ucitavanje...</div>`;

        try {
            await this.ucitajKategorije();
            main.innerHTML = "";

            const toolbar = document.createElement("div");
            toolbar.className = "admin-toolbar";

            const titleEl = document.createElement("div");
            titleEl.className = "admin-section-title";
            titleEl.innerHTML = `<i class="fas fa-th-large"></i> Kategorije <span class="admin-count">${this.kategorije.length}</span>`;

            const dodajBtn = document.createElement("button");
            dodajBtn.className = "admin-add-btn";
            dodajBtn.innerHTML = '<i class="fas fa-plus"></i> Dodaj kategoriju';
            dodajBtn.onclick = () => this.drawKategorijaModal(null);

            toolbar.appendChild(titleEl);
            toolbar.appendChild(dodajBtn);
            main.appendChild(toolbar);

            const tableWrap = document.createElement("div");
            tableWrap.className = "admin-table-wrap";

            if (this.kategorije.length === 0) {
                tableWrap.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-th-large"></i>
                        <p>Nema kategorija. Dodaj prvu!</p>
                    </div>`;
            } else {
                const table = document.createElement("table");
                table.className = "admin-table";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Naziv</th>
                            <th>Opis</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                `;
                const tbody = document.createElement("tbody");

                this.kategorije.forEach(k => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td class="admin-td-naziv">${k.naziv}</td>
                        <td class="admin-td-opis">${k.opis || "—"}</td>
                        <td class="admin-td-akcije">
                            <button class="admin-btn admin-btn-edit" title="Izmeni"><i class="fas fa-edit"></i></button>
                            <button class="admin-btn admin-btn-delete" title="Obrisi"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tr.querySelector(".admin-btn-edit").onclick   = () => this.drawKategorijaModal(k);
                    tr.querySelector(".admin-btn-delete").onclick = () => this.obrisiKategoriju(k, tr);
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

    drawKategorijaModal(k) {
        const stari = document.getElementById("admin-modal-overlay");
        if (stari) stari.remove();

        const jeNova = k === null;
        const overlay = document.createElement("div");
        overlay.id = "admin-modal-overlay";
        overlay.className = "modal-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement("div");
        modal.className = "modal-box admin-modal-box";
        modal.innerHTML = `
            <button class="modal-close" id="kat-modal-close">&times;</button>
            <h2 class="modal-title">
                <i class="fas ${jeNova ? "fa-plus-circle" : "fa-edit"}"></i>
                ${jeNova ? "Dodaj kategoriju" : "Izmeni kategoriju"}
            </h2>
            <form class="modal-form admin-modal-form" id="kat-form">
                <div class="profil-form-group">
                    <label><i class="fas fa-tag"></i> Naziv</label>
                    <input type="text" id="kat-naziv" value="${k?.naziv || ""}" placeholder="Naziv kategorije" required />
                </div>
                <div class="profil-form-group">
                    <label><i class="fas fa-align-left"></i> Opis</label>
                    <textarea id="kat-opis" placeholder="Opis kategorije" rows="3">${k?.opis || ""}</textarea>
                </div>
                <div class="profil-msg" id="kat-msg" style="display:none"></div>
                <button type="submit" class="profil-save-btn" style="margin-top:8px">
                    <i class="fas fa-save"></i> ${jeNova ? "DODAJ" : "SACUVAJ"}
                </button>
            </form>
        `;

        modal.querySelector("#kat-modal-close").onclick = () => overlay.remove();
        modal.querySelector("#kat-form").onsubmit = async (e) => {
            e.preventDefault();
            const msgEl = modal.querySelector("#kat-msg");
            const naziv = modal.querySelector("#kat-naziv").value.trim();
            const opis  = modal.querySelector("#kat-opis").value.trim();

            if (!naziv) { this.setAdmMsg(msgEl, "error", "Naziv je obavezan."); return; }
            this.setAdmMsg(msgEl, "loading", "Cuvanje...");

            try {
                const body = jeNova ? { naziv, opis } : { id: k.id, naziv, opis };
                const res = await fetch(
                    jeNova ? `${API_URL}/Kategorija/KreirajKategoriju` : `${API_URL}/Kategorija/IzmeniKategoriju`,
                    { method: jeNova ? "POST" : "PUT", headers: this.headers, body: JSON.stringify(body) }
                );
                if (!res.ok) throw new Error(await res.text());
                this.setAdmMsg(msgEl, "success", jeNova ? "Kategorija dodana!" : "Izmene sacuvane!");
                setTimeout(() => { overlay.remove(); this.renderKategorije(); }, 800);
            } catch (err) {
                this.setAdmMsg(msgEl, "error", `Greska: ${err.message}`);
            }
        };

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            overlay.classList.add("modal-visible");
            modal.classList.add("modal-in");
        });
    }

    async obrisiKategoriju(k, tr) {
        if (!confirm(`Obrisati kategoriju "${k.naziv}"?`)) return;
        tr.style.opacity = "0.4";
        tr.style.pointerEvents = "none";
        try {
            const res = await fetch(`${API_URL}/Kategorija/ObrisiKategoriju/${k.id}`, {
                method: "DELETE", headers: this.headers
            });
            if (res.ok) {
                tr.classList.add("admin-row-removing");
                setTimeout(() => this.renderKategorije(), 350);
            } else {
                alert(`Greska: ${await res.text()}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    // ================================================================
    // TAB: PORUDŽBINE
    // ================================================================
    async renderPorudzbine() {
        const main = document.getElementById("admin-main");
        main.innerHTML = `<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> Ucitavanje...</div>`;

        try {
            const resK = await fetch(`${API_URL}/Korisnik/SviKorisnici`, { headers: this.headers });
            if (!resK.ok) throw new Error(`HTTP ${resK.status}`);
            const korisnici = await resK.json();

            const svePorArr = await Promise.all(
                korisnici.map(k =>
                    fetch(`${API_URL}/Porudzbina/Porudzbine/${k.username}`, { headers: this.headers })
                        .then(r => r.ok ? r.json() : []).catch(() => [])
                )
            );

            const svePorudzbine = svePorArr.flat()
                .sort((a, b) => new Date(b.vremeKreiranja) - new Date(a.vremeKreiranja));

            main.innerHTML = "";

            const toolbar = document.createElement("div");
            toolbar.className = "admin-toolbar";
            toolbar.innerHTML = `
                <div class="admin-section-title">
                    <i class="fas fa-list-alt"></i> Porudzbine
                    <span class="admin-count">${svePorudzbine.length}</span>
                </div>
            `;
            main.appendChild(toolbar);

            const tableWrap = document.createElement("div");
            tableWrap.className = "admin-table-wrap";

            if (svePorudzbine.length === 0) {
                tableWrap.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-box-open"></i>
                        <p>Nema porudzbina.</p>
                    </div>`;
            } else {
                const statusMapa = {
                    "NA_CEKANJU":  { label: "Na čekanju",  cls: "admin-kol-malo" },
                    "PRIHVACENA":  { label: "Prihvaćena",  cls: "admin-kol-ima"  },
                    "ODBIJENA":    { label: "Odbijena",     cls: "admin-kol-nema" },
                    "POSLATA":     { label: "Poslata",      cls: "admin-kol-ima"  },
                    "OTKAZANA":    { label: "Otkazana",     cls: "admin-kol-nema" },
                    "DOSTAVLJENA": { label: "Dostavljena",  cls: "admin-kol-ima"  },
                    "VRACENA":     { label: "Vraćena",      cls: "admin-kol-malo" },
                };

                const sledeci = {
                    "NA_CEKANJU":  ["PRIHVACENA", "ODBIJENA"],
                    "PRIHVACENA":  ["POSLATA", "OTKAZANA"],
                    "POSLATA":     ["DOSTAVLJENA", "OTKAZANA"],
                    "DOSTAVLJENA": ["VRACENA"],
                };

                const table = document.createElement("table");
                table.className = "admin-table";
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Korisnik</th>
                            <th>Datum</th>
                            <th>Stavke</th>
                            <th>Ukupno</th>
                            <th>Status</th>
                            <th>Promeni status</th>
                        </tr>
                    </thead>
                `;
                const tbody = document.createElement("tbody");

                svePorudzbine.forEach(p => {
                    const st = statusMapa[p.status] ?? { label: p.status, cls: "" };
                    const datum = new Date(p.vremeKreiranja).toLocaleDateString("sr-RS", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                    });
                    const stavkeText = p.stavke.map(s => `${s.proizvodINaziv} x${s.kolicina}`).join(", ");
                    const dostupni = sledeci[p.status] ?? [];

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${p.username}</strong></td>
                        <td style="white-space:nowrap;font-size:0.78rem">${datum}</td>
                        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.78rem;color:var(--text-dim)" title="${stavkeText}">${stavkeText}</td>
                        <td class="admin-td-cena">${p.ukupnaCena.toLocaleString()} rsd</td>
                        <td><span class="admin-kolicina ${st.cls}">${st.label}</span></td>
                        <td style="display:flex;align-items:center;gap:8px">
                            <select class="sp-cat-select status-select" style="min-width:130px;border-radius:8px;padding:5px 30px 5px 10px;font-size:0.75rem" ${dostupni.length === 0 ? "disabled" : ""}>
                                <option value="">-- Promeni --</option>
                                ${dostupni.map(s => `<option value="${s}">${statusMapa[s]?.label ?? s}</option>`).join("")}
                            </select>
                            <button class="admin-btn admin-btn-delete obrisi-porudzbinu-btn" title="Obrisi porudzbinu">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;

                    const sel = tr.querySelector(".status-select");
                    sel.onchange = async () => {
                        if (!sel.value) return;
                        await this.promeniStatusPorudzbine(p.id, sel.value, tr);
                    };

                    tr.querySelector(".obrisi-porudzbinu-btn").onclick = () => this.obrisiPorudzbinu(p, tr);

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

    async obrisiPorudzbinu(p, tr) {
        if (!confirm(`Obrisati porudzbinu korisnika "${p.username}"?`)) return;
        tr.style.opacity = "0.4";
        tr.style.pointerEvents = "none";
        try {
            const res = await fetch(`${API_URL}/Porudzbina/ObrisiPorudzbinu/${p.id}`, {
                method: "DELETE", headers: this.headers
            });
            if (res.ok) {
                tr.classList.add("admin-row-removing");
                setTimeout(() => this.renderPorudzbine(), 350);
            } else {
                alert(`Greska: ${await res.text()}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    async promeniStatusPorudzbine(id, status, tr) {
        tr.style.opacity = "0.5";
        tr.style.pointerEvents = "none";

        try {
            const res = await fetch(`${API_URL}/Porudzbina/IzmeniStatus/${id}/${status}`, {
                method: "PUT", headers: this.headers
            });

            if (res.ok) {
                setTimeout(() => this.renderPorudzbine(), 300);
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

    // ================================================================
    // TAB: KORISNICI
    // ================================================================
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
                const userData = (() => {
                    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
                })();

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
                alert(`Greska: ${await res.text()}`);
                tr.style.opacity = "1";
                tr.style.pointerEvents = "auto";
            }
        } catch {
            tr.style.opacity = "1";
            tr.style.pointerEvents = "auto";
        }
    }

    // ================================================================
    // HELPERS
    // ================================================================
    async ucitajKategorije() {
        try {
            const res = await fetch(`${API_URL}/Kategorija/VratiSveKategorije`, { headers: this.headers });
            if (res.ok) this.kategorije = await res.json();
        } catch { /* nastavi bez kategorija */ }
    }

    setAdmMsg(el, type, text) {
        const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", loading: "fa-spinner fa-spin" };
        el.className = `profil-msg profil-msg--${type}`;
        el.innerHTML = `<i class="fas ${icons[type]}"></i> ${text}`;
        el.style.display = "flex";
    }
}