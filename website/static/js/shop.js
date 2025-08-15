class ShopManager {
    constructor() {
        this.config = {
            ITEMS_PER_PAGE: 12,
            PRICE_MIN_DEFAULT: 0,
            PRICE_MAX_DEFAULT: 10000,
            DEBOUNCE_DELAY: 500
        };

        this.currentFilters = {
            categories: [],
            options: [],
            colors: [],
            sizes: [],
            priceMin: null,
            priceMax: null,
            search: '',
            sort: 'default',
            page: 1
        };
        
        this.isLoading = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalProducts = 0;
        this.debounceTimer = null;

        // Cache DOM elements for performance
        this.elements = {
            categoryCheckboxes: document.querySelectorAll('.category-checkbox'),
            optionCheckboxes: document.querySelectorAll('.option-checkbox'),
            colorCheckboxes: document.querySelectorAll('.color-checkbox'),
            sizeCheckboxes: document.querySelectorAll('.size-checkbox'),
            minPrice: document.getElementById('min-price'),
            maxPrice: document.getElementById('max-price'),
            priceSliderMin: document.getElementById('price-slider-min'),
            priceSliderMax: document.getElementById('price-slider-max'),
            priceSliderRange: document.querySelector('.price-slider-range'),
            applyFilterBtn: document.getElementById('apply-filter-btn'),
            resetFilterBtn: document.getElementById('reset-filter-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            productSection: document.getElementById('product-section'),
            paginationNumbers: document.getElementById('pagination-numbers'),
            loadingIndicator: document.getElementById('loading-indicator'),
            searchInput: document.getElementById('search-head-input'),
            sortSelect: document.getElementById('sort-by'),
            totalProductsElement: document.getElementById('total-products'),
            filterHeaders: document.querySelectorAll('.filter-header'),
            maxPrice: document.getElementById('max-price'),
            priceSlider: document.getElementById('price-slider'), // سلايدر واحد فقط
            priceSliderRange: document.querySelector('.price-slider-range'),
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUrlParameters();
        this.loadProducts();
    }

    bindEvents() {
        // Filter headers toggle
        this.elements.filterHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('active');
                const body = header.nextElementSibling;
                body.classList.toggle('active');
                body.style.display = body.classList.contains('active') ? 'block' : 'none';
            });
        });

        // Filter checkboxes using cached elements
        this.elements.categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        this.elements.optionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        this.elements.colorCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        this.elements.sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        // Price inputs with debouncing
        if (this.elements.minPrice) {
            this.elements.minPrice.addEventListener('input', () => this.handlePriceInputChange('min'));
        }

        if (this.elements.maxPrice) {
            this.elements.maxPrice.addEventListener('input', () => this.handlePriceInputChange('max'));
        }

        // Price sliders
        if (this.elements.priceSliderMin && this.elements.priceSliderMax) {
            this.elements.priceSliderMin.addEventListener('input', () => this.handlePriceSliderChange('min'));
            this.elements.priceSliderMax.addEventListener('input', () => this.handlePriceSliderChange('max'));
        }

        // Search input with debouncing
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => this.debounceFilterChange());
        }

        // Sort select
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', () => {
                this.currentFilters.sort = this.elements.sortSelect.value;
                this.currentPage = 1;
                this.loadProducts();
            });
        }

        // Filter buttons
        if (this.elements.applyFilterBtn) {
            this.elements.applyFilterBtn.addEventListener('click', () => this.applyFilters(),hidefilterforphonesection() || null);
        }

        if (this.elements.resetFilterBtn) {
            this.elements.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        }

        // Pagination
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }

        // Category cards click
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                this.filterByCategory(categoryId);
            });
        });
    }

    handlePriceInputChange(type) {
        const value = parseFloat(this.elements[`${type}Price`].value) || 0;
        const clampedValue = Math.min(Math.max(value, 0), 10000);
        
        // Update the corresponding slider
        if (type === 'min') {
            this.elements.priceSliderMin.value = clampedValue;
            this.elements.minPrice.value = clampedValue;
        } else {
            this.elements.priceSliderMax.value = clampedValue;
            this.elements.maxPrice.value = clampedValue;
        }
        
        this.updatePriceRange();
        this.debounceFilterChange();
    }

    handlePriceSliderChange(type) {
        const value = parseFloat(this.elements[`priceSlider${type.charAt(0).toUpperCase() + type.slice(1)}`].value);
        
        // Update the corresponding input
        if (type === 'min') {
            this.elements.minPrice.value = value;
        } else {
            this.elements.maxPrice.value = value;
        }
        
        this.updatePriceRange();
        this.debounceFilterChange();
    }

    updatePriceRange() {
        const maxValue = parseFloat(this.elements.maxPrice.value) || this.config.PRICE_MAX_DEFAULT;

        // القيم الدنيا والعليا الممكنة للسلايدر
        const sliderMin = parseFloat(this.elements.maxPrice.min) || this.config.PRICE_MIN_DEFAULT;
        const sliderMax = parseFloat(this.elements.maxPrice.max) || this.config.PRICE_MAX_DEFAULT;

        // حساب النسبة
        const maxPercent = ((maxValue - sliderMin) / (sliderMax - sliderMin)) * 100;

        // تحديث الشريط من البداية حتى maxValue
        this.elements.priceSliderRange.style.left = "0%";
        this.elements.priceSliderRange.style.width = `${maxPercent}%`;
        this.elements.priceSlider.addEventListener('input', () => {
            this.elements.maxPrice.value = this.elements.priceSlider.value;
            this.updatePriceRange();
        });

        this.elements.maxPrice.addEventListener('input', () => {
            this.elements.priceSlider.value = this.elements.maxPrice.value;
            this.updatePriceRange();
        });

    }


    loadUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        
        // Load search parameter
        this.currentFilters.search = params.get('search') || '';
        if (this.currentFilters.search && this.elements.searchInput) {
            this.elements.searchInput.value = this.currentFilters.search;
        }

        // Load category parameter
        const categoryId = params.get('category');
        if (categoryId) {
            this.currentFilters.categories = [categoryId];
            const categoryCheckbox = document.getElementById(`category_${categoryId}`);
            if (categoryCheckbox) {
                categoryCheckbox.checked = true;
            }
        }

        // Load sort parameter
        this.currentFilters.sort = params.get('sort') || 'default';
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = this.currentFilters.sort;
        }

        // Load page parameter
        this.currentFilters.page = parseInt(params.get('page')) || 1;
        this.currentPage = this.currentFilters.page;
    }

    debounceFilterChange() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.handleFilterChange();
        }, this.config.DEBOUNCE_DELAY);
    }

    handleFilterChange() {
        this.updateCurrentFilters();
        // Don't apply filters automatically - wait for Apply button
    }

    updateCurrentFilters() {
        // Update categories using cached elements
        this.currentFilters.categories = Array.from(this.elements.categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Update options
        this.currentFilters.options = Array.from(this.elements.optionCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Update colors
        this.currentFilters.colors = Array.from(this.elements.colorCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Update sizes
        this.currentFilters.sizes = Array.from(this.elements.sizeCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Update price range
        this.currentFilters.priceMin = this.elements.minPrice?.value || null;
        this.currentFilters.priceMax = this.elements.maxPrice?.value || null;

        // Update search
        this.currentFilters.search = this.elements.searchInput?.value.trim() || '';

        // Reset to first page when filters change
        this.currentFilters.page = 1;
        this.currentPage = 1;
    }

    applyFilters() {
        this.updateCurrentFilters();
        this.loadProducts();
        this.updateUrl();
    }

    resetFilters() {
        window.location.href = '/shop/'; // Reload the shop page to reset all filters
        // Clear all checkboxes
        this.elements.categoryCheckboxes.forEach(cb => cb.checked = false);
        this.elements.optionCheckboxes.forEach(cb => cb.checked = false);
        this.elements.colorCheckboxes.forEach(cb => cb.checked = false);
        this.elements.sizeCheckboxes.forEach(cb => cb.checked = false);

        // Reset price inputs
        if (this.elements.minPrice) this.elements.minPrice.value = this.config.PRICE_MIN_DEFAULT;
        if (this.elements.maxPrice) this.elements.maxPrice.value = this.config.PRICE_MAX_DEFAULT;
        if (this.elements.priceSliderMin) this.elements.priceSliderMin.value = this.config.PRICE_MIN_DEFAULT;
        if (this.elements.priceSliderMax) this.elements.priceSliderMax.value = this.config.PRICE_MAX_DEFAULT;
        this.updatePriceRange();

        // Reset sort
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = 'default';
            this.currentFilters.sort = 'default';
        }

        // Reset filters object
        this.currentFilters = {
            categories: [],
            options: [],
            colors: [],
            sizes: [],
            priceMin: null,
            priceMax: null,
            search: this.currentFilters.search, // Keep search term
            sort: 'default',
            page: 1
        };

        this.currentPage = 1;
        this.loadProducts();
        this.updateUrl();
    }

    filterByCategory(categoryId) {
        // Uncheck all category checkboxes
        document.querySelectorAll('input[type="checkbox"][id^="category_"]').forEach(cb => {
            cb.checked = false;
        });

        // Check the selected category checkbox
        const checkbox = document.getElementById(`category_${categoryId}`);
        if (checkbox) {
            checkbox.checked = true;
        }

        this.applyFilters();
    }

    async loadProducts() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            // Check if we should load bestsellers
            if (this.currentFilters.sort === 'bestseller') {
                const data = await this.fetchBestSellers();
                // Ensure data is an array
                const products = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
                this.renderProducts(products);
                this.totalProducts = products.length;
                this.updateProductCount();
                this.hidePagination(); // Hide pagination for bestsellers
            } else {
                const data = await this.fetchProducts();
                // Ensure data.results is an array
                const products = Array.isArray(data.results) ? data.results : [];
                this.renderProducts(products);
                this.totalProducts = data.count || 0;
                this.updateProductCount();
                this.updatePagination(data);
                this.showPagination();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError(`Failed to load products: ${error.message}. Please try again.`);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    async fetchProducts() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.categories.length > 0) {
            params.append('category', this.currentFilters.categories.join(','));
        }
        
        if (this.currentFilters.options.length > 0) {
            params.append('option', this.currentFilters.options.join(','));
        }
        
        if (this.currentFilters.colors.length > 0) {
            params.append('color', this.currentFilters.colors.join(','));
        }
        
        if (this.currentFilters.sizes.length > 0) {
            params.append('size', this.currentFilters.sizes.join(','));
        }
        
        if (this.currentFilters.priceMin) {
            params.append('price_min', this.currentFilters.priceMin);
        }
        
        if (this.currentFilters.priceMax) {
            params.append('price_max', this.currentFilters.priceMax);
        }
        
        if (this.currentFilters.search) {
            params.append('name', this.currentFilters.search);
        }
        
        // Add sorting
        if (this.currentFilters.sort && this.currentFilters.sort !== 'default') {
            if (this.currentFilters.sort === 'price_asc') {
                params.append('ordering', 'price');
            } else if (this.currentFilters.sort === 'price_desc') {
                params.append('ordering', '-price');
            } else if (this.currentFilters.sort === 'rating') {
                params.append('ordering', '-average_rating');
            }
        }
        
        params.append('page', this.currentPage);

        const url = `${mainDomain}/products/products-list/shop/?${params.toString()}`;

        const headers = {
            'Content-Type': 'application/json'
        };
        const csrfToken = this.getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch {}
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // Ensure the response has the expected structure
        if (!responseData || typeof responseData !== 'object') {
            console.warn('Invalid response format:', responseData);
            return { results: [], count: 0 };
        }

        return responseData;
    }

    async fetchBestSellers() {
        const url = `${mainDomain}/products/api/bestseller/`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch bestsellers: ${response.status}`);
        }

        const data = await response.json();
        
        // Ensure data is in the expected format
        if (!data) {
            console.warn('No data received from bestsellers API');
            return [];
        }

        return data;
    }

    renderProducts(products) {
        const productSection = this.elements.productSection;
        if (!productSection) return;

        productSection.innerHTML = '';

        // Ensure products is an array
        if (!Array.isArray(products)) {
            console.warn('Products is not an array:', products);
            products = [];
        }
        if (products.length === 0) {
            productSection.classList.add('empty');
            productSection.innerHTML = `
                <div class="empty-state empty-state--no-products">
                    <i class="fas fa-search empty-state__icon"></i>
                    <p class="empty-state__message">No products found matching your criteria.</p>
                    <button class="empty-state__button" onclick="shopManager.resetFilters()" aria-label="Clear all filters">
                        <i class="fas fa-filter"></i> Clear Filters
                    </button>
                </div>
            `;
            return;
        } else {
            productSection.classList.remove('empty');
        }



        products.forEach(product => {
            if (product && typeof product === 'object') {
                const productHTML = this.createProductHTML(product);
                productSection.insertAdjacentHTML('beforeend', productHTML);
            } else {
                console.warn('Invalid product data:', product);
            }
        });

        // Re-bind event listeners for dynamically added elements
        this.bindProductEvents();
    }

createProductHTML(product) {
    const hasDiscount = product.old_price && product.discount && parseFloat(product.discount) > 0;
    const displayPrice = product.price || 0;
    const rating = product.average_rating || 0;
    const totalReviews = product.total_reviews || 0;
    const imageUrl = product.image_1 || '/static/imges/default-product.jpg';
    
    // Determine cart and wishlist status
    const isInCart = product.in_cart;
    const isInWishlist = product.in_favorites;

    // قص الاسم إذا تجاوز 100 حرف
    const fullName = product.name || '';
    const shortName = fullName.length > 100 ? fullName.substring(0, 100) + '...' : fullName;

    return `
        <div class="product-box" data-product-id="${product.id}">
            <div class="shop-img" onclick="shopManager.viewProductDetails('${product.id}')">
                <img src="${imageUrl}" alt="${fullName}" loading="lazy">
                ${hasDiscount ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
            </div>
            <div class="shop-wishlist ${isInWishlist ? 'wishlist-active' : ''}" onclick="shopManager.addToWishlist('${product.id}')">
                <i class="bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'}"></i>
            </div>
            <div class="shop-name" title="${fullName}">${shortName}</div>
            <div class="shop-rating">
                ${this.generateStarRating(rating)}
                <span>(${rating} - ${totalReviews} reviews)</span>
            </div>
            <div class="price-shop">
                <span class="products-main-price">${currencySymbol}${displayPrice}</span>
                ${product.old_price && parseFloat(product.old_price) > parseFloat(displayPrice) ? `<span class="products-old-price">${currencySymbol}${product.old_price}</span>` : ''}
            </div>
            <div class="shop-buttons">
                <button onclick="shopManager.addToCart('${product.id}')" 
                        class="add-to-cart-btn ${isInCart ? 'in-cart' : ''}" 
                        data-product-id="${product.id}"
                        ${isInCart ? 'disabled' : ''}>
                    <span>${isInCart ? 'Already in Cart' : 'Add To Cart'}</span>
                    <span>
                        <i class="${isInCart ? 'bi bi-cart-check' : 'bi bi-cart-plus'}"></i>
                    </span>
                </button>
            </div>
        </div>
    `;
}


    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="bi bi-star-fill"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="bi bi-star-half"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="bi bi-star"></i>';
        }

        return starsHTML;
    }

    bindProductEvents() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    updateProductCount() {
        if (this.elements.totalProductsElement) {
            this.elements.totalProductsElement.textContent = this.totalProducts.toLocaleString();
        }
    }

    hidePagination() {
        const paginationSection = document.querySelector('.pagination-section');
        if (paginationSection) {
            paginationSection.style.display = 'none';
        }
    }

    showPagination() {
        const paginationSection = document.querySelector('.pagination-section');
        if (paginationSection) {
            paginationSection.style.display = 'flex';
        }
    }

    updatePagination(data) {
        this.totalPages = Math.ceil((data.count || 0) / this.config.ITEMS_PER_PAGE);
        
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = this.currentPage >= this.totalPages;
        }

        this.generatePageNumbers();
    }

    generatePageNumbers() {
        const paginationNumbers = this.elements.paginationNumbers;
        if (!paginationNumbers) return;

        paginationNumbers.innerHTML = '';

        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.addPageButton(1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                paginationNumbers.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            this.addPageButton(i);
        }

        // Add last page and ellipsis if needed
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                paginationNumbers.appendChild(ellipsis);
            }
            this.addPageButton(this.totalPages);
        }
    }

    addPageButton(page) {
        const paginationNumbers = this.elements.paginationNumbers;
        const pageBtn = document.createElement('button');
        pageBtn.textContent = page;
        pageBtn.className = page === this.currentPage ? 'active' : '';
        pageBtn.addEventListener('click', () => this.goToPage(page));
        paginationNumbers.appendChild(pageBtn);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.currentFilters.page = page;
        this.loadProducts();
        this.updateUrl();
    }

    async addToCart(productId) {
        try {
            const response = await fetch('/orders/add-to-cart/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({ product_id: productId })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification(data.message, 'success');
                this.updateCartButton(productId, true);
                this.updateCartCount();
            } else {
                if (response.status === 401) {
                    this.showAuthMessage();
                } else {
                    this.showNotification(data.message || 'Failed to add product to cart', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add product to cart', 'error');
        }
    }

    async addToWishlist(productId) {
        try {
            const response = await fetch('/orders/add-to-wishlist/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({ product_id: productId })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification(data.message, 'success');
                // Determine if product was added or removed from wishlist
                const isAdded = data.message.includes('added') || data.message.includes('تم إضافة');
                this.updateWishlistIcon(productId, isAdded);
            } else {
                if (response.status === 401) {
                    this.showAuthMessage();
                } else {
                    this.showNotification(data.message || 'Failed to add product to wishlist', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            this.showNotification('Failed to add product to wishlist', 'error');
        }
    }

    viewProductDetails(productId) {
        window.location.href = `/product-details/${String(productId)}`;
    }

    updateCartCount() {
        // Implement this if you have a cart count display
    }

    updateCartButton(productId, isInCart) {
        const productBox = document.querySelector(`[data-product-id="${productId}"]`);
        if (productBox) {
            const cartButton = productBox.querySelector('.add-to-cart-btn');
            if (cartButton) {
                const icon = cartButton.querySelector('i');

                if (isInCart) {
                    cartButton.classList.add('in-cart');
                    cartButton.disabled = true; // الزر غير قابل للنقر
                    cartButton.querySelector('span:first-child').textContent = 'Already in Cart';
                    if (icon) {
                        icon.classList.remove('bi-cart-plus');
                        icon.classList.add('bi-cart-check');
                    }
                } else {
                    cartButton.classList.remove('in-cart');
                    cartButton.disabled = false;
                    cartButton.querySelector('span:first-child').textContent = 'Add To Cart';
                    if (icon) {
                        icon.classList.remove('bi-cart-check');
                        icon.classList.add('bi-cart-plus');
                    }
                }
            }
        }
    }



    updateWishlistIcon(productId, isInWishlist) {
        const productBox = document.querySelector(`[data-product-id="${productId}"]`);
        if (productBox) {
            const wishlistButton = productBox.querySelector('.shop-wishlist');
            const heartIcon = productBox.querySelector('.shop-wishlist i');
            
            if (wishlistButton && heartIcon) {
                if (isInWishlist) {
                    heartIcon.className = 'bi bi-heart-fill';
                    wishlistButton.classList.add('wishlist-active');
                } else {
                    heartIcon.className = 'bi bi-heart';
                    wishlistButton.classList.remove('wishlist-active');
                }
            }
        }
    }

    showLoading() {
        const productSection = this.elements.productSection;
        productSection.style.display = 'flex';
        productSection.style.alignItems = 'center';
        productSection.style.justifyContent = 'center';
    }

    hideLoading() {
        const productSection = this.elements.productSection;
        productSection.style.display = 'grid';
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }

    showAuthMessage() {
        // Create notification element
        const authAlert = document.createElement("div");
        authAlert.className = "auth-alert auth-alert-warning";

        // Add icon with text
        authAlert.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="margin-right:8px;"></i>
            Please log in to perform this action.
        `;

        // Add to page
        document.body.appendChild(authAlert);

        // Show notification with slide effect
        setTimeout(() => {
            authAlert.classList.add("auth-alert-show");
        }, 50);

        // Hide after 4 seconds
        setTimeout(() => {
            authAlert.classList.remove("auth-alert-show");
            // Remove element after animation
            setTimeout(() => {
                authAlert.remove();
            }, 500);
        }, 4000);
    }

    showError(message) {
        const productSection = this.elements.productSection;
        if (productSection) {
            productSection.classList.add('empty');
            productSection.innerHTML = `
                <div class="empty-state empty-state--error">
                    <i class="fas fa-exclamation-triangle empty-state__icon"></i>
                    <p class="empty-state__message">${message}</p>
                    <button class="empty-state__button" onclick="shopManager.loadProducts()" aria-label="Try loading products again">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        notification.className = `notification ${type}`;

        // Use innerHTML to add message with icon
        notification.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
        `;

        notification.style.display = 'block';

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    updateUrl() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.search) {
            params.append('search', this.currentFilters.search);
        }
        
        if (this.currentFilters.categories.length > 0) {
            params.append('category', this.currentFilters.categories.join(','));
        }
        
        if (this.currentFilters.sort !== 'default') {
            params.append('sort', this.currentFilters.sort);
        }
        
        if (this.currentPage > 1) {
            params.append('page', this.currentPage);
        }

        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState(null, '', newUrl);
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue || '';
    }
    
}

// Initialize shop manager when DOM is loaded
let shopManager;

document.addEventListener('DOMContentLoaded', () => {
    shopManager = new ShopManager();
});

// Legacy function support for backward compatibility
function AddToCart(product_id) {
    shopManager.addToCart(product_id);
}

function AddToWishlist(product_id) {
    shopManager.addToWishlist(product_id);
}

function viewProductdetailes(productId) {
    shopManager.viewProductDetails(productId);
}

function getCookie(name) {
    return shopManager.getCookie(name);
}

// Price Range Slider Functionality
const rangeMin = document.getElementById("range-min");
const rangeMax = document.getElementById("range-max");
const minPrice = document.getElementById("min-price");
const maxPrice = document.getElementById("max-price");
const sliderTrack = document.querySelector(".slider-track");
const applyFilterBtn = document.getElementById("apply-filter-btn");

// Minimum gap between min and max values
const minGap = 0; // يمكنك تعديل هذه القيمة حسب احتياجاتك

// Update slider track color
function updateSliderTrack() {
    const percent1 = (rangeMin.value / rangeMax.max) * 100;
    const percent2 = (rangeMax.value / rangeMax.max) * 100;
    sliderTrack.style.background = `linear-gradient(to right, 
        #d7dcdf ${percent1}%, 
        #3348FF ${percent1}%, 
        #3348FF ${percent2}%, 
        #d7dcdf ${percent2}%)`;
}

// Initialize slider values
function initPriceSlider() {
    minPrice.value = rangeMin.value;
    maxPrice.value = rangeMax.value;
    updateSliderTrack();
}

// Event listeners for range sliders
rangeMin.addEventListener("input", function() {
    if (parseInt(rangeMax.value) - parseInt(rangeMin.value) <= minGap) {
        rangeMin.value = parseInt(rangeMax.value) - minGap;
    }
    minPrice.value = rangeMin.value;
    updateSliderTrack();
});

rangeMax.addEventListener("input", function() {
    if (parseInt(rangeMax.value) - parseInt(rangeMin.value) <= minGap) {
        rangeMax.value = parseInt(rangeMin.value) + minGap;
    }
    maxPrice.value = rangeMax.value;
    updateSliderTrack();
});

// Event listeners for price inputs
minPrice.addEventListener("input", function() {
    let value = parseInt(this.value);
    
    // Validate input
    if (isNaN(value)) value = 0;
    if (value < parseInt(rangeMin.min)) value = parseInt(rangeMin.min);
    if (value > parseInt(rangeMin.max)) value = parseInt(rangeMin.max);
    if (value > parseInt(maxPrice.value) - minGap) {
        value = parseInt(maxPrice.value) - minGap;
    }
    
    this.value = value;
    rangeMin.value = value;
    updateSliderTrack();
});

maxPrice.addEventListener("input", function() {
    let value = parseInt(this.value);
    
    // Validate input
    if (isNaN(value)) value = 10000;
    if (value < parseInt(rangeMax.min)) value = parseInt(rangeMax.min);
    if (value > parseInt(rangeMax.max)) value = parseInt(rangeMax.max);
    if (value < parseInt(minPrice.value) + minGap) {
        value = parseInt(minPrice.value) + minGap;
    }
    
    this.value = value;
    rangeMax.value = value;
    updateSliderTrack();
});

// Prevent form submission on Enter key
[minPrice, maxPrice].forEach(input => {
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    });
});

