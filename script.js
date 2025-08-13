"use strict";

const API_KEY = "1906479";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("results");
const searchSection = document.getElementById("searchSection");
const watchlistSection = document.getElementById("watchlistSection");
const movieDetailSection = document.getElementById("movieDetailSection");
const movieDetailContainer = document.getElementById("movieDetailContainer");

const backFromDetailBtn = document.getElementById("backFromDetailBtn");
const backToSearchBtn = document.getElementById("backToSearchBtn");
const watchlistToggleBtn = document.getElementById("watchlistToggleBtn");
const homeTitle = document.getElementById("homeTitle");
const watchlistContainer = document.getElementById("watchlistContainer");

// ... after watchlistContainer
const favoritesToggleBtn = document.getElementById("favoritesToggleBtn"); // ADD THIS
const favoritesSection = document.getElementById("favoritesSection"); // ADD THIS
const favoritesContainer = document.getElementById("favoritesContainer"); // ADD THIS
const backToSearchFromFavBtn = document.getElementById(
  "backToSearchFromFavBtn"
);

const memeSection = document.getElementById("memeSection");

const sortContainer = document.getElementById("sortContainer");
const sortSelect = document.getElementById("sortSelect");

// Store last search results to refresh UI properly
let lastSearchResults = [];
let lastSearchQuery = "";

// Utility: show one view and hide others
const showView = (view) => {
  // Hide all sections first
  searchSection.style.display = "none";
  watchlistSection.style.display = "none";
  movieDetailSection.style.display = "none";
  favoritesSection.style.display = "none";
  memeSection.style.display = "none"; // hide meme by default

  // Show the correct section with the correct display type
  view === "search"
    ? ((searchSection.style.display = "flex"),
      (memeSection.style.display = "block")) // original was flex
    : view === "watchlist"
    ? (watchlistSection.style.display = "block")
    : view === "detail"
    ? (movieDetailSection.style.display = "block")
    : view === "favorites"
    ? (favoritesSection.style.display = "block")
    : null;
};

// Sort function
const sortMovies = (movies, sortBy) => {
  if (sortBy === "none") return movies;

  return movies
    .slice() // copy to avoid mutating original
    .sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.Title.localeCompare(b.Title);
        case "title-desc":
          return b.Title.localeCompare(a.Title);
        case "year-asc":
          return a.Year.localeCompare(b.Year);
        case "year-desc":
          return b.Year.localeCompare(a.Year);
        default:
          return 0;
      }
    });
};

// Display search results
const displayResults = (movies) => {
  memeSection.style.display = "none";
  resultsContainer.innerHTML = "";
  const watchlist = getWatchlist();
  const favorites = getFavorites();

  movies.forEach((movie) => {
    const isInWatchlist = watchlist.some(
      (item) => item.imdbID === movie.imdbID
    );
    const isInFavorites = favorites.some(
      (item) => item.imdbID === movie.imdbID
    );
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.style.cursor = "pointer";

    const poster =
      movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/100x140?text=No+Image";
    const btnLabel = isInWatchlist
      ? "✓ Added in Watchlist"
      : "➕ Add to Watchlist";
    const favBtnLabel = isInFavorites
      ? "♥ Added to Favorites"
      : "♡ Add to Favorites"; // LABEL FOR NEW BUTTON

    card.innerHTML = `
      <div class="movie-info" style="display: flex; align-items: center; gap: 10px;">
        <img src="${poster}" alt="${movie.Title}" />
        <div>
          <strong>${movie.Title}</strong> (${movie.Year})
        </div>
      </div>
      <div class="button-group" style="display: flex; flex-direction: column; gap: 5px;">
      <button class="watchlistToggleBtn">${btnLabel}</button>
      <button class="favoritesToggleBtn">${favBtnLabel}</button> 
      </div>
    `;

    // Toggle watchlist on button click
    const toggleBtn = card.querySelector(".watchlistToggleBtn");
    toggleBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleList(movie, toggleBtn, "watchlist");
    });

    // ADD THIS: Toggle favorites on button click
    const favoritesBtn = card.querySelector(".favoritesToggleBtn");
    favoritesBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleList(movie, favoritesBtn, "favorites");
    });

    // Show details on movie info click
    card.querySelector(".movie-info").addEventListener("click", () => {
      showMovieDetails(movie.imdbID);
    });

    resultsContainer.appendChild(card);
  });
};

