const STORAGE_KEY = "petPlannerPetsV1";
const ACTIVE_KEY = "petPlannerActivePetV1";

const speciesEmoji = {
  Turtle: "🐢",
  Fish: "🐠",
  Dog: "🐶",
  Cat: "🐱",
  Bird: "🦜",
  Snake: "🐍",
  Lizard: "🦎",
  Rabbit: "🐇",
  "Small animal": "🐹",
  Horse: "🐴",
  Other: "🐾"
};

const builderNames = {
  Turtle: "Tank Builder",
  Fish: "Aquarium Builder",
  Snake: "Vivarium Builder",
  Lizard: "Vivarium Builder",
  Bird: "Aviary Builder",
  Rabbit: "Enclosure Builder",
  "Small animal": "Enclosure Builder",
  Dog: "Space Planner",
  Cat: "Space Planner",
  Horse: "Stable Planner",
  Other: "Habitat Builder"
};

const petList = document.querySelector("#petList");
const emptyState = document.querySelector("#emptyState");
const dashboard = document.querySelector("#dashboard");
const petDialog = document.querySelector("#petDialog");
const petForm = document.querySelector("#petForm");
const featureMessage = document.querySelector("#featureMessage");

function getPets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function savePets(pets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY);
}

function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

function calculateAge(birthday) {
  if (!birthday) return "";
  const birth = new Date(`${birthday}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) return `${years} year${years === 1 ? "" : "s"} old`;
  return `${Math.max(months, 0)} month${months === 1 ? "" : "s"} old`;
}

function render() {
  const pets = getPets();

  if (!pets.length) {
    petList.innerHTML = "";
    emptyState.hidden = false;
    dashboard.hidden = true;
    return;
  }

  emptyState.hidden = true;
  dashboard.hidden = false;

  let activeId = getActiveId();
  let activePet = pets.find(pet => pet.id === activeId);

  if (!activePet) {
    activePet = pets[0];
    setActiveId(activePet.id);
  }

  petList.innerHTML = pets.map(pet => `
    <button class="pet-chip ${pet.id === activePet.id ? "active" : ""}" data-id="${pet.id}">
      <span class="emoji">${speciesEmoji[pet.species] ?? "🐾"}</span>
      <strong>${escapeHtml(pet.name)}</strong>
      <small>${escapeHtml(pet.species)}</small>
    </button>
  `).join("");

  petList.querySelectorAll(".pet-chip").forEach(button => {
    button.addEventListener("click", () => {
      setActiveId(button.dataset.id);
      featureMessage.textContent = "";
      render();
    });
  });

  document.querySelector("#petAvatar").textContent = speciesEmoji[activePet.species] ?? "🐾";
  document.querySelector("#petSpecies").textContent = activePet.species.toUpperCase();
  document.querySelector("#petName").textContent = activePet.name;

  const metaParts = [activePet.breed, calculateAge(activePet.birthday)].filter(Boolean);
  document.querySelector("#petMeta").textContent = metaParts.length ? metaParts.join(" • ") : "Profile ready";
  document.querySelector("#petSex").textContent = activePet.sex || "Unknown";
  document.querySelector("#petWeight").textContent = activePet.weight || "Not added";
  document.querySelector("#builderLabel").textContent = builderNames[activePet.species] ?? "Habitat Builder";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openDialog() {
  petForm.reset();
  petDialog.showModal();
}

document.querySelector("#openAddPet").addEventListener("click", openDialog);
document.querySelector("#emptyAddPet").addEventListener("click", openDialog);
document.querySelector("#closeDialog").addEventListener("click", () => petDialog.close());

petForm.addEventListener("submit", event => {
  event.preventDefault();

  const pet = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: document.querySelector("#nameInput").value.trim(),
    species: document.querySelector("#speciesInput").value,
    breed: document.querySelector("#breedInput").value.trim(),
    birthday: document.querySelector("#birthdayInput").value,
    sex: document.querySelector("#sexInput").value,
    weight: document.querySelector("#weightInput").value.trim()
  };

  if (!pet.name || !pet.species) return;

  const pets = getPets();
  pets.push(pet);
  savePets(pets);
  setActiveId(pet.id);
  petDialog.close();
  render();
});

document.querySelector("#deletePet").addEventListener("click", () => {
  const activeId = getActiveId();
  const pets = getPets();
  const activePet = pets.find(pet => pet.id === activeId);
  if (!activePet) return;

  const confirmed = confirm(`Delete ${activePet.name}'s profile?`);
  if (!confirmed) return;

  const remaining = pets.filter(pet => pet.id !== activeId);
  savePets(remaining);
  if (remaining.length) setActiveId(remaining[0].id);
  else localStorage.removeItem(ACTIVE_KEY);
  render();
});

document.querySelectorAll(".feature-card").forEach(button => {
  button.addEventListener("click", () => {
    const label = button.querySelector("span").textContent;
    featureMessage.textContent = `${label} is the next part we can build 👀`;
  });
});

render();
