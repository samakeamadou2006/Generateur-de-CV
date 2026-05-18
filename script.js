// ============================================================
// DONNÉES PAR DÉFAUT
// ============================================================
function cvParDefaut() {
  return {
    couleur: "#1e3a5f",
    couleurClaire: "#2980b9",
    styleNiveau: "points", // "points" ou "barres"
    personnel: {
      prenom: "", nom: "", naissance: "", lieu: "",
      sexe: "", nationalite: "", email: "", telephone: "", photo: ""
    },
    profil: "",
    competences: [],
    langues: [],
    interets: [],
    formations: [],
    experiences: [],
    activites: [],
    references: "Références disponibles sur demande.",
    signLieu: "",
    signature: "",
    signatureImg: ""
  };
}

let cv = cvParDefaut();
let ancienneCle = "";

// ============================================================
// UTILITAIRES
// ============================================================
function genId() { return Math.random().toString(36).substr(2, 8); }

/**
 * Échappe une chaîne HTML pour prévenir les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} - Le texte échappé
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Valide le type MIME d'un fichier image
 * @param {File} file - Le fichier à valider
 * @returns {boolean} - true si le type est valide
 */
function validerTypeImage(file) {
  const typesValides = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return typesValides.includes(file.type);
}

/**
 * Valide un format email basique
 * @param {string} email - L'email à valider
 * @returns {boolean} - true si le format est valide
 */