// Search movies
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
        query
      )}`
    );
    const data = await res.json();

    if (data.Response === "True") {
      lastSearchResults = data.Search;
      lastSearchQuery = query;
      sortContainer.style.display = "block"; // Show sorting options on success
      const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
      displayResults(sortedMovies);
    } else {
      sortContainer.style.display = "none"; // Hide sorting if no results
      resultsContainer.innerHTML = `<p>No results found for "${query}".</p>`;
      lastSearchResults = [];
      lastSearchQuery = "";
    }
  } catch {
    sortContainer.style.display = "none"; // Hide sorting on error
    resultsContainer.innerHTML = `<p>Error fetching data.</p>`;
    lastSearchResults = [];
    lastSearchQuery = "";
  }
});

// Enter key triggers search
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchBtn.click();
  }
});

// Update display when sort option changes
sortSelect.addEventListener("change", () => {
  if (lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  }
});

// Show/hide watchlist
watchlistToggleBtn.addEventListener("click", () => {
  showView("watchlist");
  displayWatchlist();
});

// Show/hide favorites
favoritesToggleBtn.addEventListener("click", () => {
  showView("favorites");
  displayFavorites(); // We will create this function next
});

// Back buttons refresh results
backToSearchBtn.addEventListener("click", () => {
  showView("search");
  if (lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  } else {
    resultsContainer.innerHTML = "";
    sortContainer.style.display = "none"; // Hide sorting when no results
  }
});

// Back from favorites
backToSearchFromFavBtn.addEventListener("click", () => {
  showView("search");
  if (lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  } else {
    resultsContainer.innerHTML = "";
    sortContainer.style.display = "none";
  }
});

backFromDetailBtn.addEventListener("click", () => {
  showView("search");
  if (lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  } else {
    resultsContainer.innerHTML = "";
    sortContainer.style.display = "none"; // Hide sorting when no results
  }
});

homeTitle.addEventListener("click", (e) => {
  e.preventDefault();

  showView("search");
  resultsContainer.innerHTML = "";
  searchInput.value = "";
  lastSearchResults = [];
  lastSearchQuery = "";
  sortContainer.style.display = "none"; // Hide sorting when clearing search
  memeSection.style.display = "block";
});

// Replace your old toggleWatchlist function with this new, more flexible one
const toggleList = (movie, btn, listType) => {
  const isWatchlist = listType === "watchlist";
  const getList = isWatchlist ? getWatchlist : getFavorites;
  const saveList = isWatchlist ? saveWatchlist : saveFavorites;
  const addLabel = isWatchlist ? "➕ Add to Watchlist" : "♡ Add to Favorites";
  const removeLabel = isWatchlist
    ? "✓ Added to Watchlist"
    : "♥ Added to Favorites";

  const list = getList();
  const index = list.findIndex((item) => item.imdbID === movie.imdbID);

  if (index > -1) {
    list.splice(index, 1);
    btn.textContent = addLabel;
  } else {
    list.push(movie);
    btn.textContent = removeLabel;
  }

  saveList(list);
};

// Show detailed movie info
const showMovieDetails = async (imdbID) => {
  memeSection.style.display = "none";
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}&plot=full`
    );
    const data = await res.json();

    if (data.Response === "False") {
      movieDetailContainer.innerHTML = "<p>Details not found.</p>";
      return;
    }

    movieDetailContainer.innerHTML = `
  <img src="${
    data.Poster !== "N/A" ? data.Poster : "https://via.placeholder.com/150"
  }" alt="${data.Title}" />
  
  <div class="movie-detail-info">
    <div class="movie-detail-buttons">
      <button id="detailWatchlistBtn"></button>
      <button id="detailFavoritestBtn"></button>
    </div>
    <h2>${data.Title} (${data.Year})</h2>
    <p><strong>Genre:</strong> ${data.Genre}</p>
    <p><strong>Director:</strong> ${data.Director}</p>
    <p><strong>Runtime:</strong> ${data.Runtime}</p>
    <p><strong>IMDb Rating:</strong> ${data.imdbRating}</p>
    <p><strong>Plot:</strong> ${data.Plot}</p>
  </div>
`;

    let inWatchlist = getWatchlist().some((movie) => movie.imdbID === imdbID);
    let inFavorites = getFavorites().some((movie) => movie.imdbID === imdbID);

    const detailBtn = document.getElementById("detailWatchlistBtn");
    detailBtn.textContent = inWatchlist
      ? "✓ Added in Watchlist"
      : "➕ Add to Watchlist";

    const detailFvBtn = document.getElementById("detailFavoritestBtn");
    detailFvBtn.textContent = inFavorites
      ? "♥ Added to Favorites"
      : "♡ Add to Favorites";

    detailBtn.addEventListener("click", () => {
      let watchlist = getWatchlist();

      if (inWatchlist) {
        watchlist = watchlist.filter((movie) => movie.imdbID !== imdbID);
        detailBtn.textContent = "➕ Add to Watchlist";
      } else {
        watchlist.push(data);
        detailBtn.textContent = "✓ Added in Watchlist";
      }

      saveWatchlist(watchlist);
      inWatchlist = !inWatchlist;
    });

    detailFvBtn.addEventListener("click", () => {
      let favorites = getFavorites();

      if (inFavorites) {
        favorites = favorites.filter((movie) => movie.imdbID !== imdbID);
        detailFvBtn.textContent = "♡ Add to Favorites";
      } else {
        favorites.push(data);
        detailFvBtn.textContent = "♥ Added to Favorites";
      }

      saveFavorites(favorites);
      inFavorites = !inFavorites;
    });

    showView("detail");
    memeSection.style.display = "none";
  } catch {
    movieDetailContainer.innerHTML = "<p>Error loading details.</p>";
  }
};

