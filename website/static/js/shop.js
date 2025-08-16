// دالة عامة لعمل fetch مع نظام التجديد
async function fetchWithAuth(url, options = {}) {
    try {
        let response = await fetch(url, {
            ...options,
            credentials: "include" // مهم لإرسال الكوكيز (access, refresh)
        });

        if (response.status === 401) {
            // حاول تجديد التوكن
            const refreshResponse = await fetch(
                mainDomain + "users/auth/jwt/refresh/", 
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            if (refreshResponse.ok) {
                // إذا نجح التجديد → أعد إرسال الطلب الأصلي
                response = await fetch(url, {
                    ...options,
                    credentials: "include"
                });
            } else {
                throw new Error("Session expired, please log in again.");
            }
        }

        return response;
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
}

class ShopManager {
    constructor() {
        this.config = {
            ITEMS_PER_PAGE: 12,
            PRICE_MIN_DEFAULT: 0,
            PRICE_MAX_DEFAULT: 10000,
            DEBOUNCE_DELAY: 500,
            MIN_GAP: 0
        };

        this.currentFilters = {
            categories: [],
            options: [],
            colors: [],
            sizes: [],
            priceMin: null,
            priceMax: null,
            rating: null, // إضافة فلتر التقييم
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
        this.elements = {};
        this.cacheElements();
        
        this.init();
    }

    cacheElements() {
        const elementSelectors = {
            categoryCheckboxes: '.category-checkbox',
            optionCheckboxes: '.option-checkbox',
            colorCheckboxes: '.color-checkbox',
            sizeCheckboxes: '.size-checkbox',
            ratingRadios: 'input[name="rating"]', // إضافة عناصر التقييم
            minPrice: '#min-price',
            maxPrice: '#max-price',
            priceSliderMin: '#price-slider-min',
            priceSliderMax: '#price-slider-max',
            priceSliderRange: '.price-slider-range',
            priceSlider: '#price-slider',
            rangeMin: '#range-min',
            rangeMax: '#range-max',
            sliderTrack: '.slider-track',
            applyFilterBtn: '#apply-filter-btn',
            resetFilterBtn: '#reset-filter-btn',
            prevBtn: '#prev-btn',
            nextBtn: '#next-btn',
            productSection: '#product-section',
            paginationNumbers: '#pagination-numbers',
            loadingIndicator: '#loading-indicator',
            searchInput: '#search-head-input',
            sortSelect: '#sort-by',
            totalProductsElement: '#total-products',
            filterHeaders: '.filter-header',
            toggleFilters: '#toggle-filters',
            filterSection: '.filter-section',
            filterGrySection: '#filter-gry-section'
        };

        // Cache single elements
        Object.keys(elementSelectors).forEach(key => {
            const selector = elementSelectors[key];
            if (selector.startsWith('.') && !['priceSliderRange', 'sliderTrack', 'filterSection'].includes(key)) {
                this.elements[key] = document.querySelectorAll(selector);
            } else if (key === 'ratingRadios') {
                // للـ radio buttons نستخدم querySelectorAll
                this.elements[key] = document.querySelectorAll(selector);
            } else {
                this.elements[key] = document.querySelector(selector);
            }
        });
    }

    init() {
        this.bindEvents();
        this.initializePriceSlider();
        this.loadUrlParameters();
        this.loadProducts();
    }

    bindEvents() {
        this.bindFilterEvents();
        this.bindPriceEvents();
        this.bindSearchAndSortEvents();
        this.bindButtonEvents();
        this.bindPaginationEvents();
        this.bindCategoryEvents();
        this.bindMobileFilterEvents();
        this.bindRatingEvents(); // إضافة أحداث التقييم
    }

    bindFilterEvents() {
        // Filter headers toggle
        if (this.elements.filterHeaders) {
            this.elements.filterHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    header.classList.toggle('active');
                    const body = header.nextElementSibling;
                    if (body) {
                        body.classList.toggle('active');
                        body.style.display = body.classList.contains('active') ? 'block' : 'none';
                    }
                });
            });
        }

        // Filter checkboxes
        const checkboxTypes = ['categoryCheckboxes', 'optionCheckboxes', 'colorCheckboxes', 'sizeCheckboxes'];
        checkboxTypes.forEach(type => {
            if (this.elements[type]) {
                this.elements[type].forEach(checkbox => {
                    checkbox.addEventListener('change', () => this.handleFilterChange());
                });
            }
        });
    }

    // إضافة دالة جديدة للتعامل مع أحداث التقييم
    bindRatingEvents() {
        if (this.elements.ratingRadios) {
            this.elements.ratingRadios.forEach(radio => {
                radio.addEventListener('change', () => this.handleFilterChange());
            });
        }
    }

    bindPriceEvents() {
        // Price inputs with debouncing
        if (this.elements.minPrice) {
            this.elements.minPrice.addEventListener('input', () => this.handlePriceInputChange('min'));
            this.elements.minPrice.addEventListener('keydown', this.preventEnterSubmit);
        }

        if (this.elements.maxPrice) {
            this.elements.maxPrice.addEventListener('input', () => this.handlePriceInputChange('max'));
            this.elements.maxPrice.addEventListener('keydown', this.preventEnterSubmit);
        }

        // Range sliders
        if (this.elements.rangeMin) {
            this.elements.rangeMin.addEventListener('input', () => this.handleRangeSliderChange('min'));
        }

        if (this.elements.rangeMax) {
            this.elements.rangeMax.addEventListener('input', () => this.handleRangeSliderChange('max'));
        }

        // Legacy price sliders (if they exist)
        if (this.elements.priceSliderMin) {
            this.elements.priceSliderMin.addEventListener('input', () => this.handlePriceSliderChange('min'));
        }

        if (this.elements.priceSliderMax) {
            this.elements.priceSliderMax.addEventListener('input', () => this.handlePriceSliderChange('max'));
        }
    }

    bindSearchAndSortEvents() {
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
    }

    bindButtonEvents() {
        // Filter buttons
        if (this.elements.applyFilterBtn) {
            this.elements.applyFilterBtn.addEventListener('click', () => {
                this.applyFilters();
                this.hideMobileFilter();
            });
        }

        if (this.elements.resetFilterBtn) {
            this.elements.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        }
    }

    bindPaginationEvents() {
        // Pagination buttons
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }

        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }
    }

    bindCategoryEvents() {
        // Category cards click
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                if (categoryId) {
                    this.filterByCategory(categoryId);
                }
            });
        });
    }

    bindMobileFilterEvents() {
        // Mobile filter toggle
        if (this.elements.toggleFilters) {
            this.elements.toggleFilters.addEventListener('click', () => {
                this.showMobileFilter();
            });
        }

        // Mobile filter overlay click
        if (this.elements.filterGrySection) {
            this.elements.filterGrySection.addEventListener('click', () => {
                this.hideMobileFilter();
            });
        }
    }

    preventEnterSubmit(e) {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    }

    // Price slider initialization and handling
    initializePriceSlider() {
        if (this.elements.rangeMin && this.elements.rangeMax && this.elements.minPrice && this.elements.maxPrice) {
            this.elements.minPrice.value = this.elements.rangeMin.value;
            this.elements.maxPrice.value = this.elements.rangeMax.value;
            this.updateSliderTrack();
        }
    }

    handleRangeSliderChange(type) {
        const rangeMin = this.elements.rangeMin;
        const rangeMax = this.elements.rangeMax;
        const minPrice = this.elements.minPrice;
        const maxPrice = this.elements.maxPrice;

        if (!rangeMin || !rangeMax || !minPrice || !maxPrice) return;

        let minVal = parseInt(rangeMin.value);
        let maxVal = parseInt(rangeMax.value);

        if (type === 'min') {
            if (maxVal - minVal <= this.config.MIN_GAP) {
                minVal = maxVal - this.config.MIN_GAP;
                rangeMin.value = minVal;
            }
            minPrice.value = minVal;
            this.currentFilters.priceMin = minVal;
        } else if (type === 'max') {
            if (maxVal - minVal <= this.config.MIN_GAP) {
                maxVal = minVal + this.config.MIN_GAP;
                rangeMax.value = maxVal;
            }
            maxPrice.value = maxVal;
            this.currentFilters.priceMax = maxVal;
        }

        this.updateSliderTrack();
        this.debounceFilterChange(); // حتى تحدث المنتجات تلقائياً
    }

    handlePriceInputChange(type) {
        const input = this.elements[`${type}Price`];
        const rangeSlider = this.elements[`range${type.charAt(0).toUpperCase() + type.slice(1)}`];
        
        if (!input || !rangeSlider) return;

        let value = parseInt(input.value);
        
        // Validate input
        if (isNaN(value)) {
            value = type === 'min' ? this.config.PRICE_MIN_DEFAULT : this.config.PRICE_MAX_DEFAULT;
        }
        
        const min = parseInt(rangeSlider.min) || this.config.PRICE_MIN_DEFAULT;
        const max = parseInt(rangeSlider.max) || this.config.PRICE_MAX_DEFAULT;
        
        // Clamp value to range
        value = Math.min(Math.max(value, min), max);
        
        // Handle min/max gap
        if (type === 'min') {
            const maxValue = parseInt(this.elements.maxPrice.value);
            if (value > maxValue - this.config.MIN_GAP) {
                value = maxValue - this.config.MIN_GAP;
            }
        } else {
            const minValue = parseInt(this.elements.minPrice.value);
            if (value < minValue + this.config.MIN_GAP) {
                value = minValue + this.config.MIN_GAP;
            }
        }
        
        input.value = value;
        rangeSlider.value = value;
        this.updateSliderTrack();
        this.debounceFilterChange();
    }

    // Legacy price slider support
    handlePriceSliderChange(type) {
        const slider = this.elements[`priceSlider${type.charAt(0).toUpperCase() + type.slice(1)}`];
        const input = this.elements[`${type}Price`];
        
        if (!slider || !input) return;

        const value = parseFloat(slider.value);
        input.value = value;
        
        this.updatePriceRange();
        this.debounceFilterChange();
    }

    updateSliderTrack() {
        if (!this.elements.sliderTrack || !this.elements.rangeMin || !this.elements.rangeMax) return;

        const rangeMin = this.elements.rangeMin;
        const rangeMax = this.elements.rangeMax;
        const maxRange = parseInt(rangeMax.max);
        
        const percent1 = (rangeMin.value / maxRange) * 100;
        const percent2 = (rangeMax.value / maxRange) * 100;
        
        this.elements.sliderTrack.style.background = `linear-gradient(to right, 
            #d7dcdf ${percent1}%, 
            #3348FF ${percent1}%, 
            #3348FF ${percent2}%, 
            #d7dcdf ${percent2}%)`;
    }

    // Legacy price range update (for backward compatibility)
    updatePriceRange() {
        if (!this.elements.maxPrice || !this.elements.priceSliderRange) return;

        const maxValue = parseFloat(this.elements.maxPrice.value) || this.config.PRICE_MAX_DEFAULT;
        const sliderMin = this.config.PRICE_MIN_DEFAULT;
        const sliderMax = this.config.PRICE_MAX_DEFAULT;

        const maxPercent = ((maxValue - sliderMin) / (sliderMax - sliderMin)) * 100;
        this.elements.priceSliderRange.style.left = "0%";
        this.elements.priceSliderRange.style.width = `${maxPercent}%`;
    }

    showMobileFilter() {
        if (window.innerWidth <= 1224) {
            document.body.style.overflow = 'hidden';
            if (this.elements.filterGrySection) {
                this.elements.filterGrySection.classList.add('active');
            }
            if (this.elements.filterSection) {
                this.elements.filterSection.classList.add('active');
            }
        }
    }

    hideMobileFilter() {
        if (window.innerWidth <= 1224) {
            document.body.style.overflow = '';
            if (this.elements.filterGrySection) {
                this.elements.filterGrySection.classList.remove('active');
            }
            if (this.elements.filterSection) {
                this.elements.filterSection.classList.remove('active');
            }
        }
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

        // إضافة تحميل parameter التقييم
        const rating = params.get('rating');
        if (rating) {
            this.currentFilters.rating = rating;
            const ratingRadio = document.getElementById(`rating_${rating}`);
            if (ratingRadio) {
                ratingRadio.checked = true;
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

        // Load price parameters
        const priceMin = params.get('price_min');
        const priceMax = params.get('price_max');
        
        if (priceMin) {
            this.currentFilters.priceMin = priceMin;
            if (this.elements.minPrice) this.elements.minPrice.value = priceMin;
            if (this.elements.rangeMin) this.elements.rangeMin.value = priceMin;
        }
        
        if (priceMax) {
            this.currentFilters.priceMax = priceMax;
            if (this.elements.maxPrice) this.elements.maxPrice.value = priceMax;
            if (this.elements.rangeMax) this.elements.rangeMax.value = priceMax;
        }
        
        // Update slider track after loading parameters
        this.updateSliderTrack();
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
        // Update categories
        this.currentFilters.categories = this.getCheckedValues(this.elements.categoryCheckboxes);

        // Update options
        this.currentFilters.options = this.getCheckedValues(this.elements.optionCheckboxes);

        // Update colors
        this.currentFilters.colors = this.getCheckedValues(this.elements.colorCheckboxes);

        // Update sizes
        this.currentFilters.sizes = this.getCheckedValues(this.elements.sizeCheckboxes);

        // تحديث التقييم
        this.currentFilters.rating = this.getSelectedRating();

        // Update price range
        this.currentFilters.priceMin = this.elements.minPrice?.value || null;
        this.currentFilters.priceMax = this.elements.maxPrice?.value || null;

        // Update search
        this.currentFilters.search = this.elements.searchInput?.value.trim() || '';

        // Reset to first page when filters change
        this.currentFilters.page = 1;
        this.currentPage = 1;
    }

    getCheckedValues(checkboxes) {
        if (!checkboxes) return [];
        return Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    // دالة جديدة للحصول على التقييم المختار
    getSelectedRating() {
        if (!this.elements.ratingRadios) return null;
        
        const selectedRadio = Array.from(this.elements.ratingRadios).find(radio => radio.checked);
        return selectedRadio ? selectedRadio.value : null;
    }

    applyFilters() {
        this.updateCurrentFilters();
        this.loadProducts();
        this.updateUrl();
    }

    resetFilters() {
        // Clear all checkboxes
        const checkboxTypes = ['categoryCheckboxes', 'optionCheckboxes', 'colorCheckboxes', 'sizeCheckboxes'];
        checkboxTypes.forEach(type => {
            if (this.elements[type]) {
                this.elements[type].forEach(cb => cb.checked = false);
            }
        });

        // مسح التقييم المختار
        if (this.elements.ratingRadios) {
            this.elements.ratingRadios.forEach(radio => radio.checked = false);
        }

        // Reset price inputs
        if (this.elements.minPrice) this.elements.minPrice.value = this.config.PRICE_MIN_DEFAULT;
        if (this.elements.maxPrice) this.elements.maxPrice.value = this.config.PRICE_MAX_DEFAULT;
        if (this.elements.rangeMin) this.elements.rangeMin.value = this.config.PRICE_MIN_DEFAULT;
        if (this.elements.rangeMax) this.elements.rangeMax.value = this.config.PRICE_MAX_DEFAULT;
        
        // Update slider tracks
        this.updateSliderTrack();
        this.updatePriceRange();

        // Reset sort
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = 'default';
            this.currentFilters.sort = 'default';
        }

        // Reset search
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }

        // Reset filters object
        this.currentFilters = {
            categories: [],
            options: [],
            colors: [],
            sizes: [],
            priceMin: null,
            priceMax: null,
            rating: null, // إعادة تعيين التقييم
            search: '',
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
            if (this.currentFilters.sort === 'bestseller') {
                const data = await this.fetchBestSellers();
                const products = this.ensureArray(data);
                this.renderProducts(products);
                this.totalProducts = products.length;
                this.updateProductCount();
                this.hidePagination();
            } else {
                const data = await this.fetchProducts();
                const products = this.ensureArray(data.results || data);
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

    ensureArray(data) {
        return Array.isArray(data) ? data : [];
    }

    async fetchProducts() {
        const params = this.buildProductParams();
        const url = `${mainDomain}/products/products-list/shop/?${params.toString()}`;

        const response = await this.makeRequest(url);
        const responseData = await response.json();
        
        if (!responseData || typeof responseData !== 'object') {
            console.warn('Invalid response format:', responseData);
            return { results: [], count: 0 };
        }

        return responseData;
    }

    buildProductParams() {
        const params = new URLSearchParams();
        
        const paramMap = {
            categories: 'category',
            options: 'option',
            colors: 'color',
            sizes: 'size',
            search: 'name'
        };

        // Add filter parameters
        Object.keys(paramMap).forEach(filterKey => {
            const paramKey = paramMap[filterKey];
            const filterValue = this.currentFilters[filterKey];
            
            if (Array.isArray(filterValue) && filterValue.length > 0) {
                params.append(paramKey, filterValue.join(','));
            } else if (filterValue && typeof filterValue === 'string') {
                params.append(paramKey, filterValue);
            }
        });
        
        // إضافة parameter التقييم
        if (this.currentFilters.rating) {
            params.append('rating', this.currentFilters.rating);
        }
        
        // Add price parameters
        if (this.currentFilters.priceMin) {
            params.append('price_min', this.currentFilters.priceMin);
        }
        
        if (this.currentFilters.priceMax) {
            params.append('price_max', this.currentFilters.priceMax);
        }
        
        // Add sorting
        this.addSortingParams(params);
        
        params.append('page', this.currentPage);
        
        return params;
    }

    addSortingParams(params) {
        if (this.currentFilters.sort && this.currentFilters.sort !== 'default') {
            const sortMap = {
                'price_asc': 'price',
                'price_desc': '-price',
                'rating': '-average_rating'
            };
            
            const ordering = sortMap[this.currentFilters.sort];
            if (ordering) {
                params.append('ordering', ordering);
            }
        }
    }

    async fetchBestSellers() {
        const url = `${mainDomain}/products/api/bestseller/`;
        const response = await this.makeRequest(url);
        const data = await response.json();
        
        if (!data) {
            console.warn('No data received from bestsellers API');
            return [];
        }

        return data;
    }

    async makeRequest(url) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const csrfToken = this.getCookie('csrftoken');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken;
        }

        // استخدام fetchWithAuth بدلاً من fetch العادي
        const response = await fetchWithAuth(url, {
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

        return response;
    }

    renderProducts(products) {
        const productSection = this.elements.productSection;
        if (!productSection) return;

        productSection.innerHTML = '';

        if (!Array.isArray(products)) {
            console.warn('Products is not an array:', products);
            products = [];
        }

        if (products.length === 0) {
            this.renderEmptyState();
            return;
        }

        productSection.classList.remove('empty');
        products.forEach(product => {
            if (this.isValidProduct(product)) {
                const productHTML = this.createProductHTML(product);
                productSection.insertAdjacentHTML('beforeend', productHTML);
            } else {
                console.warn('Invalid product data:', product);
            }
        });

        this.bindProductEvents();
    }

    isValidProduct(product) {
        return product && typeof product === 'object' && product.id;
    }

    renderEmptyState() {
        const productSection = this.elements.productSection;
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
    }

    createProductHTML(product) {
        const hasDiscount = product.old_price && product.discount && parseFloat(product.discount) > 0;
        const displayPrice = product.price || 0;
        const rating = product.average_rating || 0;
        const totalReviews = product.total_reviews || 0;
        const imageUrl = product.image_1 || '/static/imges/default-product.jpg';
        
        const isInCart = product.in_cart;
        const isInWishlist = product.in_favorites;

        const fullName = product.name || '';
        const shortName = fullName.length > 100 ? fullName.substring(0, 100) + '...' : fullName;

        return `
            <div class="product-box" data-product-id="${product.id}">
                <div class="shop-img" onclick="shopManager.viewProductDetails('${product.id}')">
                    <img src="${imageUrl}" alt="${this.escapeHtml(fullName)}" loading="lazy">
                    ${hasDiscount ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                </div>
                <div class="shop-wishlist ${isInWishlist ? 'wishlist-active' : ''}" onclick="shopManager.addToWishlist('${product.id}')">
                    <i class="bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'}"></i>
                </div>
                <div class="shop-name" title="${this.escapeHtml(fullName)}">${this.escapeHtml(shortName)}</div>
                <div class="shop-rating">
                    ${this.generateStarRating(rating)}
                    <span>(${rating} - ${totalReviews} reviews)</span>
                </div>
                <div class="price-shop">
                    <span class="products-main-price">${currencySymbol}${displayPrice}</span>
                    ${product.old_price && parseFloat(product.old_price) > parseFloat(displayPrice) ? 
                        `<span class="products-old-price">${currencySymbol}${product.old_price}</span>` : ''}
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
                ellipsis.className = 'pagination-ellipsis';
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
                ellipsis.className = 'pagination-ellipsis';
                paginationNumbers.appendChild(ellipsis);
            }
            this.addPageButton(this.totalPages);
        }
    }

    addPageButton(page) {
        const paginationNumbers = this.elements.paginationNumbers;
        const pageBtn = document.createElement('button');
        pageBtn.textContent = page;
        pageBtn.className = `pagination-btn ${page === this.currentPage ? 'active' : ''}`;
        pageBtn.addEventListener('click', () => this.goToPage(page));
        pageBtn.setAttribute('aria-label', `Go to page ${page}`);
        paginationNumbers.appendChild(pageBtn);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.currentFilters.page = page;
        this.loadProducts();
        this.updateUrl();
        
        // Scroll to top of products section
        if (this.elements.productSection) {
            this.elements.productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async addToCart(productId) {
        if (!productId) return;

        try {
            const response = await fetchWithAuth('/orders/add-to-cart/', {
                method: 'POST',
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
            if (error.message.includes('Session expired')) {
                this.showAuthMessage();
            } else {
                this.showNotification('Failed to add product to cart', 'error');
            }
        }
    }

    async addToWishlist(productId) {
        if (!productId) return;

        try {
            const response = await fetchWithAuth('/orders/add-to-wishlist/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify({ product_id: productId })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification(data.message, 'success');
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
            if (error.message.includes('Session expired')) {
                this.showAuthMessage();
            } else {
                this.showNotification('Failed to add product to wishlist', 'error');
            }
        }
    }

    viewProductDetails(productId) {
        if (productId) {
            window.location.href = `/product-details/${String(productId)}`;
        }
    }

    updateCartCount() {
        // Update cart count in header if element exists
        const cartCountElement = document.querySelector('.cart-count, .header-cart-count');
        if (cartCountElement) {
            // You might want to fetch the actual cart count from the server
            // For now, we'll just increment the current count
            const currentCount = parseInt(cartCountElement.textContent) || 0;
            cartCountElement.textContent = currentCount + 1;
        }
    }

    updateCartButton(productId, isInCart) {
        const productBox = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productBox) return;

        const cartButton = productBox.querySelector('.add-to-cart-btn');
        if (!cartButton) return;

        const icon = cartButton.querySelector('i');
        const textSpan = cartButton.querySelector('span:first-child');

        if (isInCart) {
            cartButton.classList.add('in-cart');
            cartButton.disabled = true;
            if (textSpan) textSpan.textContent = 'Already in Cart';
            if (icon) {
                icon.classList.remove('bi-cart-plus');
                icon.classList.add('bi-cart-check');
            }
        } else {
            cartButton.classList.remove('in-cart');
            cartButton.disabled = false;
            if (textSpan) textSpan.textContent = 'Add To Cart';
            if (icon) {
                icon.classList.remove('bi-cart-check');
                icon.classList.add('bi-cart-plus');
            }
        }
    }

    updateWishlistIcon(productId, isInWishlist) {
        const productBox = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productBox) return;

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

    showLoading() {
        const productSection = this.elements.productSection;
        if (!productSection) return;

        productSection.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading products...</p>
            </div>
        `;
        productSection.style.display = 'flex';
        productSection.style.alignItems = 'center';
        productSection.style.justifyContent = 'center';
        productSection.style.minHeight = '300px';
    }

    hideLoading() {
        const productSection = this.elements.productSection;
        if (!productSection) return;

        productSection.style.display = 'grid';
        productSection.style.alignItems = '';
        productSection.style.justifyContent = '';
        productSection.style.minHeight = '';
        
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }

    showAuthMessage() {
        const authAlert = document.createElement("div");
        authAlert.className = "auth-alert auth-alert-warning";
        authAlert.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="margin-right:8px;"></i>
            Please log in to perform this action.
        `;

        document.body.appendChild(authAlert);

        setTimeout(() => authAlert.classList.add("auth-alert-show"), 50);
        setTimeout(() => {
            authAlert.classList.remove("auth-alert-show");
            setTimeout(() => authAlert.remove(), 500);
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
        // Remove existing notification
        const existingNotification = document.getElementById('notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = `notification ${type}`;

        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        notification.innerHTML = `
            <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
            <span>${this.escapeHtml(message)}</span>
            <button class="notification-close" aria-label="Close notification">
                <i class="fa-solid fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    updateUrl() {
        const params = new URLSearchParams();
        
        if (this.currentFilters.search) {
            params.append('search', this.currentFilters.search);
        }
        
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
        
        // إضافة parameter التقييم إلى URL
        if (this.currentFilters.rating) {
            params.append('rating', this.currentFilters.rating);
        }
        
        if (this.currentFilters.priceMin) {
            params.append('price_min', this.currentFilters.priceMin);
        }
        
        if (this.currentFilters.priceMax) {
            params.append('price_max', this.currentFilters.priceMax);
        }
        
        if (this.currentFilters.sort !== 'default') {
            params.append('sort', this.currentFilters.sort);
        }
        
        if (this.currentPage > 1) {
            params.append('page', this.currentPage);
        }

        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState(null, '', newUrl);
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

// Enhanced Price Range Slider Class
class PriceRangeSlider {
    constructor(shopManager) {
        this.shopManager = shopManager;
        this.elements = {
            rangeMin: document.getElementById("range-min"),
            rangeMax: document.getElementById("range-max"),
            minPrice: document.getElementById("min-price"),
            maxPrice: document.getElementById("max-price"),
            sliderTrack: document.querySelector(".slider-track")
        };
        
        this.config = {
            minGap: 0
        };
        
        this.init();
    }

    init() {
        if (!this.elements.rangeMin || !this.elements.rangeMax) return;
        
        this.bindEvents();
        this.updateSliderTrack();
    }

    bindEvents() {
        // Range sliders
        this.elements.rangeMin.addEventListener("input", () => this.handleRangeChange('min'));
        this.elements.rangeMax.addEventListener("input", () => this.handleRangeChange('max'));
        
        // Price inputs
        this.elements.minPrice.addEventListener("input", () => this.handlePriceInputChange('min'));
        this.elements.maxPrice.addEventListener("input", () => this.handlePriceInputChange('max'));
        
        // Prevent form submission
        [this.elements.minPrice, this.elements.maxPrice].forEach(input => {
            if (input) {
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") e.preventDefault();
                });
            }
        });
    }

    handleRangeChange(type) {
        const minVal = parseInt(this.elements.rangeMin.value);
        const maxVal = parseInt(this.elements.rangeMax.value);
        
        if (type === 'min') {
            if (maxVal - minVal <= this.config.minGap) {
                this.elements.rangeMin.value = maxVal - this.config.minGap;
            }
            this.elements.minPrice.value = this.elements.rangeMin.value;
        } else {
            if (maxVal - minVal <= this.config.minGap) {
                this.elements.rangeMax.value = minVal + this.config.minGap;
            }
            this.elements.maxPrice.value = this.elements.rangeMax.value;
        }
        
        this.updateSliderTrack();
    }

    handlePriceInputChange(type) {
        const input = this.elements[`${type}Price`];
        const range = this.elements[`range${type.charAt(0).toUpperCase() + type.slice(1)}`];
        
        let value = parseInt(input.value);
        
        if (isNaN(value)) {
            value = type === 'min' ? 0 : 10000;
        }
        
        // Clamp to range limits
        const min = parseInt(range.min) || 0;
        const max = parseInt(range.max) || 10000;
        value = Math.min(Math.max(value, min), max);
        
        // Handle gap constraint
        if (type === 'min') {
            const maxValue = parseInt(this.elements.maxPrice.value);
            if (value > maxValue - this.config.minGap) {
                value = maxValue - this.config.minGap;
            }
        } else {
            const minValue = parseInt(this.elements.minPrice.value);
            if (value < minValue + this.config.minGap) {
                value = minValue + this.config.minGap;
            }
        }
        
        input.value = value;
        range.value = value;
        this.updateSliderTrack();
    }

    updateSliderTrack() {
        if (!this.elements.sliderTrack) return;
        
        const maxRange = parseInt(this.elements.rangeMax.max) || 10000;
        const percent1 = (this.elements.rangeMin.value / maxRange) * 100;
        const percent2 = (this.elements.rangeMax.value / maxRange) * 100;
        
        this.elements.sliderTrack.style.background = `linear-gradient(to right, 
            #d7dcdf ${percent1}%, 
            #3348FF ${percent1}%, 
            #3348FF ${percent2}%, 
            #d7dcdf ${percent2}%)`;
    }
}

// Global variables and initialization
let shopManager;
let priceSlider;

document.addEventListener('DOMContentLoaded', () => {
    shopManager = new ShopManager();
    priceSlider = new PriceRangeSlider(shopManager);
});

// Legacy function support for backward compatibility
function AddToCart(product_id) {
    if (shopManager) {
        shopManager.addToCart(product_id);
    }
}

function AddToWishlist(product_id) {
    if (shopManager) {
        shopManager.addToWishlist(product_id);
    }
}

function viewProductdetailes(productId) {
    if (shopManager) {
        shopManager.viewProductDetails(productId);
    }
}

function getCookie(name) {
    return shopManager ? shopManager.getCookie(name) : '';
}

// Global mobile filter functions
function hidefilterforphonesection() {
    if (shopManager) {
        shopManager.hideMobileFilter();
    }

}
document.querySelectorAll('.color-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const container = this.closest('.filter-item-color');
        if(this.checked){
            container.style.border = '2px solid var(--main-color)';
        } else {
            container.style.border = '1px solid #ccc';
        }
    });
});