function validerEmail(email) {
  if (!email) return true; // Champ vide est valide (optionnel)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validerTelephone(telephone) {
  if (!telephone) return true;
  const regex = /^[0-9+()\-\s]{6,25}$/;
  return regex.test(telephone);
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function afficherStatut(message, type = "info") {
  const statut = document.getElementById("statut-sauvegarde");
  if (!statut) return;
  statut.textContent = message;
  statut.dataset.type = type;
}

function afficherErreurChamp(id, message) {
  const champ = document.getElementById(id);
  const aide = document.getElementById(`erreur-${id.split("-")[1]}`);
  if (!champ || !aide) return;
  const isError = Boolean(message);
  champ.classList.toggle("erreur", isError);
  aide.hidden = !isError;
  aide.textContent = message || "";
}

function getInitiales() {
  const p = cv.personnel.prenom.trim().charAt(0).toUpperCase();
  const n = cv.personnel.nom.trim().charAt(0).toUpperCase();
  return (p || "") + (n || "") || "?";
}

// Convertir niveau 1-5 (points) ou 0-100 (barres)
function niveauEnPoints(valeur) {
  // valeur est 1 à 5
  return parseInt(valeur) || 3;
}

// ============================================================
// SAUVEGARDE ET CHARGEMENT
// ============================================================
function construireCle() {
  const p = cv.personnel.prenom.trim();
  const n = cv.personnel.nom.trim();
  return (p && n) ? `cv-${p}-${n}` : "cv-sans-nom";
}

function sauvegarder() {
  const nouvelleCle = construireCle();
  try {
    if (ancienneCle && ancienneCle !== nouvelleCle) {
      localStorage.removeItem(ancienneCle);
    }
    localStorage.setItem(nouvelleCle, JSON.stringify(cv));
    ancienneCle = nouvelleCle;
    afficherStatut("CV enregistré automatiquement");
  } catch (err) {
    console.error(err);
    afficherStatut("Erreur de sauvegarde : stockage plein ou bloqué", "error");
  }
}

const sauvegarderDebounced = debounce(sauvegarder, 350);

function charger() {
  const cles = Object.keys(localStorage).filter(k => k.startsWith("cv-"));
  if (cles.length > 0) {
    const data = localStorage.getItem(cles[0]);
    if (data) {
      cv = JSON.parse(data);
      ancienneCle = cles[0];
    }
  }
}

// ============================================================
// APPLIQUER LA COULEUR DU CV
// ============================================================
const COULEURS_CLAIRES = {
  "#1e3a5f": "#2980b9",
  "#1a5276": "#5dade2",
  "#1e8449": "#58d68d",
  "#6c3483": "#a569bd"
};

function appliquerCouleur(couleur) {
  cv.couleur = couleur;
  cv.couleurClaire = COULEURS_CLAIRES[couleur] || "#5dade2";

  document.documentElement.style.setProperty("--cv-couleur", couleur);
  document.documentElement.style.setProperty("--cv-couleur-claire", cv.couleurClaire);

  document.querySelectorAll(".couleur-btn").forEach(btn => {
    btn.classList.toggle("actif", btn.dataset.couleur === couleur);
  });
}

// ============================================================
// APPLIQUER LE STYLE NIVEAU
// ============================================================
function appliquerStyleNiveau(style) {
  cv.styleNiveau = style;

  document.getElementById("btn-points").classList.toggle("actif", style === "points");
  document.getElementById("btn-barres").classList.toggle("actif", style === "barres");

  // Re-afficher les sections concernées
  afficherSectionCv("competences");
  afficherSectionCv("langues");
}

// ============================================================
// REMPLIR LE FORMULAIRE DEPUIS LES DONNÉES
// ============================================================
function remplirFormulaire() {
  const p = cv.personnel;
  document.getElementById("inp-prenom").value      = p.prenom;
  document.getElementById("inp-nom").value         = p.nom;
  document.getElementById("inp-naissance").value   = p.naissance;
  document.getElementById("inp-lieu").value        = p.lieu;
  document.getElementById("inp-sexe").value        = p.sexe;
  document.getElementById("inp-nationalite").value = p.nationalite;
  document.getElementById("inp-email").value       = p.email;
  document.getElementById("inp-telephone").value   = p.telephone;
  document.getElementById("inp-profil").value      = cv.profil;
  document.getElementById("inp-references").value  = cv.references;
  document.getElementById("inp-sign-lieu").value   = cv.signLieu;
  document.getElementById("inp-signature").value   = cv.signature;

  if (p.photo) afficherPhotoFormulaire(p.photo);
  if (cv.signatureImg) {
    const prev = document.getElementById("sign-img-preview");
    prev.src = cv.signatureImg; prev.hidden = false;
    document.getElementById("sign-upload-label").hidden = true;
  }

  appliquerCouleur(cv.couleur || "#1e3a5f");
  appliquerStyleNiveau(cv.styleNiveau || "points");

  // Sections dynamiques
  cv.competences.forEach(e => ajouterBlocFormulaire("competences", e));
  cv.langues.forEach(e     => ajouterBlocFormulaire("langues", e));
  cv.interets.forEach(e    => ajouterBlocFormulaire("interets", e));
  cv.formations.forEach(e  => ajouterBlocFormulaire("formations", e));
  cv.experiences.forEach(e => ajouterBlocFormulaire("experiences", e));
  cv.activites.forEach(e   => ajouterBlocFormulaire("activites", e));
}

// ============================================================
// AFFICHER LA PRÉVISUALISATION COMPLÈTE
// ============================================================
function afficherPrevisualisation() {
  const p = cv.personnel;

  // Nom + initiales
  document.getElementById("cv-nom").textContent =
    `${p.prenom} ${p.nom}`.trim() || "PRÉNOM NOM";
  document.getElementById("cv-initiales").textContent = getInitiales();

  // Infos personnelles gauche
  majInfoItem("cv-info-nom",         "cv-info-nom-txt",         `${p.prenom} ${p.nom}`.trim());
  majInfoItem("cv-info-naissance",   "cv-info-naissance-txt",   p.naissance);
  majInfoItem("cv-info-lieu",        "cv-info-lieu-txt",        p.lieu);
  majInfoItem("cv-info-sexe",        "cv-info-sexe-txt",        p.sexe);
  majInfoItem("cv-info-nationalite", "cv-info-nationalite-txt", p.nationalite);
  majInfoItemOptional("cv-info-email", "cv-info-email-txt",     p.email);
  majInfoItemOptional("cv-info-tel",   "cv-info-tel-txt",       p.telephone);

  // Photo
  if (p.photo) afficherPhotoCv(p.photo);

  // Profil
  document.getElementById("cv-profil").textContent = cv.profil || "Votre profil apparaîtra ici...";

  // Références
  document.getElementById("cv-references").textContent = cv.references || "Références disponibles sur demande.";

  // Signature
  document.getElementById("cv-sign-lieu").textContent    = cv.signLieu || "";
  document.getElementById("cv-signature-texte").textContent = cv.signature || "";

  const signImg = document.getElementById("cv-signature-img");
  if (cv.signatureImg) { signImg.src = cv.signatureImg; signImg.hidden = false; }
  else { signImg.hidden = true; }

  // Sections dynamiques
  afficherSectionCv("competences");
  afficherSectionCv("langues");
  afficherSectionCv("interets");
  afficherSectionCv("formations");
  afficherSectionCv("experiences");
  afficherSectionCv("activites");
}

function majInfoItem(itemId, txtId, valeur) {
  document.getElementById(txtId).textContent = valeur || "";
}

function majInfoItemOptional(itemId, txtId, valeur) {
  const item = document.getElementById(itemId);
  document.getElementById(txtId).textContent = valeur || "";
  item.hidden = !valeur;
}

// ============================================================
// AFFICHER UNE SECTION DANS LE CV
// ============================================================
function afficherSectionCv(section) {
  const conteneur = document.getElementById(`cv-${section}`);
  if (!conteneur) return;
  conteneur.innerHTML = "";

  if (section === "competences" || section === "langues") {
    cv[section].forEach(item => {
      const div = document.createElement("div");
      div.dataset.id = item.id;

      if (cv.styleNiveau === "points") {
        // Affichage avec points ronds (1 à 5)
        const niveau = parseInt(item.niveau) || 3;
        let pointsHTML = "";
        for (let i = 1; i <= 5; i++) {
          pointsHTML += `<span class="cv-point ${i <= niveau ? "rempli" : ""}"></span>`;
        }
        div.className = "cv-comp-item-points";
        div.innerHTML = `
          <p class="cv-comp-nom-points">${escapeHtml(item.nom || "—")}</p>
          <div class="cv-points-wrap">${pointsHTML}</div>
        `;
      } else {
        // Affichage avec barres de progression
        const pct = parseInt(item.niveau) || 50;
        div.className = "cv-comp-item-barre";
        div.innerHTML = `
          <p class="cv-comp-nom-barre">${escapeHtml(item.nom || "—")}</p>
          <div class="cv-barre-fond">
            <div class="cv-barre-fill" style="width:${pct}%"></div>
          </div>
        `;
      }
      conteneur.appendChild(div);
    });
  }

  if (section === "interets") {
    cv.interets.forEach(item => {
      const div = document.createElement("div");
      div.className = "cv-interet-item";
      div.dataset.id = item.id;
      div.innerHTML = `<span class="cv-interet-carre"></span><span>${escapeHtml(item.nom || "—")}</span>`;
      conteneur.appendChild(div);
    });
  }

  if (section === "formations") {
    cv.formations.forEach(f => {
      const div = document.createElement("div");
      div.className = "cv-item-droite";
      div.dataset.id = f.id;
      div.innerHTML = `
        <div class="cv-item-header">
          <span class="cv-item-titre-d">${escapeHtml(f.titre || "—")}</span>
          <span class="cv-item-periode-d">${escapeHtml(f.periode || "")}</span>
        </div>
        <p class="cv-item-sous-titre-d">${escapeHtml(f.etablissement || "")}</p>
        <p class="cv-item-desc-d">${escapeHtml(f.description || "")}</p>
      `;
      conteneur.appendChild(div);
    });
  }

  if (section === "experiences") {
    cv.experiences.forEach(exp => {
      const div = document.createElement("div");
      div.className = "cv-item-droite";
      div.dataset.id = exp.id;

      // Générer les puces de description
      const puces = exp.puces
        ? exp.puces.split("\n").filter(l => l.trim())
        : [];

      const pucesHTML = puces.length > 0
        ? `<ul class="cv-item-puces">${puces.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
        : "";

      div.innerHTML = `
        <div class="cv-item-header">
          <span class="cv-item-titre-d">${escapeHtml(exp.poste || "—")}</span>
          <span class="cv-item-periode-d">${escapeHtml(exp.periode || "")}</span>
        </div>
        <p class="cv-item-sous-titre-d">${escapeHtml(exp.lieu || "")}</p>
        ${pucesHTML}
      `;
      conteneur.appendChild(div);
    });
  }

  if (section === "activites") {
    cv.activites.forEach(a => {
      const div = document.createElement("div");
      div.className = "cv-item-droite";
      div.dataset.id = a.id;
      div.innerHTML = `
        <p class="cv-item-titre-d">${escapeHtml(a.titre || "—")}</p>
        <p class="cv-item-sous-titre-d">${escapeHtml(a.lieu || "")}</p>
        <p class="cv-item-desc-d">${escapeHtml(a.description || "")}</p>
      `;
      conteneur.appendChild(div);
    });
  }
}

// ============================================================
// BLOCS FORMULAIRE DYNAMIQUES
// ============================================================
function ajouterBlocFormulaire(section, donnees) {
  const conteneur = document.getElementById(`liste-${section}`);
  const index = cv[section].indexOf(donnees) + 1;

  const div = document.createElement("div");
  div.className = "item-bloc";
  div.dataset.id = donnees.id;

  let contenu = `
    <div class="item-entete">
      <span class="item-num">${nomSection(section)} ${index}</span>
      <button class="btn-suppr-item" data-action="supprimer" data-section="${section}" data-id="${donnees.id}">✕</button>
    </div>
  `;

  if (section === "competences" || section === "langues") {
    const estPoints = cv.styleNiveau === "points";
    contenu += `
      <div class="champ">
        <label>${section === "competences" ? "Compétence" : "Langue"}</label>
        <input type="text" value="${escapeHtml(donnees.nom || "")}" placeholder="${section === "competences" ? "Ex: JavaScript" : "Ex: Français"}"
          data-section="${section}" data-id="${donnees.id}" data-prop="nom" />
      </div>
      <div class="champ">
        <label>Niveau ${estPoints ? "(1 à 5)" : "(0 à 100%)"}</label>
        <div class="niveau-wrap">
          <input type="range" min="${estPoints ? 1 : 10}" max="${estPoints ? 5 : 100}" step="${estPoints ? 1 : 5}"
            value="${donnees.niveau || (estPoints ? 3 : 50)}"
            data-section="${section}" data-id="${donnees.id}" data-prop="niveau" />
          <span class="niveau-val">${escapeHtml(String(donnees.niveau || (estPoints ? 3 : 50)))}${estPoints ? "/5" : "%"}</span>
        </div>
      </div>
    `;
  }

  if (section === "interets") {
    contenu += `
      <div class="champ">
        <label>Centre d'intérêt</label>
        <input type="text" value="${escapeHtml(donnees.nom || "")}" placeholder="Ex: Travail en équipe"
          data-section="interets" data-id="${donnees.id}" data-prop="nom" />
      </div>
    `;
  }

  if (section === "formations") {
    contenu += `
      <div class="champ">
        <label>Titre / Diplôme</label>
        <input type="text" value="${escapeHtml(donnees.titre || "")}" placeholder="Ex: Début des études secondaires"
          data-section="formations" data-id="${donnees.id}" data-prop="titre" />
      </div>
      <div class="champ-double">
        <div class="champ">
          <label>Établissement</label>
          <input type="text" value="${escapeHtml(donnees.etablissement || "")}" placeholder="Ex: Collège les Étoiles, SAMO"
            data-section="formations" data-id="${donnees.id}" data-prop="etablissement" />
        </div>
        <div class="champ">
          <label>Période</label>
          <input type="text" value="${escapeHtml(donnees.periode || "")}" placeholder="Ex: oct. 2018 à juin 2021"
            data-section="formations" data-id="${donnees.id}" data-prop="periode" />
        </div>
      </div>
      <div class="champ">
        <label>Description</label>
        <textarea data-section="formations" data-id="${donnees.id}" data-prop="description"
          placeholder="Description...">${escapeHtml(donnees.description || "")}</textarea>
      </div>
    `;
  }

  if (section === "experiences") {
    contenu += `
      <div class="champ-double">
        <div class="champ">
          <label>Poste</label>
          <input type="text" value="${escapeHtml(donnees.poste || "")}" placeholder="Ex: Menuisier"
            data-section="experiences" data-id="${donnees.id}" data-prop="poste" />
        </div>
        <div class="champ">
          <label>Période</label>
          <input type="text" value="${escapeHtml(donnees.periode || "")}" placeholder="Ex: de 2023 à 2025"
            data-section="experiences" data-id="${donnees.id}" data-prop="periode" />
        </div>
      </div>
      <div class="champ">
        <label>Lieu / Entreprise</label>
        <input type="text" value="${escapeHtml(donnees.lieu || "")}" placeholder="Ex: SAMO"
          data-section="experiences" data-id="${donnees.id}" data-prop="lieu" />
      </div>
      <div class="champ">
        <label>Missions (une par ligne → affichées en puces)</label>
        <textarea data-section="experiences" data-id="${donnees.id}" data-prop="puces"
          placeholder="Mission 1&#10;Mission 2&#10;Mission 3">${escapeHtml(donnees.puces || "")}</textarea>
      </div>
    `;
  }

  if (section === "activites") {
    contenu += `
      <div class="champ-double">
        <div class="champ">
          <label>Titre</label>
          <input type="text" value="${escapeHtml(donnees.titre || "")}" placeholder="Ex: Inter-classes"
            data-section="activites" data-id="${donnees.id}" data-prop="titre" />
        </div>
        <div class="champ">
          <label>Lieu</label>
          <input type="text" value="${escapeHtml(donnees.lieu || "")}" placeholder="Ex: Bonoua"
            data-section="activites" data-id="${donnees.id}" data-prop="lieu" />
        </div>
      </div>
      <div class="champ">
        <label>Description</label>
        <textarea data-section="activites" data-id="${donnees.id}" data-prop="description"
          placeholder="Description...">${escapeHtml(donnees.description || "")}</textarea>
      </div>
    `;
  }

  div.innerHTML = contenu;
  conteneur.appendChild(div);
}

function nomSection(section) {
  const noms = {
    competences: "Compétence", langues: "Langue", interets: "Intérêt",
    formations: "Formation", experiences: "Expérience", activites: "Activité"
  };
  return noms[section] || section;
}

// ============================================================
// AJOUTER UN ÉLÉMENT
// ============================================================
function ajouter(section) {
  const defaults = {
    competences: { nom: "", niveau: cv.styleNiveau === "points" ? 3 : 50 },
    langues:     { nom: "", niveau: cv.styleNiveau === "points" ? 3 : 50 },
    interets:    { nom: "" },
    formations:  { titre: "", etablissement: "", periode: "", description: "" },
    experiences: { poste: "", periode: "", lieu: "", puces: "" },
    activites:   { titre: "", lieu: "", description: "" }
  };

  const nouvel = { id: genId(), ...defaults[section] };
  cv[section].push(nouvel);
  ajouterBlocFormulaire(section, nouvel);
  afficherSectionCv(section);
  sauvegarder();
}

function traiterFichierPhoto(fichier, callback) {
  if (!fichier) return;
  if (!validerTypeImage(fichier)) {
    afficherStatut("Type d'image non supporté", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    callback(evt.target.result);
    sauvegarder();
  };
  reader.readAsDataURL(fichier);
}

function activerElementClavier(element, callback) {
  element.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  });
}

// ============================================================
// SUPPRIMER UN ÉLÉMENT
// ============================================================
function supprimer(section, id) {
  cv[section] = cv[section].filter(e => e.id !== id);
  const bloc = document.querySelector(`#liste-${section} [data-id="${id}"]`);
  if (bloc) bloc.remove();
  afficherSectionCv(section);
  sauvegarder();
}

// ============================================================
// PHOTO
// ============================================================
function afficherPhotoFormulaire(src) {
  document.getElementById("photo-placeholder").hidden = true;
  const prev = document.getElementById("photo-preview");
  prev.src = src; prev.hidden = false;
}

function afficherPhotoCv(src) {
  const cvPhoto = document.getElementById("cv-photo");
  cvPhoto.src = src; cvPhoto.hidden = false;
  document.getElementById("cv-initiales").hidden = true;
}

// ============================================================
// MISE À JOUR CIBLÉE (temps réel sans re-rendu complet)
// ============================================================
function mettreAJourPersonnel(champ, valeur) {
  cv.personnel[champ] = valeur;

  if (champ === "email") {
    const valide = validerEmail(valeur);
    afficherErreurChamp("inp-email", valide ? "" : "Email invalide");
  }
  if (champ === "telephone") {
    const valide = validerTelephone(valeur);
    afficherErreurChamp("inp-telephone", valide ? "" : "Numéro de téléphone invalide");
  }

  switch (champ) {
    case "prenom": case "nom":
      document.getElementById("cv-nom").textContent =
        `${cv.personnel.prenom} ${cv.personnel.nom}`.trim() || "PRÉNOM NOM";
      document.getElementById("cv-initiales").textContent = getInitiales();
      majInfoItem("cv-info-nom", "cv-info-nom-txt", `${cv.personnel.prenom} ${cv.personnel.nom}`.trim());
      break;
    case "naissance":   majInfoItem("cv-info-naissance",   "cv-info-naissance-txt",   valeur); break;
    case "lieu":        majInfoItem("cv-info-lieu",        "cv-info-lieu-txt",        valeur); break;
    case "sexe":        majInfoItem("cv-info-sexe",        "cv-info-sexe-txt",        valeur); break;
    case "nationalite": majInfoItem("cv-info-nationalite", "cv-info-nationalite-txt", valeur); break;
    case "email":       majInfoItemOptional("cv-info-email", "cv-info-email-txt", valeur); break;
    case "telephone":   majInfoItemOptional("cv-info-tel",   "cv-info-tel-txt",   valeur); break;
  }

  sauvegarderDebounced();
}

function mettreAJourElement(section, id, prop, valeur) {
  const el = cv[section].find(e => e.id === id);
  if (!el) return;

  // Convertir en nombre pour les niveaux
  if (prop === "niveau") {
    el[prop] = parseInt(valeur);
    // Mettre à jour l'affichage du compteur
    const bloc = document.querySelector(`#liste-${section} [data-id="${id}"]`);
    if (bloc) {
      const niveauVal = bloc.querySelector(".niveau-val");
      if (niveauVal) niveauVal.textContent = cv.styleNiveau === "points" ? `${valeur}/5` : `${valeur}%`;
    }
  } else {
    el[prop] = valeur;
  }

  afficherSectionCv(section);
  sauvegarderDebounced();
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================

// Champs personnels
["inp-prenom","inp-nom","inp-naissance","inp-lieu",
 "inp-sexe","inp-nationalite","inp-email","inp-telephone"].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener("input", (e) => mettreAJourPersonnel(e.target.dataset.champ, e.target.value));
  el.addEventListener("change", (e) => mettreAJourPersonnel(e.target.dataset.champ, e.target.value));
});

// Profil
document.getElementById("inp-profil").addEventListener("input", (e) => {
  cv.profil = e.target.value;
  document.getElementById("cv-profil").textContent = e.target.value || "Votre profil apparaîtra ici...";
  sauvegarderDebounced();
});

// Références
document.getElementById("inp-references").addEventListener("input", (e) => {
  cv.references = e.target.value;
  document.getElementById("cv-references").textContent = e.target.value;
  sauvegarderDebounced();
});

// Signature texte
document.getElementById("inp-signature").addEventListener("input", (e) => {
  cv.signature = e.target.value;
  document.getElementById("cv-signature-texte").textContent = e.target.value;
  sauvegarderDebounced();
});

// Lieu signature
document.getElementById("inp-sign-lieu").addEventListener("input", (e) => {
  cv.signLieu = e.target.value;
  document.getElementById("cv-sign-lieu").textContent = e.target.value;
  sauvegarderDebounced();
});

// Inputs dynamiques
document.getElementById("formulaire").addEventListener("input", (e) => {
  const el = e.target;
  const section = el.dataset.section;
  const id = el.dataset.id;
  const prop = el.dataset.prop;
  if (section && id && prop) mettreAJourElement(section, id, prop, el.value);
});

// Clics (ajouter / supprimer)
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const section = el.dataset.section;
  const id = el.dataset.id;
  if (action === "ajouter")   ajouter(section);
  if (action === "supprimer") supprimer(section, id);
});

// Palette couleurs
document.getElementById("couleurs-palette").addEventListener("click", (e) => {
  const btn = e.target.closest(".couleur-btn");
  if (!btn) return;
  appliquerCouleur(btn.dataset.couleur);
  sauvegarder();
});

// Toggle style niveau
document.getElementById("btn-points").addEventListener("click", () => {
  appliquerStyleNiveau("points");
  sauvegarder();
});

document.getElementById("btn-barres").addEventListener("click", () => {
  appliquerStyleNiveau("barres");
  sauvegarder();
});

// Photo profil
const photoUpload = document.getElementById("photo-upload");
const inputPhoto = document.getElementById("input-photo");
photoUpload.addEventListener("click", () => inputPhoto.click());
photoUpload.addEventListener("dragover", (e) => {
  e.preventDefault();
  photoUpload.classList.add("dragover");
});
photoUpload.addEventListener("dragleave", () => photoUpload.classList.remove("dragover"));
photoUpload.addEventListener("drop", (e) => {
  e.preventDefault();
  photoUpload.classList.remove("dragover");
  const fichier = e.dataTransfer.files[0];
  if (!fichier) return;
  traiterFichierPhoto(fichier, (src) => {
    cv.personnel.photo = src;
    afficherPhotoFormulaire(src);
    afficherPhotoCv(src);
  });
});
activerElementClavier(photoUpload, () => inputPhoto.click());

inputPhoto.addEventListener("change", (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;
  traiterFichierPhoto(fichier, (src) => {
    cv.personnel.photo = src;
    afficherPhotoFormulaire(src);
    afficherPhotoCv(src);
  });
});

// Signature image
document.getElementById("sign-upload-zone").addEventListener("click", () => {
  document.getElementById("input-signature-img").click();
});
activerElementClavier(document.getElementById("sign-upload-zone"), () => document.getElementById("input-signature-img").click());

document.getElementById("input-signature-img").addEventListener("change", (e) => {
  const fichier = e.target.files[0];
  if (!fichier) return;
  traiterFichierPhoto(fichier, (src) => {
    cv.signatureImg = src;
    const prev = document.getElementById("sign-img-preview");
    prev.src = src; prev.hidden = false;
    document.getElementById("sign-upload-label").hidden = true;
    const cvSignImg = document.getElementById("cv-signature-img");
    cvSignImg.src = src; cvSignImg.hidden = false;
  });
});

// Export PDF
document.getElementById("btn-pdf").addEventListener("click", () => window.print());

// Réinitialisation
const modalReset = document.getElementById("modal-reset");
document.getElementById("btn-reset").addEventListener("click", () => { modalReset.hidden = false; });
document.getElementById("btn-reset-annuler").addEventListener("click", () => { modalReset.hidden = true; });
modalReset.addEventListener("click", (e) => { if (e.target === modalReset) modalReset.hidden = true; });

document.getElementById("btn-reset-confirmer").addEventListener("click", () => {
  localStorage.removeItem(construireCle());
  cv = cvParDefaut();
  ancienneCle = "";

  // Vider toutes les listes dynamiques
  ["competences","langues","interets","formations","experiences","activites"].forEach(s => {
    document.getElementById(`liste-${s}`).innerHTML = "";
  });

  // Réinitialiser photo
  document.getElementById("photo-placeholder").hidden = false;
  document.getElementById("photo-preview").hidden     = true;
  document.getElementById("cv-photo").hidden          = true;
  document.getElementById("cv-initiales").hidden      = false;

  // Réinitialiser signature image
  document.getElementById("sign-img-preview").hidden  = true;
  document.getElementById("sign-upload-label").hidden = false;

  remplirFormulaire();
  afficherPrevisualisation();
  modalReset.hidden = true;
});

// ============================================================
// DÉMARRAGE
// ============================================================
charger();
remplirFormulaire();
afficherPrevisualisation();

// ============================================================
// PWA - INSTALLATION
// ============================================================

/**
 * Gestion de l'installation PWA
 * Affiche un bouton "Installer l'application" quand disponible
 */

// Variable pour stocker l'événement beforeinstallprompt
let deferredPrompt = null;

/**
 * Enregistrement du Service Worker
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Échec enregistrement Service Worker:', error);
      });
  });
}

/**
 * Création du bouton d'installation PWA
 */
function creerBoutonInstallation() {
  let btnInstall = document.getElementById('btn-install-pwa');

  if (!btnInstall) {
    btnInstall = document.createElement('button');
    btnInstall.id = 'btn-install-pwa';
    btnInstall.className = 'btn btn-primaire';
    btnInstall.innerHTML = '📲 Installer l\'app';
    btnInstall.style.display = 'none'; // Caché par défaut
    btnInstall.setAttribute('aria-label', 'Installer l\'application');
    btnInstall.setAttribute('title', 'Installer le Générateur de CV sur votre appareil');

    // Insérer le bouton dans l'en-tête, avant le bouton PDF
    const btnPdf = document.getElementById('btn-pdf');
    if (btnPdf && btnPdf.parentNode) {
      btnPdf.parentNode.insertBefore(btnInstall, btnPdf);
    }
  }

  if (!btnInstall.dataset.pwaInit) {
    btnInstall.addEventListener('click', installerPWA);
    btnInstall.dataset.pwaInit = 'true';
  }
}

/**
 * Installation de la PWA
 */
function installerPWA() {
  if (!deferredPrompt) {
    console.log('[PWA] Installation non disponible');
    return;
  }

  // Afficher le bouton dans la barre d'adresse (mobile) ou la modale (desktop)
  deferredPrompt.prompt();

  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] Installation acceptée par l\'utilisateur');
      afficherStatut('Application installée avec succès !');
    } else {
      console.log('[PWA] Installation refusée par l\'utilisateur');
    }
    deferredPrompt = null;
    
    // Cacher le bouton après tentative
    const btnInstall = document.getElementById('btn-install-pwa');
    if (btnInstall) {
      btnInstall.style.display = 'none';
    }
  });
}