// Integration with ShopManager
if (typeof shopManager !== 'undefined') {
    // Update ShopManager's price filters when Apply button is clicked
    applyFilterBtn.addEventListener('click', function() {
        shopManager.currentFilters.priceMin = minPrice.value;
        shopManager.currentFilters.priceMax = maxPrice.value;
        shopManager.applyFilters();
    });
    
    // Initialize with ShopManager's current values if they exist
    document.addEventListener('DOMContentLoaded', function() {
        if (shopManager.currentFilters.priceMin) {
            minPrice.value = shopManager.currentFilters.priceMin;
            rangeMin.value = shopManager.currentFilters.priceMin;
        }
        if (shopManager.currentFilters.priceMax) {
            maxPrice.value = shopManager.currentFilters.priceMax;
            rangeMax.value = shopManager.currentFilters.priceMax;
        }
        updateSliderTrack();
    });
}

// Initialize the slider
initPriceSlider();

if (window.innerWidth <= 1224) {
    // Hide filter section for mobile devices
    function hidefilterforphonesection() {
        const filterSection = document.querySelector('.filter-section');
        const filterGrySection = document.getElementById('filter-gry-section');
        filterSection.classList.remove('active');
        filterGrySection.classList.remove('active');
        document.body.style.overflow = ''; // استرجاع التمرير
    }
}


document.getElementById('toggle-filters').addEventListener('click', function() {
    document.body.style.overflow = 'hidden';
    const filterSection = document.querySelector('.filter-section');
    const filterGrySection = document.getElementById('filter-gry-section');

    filterGrySection.classList.toggle('active');
    filterSection.classList.toggle('active');

    filterGrySection.onclick = function() {
        hidefilterforphonesection();
    }
});
