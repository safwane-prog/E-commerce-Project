// Enhanced Shop JavaScript with better error handling, performance, and functionality
const params = new URLSearchParams(window.location.search);
const searchValue = params.get('search');     // safwane
const categoryId = params.get('category');   // 1



document.getElementById('searsh-head-inpur').value = searchValue
// قراءة الـ query string من الرابط

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
            priceMin: null,
            priceMax: null,
            search: '',
            page: 1
        };
        
        this.isLoading = false;
        this.currentPage = 1;
        this.totalPages = 1;
        this.debounceTimer = null;

        // Cache DOM elements for performance
        this.elements = {
            categoryCheckboxes: document.querySelectorAll('.category-checkbox'),
            optionCheckboxes: document.querySelectorAll('.option-checkbox'),
            minPrice: document.getElementById('min-price'),
            maxPrice: document.getElementById('max-price'),
            applyFilterBtn: document.getElementById('apply-filter-btn'),
            resetFilterBtn: document.getElementById('reset-filter-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            productSection: document.getElementById('product-section'),
            paginationNumbers: document.getElementById('pagination-numbers'),
            loadingIndicator: document.getElementById('loading-indicator'),
            searchInput: document.getElementById('search-head-input'),
            rangeLeft: document.getElementById('price-range-left'),
            rangeRight: document.getElementById('price-range-right'),
            rangeFill: document.querySelector('.range-fill')
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUrlParameters();
        this.loadProducts();
    }

    bindEvents() {
        // Filter checkboxes using cached elements
        this.elements.categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        this.elements.optionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleFilterChange());
        });

        // Price inputs with debouncing
        if (this.elements.minPrice) {
            this.elements.minPrice.addEventListener('input', () => this.debounceFilterChange());
        }

        if (this.elements.maxPrice) {
            this.elements.maxPrice.addEventListener('input', () => this.debounceFilterChange());
        }

        // Search input with debouncing
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => this.debounceFilterChange());
        }

        // Filter buttons
        if (this.elements.applyFilterBtn) {
            this.elements.applyFilterBtn.addEventListener('click', () => this.applyFilters());
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
                // نحصل على id الفئة المضغوط عليها
                const categoryId = e.currentTarget.dataset.categoryId;

                // نستدعي الفلترة مع استبدال أي ID قديم
                this.filterByCategory(categoryId);
            });
        });


        // Price range slider sync
        if (this.elements.minPrice && this.elements.maxPrice && this.elements.rangeFill) {
            const updateRangeFill = () => {
                const min = parseFloat(this.elements.minPrice.value) || this.config.PRICE_MIN_DEFAULT;
                const max = parseFloat(this.elements.maxPrice.value) || this.config.PRICE_MAX_DEFAULT;
                const rangeMin = parseFloat(this.elements.minPrice.min) || this.config.PRICE_MIN_DEFAULT;
                const rangeMax = parseFloat(this.elements.maxPrice.max) || this.config.PRICE_MAX_DEFAULT;

                const leftPercent = ((min - rangeMin) / (rangeMax - rangeMin)) * 100;
                const rightPercent = ((max - rangeMin) / (rangeMax - rangeMin)) * 100;

                this.elements.rangeFill.style.left = `${leftPercent}%`;
                this.elements.rangeFill.style.width = `${rightPercent - leftPercent}%`;
            };

            this.elements.minPrice.addEventListener('input', updateRangeFill);
            this.elements.maxPrice.addEventListener('input', updateRangeFill);

            // Initial update
            updateRangeFill();
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
        // Auto-apply filters can be enabled here if desired
        // this.applyFilters();
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
        // Clear all checkboxes
        this.elements.categoryCheckboxes.forEach(cb => cb.checked = false);
        this.elements.optionCheckboxes.forEach(cb => cb.checked = false);

        // Reset price inputs
        if (this.elements.minPrice) this.elements.minPrice.value = this.config.PRICE_MIN_DEFAULT;
        if (this.elements.maxPrice) this.elements.maxPrice.value = this.config.PRICE_MAX_DEFAULT;

        // Reset filters object
        this.currentFilters = {
            categories: [],
            options: [],
            priceMin: null,
            priceMax: null,
            search: this.currentFilters.search, // Keep search term
            page: 1
        };

        this.currentPage = 1;
        this.loadProducts();
        this.updateUrl();
    }

    filterByCategory(categoryId) {
        // إلغاء تحديد كل checkboxes الخاصة بالفئات
        document.querySelectorAll('input[type="checkbox"][id^="category_"]').forEach(cb => {
            cb.checked = false;
        });

        // تحديد checkbox الخاص بالفئة الجديدة فقط
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
            const data = await this.fetchProducts();
            this.renderProducts(data.results || []);
            this.updatePagination(data);
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
        
        if (this.currentFilters.priceMin) {
            params.append('price_min', this.currentFilters.priceMin);
        }
        
        if (this.currentFilters.priceMax) {
            params.append('price_max', this.currentFilters.priceMax);
        }
        
        if (this.currentFilters.search) {
            params.append('name', this.currentFilters.search);
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

        return await response.json();
    }

    renderProducts(products) {
        const productSection = this.elements.productSection;
        if (!productSection) return;

        productSection.innerHTML = '';

        if (!products || products.length === 0) {
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
        }

        products.forEach(product => {
            const productHTML = this.createProductHTML(product);
            productSection.insertAdjacentHTML('beforeend', productHTML);
        });

        // Re-bind event listeners for dynamically added elements
        this.bindProductEvents();
    }

    createProductHTML(product) {
        const hasDiscount = product.old_price && product.discount;
        const displayPrice = product.price || 0;
        const rating = product.average_rating || 0;
        const imageUrl = product.image_1 || '/static/imges/default-product.jpg';

        return `
            <div class="product-box" data-product-id="${product.id}">
                <div class="shop-img" onclick="shopManager.viewProductDetails('${product.id}')">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                    ${hasDiscount ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                </div>
                <div class="shop-wishlist" onclick="shopManager.addToWishlist('${product.id}')">
                    <i class="bi bi-heart"></i>
                </div>
                <div class="shop-name" title="${product.name}">${product.name}</div>
                <div class="shop-rating">
                    ${this.generateStarRating(rating)}
                    <span>(${rating})</span>
                </div>
                <div class="price-shop">
                    <span class="products-main-price">${currencySymbol}${displayPrice}</span>
                    ${product.old_price ? `<span class="products-old-price">${currencySymbol}${product.old_price}</span>` : ''}
                </div>
                <div class="shop-buttons">
                    <button onclick="shopManager.addToCart('${product.id}')" class="add-to-cart-btn">
                        Add To Cart 
                        <span><img src="/static/imges/icon/Style=Stroke, Type=Rounded (2).svg" alt="cart"></span>
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
                this.updateWishlistIcon(productId, true);
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
        // For now, navigate; can be updated to modal if needed
        window.location.href = `/product-details/${String(productId)}`;
    }

    updateCartCount() {
        // Implement if cart counter exists, e.g., fetch cart count from server
    }

    updateWishlistIcon(productId, isInWishlist) {
        const productBox = document.querySelector(`[data-product-id="${productId}"]`);
        if (productBox) {
            const heartIcon = productBox.querySelector('.shop-wishlist i');
            if (heartIcon) {
                heartIcon.className = isInWishlist ? 'bi bi-heart-fill' : 'bi bi-heart';
            }
        }
    }

    showLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'block';
        }
    }

    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }
    showAuthMessage() {
        // إنشاء عنصر الإشعار
        const authAlert = document.createElement("div");
        authAlert.className = "auth-alert auth-alert-warning";

        // إضافة أيقونة مع النص
        authAlert.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="margin-right:8px;"></i>
            Please log in to perform this action.
        `;

        // إضافته للصفحة
        document.body.appendChild(authAlert);

        // إظهار الإشعار بتأثير الإزاحة بعد قليل
        setTimeout(() => {
            authAlert.classList.add("auth-alert-show");
        }, 50);

        // إخفاؤه بعد 4 ثوانٍ
        setTimeout(() => {
            authAlert.classList.remove("auth-alert-show");
            // إزالة العنصر بعد انتهاء التأثير
            setTimeout(() => {
                authAlert.remove();
            }, 500);
        }, 4000);
    }



    showError(message) {
        const productSection = this.elements.productSection;
        if (productSection) {
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

    // استخدام innerHTML لإضافة رسالة مع أيقونة
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