// Display watchlist movies
const displayWatchlist = () => {
  memeSection.style.display = "none";
  const watchlist = getWatchlist();
  watchlistContainer.innerHTML = "";

  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = "<p>Your watchlist is empty.</p>";
    return;
  }

  watchlist.forEach((movie) => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.style.cursor = "pointer";

    const poster =
      movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/100x140?text=No+Image";

    card.innerHTML = `
      <div class="movie-info" style="display: flex; align-items: center; gap: 10px;">
        <img src="${poster}" alt="${movie.Title}" />
        <div>
          <strong>${movie.Title}</strong> (${movie.Year})
        </div>
      </div>
      <button class="removeBtn">🗑 Remove</button>
    `;

    const removeBtn = card.querySelector(".removeBtn");
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      removeFromWatchlist(movie.imdbID);
    });

    card.querySelector(".movie-info").addEventListener("click", () => {
      showMovieDetails(movie.imdbID);
    });

    watchlistContainer.appendChild(card);
  });
};

// Create a copy of displayWatchlist and adapt it for favorites
const displayFavorites = () => {
  memeSection.style.display = "none";
  const favorites = getFavorites();
  favoritesContainer.innerHTML = "";

  if (favorites.length === 0) {
    favoritesContainer.innerHTML = "<p>Your favorites list is empty.</p>";
    return;
  }

  favorites.forEach((movie) => {
    const card = document.createElement("div");
    card.classList.add("movie-card");
    // ... (rest of the card creation is the same as displayWatchlist)
    card.innerHTML = `
      <div class="movie-info" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <img src="${
          movie.Poster !== "N/A"
            ? movie.Poster
            : "https://via.placeholder.com/100x140?text=No+Image"
        }" alt="${movie.Title}" />
        <div>
          <strong>${movie.Title}</strong> (${movie.Year})
        </div>
      </div>
      <button class="removeFavBtn">🗑 Remove</button>
    `;

    // Event listener to remove from favorites
    card.querySelector(".removeFavBtn").addEventListener("click", (event) => {
      event.stopPropagation();
      removeFromFavorites(movie.imdbID);
    });

    // Event listener to show details
    card.querySelector(".movie-info").addEventListener("click", () => {
      showMovieDetails(movie.imdbID);
    });

    favoritesContainer.appendChild(card);
  });
};

// Remove movie from watchlist and refresh UI
const removeFromWatchlist = (imdbID) => {
  let watchlist = getWatchlist();
  watchlist = watchlist.filter((movie) => movie.imdbID !== imdbID);
  saveWatchlist(watchlist);
  displayWatchlist();

  if (searchSection.style.display === "block" && lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  }
};

// Create a copy of removeFromWatchlist for favorites
const removeFromFavorites = (imdbID) => {
  let favorites = getFavorites();
  favorites = favorites.filter((movie) => movie.imdbID !== imdbID);
  saveFavorites(favorites);
  displayFavorites(); // Refresh the favorites list

  // Also refresh the main search results view if it's visible
  if (searchSection.style.display === "block" && lastSearchResults.length > 0) {
    const sortedMovies = sortMovies(lastSearchResults, sortSelect.value);
    displayResults(sortedMovies);
  }
};

// LocalStorage helpers
const getWatchlist = () =>
  JSON.parse(localStorage.getItem("watchlist") || "[]");
const saveWatchlist = (watchlist) =>
  localStorage.setItem("watchlist", JSON.stringify(watchlist));

// ADD THESE NEW FUNCTIONS for Favorites
const getFavorites = () =>
  JSON.parse(localStorage.getItem("favoriteslist") || "[]");
const saveFavorites = (favorites) =>
  localStorage.setItem("favoriteslist", JSON.stringify(favorites));