/**
 * Écouteur pour beforeinstallprompt
 * Déclenché quand le navigateur détecte qu'on peut installer
 */
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt déclenché');
  e.preventDefault(); // Empêche le comportement par défaut
  deferredPrompt = e;

  // Afficher le bouton d'installation
  const btnInstall = document.getElementById('btn-install-pwa');
  if (btnInstall) {
    btnInstall.style.display = 'block';
  }
});

/**
 * Détecte quand l'application est installée
 */
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Application installée');
  deferredPrompt = null;
  const btnInstall = document.getElementById('btn-install-pwa');
  if (btnInstall) {
    btnInstall.style.display = 'none';
  }
  afficherStatut('Application installée !');
});

/**
 * Vérifie si on est déjà en mode standalone (app installée)
 */
function estEnModeStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Initialisation PWA au chargement
 */
document.addEventListener('DOMContentLoaded', () => {
  // Créer le bouton d'installation
  creerBoutonInstallation();

  // Si déjà installé, cacher le bouton
  if (estEnModeStandalone()) {
    const btnInstall = document.getElementById('btn-install-pwa');
    if (btnInstall) {
      btnInstall.style.display = 'none';
    }
    console.log('[PWA] Déjà en mode application installée');
  }
});

// Créer le bouton immédiatement si le DOM est déjà chargé
if (document.readyState !== 'loading') {
  creerBoutonInstallation();
}
