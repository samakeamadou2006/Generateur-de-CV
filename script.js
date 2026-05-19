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
 * Échappe une chaîne pour un attribut HTML
 * @param {string} text - Le texte à échapper
 * @returns {string} - Le texte échappé
 */
function escapeHtmlAttr(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, '&#39;')
    .replace(/</g, '<')
    .replace(/>/g, '>');
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

// ============================================================
// COMPRESSION D'IMAGES
// ============================================================
function compresserImage(dataUrl, maxWidth, maxHeight, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculer les nouvelles dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

// ============================================================
// SAUVEGARDE ET CHARGEMENT
// ============================================================
function construireCle() {
  const p = cv.personnel.prenom.trim();
  const n = cv.personnel.nom.trim();
  return (p && n) ? `cv-${p}-${n}` : "cv-sans-nom";
}

function estimerTailleDonnees() {
  try {
    const str = JSON.stringify(cv);
    return new Blob([str]).size;
  } catch (e) {
    return 0;
  }
}

function sauvegarder() {
  const nouvelleCle = construireCle();
  try {
    // Vérifier la taille des données
    const taille = estimerTailleDonnees();
    if (taille > 4 * 1024 * 1024) { // 4MB
      afficherStatut("Attention : stockage presque plein", "warning");
    }

    if (ancienneCle && ancienneCle !== nouvelleCle) {
      localStorage.removeItem(ancienneCle);
    }
    localStorage.setItem(nouvelleCle, JSON.stringify(cv));
    ancienneCle = nouvelleCle;
    afficherStatut("CV enregistré automatiquement");
  } catch (err) {
    console.error(err);
    if (err.name === 'QuotaExceededError') {
      afficherStatut("Stockage plein ! Exportez ou supprimez des données.", "error");
    } else {
      afficherStatut("Erreur de sauvegarde : stockage bloqué", "error");
    }
  }
}

const sauvegarderDebounced = debounce(sauvegarder, 350);

function charger() {
  const cles = Object.keys(localStorage).filter(k => k.startsWith("cv-"));
  if (cles.length > 0) {
    const data = localStorage.getItem(cles[0]);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Validation basique de la structure
        if (parsed && typeof parsed === 'object' && 'personnel' in parsed) {
          cv = { ...cvParDefaut(), ...parsed };
          ancienneCle = cles[0];
        }
      } catch (e) {
        console.warn('Erreur lors du chargement du CV, utilisation des valeurs par défaut');
      }
    }
  }
}

// ============================================================
// VALIDATION IMPORT JSON
// ============================================================
function validerStructureCV(data) {
  if (!data || typeof data !== 'object') {
    return { valide: false, erreur: "Les données doivent être un objet JSON" };
  }

  // Structure de base requise
  const structureRequise = {
    personnel: ['prenom', 'nom', 'email', 'telephone'],
    competences: null, // tableau
    langues: null,
    interets: null,
    formations: null,
    experiences: null,
    activites: null
  };

  // Vérifier les types de base
  if (typeof data.personnel !== 'object' || data.personnel === null) {
    return { valide: false, erreur: "Le champ 'personnel' doit être un objet" };
  }

  if (!Array.isArray(data.competences) || !Array.isArray(data.langues) ||
      !Array.isArray(data.interets) || !Array.isArray(data.formations) ||
      !Array.isArray(data.experiences) || !Array.isArray(data.activites)) {
    return { valide: false, erreur: "Les sections doivent être des tableaux" };
  }

  // Vérifier que les tableaux ne sont pas trop grands (limite de sécurité)
  const maxItems = 50;
  const sections = ['competences', 'langues', 'interets', 'formations', 'experiences', 'activites'];
  for (const section of sections) {
    if (data[section].length > maxItems) {
      return { valide: false, erreur: `Trop d'éléments dans ${section} (max ${maxItems})` };
    }
  }

  // Vérifier la taille totale
  try {
    const taille = JSON.stringify(data).length;
    if (taille > 4 * 1024 * 1024) { // 4MB
      return { valide: false, erreur: "Le fichier est trop volumineux (max 4MB)" };
    }
  } catch (e) {
    return { valide: false, erreur: "Impossible de calculer la taille des données" };
  }

  return { valide: true };
}

