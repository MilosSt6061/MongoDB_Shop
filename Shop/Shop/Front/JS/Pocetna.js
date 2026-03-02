const API_URL = "http://localhost:5062/api";

export class Pocetna {
    constructor(host, onLoginSuccess) {
        this.host = host;
        this.onLoginSuccess = onLoginSuccess;
    }

    async draw() {
        this.host.innerHTML = "";
        const isAuth = localStorage.getItem("token") !== null;
        let userData = null;
        try {
            userData = JSON.parse(localStorage.getItem("user"));
        } catch {
            userData = null;
        }


        //  1. HEADER 
        const header = document.createElement("div");
        header.className = "market-header";

        const title = document.createElement("div");
        title.className = "header-title";
        title.innerHTML = '<i class="fas fa-shopping-bag"></i> &nbsp; MARKET APP';

        const navDiv = document.createElement("div");
        navDiv.className = "header-nav";

        if (!isAuth) {
            const btnLogin = document.createElement("button");
            btnLogin.className = "market-nav-btn btn-login";
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> PRIJAVI SE';
            btnLogin.onclick = () => this.drawModal("Prijava");

            const btnReg = document.createElement("button");
            btnReg.className = "market-nav-btn btn-register";
            btnReg.innerHTML = '<i class="fas fa-user-plus"></i> REGISTRUJTE SE';
            btnReg.onclick = () => this.drawModal("Registracija");

            navDiv.appendChild(btnLogin);
            navDiv.appendChild(btnReg);
        } else {
            navDiv.innerHTML = `
                <span class="user-welcome">Zdravo, ${userData?.username || 'Korisniče'}</span>
                <button id="logout-btn" class="market-nav-btn btn-logout">
                    <i class="fas fa-sign-out-alt"></i> ODJAVI SE
                </button>
            `;
            navDiv.querySelector("#logout-btn").onclick = () => {
                localStorage.clear();
                this.draw();
            };
        }

        header.appendChild(title);
        header.appendChild(navDiv);
        this.host.appendChild(header);

        //  2. HERO 
        const hero = document.createElement("div");
        hero.className = "market-hero";

        const heroContent = document.createElement("div");
        heroContent.className = "hero-content";

        const heroTag = document.createElement("span");
        heroTag.className = "hero-tag";
        heroTag.innerText = "DOBRODOŠLI";

        const heroTitle = document.createElement("h1");
        heroTitle.className = "hero-title";
        heroTitle.innerText = "Sve što ti treba,\nna jednom mestu.";

        const heroSub = document.createElement("p");
        heroSub.className = "hero-sub";
        heroSub.innerText = "Hiljade proizvoda. Brza dostava. Sigurna kupovina.";

        const heroBtn = document.createElement("button");
        heroBtn.className = "hero-cta";
        if (!isAuth) {
            heroBtn.innerHTML = "POGLEDAJ PONUDU &rarr;";
            heroBtn.onclick = () => this.drawModal("Registracija");
        }

        const heroStats = document.createElement("div");
        heroStats.className = "hero-stats";
        heroStats.innerHTML = `
            <div class="hero-stat">
                <span class="hero-stat-num">10K+</span>
                <span class="hero-stat-label">Proizvoda</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
                <span class="hero-stat-num">50K+</span>
                <span class="hero-stat-label">Kupaca</span>
            </div>
            <div class="hero-stat-divider"></div>
            <div class="hero-stat">
                <span class="hero-stat-num">24h</span>
                <span class="hero-stat-label">Dostava</span>
            </div>
        `;

        heroContent.appendChild(heroTag);
        heroContent.appendChild(heroTitle);
        heroContent.appendChild(heroSub);
        heroContent.appendChild(heroBtn);
        heroContent.appendChild(heroStats);
        hero.appendChild(heroContent);
        this.host.appendChild(hero);

        //  3. FOOTER 
        const footer = document.createElement("div");
        footer.className = "market-footer";
        footer.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand"><i class="fas fa-shopping-bag"></i> MARKET APP</div>
                <div class="footer-copy">© 2025 Market App. Sva prava zadržana.</div>
            </div>
        `;
        this.host.appendChild(footer);
    }

    //  MODAL PRIJAVA / REGISTRACIJA 
    drawModal(type) {
        const old = document.getElementById("market-modal-overlay");
        if (old) old.remove();

        const overlay = document.createElement("div");
        overlay.id = "market-modal-overlay";
        overlay.className = "modal-overlay";
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const modal = document.createElement("div");
        modal.className = "modal-box";

        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close";
        closeBtn.innerHTML = "&times;";
        closeBtn.onclick = () => overlay.remove();

        const modalTitle = document.createElement("h2");
        modalTitle.className = "modal-title";

        const form = document.createElement("form");
        form.className = "modal-form";
        form.onsubmit = (e) => e.preventDefault();

        if (type === "Prijava") {
            modalTitle.innerHTML = '<i class="fas fa-sign-in-alt"></i> Prijavi se';
            form.innerHTML = `
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username-login" placeholder="Vaš username" required />
                </div>
                <div class="form-group">
                    <label>Lozinka</label>
                    <input type="password" id="login-pw" placeholder="••••••••" required />
                </div>
                <button type="submit" class="modal-submit-btn">
                    <i class="fas fa-sign-in-alt"></i> PRIJAVITE SE
                </button>
                <p class="modal-switch">Nemate nalog?
                    <a href="#" id="switch-to-reg">Registrujte se</a>
                </p>
            `;
            form.onsubmit = async (e) => {
                e.preventDefault();
                const username = document.getElementById("username-login").value;
                const password = document.getElementById("login-pw").value;

                try {
                    const response = await fetch(`${API_URL}/Korisnik/Prijava`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem("token", data.token);
                        localStorage.setItem("user", JSON.stringify(data));
                        overlay.remove();
                        this.onLoginSuccess(data);
                    } else {
                        const error = await response.text();
                        alert("Greška: " + error);
                    }
                } catch (err) {
                    alert("Serverska greška pri prijavi.");
                }
            };

        } else {
            modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Registrujte se';
            form.innerHTML = `
                <div class="form-column">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="reg-username" placeholder="Vaš username" required />
                    </div>
                    <div class="form-group">
                        <label>Ime</label>
                        <input type="text" id="reg-ime" placeholder="Vaše ime" required />
                    </div>
                    <div class="form-group">
                        <label>Prezime</label>
                        <input type="text" id="reg-prezime" placeholder="Vaše prezime" required />
                    </div>
                </div>
                <div class="form-group">
                    <label>Email adresa</label>
                    <input type="email" id="reg-email" placeholder="vas@email.com" required />
                </div>
                <div class="form-group">
                    <label>Broj telefona</label>
                    <input type="text" id="reg-number" placeholder="Broj telefona" required />
                </div>
                <div class="form-group">
                    <label>Lozinka</label>
                    <input type="password" id="reg-pw" placeholder="Minimalno 8 znakova" required />
                </div>
                <button type="submit" class="modal-submit-btn btn-reg-submit">
                    <i class="fas fa-user-plus"></i> REGISTRUJTE SE
                </button>
                <p class="modal-switch">Već imate nalog?
                    <a href="#" id="switch-to-login">Prijavite se</a>
                </p>
            `;
            form.onsubmit = async (e) => {
                e.preventDefault();
                const noviKorisnik = {
                    username: document.getElementById("reg-username").value,
                    ime:      document.getElementById("reg-ime").value,
                    prezime:  document.getElementById("reg-prezime").value,
                    email:    document.getElementById("reg-email").value,
                    broj:     document.getElementById("reg-number").value,
                    lozinka:  document.getElementById("reg-pw").value
                };

                try {
                    const response = await fetch(`${API_URL}/Korisnik/Registracija`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(noviKorisnik)
                    });

                    if (response.ok) {
                        alert("Uspešna registracija! Sada se možete prijaviti.");
                        this.drawModal("Prijava");
                    } else {
                        const error = await response.text();
                        alert("Greška: " + error);
                    }
                } catch (err) {
                    alert("Serverska greška pri registraciji.");
                }
            };
        }

        modal.appendChild(closeBtn);
        modal.appendChild(modalTitle);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add("modal-visible");
            modal.classList.add("modal-in");
        });

        const switchReg   = form.querySelector("#switch-to-reg");
        const switchLogin = form.querySelector("#switch-to-login");
        if (switchReg)   switchReg.onclick   = (e) => { e.preventDefault(); overlay.remove(); this.drawModal("Registracija"); };
        if (switchLogin) switchLogin.onclick = (e) => { e.preventDefault(); overlay.remove(); this.drawModal("Prijava"); };
    }
}