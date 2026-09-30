const API = "https://www.themealdb.com/api/json/v1/1";

const mealsBox = document.getElementById("meals");
const categoriesBox = document.getElementById("categories");
const menuCategories = document.getElementById("menuCategories");
const detailsSection = document.getElementById("detailsSection");
const mealDetails = document.getElementById("mealDetails");
const breadcrumb = document.getElementById("breadcrumb");
const mealsSection = document.getElementById("mealsSection");

async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load data");
  return response.json();
}

function showMessage(box, message) {
  box.innerHTML = `<p class="status-message">${message}</p>`;
}

function makeMealCard(meal) {
  const card = document.createElement("article");
  card.className = "meal-card";
  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
    <h3>${meal.strMeal}</h3>
  `;
  card.addEventListener("click", () => loadMeal(meal.idMeal));
  return card;
}

function renderMeals(list, target = mealsBox) {
  target.innerHTML = "";
  if (!list || list.length === 0) {
    showMessage(target, "No meals found");
    return;
  }
  list.forEach(meal => target.appendChild(makeMealCard(meal)));
}

async function loadCategories() {
  try {
    const data = await getJSON(`${API}/categories.php`);
    categoriesBox.innerHTML = "";
    menuCategories.innerHTML = "";

    data.categories.forEach(category => {
      const card = document.createElement("article");
      card.className = "category-card";
      card.innerHTML = `<img src="${category.strCategoryThumb}" alt="${category.strCategory}" loading="lazy"><span>${category.strCategory}</span>`;
      card.addEventListener("click", () => openCategory(category.strCategory));
      categoriesBox.appendChild(card);

      const item = document.createElement("button");
      item.className = "menu-item";
      item.textContent = category.strCategory;
      item.addEventListener("click", () => openCategory(category.strCategory));
      menuCategories.appendChild(item);
    });
  } catch (error) {
    showMessage(categoriesBox, "Categories could not be loaded.");
  }
}

function openCategory(category) {
  window.open(`${window.location.pathname}?category=${encodeURIComponent(category)}`, "_blank");
  document.getElementById("sidePanel").classList.remove("open");
}

async function searchMeals(name) {
  mealsSection.style.display = "block";
  detailsSection.style.display = "none";
  mealsBox.innerHTML = `<p class="status-message">Loading meals...</p>`;
  try {
    const data = await getJSON(`${API}/search.php?s=${encodeURIComponent(name)}`);
    renderMeals(data.meals);
  } catch (error) {
    showMessage(mealsBox, "Something went wrong. Please try again.");
  }
}

async function loadMeal(id) {
  try {
    const data = await getJSON(`${API}/lookup.php?i=${id}`);
    const meal = data.meals && data.meals[0];
    if (!meal) return;

    mealsSection.style.display = "none";
    detailsSection.style.display = "block";
    breadcrumb.innerHTML = `
      <button id="homeCrumb"><i class="fa-solid fa-house"></i> HOME</button>
      <i class="fa-solid fa-angle-right"></i>
      <span>${meal.strMeal}</span>`;

    document.getElementById("homeCrumb").addEventListener("click", () => {
      detailsSection.style.display = "none";
      mealsSection.style.display = "block";
      breadcrumb.innerHTML = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const ingredients = [];
    const measures = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(`${ingredient} ${measure || ""}`.trim());
        measures.push(measure && measure.trim() ? measure.trim() : "As required");
      }
    }

    const steps = (meal.strInstructions || "").split(/\r?\n/).filter(step => step.trim());

    mealDetails.innerHTML = `
      <div class="meal-info">
        <img class="detail-image" src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-summary">
          <h2>${meal.strMeal}</h2>
          <p><strong>CATEGORY:</strong> ${meal.strCategory || "Not available"}</p>
          <p><strong>AREA:</strong> ${meal.strArea || "Not available"}</p>
          <p><strong>SOURCE:</strong> ${meal.strSource || "Not available"}</p>
          <p><strong>TAGS:</strong> ${meal.strTags || "No tags"}</p>
          <div class="ingredients-box">
            <h3>Ingredients</h3>
            <div class="ingredient-list">${ingredients.map(item => `<span>${item}</span>`).join("")}</div>
          </div>
        </div>
      </div>
      <h3 class="detail-title">Measure:</h3>
      <div class="measure-box">${measures.map(item => `<p><i class="fa-solid fa-spoon"></i>${item}</p>`).join("")}</div>
      <h3 class="detail-title">Instructions:</h3>
      <div class="instructions-box">${steps.map(step => `<p><i class="fa-regular fa-square-check"></i>${step.trim()}</p>`).join("")}</div>`;

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showMessage(mealDetails, "Meal details could not be loaded.");
  }
}

document.getElementById("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("searchInput").value.trim();
  if (!name) {
    alert("Please enter a meal name");
    return;
  }
  searchMeals(name);
});

document.getElementById("openMenu").addEventListener("click", () => {
  document.getElementById("sidePanel").classList.add("open");
});
document.getElementById("closeMenu").addEventListener("click", () => {
  document.getElementById("sidePanel").classList.remove("open");
});

loadCategories();


// Category pages use the same index.html in a new tab.
async function loadCategoryPage(category) {
  const data = await getJSON(`${API}/filter.php?c=${encodeURIComponent(category)}`);
  mealsSection.style.display = "block";
  detailsSection.style.display = "none";
  renderMeals(data.meals);
  const heading = mealsSection.querySelector(".section-heading h2");
  if (heading) heading.textContent = `${category.toUpperCase()} MEALS`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function checkCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  if (category) loadCategoryPage(category).catch(() => showMessage(mealsBox, "Unable to load meals."));
}

checkCategoryPage();
