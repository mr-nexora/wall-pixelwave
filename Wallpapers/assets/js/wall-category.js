document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const WALLPAPERS_PER_PAGE = 30;
    let currentPage = 1;
    let totalPages = 1;
    let allWallpapers = [];
    let filteredWallpapers = [];
    
    // Get category from URL
    const path = window.location.pathname;
    const category = path.split('/').pop().replace('.html', '');
    
    // Get tag from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const tagName = urlParams.get('tag');
    
    // Initialize
    setCategoryTheme(category, tagName);
    loadWallpapers();
    setupFilters();
    setupSearch();
    setupPagination();

    // Load wallpapers from JSON
    async function loadWallpapers() {
        try {
            const response = await fetch('../../data/wallpapers.json');
            const data = await response.json();
            
            allWallpapers = data.wallpapers;
            
            // Filter by tag if specified
            if (tagName) {
                allWallpapers = allWallpapers.filter(wp => 
                    wp.tags && wp.tags.some(tag => 
                        tag.toLowerCase() === tagName.toLowerCase()
                    )
                );
            }
            // Filter by category if not "all"
            else if (category !== 'wall-category') {
                allWallpapers = allWallpapers.filter(wp => 
                    wp.type === category || wp.category === category
                );
            }
            
            totalPages = Math.ceil(allWallpapers.length / WALLPAPERS_PER_PAGE);
            filteredWallpapers = [...allWallpapers];
            displayWallpapers();
            
        } catch (error) {
            console.error('Error loading wallpapers:', error);
            showError();
        }
    }

    // Display wallpapers for current page
    function displayWallpapers() {
        const grid = document.getElementById('wallpapers-grid');
        grid.innerHTML = '';
        
        const startIdx = (currentPage - 1) * WALLPAPERS_PER_PAGE;
        const endIdx = startIdx + WALLPAPERS_PER_PAGE;
        const wallpapersToShow = filteredWallpapers.slice(startIdx, endIdx);
        
        if (wallpapersToShow.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-image"></i>
                    <h3>No wallpapers found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        wallpapersToShow.forEach(wp => {
            const item = document.createElement('div');
            item.className = `wallpaper-item ${getAspectClass(wp.resolution)}`;
            item.innerHTML = `
                <img src="${wp.image}" alt="${wp.title}" loading="lazy">
                <div class="wallpaper-info">
                    <h3>${wp.title}</h3>
                    <a href="single-wall.html?id=${wp.id}" class="download-btn-new">
                        <i class="fas fa-download"></i>
                        Download
                    </a>
                </div>
            `;
            grid.appendChild(item);
        });
        
        updatePagination();
    }

    // Get aspect ratio class based on resolution
    function getAspectClass(resolution) {
        const [width, height] = resolution.split('x').map(Number);
        const ratio = width / height;
        
        if (ratio >= 0.95 && ratio <= 1.05) return 'aspect-square';
        if (ratio < 0.95) return 'aspect-portrait';
        return 'aspect-landscape';
    }

    // Setup filter functionality
    function setupFilters() {
        const filterOptions = document.querySelectorAll('.filter-option');
        
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                filterOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                applyFilter(filter);
            });
        });
    }

    // Apply selected filter
    function applyFilter(filter) {
        currentPage = 1; // Reset to first page
        
        if (filter === 'all') {
            filteredWallpapers = [...allWallpapers];
        } else if (filter === 'square') {
            filteredWallpapers = allWallpapers.filter(wp => {
                const [w, h] = wp.resolution.split('x').map(Number);
                const ratio = w / h;
                return ratio >= 0.95 && ratio <= 1.05; // More precise square detection
            });
        } else if (filter === 'portrait') {
            filteredWallpapers = allWallpapers.filter(wp => {
                const [w, h] = wp.resolution.split('x').map(Number);
                return w / h < 0.95;
            });
        } else if (filter === 'landscape') {
            filteredWallpapers = allWallpapers.filter(wp => {
                const [w, h] = wp.resolution.split('x').map(Number);
                return w / h > 1.05;
            });
        }
        
        totalPages = Math.ceil(filteredWallpapers.length / WALLPAPERS_PER_PAGE);
        displayWallpapers();
    }

    // Setup search functionality
    function setupSearch() {
        const searchInput = document.getElementById('smart-search');
        
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            const term = this.value.toLowerCase();
            
            if (term === '') {
                filteredWallpapers = [...allWallpapers];
            } else {
                filteredWallpapers = allWallpapers.filter(wp => 
                    wp.title.toLowerCase().includes(term) ||
                    (wp.tags && wp.tags.some(tag => tag.toLowerCase().includes(term)))
                );
            }
            
            totalPages = Math.ceil(filteredWallpapers.length / WALLPAPERS_PER_PAGE);
            displayWallpapers();
        });
    }

    // Setup pagination
    function setupPagination() {
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayWallpapers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayWallpapers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Update pagination UI
    function updatePagination() {
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = '';
        
        // Previous button state
        document.getElementById('prev-page').disabled = currentPage === 1;
        
        // Next button state
        document.getElementById('next-page').disabled = currentPage === totalPages;
        
        // Always show first page
        addPageNumber(1);
        
        // Show ellipsis if needed
        if (currentPage > 3) {
            addEllipsis();
        }
        
        // Show current page and adjacent pages
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = startPage; i <= endPage; i++) {
            addPageNumber(i);
        }
        
        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            addEllipsis();
        }
        
        // Always show last page if different from first
        if (totalPages > 1) {
            addPageNumber(totalPages);
        }
    }
    
    function addPageNumber(page) {
        const pageNumbers = document.getElementById('page-numbers');
        const pageElement = document.createElement('div');
        
        pageElement.className = `page-number ${page === currentPage ? 'active' : ''}`;
        pageElement.textContent = page;
        pageElement.addEventListener('click', () => {
            currentPage = page;
            displayWallpapers();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        pageNumbers.appendChild(pageElement);
    }
    
    function addEllipsis() {
        const pageNumbers = document.getElementById('page-numbers');
        const ellipsis = document.createElement('div');
        ellipsis.className = 'page-ellipsis';
        ellipsis.textContent = '...';
        pageNumbers.appendChild(ellipsis);
    }

    // Set category theme and title
    function setCategoryTheme(category, tagName) {
        const categoryTitle = document.getElementById('dynamic-title');
        const heroSection = document.getElementById('category-hero');
        
        if (tagName) {
            // Tag page
            categoryTitle.innerHTML = `Wallpapers Tag: <span>${tagName}</span>`;
            heroSection.className = 'parallax-hero tag-hero';
            document.title = `${tagName} Wallpapers - PixelWave`;
        } else {
            // Category page
            const categoryNames = {
                'forests': 'Forests',
                'nature': 'Nature',
                'abstract': 'Abstract',
                'space': 'Space',
                'ocean': 'Ocean',
                'mountains': 'Mountains',
                'animals': 'Animals',
                'city': 'City',
                'cars': 'Cars',
                'all': 'All Wallpapers'
            };
            
            const displayName = categoryNames[category] || category;
            categoryTitle.textContent = `${displayName} Wallpapers`;
            heroSection.className = `parallax-hero ${category}-hero`;
            document.title = `${displayName} Wallpapers - PixelWave`;
        }
    }

    // Show error message
    function showError() {
        const grid = document.getElementById('wallpapers-grid');
        grid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load wallpapers</h3>
                <p>Please try refreshing the page</p>
            </div>
        `;
    }
});
