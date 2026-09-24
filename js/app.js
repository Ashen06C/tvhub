/**
 * TVHUB MOVIE LIBRARY - JAVASCRIPT APPLICATION
 * Handles:
 * - Header navigation, mobile drawer & keyboard accessibility
 * - Hero slideshow with auto-play & navigation controls
 * - TVMaze API search & live autocomplete
 * - Favorites grid management (add, remove, persist, filter)
 * - Movie details modal with TVMaze cast & show info
 * - Frontend form validation & backend AJAX submission
 * - RTL (Right-to-Left) toggle
 * - Toast notifications & WCAG AA standards
 */

(function () {
  'use strict';

  // Initial State & Default Movie Data

  const DEFAULT_MOVIES = [
    {
      id: 'static-batman',
      tvmazeId: 442,
      title: 'Batman Returns',
      image: 'assets/images/batman-returns.jpg',
      rating: 7.1,
      year: '1992',
      genres: ['Action', 'Fantasy'],
      description: 'When the Penguin and Catwoman team up to terrorize Gotham City, Batman must face two cunning adversaries at once to restore peace and justice to the troubled metropolis.',
      status: 'Ended',
      language: 'English',
      runtime: 126
    },
    {
      id: 'static-wild-west',
      tvmazeId: 2130,
      title: 'Wild Wild West',
      image: 'assets/images/wild-wild-west.jpg',
      rating: 5.0,
      year: '1999',
      genres: ['Action', 'Western', 'Sci-Fi'],
      description: 'Two top secret-service agents in the post-Civil War American West are assigned to stop an evil inventor from seizing control of the United States with a giant steam-powered tarantula.',
      status: 'Ended',
      language: 'English',
      runtime: 106
    },
    {
      id: 'static-spiderman',
      tvmazeId: 4490,
      title: 'The Amazing Spiderman',
      image: 'assets/images/spiderman.jpg',
      rating: 7.0,
      year: '2012',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      description: 'Peter Parker gains superhuman abilities after being bitten by a genetically altered spider, taking on the mantle of the hero known as Spider-Man while uncovering secrets of his past.',
      status: 'Ended',
      language: 'English',
      runtime: 136
    }
  ];

  // Application State
  const state = {
    movies: [],
    activeFilter: 'all',
    slideshowIndex: 0,
    slideshowTimer: null,
    slideshowPlaying: true,
    isRTL: false,
    searchDebounceTimer: null
  };

  // Cache DOM Elements
  const DOM = {
    header: document.getElementById('site-header'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    mobileDrawer: document.getElementById('mobile-drawer'),
    mobileDrawerBackdrop: document.getElementById('mobile-drawer-backdrop'),
    rtlToggleBtns: document.querySelectorAll('.rtl-toggle-btn'),
    heroSlideshow: document.getElementById('hero-slideshow'),
    heroSlides: document.querySelectorAll('.hero-slide'),
    heroDotsContainer: document.getElementById('hero-dots-container'),
    heroPrevBtn: document.getElementById('hero-prev-btn'),
    heroNextBtn: document.getElementById('hero-next-btn'),
    heroPauseBtn: document.getElementById('hero-pause-btn'),
    movieGrid: document.getElementById('movie-grid'),
    filterChips: document.querySelectorAll('.filter-chip'),
    searchInput: document.getElementById('movie-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    searchSpinner: document.getElementById('search-spinner'),
    searchDropdown: document.getElementById('search-dropdown'),
    searchResultsList: document.getElementById('search-results-list'),
    favBadgeCounts: document.querySelectorAll('.fav-badge-count'),
    contactForm: document.getElementById('contact-form'),
    formAlertSuccess: document.getElementById('form-alert-success'),
    formAlertError: document.getElementById('form-alert-error'),
    formSubmitBtn: document.getElementById('btn-submit-form'),
    movieModal: document.getElementById('movie-modal'),
    movieModalBody: document.getElementById('movie-modal-body'),
    movieModalCloseBtn: document.getElementById('movie-modal-close'),
    toastContainer: document.getElementById('toast-container'),
    backToTopBtn: document.getElementById('back-to-top-btn')
  };


  // Initialization

  function init() {
    loadSavedRTL();
    loadSavedMovies();
    setupNavigation();
    setupHeroSlideshow();
    setupSearch();
    setupFilterChips();
    setupContactForm();
    setupModals();
    setupBackToTop();
  }


  // Right-to-Left (RTL) Support

  function loadSavedRTL() {
    const saved = localStorage.getItem('tvhub_direction');
    if (saved === 'rtl') {
      enableRTL(true);
    }
  }

  function enableRTL(isRtl) {
    state.isRTL = isRtl;
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en');
    localStorage.setItem('tvhub_direction', isRtl ? 'rtl' : 'ltr');

    DOM.rtlToggleBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', isRtl ? 'true' : 'false');
      btn.innerHTML = isRtl ? '<span>LTR</span>' : '<span>RTL</span>';
    });

    showToast(isRtl ? 'Switched to Right-to-Left (RTL) mode' : 'Switched to Left-to-Right (LTR) mode');
  }

  DOM.rtlToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      enableRTL(!state.isRTL);
    });
  });


  // Header & Mobile Navigation Drawer

  function setupNavigation() {
    // Header shadow on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        DOM.header.classList.add('scrolled');
      } else {
        DOM.header.classList.remove('scrolled');
      }
    }, { passive: true });

    // Open/Close Mobile Drawer
    function toggleDrawer(open) {
      const isOpen = open !== undefined ? open : !DOM.mobileDrawer.classList.contains('active');
      DOM.mobileDrawer.classList.toggle('active', isOpen);
      DOM.mobileDrawerBackdrop.classList.toggle('active', isOpen);
      DOM.hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        // Focus first link in drawer for keyboard accessibility
        const firstLink = DOM.mobileDrawer.querySelector('a, button');
        if (firstLink) firstLink.focus();
      } else {
        DOM.hamburgerBtn.focus();
      }
    }

    if (DOM.hamburgerBtn) {
      DOM.hamburgerBtn.addEventListener('click', () => toggleDrawer());
    }

    if (DOM.mobileDrawerBackdrop) {
      DOM.mobileDrawerBackdrop.addEventListener('click', () => toggleDrawer(false));
    }

    // Close on navigation link click
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => toggleDrawer(false));
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.mobileDrawer.classList.contains('active')) {
        toggleDrawer(false);
      }
    });

    // Smooth scroll for internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetElem = document.querySelector(targetId);
          if (targetElem) {
            e.preventDefault();
            const headerOffset = 76;
            const elementPosition = targetElem.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
            // Update active states
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
          }
        }
      });
    });
  }


  // Hero Slideshow

  function setupHeroSlideshow() {
    const totalSlides = DOM.heroSlides.length;
    if (totalSlides === 0) return;

    // Create pagination dots dynamically
    if (DOM.heroDotsContainer) {
      DOM.heroDotsContainer.innerHTML = '';
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        DOM.heroDotsContainer.appendChild(dot);
      }
    }

    function showSlide(index) {
      state.slideshowIndex = (index + totalSlides) % totalSlides;
      DOM.heroSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === state.slideshowIndex);
      });

      const dots = DOM.heroDotsContainer.querySelectorAll('.hero-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === state.slideshowIndex);
      });
    }

    function goToSlide(index) {
      showSlide(index);
      resetSlideshowTimer();
    }

    function nextSlide() {
      goToSlide(state.slideshowIndex + 1);
    }

    function prevSlide() {
      goToSlide(state.slideshowIndex - 1);
    }

    function startSlideshow() {
      stopSlideshow();
      state.slideshowTimer = setInterval(nextSlide, 5500);
      state.slideshowPlaying = true;
      if (DOM.heroPauseBtn) {
        DOM.heroPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        `;
        DOM.heroPauseBtn.setAttribute('aria-label', 'Pause slideshow');
      }
    }

    function stopSlideshow() {
      if (state.slideshowTimer) {
        clearInterval(state.slideshowTimer);
        state.slideshowTimer = null;
      }
      state.slideshowPlaying = false;
      if (DOM.heroPauseBtn) {
        DOM.heroPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
        DOM.heroPauseBtn.setAttribute('aria-label', 'Play slideshow');
      }
    }

    function resetSlideshowTimer() {
      if (state.slideshowPlaying) {
        startSlideshow();
      }
    }

    if (DOM.heroNextBtn) DOM.heroNextBtn.addEventListener('click', nextSlide);
    if (DOM.heroPrevBtn) DOM.heroPrevBtn.addEventListener('click', prevSlide);
    if (DOM.heroPauseBtn) {
      DOM.heroPauseBtn.addEventListener('click', () => {
        if (state.slideshowPlaying) {
          stopSlideshow();
        } else {
          startSlideshow();
        }
      });
    }

    // Auto-start slideshow
    startSlideshow();
  }



  // Favorites Grid Management (Add, Remove, Filter, Persist)

  function loadSavedMovies() {
    try {
      const saved = localStorage.getItem('tvhub_favorite_movies');
      if (saved) {
        state.movies = JSON.parse(saved);
      } else {
        state.movies = [...DEFAULT_MOVIES];
      }
    } catch (e) {
      state.movies = [...DEFAULT_MOVIES];
    }
    renderMovieGrid();
  }

  function saveMovies() {
    try {
      localStorage.setItem('tvhub_favorite_movies', JSON.stringify(state.movies));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
    updateBadgeCounts();
  }

  function updateBadgeCounts() {
    DOM.favBadgeCounts.forEach(el => {
      el.textContent = state.movies.length;
    });
  }

  function renderMovieGrid() {
    if (!DOM.movieGrid) return;

    updateBadgeCounts();

    const filtered = state.movies.filter(movie => {
      if (state.activeFilter === 'all') return true;
      if (!movie.genres || !Array.isArray(movie.genres)) return false;
      return movie.genres.some(g => g.toLowerCase() === state.activeFilter.toLowerCase());
    });

    if (filtered.length === 0) {
      DOM.movieGrid.innerHTML = `
        <div class="grid-empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          <h3 class="empty-title">${state.movies.length === 0 ? 'Your Favorites Grid is Empty' : 'No movies found in this genre'}</h3>
          <p class="empty-desc">${state.movies.length === 0 ? 'Search for movies above to add them to your collection, or restore the default titles.' : 'Try selecting another genre chip or search for new titles.'}</p>
          ${state.movies.length === 0 ? '<button class="btn-restore" id="btn-restore-defaults">Restore Default Titles</button>' : ''}
        </div>
      `;

      const restoreBtn = document.getElementById('btn-restore-defaults');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreDefaultMovies);
      }
      return;
    }

    DOM.movieGrid.innerHTML = filtered.map(movie => createMovieCardHTML(movie)).join('');

    // Attach card event listeners
    DOM.movieGrid.querySelectorAll('.btn-remove-grid').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        removeMovieFromGrid(id);
      });
    });

    DOM.movieGrid.querySelectorAll('.btn-card-details, .movie-poster-wrapper, .movie-title').forEach(elem => {
      elem.addEventListener('click', (e) => {
        const card = elem.closest('.movie-card');
        if (card) {
          const id = card.getAttribute('data-id');
          openMovieDetailsModal(id);
        }
      });
    });
  }

  function createMovieCardHTML(movie) {
    const ratingDisplay = movie.rating ? `⭐ ${movie.rating}` : 'NR';
    const yearDisplay = movie.year || (movie.premiered ? movie.premiered.substring(0, 4) : '');
    const genresList = (movie.genres || []).slice(0, 2).join(' • ');

    return `
      <article class="movie-card" data-id="${movie.id}" id="movie-${movie.id}">
        <div class="movie-poster-wrapper" tabindex="0" role="button" aria-label="View details for ${escapeHTML(movie.title)}">
          <img 
            src="${movie.image}" 
            alt="${escapeHTML(movie.title)} poster" 
            class="movie-poster-img"
            loading="lazy"
            onerror="this.onerror=null; this.src='assets/images/hero-cinema.jpg';"
          />
          <button 
            type="button" 
            class="btn-remove-grid" 
            data-id="${movie.id}" 
            aria-label="Remove ${escapeHTML(movie.title)} from grid"
            title="Remove from grid"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="card-badges">
            ${movie.rating ? `<span class="badge-tag rating">${ratingDisplay}</span>` : ''}
            ${yearDisplay ? `<span class="badge-tag">${yearDisplay}</span>` : ''}
          </div>
        </div>
        <div class="movie-card-content">
          <h3 class="movie-title" tabindex="0" role="button">${escapeHTML(movie.title)}</h3>
          <p class="movie-desc">${escapeHTML(movie.description)}</p>
          <div class="movie-card-footer">
            <button type="button" class="btn-card-details">
              <span>View Details</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <span class="movie-genres-preview">${escapeHTML(genresList)}</span>
          </div>
        </div>
      </article>
    `;
  }

  function addMovieToGrid(show) {
    // Check if show already exists
    const exists = state.movies.some(m => m.id === `tvmaze-${show.id}` || m.title.toLowerCase() === show.name.toLowerCase());
    if (exists) {
      showToast(`"${show.name}" is already in your grid!`, 'warning');
      return false;
    }

    const cleanedSummary = show.summary
      ? show.summary.replace(/<[^>]*>/g, '').trim()
      : 'No description available for this title.';

    const newMovie = {
      id: `tvmaze-${show.id}`,
      tvmazeId: show.id,
      title: show.name,
      image: (show.image && show.image.original) || (show.image && show.image.medium) || 'assets/images/hero-cinema.jpg',
      rating: (show.rating && show.rating.average) || null,
      year: show.premiered ? show.premiered.substring(0, 4) : 'TBA',
      genres: show.genres || ['Drama'],
      description: cleanedSummary.length > 220 ? cleanedSummary.substring(0, 217) + '...' : cleanedSummary,
      fullSummary: show.summary || cleanedSummary,
      status: show.status || 'Active',
      language: show.language || 'English',
      runtime: show.runtime || show.averageRuntime || 60,
      officialSite: show.officialSite,
      network: show.network ? show.network.name : (show.webChannel ? show.webChannel.name : 'Unknown')
    };

    // Prepend to top of grid
    state.movies.unshift(newMovie);
    saveMovies();
    renderMovieGrid();
    showToast(`Added "${newMovie.title}" to your grid!`, 'success');

    // Scroll smoothly to grid if not in view
    const card = document.getElementById(`movie-${newMovie.id}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return true;
  }

  function removeMovieFromGrid(id) {
    const index = state.movies.findIndex(m => m.id === id);
    if (index !== -1) {
      const removedTitle = state.movies[index].title;
      const card = document.getElementById(`movie-${id}`);

      if (card) {
        card.style.transition = 'transform 250ms ease, opacity 250ms ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.85)';
        setTimeout(() => {
          state.movies.splice(index, 1);
          saveMovies();
          renderMovieGrid();
          showToast(`Removed "${removedTitle}" from grid`);
        }, 220);
      } else {
        state.movies.splice(index, 1);
        saveMovies();
        renderMovieGrid();
        showToast(`Removed "${removedTitle}" from grid`);
      }
    }
  }

  function restoreDefaultMovies() {
    state.movies = [...DEFAULT_MOVIES];
    saveMovies();
    renderMovieGrid();
    showToast('Default titles restored!', 'success');
  }

  // Clear all button handler
  const btnClearAll = document.getElementById('btn-clear-grid');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (state.movies.length === 0) return;
      if (confirm('Are you sure you want to remove all movies from your grid?')) {
        state.movies = [];
        saveMovies();
        renderMovieGrid();
        showToast('All movies cleared');
      }
    });
  }

  // Reset defaults button handler
  const btnResetDefault = document.getElementById('btn-reset-default');
  if (btnResetDefault) {
    btnResetDefault.addEventListener('click', restoreDefaultMovies);
  }

  // Genre Filter Chips
  function setupFilterChips() {
    DOM.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.getAttribute('data-filter') || 'all';
        renderMovieGrid();
      });
    });
  }


  // Search Input & TVMaze API Dynamic Fetching

  function setupSearch() {
    if (!DOM.searchInput) return;

    DOM.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      if (DOM.searchClearBtn) {
        DOM.searchClearBtn.classList.toggle('active', query.length > 0);
      }

      if (state.searchDebounceTimer) {
        clearTimeout(state.searchDebounceTimer);
      }

      if (query.length < 2) {
        hideSearchDropdown();
        return;
      }

      state.searchDebounceTimer = setTimeout(() => {
        fetchShowsFromTVMaze(query);
      }, 300);
    });

    // Enter key submits and adds first result
    DOM.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstBtn = DOM.searchDropdown.querySelector('.btn-add-grid');
        if (firstBtn) {
          firstBtn.click();
        }
      }
      if (e.key === 'Escape') {
        hideSearchDropdown();
      }
    });

    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.searchClearBtn.classList.remove('active');
        hideSearchDropdown();
        DOM.searchInput.focus();
      });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        hideSearchDropdown();
      }
    });
  }

  async function fetchShowsFromTVMaze(query) {
    if (DOM.searchSpinner) DOM.searchSpinner.classList.add('active');

    try {
      const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('API Network response was not ok');

      const data = await response.json();
      renderSearchResults(data, query);
    } catch (err) {
      console.error('TVMaze fetch error:', err);
      renderSearchError();
    } finally {
      if (DOM.searchSpinner) DOM.searchSpinner.classList.remove('active');
    }
  }

  function renderSearchResults(results, query) {
    if (!DOM.searchResultsList || !DOM.searchDropdown) return;

    if (!results || results.length === 0) {
      DOM.searchResultsList.innerHTML = `
        <li style="padding: 1.25rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;">
          No TV shows or movies found for "<strong>${escapeHTML(query)}</strong>". Try another keyword.
        </li>
      `;
      DOM.searchDropdown.classList.add('active');
      return;
    }

    DOM.searchResultsList.innerHTML = results.slice(0, 6).map(item => {
      const show = item.show;
      const thumb = (show.image && show.image.medium) || 'assets/images/hero-cinema.jpg';
      const year = show.premiered ? show.premiered.substring(0, 4) : '';
      const rating = show.rating && show.rating.average ? `⭐ ${show.rating.average}` : '';
      const isAlreadyInGrid = state.movies.some(m => m.id === `tvmaze-${show.id}` || m.title.toLowerCase() === show.name.toLowerCase());

      return `
        <li class="search-result-item" data-show-id="${show.id}">
          <img src="${thumb}" alt="${escapeHTML(show.name)}" class="search-result-thumb" loading="lazy" />
          <div class="search-result-info">
            <h4 class="search-result-title">${escapeHTML(show.name)}</h4>
            <div class="search-result-meta">
              ${year ? `<span>${year}</span>` : ''}
              ${rating ? `<span class="rating-star-badge">${rating}</span>` : ''}
              <span>${escapeHTML((show.genres || []).slice(0, 2).join(', '))}</span>
            </div>
          </div>
          <button 
            type="button" 
            class="btn-add-grid ${isAlreadyInGrid ? 'added' : ''}" 
            data-show-json="${escapeAttr(JSON.stringify(show))}"
            ${isAlreadyInGrid ? 'disabled' : ''}
          >
            ${isAlreadyInGrid ? 'Added' : '+ Add'}
          </button>
        </li>
      `;
    }).join('');

    DOM.searchDropdown.classList.add('active');

    // Attach click events on + Add buttons
    DOM.searchResultsList.querySelectorAll('.btn-add-grid').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          const showData = JSON.parse(btn.getAttribute('data-show-json'));
          const added = addMovieToGrid(showData);
          if (added) {
            btn.classList.add('added');
            btn.textContent = 'Added';
            btn.disabled = true;
          }
        } catch (err) {
          console.error('Error adding movie from search', err);
        }
      });
    });
  }

  function renderSearchError() {
    if (!DOM.searchResultsList || !DOM.searchDropdown) return;
    DOM.searchResultsList.innerHTML = `
      <li style="padding: 1rem; text-align: center; color: var(--color-error); font-size: 0.875rem;">
        Failed to fetch from TVMaze API. Please check your internet connection.
      </li>
    `;
    DOM.searchDropdown.classList.add('active');
  }

  function hideSearchDropdown() {
    if (DOM.searchDropdown) DOM.searchDropdown.classList.remove('active');
  }

  // Movie Details Modal

  function setupModals() {
    if (DOM.movieModalCloseBtn) {
      DOM.movieModalCloseBtn.addEventListener('click', closeMovieDetailsModal);
    }
    if (DOM.movieModal) {
      DOM.movieModal.addEventListener('click', (e) => {
        if (e.target === DOM.movieModal) closeMovieDetailsModal();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.movieModal && DOM.movieModal.classList.contains('active')) {
        closeMovieDetailsModal();
      }
    });
  }

  async function openMovieDetailsModal(id) {
    const movie = state.movies.find(m => m.id === id);
    if (!movie || !DOM.movieModal || !DOM.movieModalBody) return;

    // Show initial modal with current data
    DOM.movieModalBody.innerHTML = `
      <div class="modal-movie-grid">
        <img src="${movie.image}" alt="${escapeHTML(movie.title)}" class="modal-movie-poster" />
        <div>
          <h2 style="font-size: 1.5rem; color: #FFFFFF; margin-bottom: 0.5rem;">${escapeHTML(movie.title)}</h2>
          <div class="modal-genres">
            ${(movie.genres || []).map(g => `<span class="modal-genre-tag">${escapeHTML(g)}</span>`).join('')}
          </div>
          <div class="modal-movie-meta-item">
            <span class="modal-meta-label">Premiered:</span>
            <span>${movie.year || 'N/A'}</span>
          </div>
          <div class="modal-movie-meta-item">
            <span class="modal-meta-label">Rating:</span>
            <span style="color: var(--color-primary); font-weight: 700;">${movie.rating ? `⭐ ${movie.rating} / 10` : 'Not Rated'}</span>
          </div>
          <div class="modal-movie-meta-item">
            <span class="modal-meta-label">Status:</span>
            <span>${movie.status || 'Active'}</span>
          </div>
          <div class="modal-movie-meta-item">
            <span class="modal-meta-label">Language:</span>
            <span>${movie.language || 'English'}</span>
          </div>
          <div class="modal-movie-meta-item" style="margin-top: 1rem;">
            <span class="modal-meta-label" style="display: block; margin-bottom: 4px;">Synopsis:</span>
            <div style="font-size: 0.9rem; line-height: 1.6; color: #D1D5DB;">
              ${movie.fullSummary || movie.description}
            </div>
          </div>
          <div id="modal-cast-section" style="margin-top: 1.25rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Loading cast and additional details from TVMaze API...</div>
          </div>
        </div>
      </div>
    `;

    DOM.movieModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // If movie has a TVMaze show ID, fetch full cast and details asynchronously
    if (movie.tvmazeId) {
      try {
        const res = await fetch(`https://api.tvmaze.com/shows/${movie.tvmazeId}?embed=cast`);
        if (res.ok) {
          const detailData = await res.json();
          const cast = (detailData._embedded && detailData._embedded.cast) || [];
          const castSection = document.getElementById('modal-cast-section');

          if (castSection) {
            if (cast.length > 0) {
              const castHTML = cast.slice(0, 5).map(c => `
                <div style="display: inline-block; background: #222631; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px; margin-bottom: 6px;">
                  <strong style="color: #FFFFFF;">${escapeHTML(c.person.name)}</strong> as ${escapeHTML(c.character.name)}
                </div>
              `).join('');

              castSection.innerHTML = `
                <span class="modal-meta-label" style="display: block; margin-bottom: 6px;">Featured Cast:</span>
                <div>${castHTML}</div>
                ${detailData.officialSite ? `
                  <div style="margin-top: 1rem;">
                    <a href="${detailData.officialSite}" target="_blank" rel="noopener" style="color: var(--color-primary); font-size: 0.85rem; text-decoration: underline; font-weight: 600;">
                      Visit Official Website &rarr;
                    </a>
                  </div>
                ` : ''}
              `;
            } else {
              castSection.innerHTML = '';
            }
          }
        }
      } catch (e) {
        const castSection = document.getElementById('modal-cast-section');
        if (castSection) castSection.innerHTML = '';
      }
    }
  }

  function closeMovieDetailsModal() {
    if (DOM.movieModal) {
      DOM.movieModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Contact Form Validation & Asynchronous PHP Submission

  function setupContactForm() {
    if (!DOM.contactForm) return;

    const fields = {
      firstName: document.getElementById('first-name'),
      lastName: document.getElementById('last-name'),
      email: document.getElementById('email-address'),
      phone: document.getElementById('phone-number'),
      comments: document.getElementById('comments-msg'),
      terms: document.getElementById('agree-terms')
    };

    // Live validation on blur and input
    if (fields.firstName) {
      fields.firstName.addEventListener('blur', () => validateFirstName());
      fields.firstName.addEventListener('input', () => clearFieldError('first-name'));
    }
    if (fields.lastName) {
      fields.lastName.addEventListener('blur', () => validateLastName());
      fields.lastName.addEventListener('input', () => clearFieldError('last-name'));
    }
    if (fields.email) {
      fields.email.addEventListener('blur', () => validateEmail());
      fields.email.addEventListener('input', () => clearFieldError('email-address'));
    }
    if (fields.phone) {
      fields.phone.addEventListener('blur', () => validatePhone());
      fields.phone.addEventListener('input', () => clearFieldError('phone-number'));
    }
    if (fields.comments) {
      fields.comments.addEventListener('blur', () => validateComments());
      fields.comments.addEventListener('input', () => clearFieldError('comments-msg'));
    }

    function setFieldError(fieldId, errorId, message) {
      const input = document.getElementById(fieldId);
      const errorElem = document.getElementById(errorId);
      if (input) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        input.setAttribute('aria-invalid', 'true');
      }
      if (errorElem) {
        errorElem.textContent = message;
        errorElem.classList.add('active');
      }
      return false;
    }

    function clearFieldError(fieldId) {
      const input = document.getElementById(fieldId);
      const errorElem = document.getElementById(`${fieldId}-error`);
      if (input) {
        input.classList.remove('is-invalid');
        input.setAttribute('aria-invalid', 'false');
      }
      if (errorElem) {
        errorElem.classList.remove('active');
        errorElem.textContent = '';
      }
    }

    function validateFirstName() {
      const val = fields.firstName ? fields.firstName.value.trim() : '';
      if (!val) {
        return setFieldError('first-name', 'first-name-error', 'First name is required.');
      }
      if (val.length < 2) {
        return setFieldError('first-name', 'first-name-error', 'First name must be at least 2 characters.');
      }
      if (!/^[a-zA-Z\s\-']+$/.test(val)) {
        return setFieldError('first-name', 'first-name-error', 'Please enter a valid first name (letters only).');
      }
      clearFieldError('first-name');
      fields.firstName.classList.add('is-valid');
      return true;
    }

    function validateLastName() {
      const val = fields.lastName ? fields.lastName.value.trim() : '';
      if (!val) {
        return setFieldError('last-name', 'last-name-error', 'Last name is required.');
      }
      if (val.length < 2) {
        return setFieldError('last-name', 'last-name-error', 'Last name must be at least 2 characters.');
      }
      if (!/^[a-zA-Z\s\-']+$/.test(val)) {
        return setFieldError('last-name', 'last-name-error', 'Please enter a valid last name (letters only).');
      }
      clearFieldError('last-name');
      fields.lastName.classList.add('is-valid');
      return true;
    }

    function validateEmail() {
      const val = fields.email ? fields.email.value.trim() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) {
        return setFieldError('email-address', 'email-address-error', 'Email address is required.');
      }
      if (!emailRegex.test(val)) {
        return setFieldError('email-address', 'email-address-error', 'Please enter a valid email address.');
      }
      clearFieldError('email-address');
      fields.email.classList.add('is-valid');
      return true;
    }

    function validatePhone() {
      const val = fields.phone ? fields.phone.value.trim() : '';
      if (val) {
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.\/0-9]{6,15}$/;
        if (!phoneRegex.test(val)) {
          return setFieldError('phone-number', 'phone-number-error', 'Please enter a valid phone number format.');
        }
      }
      clearFieldError('phone-number');
      if (val) fields.phone.classList.add('is-valid');
      return true;
    }

    function validateComments() {
      const val = fields.comments ? fields.comments.value.trim() : '';
      if (!val) {
        return setFieldError('comments-msg', 'comments-msg-error', 'Comments are required.');
      }
      if (val.length < 5) {
        return setFieldError('comments-msg', 'comments-msg-error', 'Comments must be at least 5 characters long.');
      }
      clearFieldError('comments-msg');
      fields.comments.classList.add('is-valid');
      return true;
    }

    function validateTerms() {
      if (fields.terms && !fields.terms.checked) {
        return setFieldError('agree-terms', 'agree-terms-error', 'You must agree to the Terms & Conditions.');
      }
      clearFieldError('agree-terms');
      return true;
    }

    // Submit handler
    DOM.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Reset top banners
      if (DOM.formAlertSuccess) DOM.formAlertSuccess.style.display = 'none';
      if (DOM.formAlertError) DOM.formAlertError.style.display = 'none';

      // Perform full validation check
      const isFirstValid = validateFirstName();
      const isLastValid = validateLastName();
      const isEmailValid = validateEmail();
      const isPhoneValid = validatePhone();
      const isCommentsValid = validateComments();
      const isTermsValid = validateTerms();

      if (!isFirstValid || !isLastValid || !isEmailValid || !isPhoneValid || !isCommentsValid || !isTermsValid) {
        // Focus first invalid field for WCAG compliance
        const firstInvalid = DOM.contactForm.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        showToast('Please correct the errors in the form before submitting.', 'error');
        return;
      }

      // Prepare payload
      const payload = {
        firstName: fields.firstName.value.trim(),
        lastName: fields.lastName.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value.trim(),
        comments: fields.comments.value.trim(),
        csrf_token: document.getElementById('csrf_token') ? document.getElementById('csrf_token').value : ''
      };

      // Set Loading State
      if (DOM.formSubmitBtn) {
        DOM.formSubmitBtn.classList.add('loading');
        DOM.formSubmitBtn.disabled = true;
      }

      try {
        const response = await fetch('api/contact.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success Feedback
          if (DOM.formAlertSuccess) {
            DOM.formAlertSuccess.innerHTML = `
              <strong>✓ Thank you, ${escapeHTML(payload.firstName)}!</strong><br>
              <span>Your message has been sent successfully. Our guest relations team will get back to you shortly.</span>
            `;
            DOM.formAlertSuccess.style.display = 'block';
            DOM.formAlertSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          showToast('Message sent successfully! We will get back to you shortly.', 'success');
          DOM.contactForm.reset();

          // Reset all validation classes
          Object.values(fields).forEach(f => {
            if (f) {
              f.classList.remove('is-valid');
              f.classList.remove('is-invalid');
            }
          });
        } else {
          // Server-side validation errors returned
          let errorMsg = result.message || 'An error occurred while submitting your message.';
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, msg]) => {
              if (field === 'firstName') setFieldError('first-name', 'first-name-error', msg);
              if (field === 'lastName') setFieldError('last-name', 'last-name-error', msg);
              if (field === 'email') setFieldError('email-address', 'email-address-error', msg);
              if (field === 'phone') setFieldError('phone-number', 'phone-number-error', msg);
              if (field === 'comments') setFieldError('comments-msg', 'comments-msg-error', msg);
            });
          }

          if (DOM.formAlertError) {
            DOM.formAlertError.textContent = errorMsg;
            DOM.formAlertError.style.display = 'block';
            DOM.formAlertError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          showToast(errorMsg, 'error');
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        if (DOM.formAlertError) {
          DOM.formAlertError.textContent = 'Network or server error. Please ensure your backend PHP server is running.';
          DOM.formAlertError.style.display = 'block';
        }
        showToast('Submission failed. Check network or backend server.', 'error');
      } finally {
        if (DOM.formSubmitBtn) {
          DOM.formSubmitBtn.classList.remove('loading');
          DOM.formSubmitBtn.disabled = false;
        }
      }
    });
  }

  // Back-to-Top Button

  function setupBackToTop() {
    if (DOM.backToTopBtn) {
      DOM.backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  // Toast Notifications 

  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    let icon = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;

    if (type === 'success') {
      icon = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      icon = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }

    toast.innerHTML = `${icon}<span>${escapeHTML(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 300ms ease, transform 300ms ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Security & Sanitization Helpers

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
