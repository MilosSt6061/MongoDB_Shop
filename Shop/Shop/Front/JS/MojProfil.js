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

        const userData = await this.ucitajProfil();

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
            { label: "MOJ PROFIL",    icon: "fa-user-circle",   active: true,  action: () => {} },
            { label: "KORPA",         icon: "fa-shopping-cart", active: false, action: () => this.onNavigate("korpa") },
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

        // MAIN
        const main = document.createElement("div");
        main.className = "profil-main";

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

        // KARTICA: Lični podaci
        const podaciCard = document.createElement("div");
        podaciCard.className = "profil-card";

        const podaciMsg = document.createElement("div");
        podaciMsg.className = "profil-msg";
        podaciMsg.id = "profil-podaci-msg";

        const podaciForm = document.createElement("form");
        podaciForm.className = "profil-form";

        podaciCard.innerHTML = "";
        podaciCard.appendChild(Object.assign(document.createElement("h2"), {
            className: "profil-card-title",
            innerHTML: '<i class="fas fa-id-card"></i> Lični podaci'
        }));
        podaciCard.appendChild(podaciMsg);
        podaciCard.appendChild(podaciForm);

        const podaciFields = [
            { id: "profil-username", label: "Username",     type: "text",  key: "username", icon: "fa-at"       },
            { id: "profil-ime",      label: "Ime",           type: "text",  key: "name",      icon: "fa-user"     },
            { id: "profil-prezime",  label: "Prezime",       type: "text",  key: "lastname",  icon: "fa-user"     },
            { id: "profil-email",    label: "Email adresa",  type: "email", key: "email",    icon: "fa-envelope" },
            { id: "profil-broj",     label: "Broj telefona", type: "text",  key: "number",     icon: "fa-phone"    },
        ];

        podaciFields.forEach(f => {
            const val = userData?.[f.key] || userData?.[f.key.charAt(0).toUpperCase() + f.key.slice(1)] || "";
            const group = document.createElement("div");
            group.className = "profil-form-group";
            group.innerHTML = `
                <label for="${f.id}"><i class="fas ${f.icon}"></i> ${f.label}</label>
                <input type="${f.type}" id="${f.id}" value="${val}" placeholder="${f.label}" autocomplete="off" disabled />
            `;
            podaciForm.appendChild(group);
        });

        const podaciBtns = document.createElement("div");
        podaciBtns.className = "profil-btns";

        const izmeniBtn   = Object.assign(document.createElement("button"), { type: "button", className: "profil-save-btn profil-btn-izmeni",  innerHTML: '<i class="fas fa-edit"></i> IZMENI' });
        const sacuvajBtn  = Object.assign(document.createElement("button"), { type: "submit",  className: "profil-save-btn profil-btn-sacuvaj", innerHTML: '<i class="fas fa-save"></i> SACUVAJ' });
        const odustaniBtn = Object.assign(document.createElement("button"), { type: "button", className: "profil-save-btn profil-btn-odustani", innerHTML: '<i class="fas fa-times"></i> ODUSTANI' });

        sacuvajBtn.style.display  = "none";
        odustaniBtn.style.display = "none";

        izmeniBtn.onclick = () => {
            podaciFields.forEach(f => { document.getElementById(f.id).disabled = false; });
            izmeniBtn.style.display = "none"; sacuvajBtn.style.display = "flex"; odustaniBtn.style.display = "flex";
            this.clearMsg(podaciMsg);
        };

        odustaniBtn.onclick = () => {
            podaciFields.forEach(f => {
                const inp = document.getElementById(f.id);
                inp.value = userData?.[f.key] || ""; inp.disabled = true;
                inp.classList.remove("profil-input-error");
            });
            izmeniBtn.style.display = "flex"; sacuvajBtn.style.display = "none"; odustaniBtn.style.display = "none";
            this.clearMsg(podaciMsg);
        };

        podaciBtns.append(izmeniBtn, sacuvajBtn, odustaniBtn);
        podaciForm.appendChild(podaciBtns);

        podaciForm.onsubmit = async (e) => {
            e.preventDefault();
            const ok = await this.sacuvajPodatke(podaciMsg, podaciFields, userData);
            if (ok) {
                podaciFields.forEach(f => { document.getElementById(f.id).disabled = true; });
                izmeniBtn.style.display = "flex"; sacuvajBtn.style.display = "none"; odustaniBtn.style.display = "none";
            }
        };

        // KARTICA: Promena lozinke
        const lozinkaCard = document.createElement("div");
        lozinkaCard.className = "profil-card";

        const lozinkaMsg = document.createElement("div");
        lozinkaMsg.className = "profil-msg";
        lozinkaMsg.id = "profil-lozinka-msg";

        const lozinkaForm = document.createElement("form");
        lozinkaForm.className = "profil-form";

        lozinkaCard.appendChild(Object.assign(document.createElement("h2"), {
            className: "profil-card-title",
            innerHTML: '<i class="fas fa-lock"></i> Promena lozinke'
        }));
        lozinkaCard.appendChild(lozinkaMsg);
        lozinkaCard.appendChild(lozinkaForm);

        const pwFields = [
            { id: "profil-stara-pw",   label: "Trenutna lozinka",    icon: "fa-lock"         },
            { id: "profil-nova-pw",    label: "Nova lozinka",         icon: "fa-key"          },
            { id: "profil-potvrda-pw", label: "Potvrdi novu lozinku", icon: "fa-check-circle" },
        ];

        pwFields.forEach(f => {
            const group = document.createElement("div");
            group.className = "profil-form-group";
            group.innerHTML = `
                <label for="${f.id}"><i class="fas ${f.icon}"></i> ${f.label}</label>
                <div class="profil-pw-wrapper">
                    <input type="password" id="${f.id}" placeholder="••••••••" autocomplete="new-password" disabled />
                    <button type="button" class="profil-pw-toggle" data-target="${f.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            lozinkaForm.appendChild(group);
        });

        lozinkaForm.querySelectorAll(".profil-pw-toggle").forEach(btn => {
            btn.onclick = () => {
                const inp  = document.getElementById(btn.dataset.target);
                inp.type   = inp.type === "password" ? "text" : "password";
                btn.querySelector("i").className = inp.type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
            };
        });

        const lozinkaBtns  = document.createElement("div");
        lozinkaBtns.className = "profil-btns";

        const izmeniPwBtn   = Object.assign(document.createElement("button"), { type: "button", className: "profil-save-btn profil-btn-izmeni",  innerHTML: '<i class="fas fa-edit"></i> IZMENI' });
        const sacuvajPwBtn  = Object.assign(document.createElement("button"), { type: "submit",  className: "profil-save-btn profil-btn-sacuvaj", innerHTML: '<i class="fas fa-key"></i> PROMENI LOZINKU' });
        const odustaniPwBtn = Object.assign(document.createElement("button"), { type: "button", className: "profil-save-btn profil-btn-odustani", innerHTML: '<i class="fas fa-times"></i> ODUSTANI' });

        sacuvajPwBtn.style.display  = "none";
        odustaniPwBtn.style.display = "none";

        izmeniPwBtn.onclick = () => {
            pwFields.forEach(f => { document.getElementById(f.id).disabled = false; });
            izmeniPwBtn.style.display = "none"; sacuvajPwBtn.style.display = "flex"; odustaniPwBtn.style.display = "flex";
            this.clearMsg(lozinkaMsg);
        };

        odustaniPwBtn.onclick = () => {
            pwFields.forEach(f => {
                const inp = document.getElementById(f.id);
                inp.value = ""; inp.disabled = true;
                inp.classList.remove("profil-input-error");
            });
            izmeniPwBtn.style.display = "flex"; sacuvajPwBtn.style.display = "none"; odustaniPwBtn.style.display = "none";
            this.clearMsg(lozinkaMsg);
        };

        lozinkaBtns.append(izmeniPwBtn, sacuvajPwBtn, odustaniPwBtn);
        lozinkaForm.appendChild(lozinkaBtns);

        lozinkaForm.onsubmit = async (e) => {
            e.preventDefault();
            const ok = await this.promeniLozinku(lozinkaMsg, userData);
            if (ok) {
                pwFields.forEach(f => { const inp = document.getElementById(f.id); inp.value = ""; inp.disabled = true; });
                izmeniPwBtn.style.display = "flex"; sacuvajPwBtn.style.display = "none"; odustaniPwBtn.style.display = "none";
            }
        };

        formsRow.appendChild(podaciCard);
        formsRow.appendChild(lozinkaCard);
        main.appendChild(formsRow);
        pageWrapper.appendChild(main);

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
    }

    async ucitajProfil() {
        const localUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
        const username  = localUser?.username;
        if (!username) return localUser;

        try {
            const res = await fetch(`${API_URL}/Korisnik/Podaci/${username}`, { headers: this.headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const profil  = await res.json();
            const merged  = { ...localUser, ...profil };
            localStorage.setItem("user", JSON.stringify(merged));
            return merged;
        } catch (err) {
            console.warn("Nije moguce ucitati profil:", err.message);
            return localUser;
        }
    }

    async sacuvajPodatke(msgEl, fields, userData) {
        let hasError = false;
        fields.forEach(f => {
            const inp = document.getElementById(f.id);
            inp.classList.remove("profil-input-error");
            if (!inp.value.trim()) { inp.classList.add("profil-input-error"); hasError = true; }
            if (f.type === "email" && inp.value && !this.validEmail(inp.value)) {
                inp.classList.add("profil-input-error");
                this.setMsg(msgEl, "error", "Email adresa nije ispravna.");
                hasError = true;
            }
        });

        if (hasError) {
            if (!msgEl.innerHTML.includes("Email")) this.setMsg(msgEl, "error", "Sva polja su obavezna.");
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
                method: "PUT", headers: this.headers, body: JSON.stringify(dto)
            });
            if (res.ok) {
                localStorage.setItem("user", JSON.stringify({ ...userData, ...dto }));
                this.setMsg(msgEl, "success", "Podaci su uspesno sacuvani!");
                return true;
            } else {
                this.setMsg(msgEl, "error", `Greska: ${await res.text()}`);
                return false;
            }
        } catch {
            this.setMsg(msgEl, "error", "Serverska greska. Pokusajte ponovo.");
            return false;
        }
    }

    async promeniLozinku(msgEl, userData) {
        const staraInp   = document.getElementById("profil-stara-pw");
        const novaInp    = document.getElementById("profil-nova-pw");
        const potvrdaInp = document.getElementById("profil-potvrda-pw");

        [staraInp, novaInp, potvrdaInp].forEach(i => i.classList.remove("profil-input-error"));

        let hasError = false;
        if (!staraInp.value)   { staraInp.classList.add("profil-input-error");   hasError = true; }
        if (!novaInp.value)    { novaInp.classList.add("profil-input-error");    hasError = true; }
        if (!potvrdaInp.value) { potvrdaInp.classList.add("profil-input-error"); hasError = true; }
        if (hasError) { this.setMsg(msgEl, "error", "Sva polja su obavezna."); return false; }

        if (novaInp.value.length < 8) {
            novaInp.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka mora imati najmanje 8 znakova.");
            return false;
        }
        if (novaInp.value !== potvrdaInp.value) {
            novaInp.classList.add("profil-input-error");
            potvrdaInp.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka i potvrda se ne poklapaju.");
            return false;
        }
        if (staraInp.value === novaInp.value) {
            novaInp.classList.add("profil-input-error");
            this.setMsg(msgEl, "error", "Nova lozinka mora biti drugacija od stare.");
            return false;
        }

        this.setMsg(msgEl, "loading", "Menjanje lozinke...");

        try {
            const url = `${API_URL}/Korisnik/EditPassword?username=${encodeURIComponent(userData?.username || "")}&oldPassword=${encodeURIComponent(staraInp.value)}&newPassword=${encodeURIComponent(novaInp.value)}`;
            const res = await fetch(url, { method: "PUT", headers: this.headers });

            if (res.ok) {
                this.setMsg(msgEl, "success", "Lozinka je uspesno promenjena!");
                return true;
            } else {
                const err = await res.text();
                if (err.toLowerCase().includes("pogrešna") || err.toLowerCase().includes("incorrect") || err.toLowerCase().includes("invalid")) {
                    staraInp.classList.add("profil-input-error");
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

    setMsg(el, type, text) {
        const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", loading: "fa-spinner fa-spin" };
        el.className    = `profil-msg profil-msg--${type}`;
        el.innerHTML    = `<i class="fas ${icons[type]}"></i> ${text}`;
        el.style.display = "flex";
        if (type === "success") setTimeout(() => { el.style.display = "none"; }, 4000);
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