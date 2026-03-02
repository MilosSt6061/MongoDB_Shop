const API_URL = "http://localhost:5062/api";

export class MojProfil {
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
    }

    async draw() {
        this.host.innerHTML = "";

        // Učitaj pun profil sa servera
        const userData = await this.ucitajProfil();

        // ── PAGE WRAPPER ──────────────────────────────────────────
        const pageWrapper = document.createElement("div");
        pageWrapper.className = "sp-page-wrapper";
        this.host.appendChild(pageWrapper);

        // ── 1. HEADER ─────────────────────────────────────────────
        const header = document.createElement("div");
        header.className = "sp-header";

        const brand = document.createElement("div");
        brand.className = "sp-brand";
        brand.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP';

        const headerNav = document.createElement("div");
        headerNav.className = "sp-header-nav";

        const navItems = [
            { label: "SVI PROIZVODI", icon: "fa-th-large",      active: false, action: () => this.onNavigate("proizvodi") },
            { label: "MOJ PROFIL",    icon: "fa-user-circle",   active: true,  action: () => {} },
            { label: "KORPA",         icon: "fa-shopping-cart", active: false, action: () => this.onNavigate("korpa") },
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

        // ── 2. MAIN ───────────────────────────────────────────────
        const main = document.createElement("div");
        main.className = "profil-main";

        // Naslov
        const pageTitle = document.createElement("div");
        pageTitle.className = "profil-page-title";
        pageTitle.innerHTML = `
            <div class="profil-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div>
                <h1 class="profil-ime-display">${userData?.username || "Korisnik"}</h1>
                <p class="profil-sub">Upravljaj svojim nalogom</p>
            </div>
        `;
        main.appendChild(pageTitle);

        const formsRow = document.createElement("div");
        formsRow.className = "profil-forms-row";

        // ── KARTICA: Lični podaci ──────────────────────────────────
        const podaciCard = document.createElement("div");
        podaciCard.className = "profil-card";

        const podaciTitle = document.createElement("h2");
        podaciTitle.className = "profil-card-title";
        podaciTitle.innerHTML = '<i class="fas fa-id-card"></i> Lični podaci';

        // Poruka
        const podaciMsg = document.createElement("div");
        podaciMsg.className = "profil-msg";
        podaciMsg.id = "profil-podaci-msg";

        const podaciForm = document.createElement("form");
        podaciForm.className = "profil-form";

        const podaciFields = [
            { id: "profil-username", label: "Username",      type: "text",  key: "username", icon: "fa-at" },
            { id: "profil-ime",      label: "Ime",            type: "text",  key: "ime",      icon: "fa-user" },
            { id: "profil-prezime",  label: "Prezime",        type: "text",  key: "prezime",  icon: "fa-user" },
            { id: "profil-email",    label: "Email adresa",   type: "email", key: "email",    icon: "fa-envelope" },
            { id: "profil-broj",     label: "Broj telefona",  type: "text",  key: "broj",     icon: "fa-phone" },
        ];

        podaciFields.forEach(f => {
            const group = document.createElement("div");
            group.className = "profil-form-group";

            // C# server može vratiti PascalCase (Ime, Prezime) ili camelCase (ime, prezime)
            const val = userData?.[f.key] || userData?.[f.key.charAt(0).toUpperCase() + f.key.slice(1)] || "";

            group.innerHTML = `
                <label for="${f.id}">
                    <i class="fas ${f.icon}"></i> ${f.label}
                </label>
                <input
                    type="${f.type}"
                    id="${f.id}"
                    value="${val}"
                    placeholder="${f.label}"
                    autocomplete="off"
                    disabled
                />
            `;
            podaciForm.appendChild(group);
        });

        // Dugmad — inicijalno samo "IZMENI" vidljivo
        const podaciBtns = document.createElement("div");
        podaciBtns.className = "profil-btns";

        const izmeniBtn = document.createElement("button");
        izmeniBtn.type = "button";
        izmeniBtn.className = "profil-save-btn profil-btn-izmeni";
        izmeniBtn.innerHTML = '<i class="fas fa-edit"></i> IZMENI';

        const sacuvajBtn = document.createElement("button");
        sacuvajBtn.type = "submit";
        sacuvajBtn.className = "profil-save-btn profil-btn-sacuvaj";
        sacuvajBtn.innerHTML = '<i class="fas fa-save"></i> SACUVAJ';
        sacuvajBtn.style.display = "none";

        const odustaniBtn = document.createElement("button");
        odustaniBtn.type = "button";
        odustaniBtn.className = "profil-save-btn profil-btn-odustani";
        odustaniBtn.innerHTML = '<i class="fas fa-times"></i> ODUSTANI';
        odustaniBtn.style.display = "none";

        // IZMENI klik — otključaj polja
        izmeniBtn.onclick = () => {
            podaciFields.forEach(f => {
                document.getElementById(f.id).disabled = false;
            });
            izmeniBtn.style.display   = "none";
            sacuvajBtn.style.display  = "flex";
            odustaniBtn.style.display = "flex";
            this.clearMsg(podaciMsg);
        };

        // ODUSTANI klik — vrati originalne vrednosti i zaključaj
        odustaniBtn.onclick = () => {
            podaciFields.forEach(f => {
                const input = document.getElementById(f.id);
                input.value    = userData?.[f.key] || "";
                input.disabled = true;
                input.classList.remove("profil-input-error");
            });
            izmeniBtn.style.display   = "flex";
            sacuvajBtn.style.display  = "none";
            odustaniBtn.style.display = "none";
            this.clearMsg(podaciMsg);
        };

        podaciBtns.appendChild(izmeniBtn);
        podaciBtns.appendChild(sacuvajBtn);
        podaciBtns.appendChild(odustaniBtn);
        podaciForm.appendChild(podaciBtns);

        podaciForm.onsubmit = async (e) => {
            e.preventDefault();
            const ok = await this.sacuvajPodatke(podaciMsg, podaciFields, userData);
            if (ok) {
                // Zaključaj polja nakon uspešnog čuvanja
                podaciFields.forEach(f => {
                    document.getElementById(f.id).disabled = true;
                });
                izmeniBtn.style.display   = "flex";
                sacuvajBtn.style.display  = "none";
                odustaniBtn.style.display = "none";
            }
        };

        podaciCard.appendChild(podaciTitle);
        podaciCard.appendChild(podaciMsg);
        podaciCard.appendChild(podaciForm);

        // ── KARTICA: Promena lozinke ───────────────────────────────
        const lozinkaCard = document.createElement("div");
        lozinkaCard.className = "profil-card";

        const lozinkaTitle = document.createElement("h2");
        lozinkaTitle.className = "profil-card-title";
        lozinkaTitle.innerHTML = '<i class="fas fa-lock"></i> Promena lozinke';

        const lozinkaMsg = document.createElement("div");
        lozinkaMsg.className = "profil-msg";
        lozinkaMsg.id = "profil-lozinka-msg";

        const lozinkaForm = document.createElement("form");
        lozinkaForm.className = "profil-form";

        const pwFields = [
            { id: "profil-stara-pw",   label: "Trenutna lozinka",    icon: "fa-lock" },
            { id: "profil-nova-pw",    label: "Nova lozinka",         icon: "fa-key" },
            { id: "profil-potvrda-pw", label: "Potvrdi novu lozinku", icon: "fa-check-circle" },
        ];

        pwFields.forEach(f => {
            const group = document.createElement("div");
            group.className = "profil-form-group";
            group.innerHTML = `
                <label for="${f.id}">
                    <i class="fas ${f.icon}"></i> ${f.label}
                </label>
                <div class="profil-pw-wrapper">
                    <input type="password" id="${f.id}" placeholder="••••••••" autocomplete="new-password" disabled />
                    <button type="button" class="profil-pw-toggle" data-target="${f.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            lozinkaForm.appendChild(group);
        });

        // Toggle show/hide — radi i kad je disabled
        lozinkaForm.querySelectorAll(".profil-pw-toggle").forEach(btn => {
            btn.onclick = () => {
                const input = document.getElementById(btn.dataset.target);
                const icon  = btn.querySelector("i");
                input.type  = input.type === "password" ? "text" : "password";
                icon.className = input.type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
            };
        });

        // Dugmad za lozinku
        const lozinkaBtns = document.createElement("div");
        lozinkaBtns.className = "profil-btns";

        const izmeniPwBtn = document.createElement("button");
        izmeniPwBtn.type = "button";
        izmeniPwBtn.className = "profil-save-btn profil-btn-izmeni";
        izmeniPwBtn.innerHTML = '<i class="fas fa-edit"></i> IZMENI';

        const sacuvajPwBtn = document.createElement("button");
        sacuvajPwBtn.type = "submit";
        sacuvajPwBtn.className = "profil-save-btn profil-btn-sacuvaj";
        sacuvajPwBtn.innerHTML = '<i class="fas fa-key"></i> PROMENI LOZINKU';
        sacuvajPwBtn.style.display = "none";

        const odustaniPwBtn = document.createElement("button");
        odustaniPwBtn.type = "button";
        odustaniPwBtn.className = "profil-save-btn profil-btn-odustani";
        odustaniPwBtn.innerHTML = '<i class="fas fa-times"></i> ODUSTANI';
        odustaniPwBtn.style.display = "none";

        izmeniPwBtn.onclick = () => {
            pwFields.forEach(f => document.getElementById(f.id).disabled = false);
            izmeniPwBtn.style.display   = "none";
            sacuvajPwBtn.style.display  = "flex";
            odustaniPwBtn.style.display = "flex";
            this.clearMsg(lozinkaMsg);
        };

        odustaniPwBtn.onclick = () => {
            pwFields.forEach(f => {
                const input = document.getElementById(f.id);
                input.value    = "";
                input.disabled = true;
                input.classList.remove("profil-input-error");
            });
            izmeniPwBtn.style.display   = "flex";
            sacuvajPwBtn.style.display  = "none";
            odustaniPwBtn.style.display = "none";
            this.clearMsg(lozinkaMsg);
        };

        lozinkaBtns.appendChild(izmeniPwBtn);
        lozinkaBtns.appendChild(sacuvajPwBtn);
        lozinkaBtns.appendChild(odustaniPwBtn);
        lozinkaForm.appendChild(lozinkaBtns);

        lozinkaForm.onsubmit = async (e) => {
            e.preventDefault();
            const ok = await this.promeniLozinku(lozinkaMsg, userData);
            if (ok) {
                pwFields.forEach(f => {
                    const input = document.getElementById(f.id);
                    input.value    = "";
                    input.disabled = true;
                });
                izmeniPwBtn.style.display   = "flex";
                sacuvajPwBtn.style.display  = "none";
                odustaniPwBtn.style.display = "none";
            }
        };

        lozinkaCard.appendChild(lozinkaTitle);
        lozinkaCard.appendChild(lozinkaMsg);
        lozinkaCard.appendChild(lozinkaForm);

        formsRow.appendChild(podaciCard);
        formsRow.appendChild(lozinkaCard);
        main.appendChild(formsRow);
        pageWrapper.appendChild(main);

        // ── FOOTER ────────────────────────────────────────────────
        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadrzana.</div>
            </div>
        `;
        pageWrapper.appendChild(footer);
    }

    // ── UČITAJ PROFIL SA SERVERA ──────────────────────────────────
    async ucitajProfil() {
        // Prvo uzmi username iz localStorage (jedino što server vraća pri prijavi)
        const localUser = (() => {
            try { return JSON.parse(localStorage.getItem("user")); }
            catch { return null; }
        })();

        const username = localUser?.username;
        if (!username) return localUser;

        try {
            const res = await fetch(`${API_URL}/Korisnik/Podaci/${username}`, {
                headers: this.headers
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const profil = await res.json();

            // Spoji sa lokalnim podacima (token, role itd.) i sačuvaj nazad
            const merged = { ...localUser, ...profil };
            localStorage.setItem("user", JSON.stringify(merged));
            return merged;

        } catch (err) {
            console.warn("Nije moguce ucitati profil sa servera:", err.message);
            return localUser; // fallback na lokalne podatke
        }
    }

    // ── SACUVAJ LICNE PODATKE ─────────────────────────────────────
    async sacuvajPodatke(msgEl, fields, userData) {
        // Validacija
        let hasError = false;

        fields.forEach(f => {
            const input = document.getElementById(f.id);
            input.classList.remove("profil-input-error");

            if (!input.value.trim()) {
                input.classList.add("profil-input-error");
                hasError = true;
            }

            if (f.type === "email" && input.value && !this.validEmail(input.value)) {
                input.classList.add("profil-input-error");
                this.setMsg(msgEl, "error", "Email adresa nije ispravna.");
                hasError = true;
            }
        });

        if (hasError) {
            if (!msgEl.innerHTML.includes("Email")) {
                this.setMsg(msgEl, "error", "Sva polja su obavezna.");
            }
            return false;
        }

        const dto = {
            id:       userData?.id || userData?.Id || "",
            username: document.getElementById("profil-username").value.trim(),
            name:     document.getElementById("profil-ime").value.trim(),
            lastname: document.getElementById("profil-prezime").value.trim(),
            email:    document.getElementById("profil-email").value.trim(),
            number:   document.getElementById("profil-broj").value.trim(),
        };

        this.setMsg(msgEl, "loading", "Cuvanje...");

        try {
            const res = await fetch(`${API_URL}/Korisnik/EditAccount`, {
                method: "PUT",
                headers: this.headers,
                body: JSON.stringify(dto)
            });

            if (res.ok) {
                const updated = { ...userData, ...dto };
                localStorage.setItem("user", JSON.stringify(updated));
                this.setMsg(msgEl, "success", "Podaci su uspesno sacuvani!");
                return true;
            } else {
                const err = await res.text();
                this.setMsg(msgEl, "error", `Greska: ${err}`);
                return false;
            }
        } catch {
            this.setMsg(msgEl, "error", "Serverska greska. Pokusajte ponovo.");
            return false;
        }
    }

    // ── PROMENI LOZINKU ───────────────────────────────────────────
    async promeniLozinku(msgEl, userData) {
        const staraInput   = document.getElementById("profil-stara-pw");
        const novaInput    = document.getElementById("profil-nova-pw");
        const potvrdaInput = document.getElementById("profil-potvrda-pw");

        // Reset grešaka
        [staraInput, novaInput, potvrdaInput].forEach(i => i.classList.remove("profil-input-error"));

        let hasError = false;

        if (!staraInput.value) {
            staraInput.classList.add("profil-input-error");
            hasError = true;
        }
        if (!novaInput.value) {
            novaInput.classList.add("profil-input-error");
            hasError = true;
        }
        if (!potvrdaInput.value) {
            potvrdaInput.classList.add("profil-input-error");
            hasError = true;
        }

        if (hasError) {
            this.setMsg(msgEl, "error", "Sva polja su obavezna.");
            return false;
        }

        if (novaInput.value.length < 8) {
            novaInput.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka mora imati najmanje 8 znakova.");
            return false;
        }

        if (novaInput.value !== potvrdaInput.value) {
            novaInput.classList.add("profil-input-error");
            potvrdaInput.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka i potvrda se ne poklapaju.");
            return false;
        }

        if (staraInput.value === novaInput.value) {
            novaInput.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka mora biti drugacija od stare.");
            return false;
        }

        this.setMsg(msgEl, "loading", "Menjanje lozinke...");

        try {
            const username = userData?.username || "";
            const url = `${API_URL}/Korisnik/EditPassword?oldPassword=${encodeURIComponent(staraInput.value)}&newPassword=${encodeURIComponent(novaInput.value)}`;

            const res = await fetch(url, {
                method: "PUT",
                headers: this.headers,
                body: JSON.stringify(username)
            });

            if (res.ok) {
                this.setMsg(msgEl, "success", "Lozinka je uspesno promenjena!");
                return true;
            } else {
                const err = await res.text();
                // Ako server kaze da je stara lozinka pogresna
                if (err.toLowerCase().includes("pogrešna") || err.toLowerCase().includes("incorrect") || err.toLowerCase().includes("invalid")) {
                    staraInput.classList.add("profil-input-error");
                    this.setMsg(msgEl, "error", "Trenutna lozinka nije ispravna.");
                } else {
                    this.setMsg(msgEl, "error", `Greska: ${err}`);
                }
                return false;
            }
        } catch {
            this.setMsg(msgEl, "error", "Serverska greska. Pokusajte ponovo.");
            return false;
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────
    setMsg(el, type, text) {
        const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", loading: "fa-spinner fa-spin" };
        el.className = `profil-msg profil-msg--${type}`;
        el.innerHTML = `<i class="fas ${icons[type]}"></i> ${text}`;
        el.style.display = "flex";

        if (type === "success") {
            setTimeout(() => { el.style.display = "none"; }, 4000);
        }
    }

    clearMsg(el) {
        el.style.display = "none";
        el.innerHTML     = "";
        el.className     = "profil-msg";
    }

    validEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}