// ============================================================
// APPLIQUER LA COULEUR DU CV
// ============================================================
const COULEURS_CLAIRES = {
  "#1e3a5f": "#2980b9",
  "#1a5276": "#5dade2",
  "#1e8449": "#58d68d",
  "#6c3483": "#a569bd",
  "#2e07db": "#6495ed" // Ajout de la 5ème couleur
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
  const txtEl = document.getElementById(txtId);
  if (txtEl) txtEl.textContent = valeur || "";
}

function majInfoItemOptional(itemId, txtId, valeur) {
  const item = document.getElementById(itemId);
  const txtEl = document.getElementById(txtId);
  if (txtEl) txtEl.textContent = valeur || "";
  if (item) item.hidden = !valeur;
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
        const pct = Math.min(100, Math.max(0, parseInt(item.niveau) || 50));
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
// MISE À JOUR CIBLÉE D'UN ÉLÉMENT (optimisée)
// ============================================================
function majElementDansPrevisualisation(section, item) {
  const conteneur = document.getElementById(`cv-${section}`);
  if (!conteneur) return;

  const elementExistant = conteneur.querySelector(`[data-id="${item.id}"]`);

  // Si l'élément n'existe pas encore ou si le style de niveau a changé, on recharge la section
  if (!elementExistant) {
    afficherSectionCv(section);
    return;
  }

  // Sinon, on recrée juste cet élément spécifique et on remplace l'ancien
  const div = document.createElement("div");
  div.dataset.id = item.id;

  if (section === "competences" || section === "langues") {
    if (cv.styleNiveau === "points") {
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
      const pct = Math.min(100, Math.max(0, parseInt(item.niveau) || 50));
      div.className = "cv-comp-item-barre";
      div.innerHTML = `
        <p class="cv-comp-nom-barre">${escapeHtml(item.nom || "—")}</p>
        <div class="cv-barre-fond">
          <div class="cv-barre-fill" style="width:${pct}%"></div>
        </div>
      `;
    }
  } else if (section === "interets") {
    div.className = "cv-interet-item";
    div.innerHTML = `<span class="cv-interet-carre"></span><span>${escapeHtml(item.nom || "—")}</span>`;
  } else if (section === "formations") {
    div.className = "cv-item-droite";
    div.innerHTML = `
      <div class="cv-item-header">
        <span class="cv-item-titre-d">${escapeHtml(item.titre || "—")}</span>
        <span class="cv-item-periode-d">${escapeHtml(item.periode || "")}</span>
      </div>
      <p class="cv-item-sous-titre-d">${escapeHtml(item.etablissement || "")}</p>
      <p class="cv-item-desc-d">${escapeHtml(item.description || "")}</p>
    `;
  } else if (section === "experiences") {
    div.className = "cv-item-droite";
    const puces = item.puces ? item.puces.split("\n").filter(l => l.trim()) : [];
    const pucesHTML = puces.length > 0 ? `<ul class="cv-item-puces">${puces.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : "";
    div.innerHTML = `
      <div class="cv-item-header">
        <span class="cv-item-titre-d">${escapeHtml(item.poste || "—")}</span>
        <span class="cv-item-periode-d">${escapeHtml(item.periode || "")}</span>
      </div>
      <p class="cv-item-sous-titre-d">${escapeHtml(item.lieu || "")}</p>
      ${pucesHTML}
    `;
  } else if (section === "activites") {
    div.className = "cv-item-droite";
    div.innerHTML = `
      <p class="cv-item-titre-d">${escapeHtml(item.titre || "—")}</p>
      <p class="cv-item-sous-titre-d">${escapeHtml(item.lieu || "")}</p>
      <p class="cv-item-desc-d">${escapeHtml(item.description || "")}</p>
    `;
  }

  conteneur.replaceChild(div, elementExistant);
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
      <button class="btn-suppr-item" data-action="supprimer" data-section="${section}" data-id="${donnees.id}" aria-label="Supprimer ${nomSection(section).toLowerCase()} ${index}">✕</button>
    </div>
  `;

  if (section === "competences" || section === "langues") {
    const estPoints = cv.styleNiveau === "points";
    const niveauDefaut = estPoints ? 3 : 50;
    const niveauActuel = donnees.niveau !== undefined ? donnees.niveau : niveauDefaut;
    contenu += `
      <div class="champ">
        <label>${section === "competences" ? "Compétence" : "Langue"}</label>
        <input type="text" value="${escapeHtmlAttr(donnees.nom || "")}" placeholder="${section === "competences" ? "Ex: JavaScript" : "Ex: Français"}"
          data-section="${section}" data-id="${donnees.id}" data-prop="nom" />
      </div>
      <div class="champ">
        <label>Niveau ${estPoints ? "(1 à 5)" : "(0 à 100%)"}</label>
        <div class="niveau-wrap">
          <input type="range" min="${estPoints ? 1 : 10}" max="${estPoints ? 5 : 100}" step="${estPoints ? 1 : 5}"
            value="${niveauActuel}"
            data-section="${section}" data-id="${donnees.id}" data-prop="niveau" />
          <span class="niveau-val">${niveauActuel}${estPoints ? "/5" : "%"}</span>
        </div>
      </div>
    `;
  }

  if (section === "interets") {
    contenu += `
      <div class="champ">
        <label>Centre d'intérêt</label>
        <input type="text" value="${escapeHtmlAttr(donnees.nom || "")}" placeholder="Ex: Travail en équipe"
          data-section="interets" data-id="${donnees.id}" data-prop="nom" />
      </div>
    `;
  }

  if (section === "formations") {
    contenu += `
      <div class="champ">
        <label>Titre / Diplôme</label>
        <input type="text" value="${escapeHtmlAttr(donnees.titre || "")}" placeholder="Ex: Début des études secondaires"
          data-section="formations" data-id="${donnees.id}" data-prop="titre" />
      </div>
      <div class="champ-double">
        <div class="champ">
          <label>Établissement</label>
          <input type="text" value="${escapeHtmlAttr(donnees.etablissement || "")}" placeholder="Ex: Collège les Étoiles, SAMO"
            data-section="formations" data-id="${donnees.id}" data-prop="etablissement" />
        </div>
        <div class="champ">
          <label>Période</label>
          <input type="text" value="${escapeHtmlAttr(donnees.periode || "")}" placeholder="Ex: oct. 2018 à juin 2021"
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
          <input type="text" value="${escapeHtmlAttr(donnees.poste || "")}" placeholder="Ex: Menuisier"
            data-section="experiences" data-id="${donnees.id}" data-prop="poste" />
        </div>
        <div class="champ">
          <label>Période</label>
          <input type="text" value="${escapeHtmlAttr(donnees.periode || "")}" placeholder="Ex: de 2023 à 2025"
            data-section="experiences" data-id="${donnees.id}" data-prop="periode" />
        </div>
      </div>
      <div class="champ">
        <label>Lieu / Entreprise</label>
        <input type="text" value="${escapeHtmlAttr(donnees.lieu || "")}" placeholder="Ex: SAMO"
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
          <input type="text" value="${escapeHtmlAttr(donnees.titre || "")}" placeholder="Ex: Inter-classes"
            data-section="activites" data-id="${donnees.id}" data-prop="titre" />
        </div>
        <div class="champ">
          <label>Lieu</label>
          <input type="text" value="${escapeHtmlAttr(donnees.lieu || "")}" placeholder="Ex: Bonoua"
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
    afficherStatut("Type d'image non supporté (JPEG, PNG, GIF, WebP uniquement)", "error");
    return;
  }

  // Vérifier la taille du fichier (max 5MB)
  if (fichier.size > 5 * 1024 * 1024) {
    afficherStatut("Image trop volumineuse (max 5MB)", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      // Compression pour la photo de profil (200x200 max)
      let compressed = await compresserImage(evt.target.result, 200, 200, 0.7);
      callback(compressed);
      sauvegarder();
    } catch (err) {
      console.error('Erreur compression image:', err);
      afficherStatut("Erreur lors du traitement de l'image", "error");
    }
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

  // Utilisation de la fonction optimisée de mise à jour
  majElementDansPrevisualisation(section, el);
  sauvegarderDebounced();
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================

// Champs personnels
["inp-prenom","inp-nom","inp-naissance","inp-lieu",
 "inp-sexe","inp-nationalite","inp-email","inp-telephone"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", (e) => mettreAJourPersonnel(e.target.dataset.champ, e.target.value));
  el.addEventListener("change", (e) => mettreAJourPersonnel(e.target.dataset.champ, e.target.value));
});

// Profil
const inpProfil = document.getElementById("inp-profil");
if (inpProfil) {
  inpProfil.addEventListener("input", (e) => {
    cv.profil = e.target.value;
    const cvProfil = document.getElementById("cv-profil");
    if (cvProfil) cvProfil.textContent = e.target.value || "Votre profil apparaîtra ici...";
    sauvegarderDebounced();
  });
}

// Références
const inpReferences = document.getElementById("inp-references");
if (inpReferences) {
  inpReferences.addEventListener("input", (e) => {
    cv.references = e.target.value;
    const cvReferences = document.getElementById("cv-references");
    if (cvReferences) cvReferences.textContent = e.target.value || "Références disponibles sur demande.";
    sauvegarderDebounced();
  });
}

// Signature texte
const inpSignature = document.getElementById("inp-signature");
if (inpSignature) {
  inpSignature.addEventListener("input", (e) => {
    cv.signature = e.target.value;
    const cvSignatureTexte = document.getElementById("cv-signature-texte");
    if (cvSignatureTexte) cvSignatureTexte.textContent = e.target.value;
    sauvegarderDebounced();
  });
}

// Lieu signature
const inpSignLieu = document.getElementById("inp-sign-lieu");
if (inpSignLieu) {
  inpSignLieu.addEventListener("input", (e) => {
    cv.signLieu = e.target.value;
    const cvSignLieu = document.getElementById("cv-sign-lieu");
    if (cvSignLieu) cvSignLieu.textContent = e.target.value;
    sauvegarderDebounced();
  });
}

// Inputs dynamiques
const formulaire = document.getElementById("formulaire");
if (formulaire) {
  formulaire.addEventListener("input", (e) => {
    const el = e.target;
    const section = el.dataset.section;
    const id = el.dataset.id;
    const prop = el.dataset.prop;
    if (section && id && prop) mettreAJourElement(section, id, prop, el.value);
  });
}

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
const palette = document.getElementById("couleurs-palette");
if (palette) {
  palette.addEventListener("click", (e) => {
    const btn = e.target.closest(".couleur-btn");
    if (!btn) return;
    appliquerCouleur(btn.dataset.couleur);
    sauvegarder();
  });
}

// Toggle style niveau
const btnPoints = document.getElementById("btn-points");
const btnBarres = document.getElementById("btn-barres");
if (btnPoints) {
  btnPoints.addEventListener("click", () => {
    appliquerStyleNiveau("points");
    sauvegarder();
  });
}
if (btnBarres) {
  btnBarres.addEventListener("click", () => {
    appliquerStyleNiveau("barres");
    sauvegarder();
  });
}

// Photo profil
const photoUpload = document.getElementById("photo-upload");
const inputPhoto = document.getElementById("input-photo");
if (photoUpload && inputPhoto) {
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
}

// Signature image
const signUploadZone = document.getElementById("sign-upload-zone");
const inputSignatureImg = document.getElementById("input-signature-img");
if (signUploadZone && inputSignatureImg) {
  signUploadZone.addEventListener("click", () => {
    inputSignatureImg.click();
  });
  activerElementClavier(signUploadZone, () => inputSignatureImg.click());

  inputSignatureImg.addEventListener("change", (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    traiterFichierPhoto(fichier, (src) => {
      // Compression pour signature (100x50 max)
      compresserImage(src, 100, 50, 0.8).then(compressed => {
        cv.signatureImg = compressed;
        const prev = document.getElementById("sign-img-preview");
        if (prev) { prev.src = compressed; prev.hidden = false; }
        document.getElementById("sign-upload-label").hidden = true;
        const cvSignImg = document.getElementById("cv-signature-img");
        if (cvSignImg) { cvSignImg.src = compressed; cvSignImg.hidden = false; }
        sauvegarder();
      });
    });
  });
}

// Export PDF
const btnPdf = document.getElementById("btn-pdf");
if (btnPdf) {
  btnPdf.addEventListener("click", () => window.print());
}

// Export/Import JSON
const btnExportJson = document.getElementById("btn-export-json");
const btnImportJson = document.getElementById("btn-import-json");
const inputImportJson = document.getElementById("input-import-json");

if (btnExportJson) {
  btnExportJson.addEventListener("click", exporterCV);
}
if (btnImportJson) {
  btnImportJson.addEventListener("click", () => inputImportJson && inputImportJson.click());
}
if (inputImportJson) {
  inputImportJson.addEventListener("change", importerCV);
}

function exporterCV() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cv));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${construireCle()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    afficherStatut("CV exporté avec succès");
  } catch (err) {
    console.error(err);
    afficherStatut("Erreur lors de l'export", "error");
  }
}

function importerCV(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Vérifier l'extension
  if (!file.name.endsWith('.json')) {
    afficherStatut("Format de fichier non valide (JSON uniquement)", "error");
    return;
  }

  // Vérifier la taille
  if (file.size > 5 * 1024 * 1024) {
    afficherStatut("Fichier trop volumineux (max 5MB)", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result);

      // Validation de la structure
      const validation = validerStructureCV(json);
      if (!validation.valide) {
        afficherStatut(`Import invalide : ${validation.erreur}`, "error");
        return;
      }

      // Fusionner avec les valeurs par défaut pour éviter les champs manquants
      cv = { ...cvParDefaut(), ...json };

      // Nettoyer les anciennes clés localStorage
      if (ancienneCle) {
        localStorage.removeItem(ancienneCle);
      }

      sauvegarder();

      // Rafraîchir tout l'UI
      // Vider toutes les listes dynamiques
      ["competences","langues","interets","formations","experiences","activites"].forEach(s => {
        const liste = document.getElementById(`liste-${s}`);
        if (liste) liste.innerHTML = "";
      });

      remplirFormulaire();
      afficherPrevisualisation();
      afficherStatut("CV importé avec succès");

      // Reset input pour permettre réimport du même fichier
      event.target.value = "";
    } catch (err) {
      console.error(err);
      afficherStatut("Erreur lors de l'importation du fichier JSON", "error");
    }
  };
  reader.onerror = () => {
    afficherStatut("Erreur de lecture du fichier", "error");
  };
  reader.readAsText(file);
}

// Réinitialisation
const modalReset = document.getElementById("modal-reset");
const btnReset = document.getElementById("btn-reset");
const btnResetAnnuler = document.getElementById("btn-reset-annuler");
const btnResetConfirmer = document.getElementById("btn-reset-confirmer");

if (btnReset) {
  btnReset.addEventListener("click", () => { if (modalReset) modalReset.hidden = false; });
}
if (btnResetAnnuler) {
  btnResetAnnuler.addEventListener("click", () => { if (modalReset) modalReset.hidden = true; });
}
if (modalReset) {
  modalReset.addEventListener("click", (e) => { if (e.target === modalReset) modalReset.hidden = true; });
}
if (btnResetConfirmer) {
  btnResetConfirmer.addEventListener("click", () => {
    if (ancienneCle) {
      localStorage.removeItem(ancienneCle);
    }
    cv = cvParDefaut();
    ancienneCle = "";

    // Vider toutes les listes dynamiques
    ["competences","langues","interets","formations","experiences","activites"].forEach(s => {
      const liste = document.getElementById(`liste-${s}`);
      if (liste) liste.innerHTML = "";
    });

    // Réinitialiser photo
    const photoPlaceholder = document.getElementById("photo-placeholder");
    const photoPreview = document.getElementById("photo-preview");
    const cvPhoto = document.getElementById("cv-photo");
    const cvInitiales = document.getElementById("cv-initiales");

    if (photoPlaceholder) photoPlaceholder.hidden = false;
    if (photoPreview) photoPreview.hidden = true;
    if (cvPhoto) cvPhoto.hidden = true;
    if (cvInitiales) cvInitiales.hidden = false;

    // Réinitialiser signature image
    const signImgPreview = document.getElementById("sign-img-preview");
    const signUploadLabel = document.getElementById("sign-upload-label");
    if (signImgPreview) signImgPreview.hidden = true;
    if (signUploadLabel) signUploadLabel.hidden = false;

    remplirFormulaire();
    afficherPrevisualisation();
    if (modalReset) modalReset.hidden = true;
    afficherStatut("CV réinitialisé");
  });
}

// ============================================================
// DÉMARRAGE
// ============================================================
charger();
remplirFormulaire();
afficherPrevisualisation();

// ============================================================
// PWA - INSTALLATION (code centralisé)
// ============================================================

// Variable pour stocker l'événement beforeinstallprompt
let deferredPrompt = null;
let isInstallable = false;

/**
 * Vérifie si la PWA est installable
 */
function verifierInstallabilite() {
  // Vérifier HTTPS (sauf localhost)
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('[PWA] Le site doit être en HTTPS pour l\'installation PWA (sauf localhost)');
  }

  // Vérifier Service Worker
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker non supporté par ce navigateur');
  }

  // Vérifier Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    console.warn('[PWA] Aucun manifest.json trouvé');
  }
}

/**
 * Enregistrement du Service Worker
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

        // Vérifier les mises à jour du SW
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nouvelle version prête à être activée');
              afficherStatut('Une nouvelle version est disponible, rechargez la page');
            }
          });
        });
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
  const btnInstall = document.getElementById('btn-install-pwa');
  if (!btnInstall) return;

  // Si déjà installé, cacher le bouton
  if (estEnModeStandalone()) {
    btnInstall.style.display = 'none';
    return;
  }

  // Afficher le bouton
  btnInstall.style.display = 'block';

  // Ajouter l'écouteur une seule fois
  if (!btnInstall.dataset.pwaInit) {
    btnInstall.addEventListener('click', installerPWA);
    btnInstall.dataset.pwaInit = 'true';
  }
}

/**
 * Installation de la PWA
 */
function installerPWA() {
  // 1. Si deferredPrompt est présent, on déclenche l'installation native
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        afficherStatut('Application installée avec succès !');
      }
      deferredPrompt = null;
    });
    return;
  }

  // 2. Si on est sur iOS Safari, afficher le guide
  if (isIOSSafari()) {
    afficherGuideIOS();
    return;
  }

  // 3. Pour les autres navigateurs, afficher les instructions
  alert("Pour installer l'application :\n\n• Sur Chrome/Edge : Cliquez sur les trois points (⋮) en haut à droite, puis 'Installer l'application'\n• Sur Firefox : Menu > 'Application' > 'Installer'\n• Sur Safari : Cliquez sur le bouton Partager, puis 'Sur l'écran d'accueil'");
}

/**
 * Écouteur pour beforeinstallprompt
 */
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt déclenché');
  e.preventDefault();
  deferredPrompt = e;
  isInstallable = true;

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
  isInstallable = false;
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
 * ===================================================================
 * SUPPORT iOS - Guide d'installation manuel
 * ===================================================================
 */

/**
 * Détecte si l'utilisateur est sur iOS
 */
function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

/**
 * Détecte si le navigateur est Safari sur iOS
 */
function isIOSSafari() {
  return isIOS() && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}

/**
 * Affiche un guide d'installation pour iOS
 */
function afficherGuideIOS() {
  // Ne pas afficher si déjà installé
  if (estEnModeStandalone()) return;

  // Vérifier si le modal existe déjà
  if (document.getElementById('modal-install-ios')) return;

  console.log('[PWA] iOS détecté - affichage du guide d\'installation');

  // Créer le modal de guide
  const modalHTML = `
    <div class="modal-overlay" id="modal-install-ios" role="dialog" aria-label="Guide d'installation">
      <div class="modal">
        <h3>📲 Installer l'application</h3>
        <p>Pour installer cette application sur votre écran d'accueil :</p>
        <ol style="text-align: left; line-height: 1.8;">
          <li>Appuyez sur le bouton <strong>Partager</strong> <span style="font-size:1.2em">📤</span></li>
          <li>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
          <li>Appuyez sur <strong>Ajouter</strong> en haut à droite</li>
        </ol>
        <div class="modal-actions">
          <button class="btn btn-primaire" id="btn-fermer-guide-ios">Compris</button>
        </div>
      </div>
    </div>
  `;

  // Ajouter le modal au body
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = modalHTML;
  document.body.appendChild(tempDiv.firstElementChild);

  // Gérer la fermeture
  const modal = document.getElementById('modal-install-ios');
  const btnFermer = document.getElementById('btn-fermer-guide-ios');

  if (btnFermer) {
    btnFermer.addEventListener('click', () => {
      if (modal) {
        modal.hidden = true;
        setTimeout(() => modal.remove(), 300);
      }
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
        setTimeout(() => modal.remove(), 300);
      }
    });
  }
}

// Initialisation PWA au chargement
document.addEventListener('DOMContentLoaded', () => {
  creerBoutonInstallation();
  verifierInstallabilite();
});

// Créer le bouton immédiatement si le DOM est déjà chargé
if (document.readyState !== 'loading') {
  creerBoutonInstallation();
}

// Afficher le guide iOS après un délai pour les utilisateurs iOS Safari
if (isIOSSafari()) {
  setTimeout(() => {
    // Seulement si l'utilisateur n'a pas encore interagi avec le bouton
    if (!deferredPrompt && !estEnModeStandalone()) {
      afficherGuideIOS();
    }
  }, 5000);
}