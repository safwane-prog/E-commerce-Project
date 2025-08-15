/**
 * Enhanced Product Details Management
 * Updated to handle the complete JSON response from the API
 */

class ProductDetailsManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.mainSwiper = null;
        this.thumbsSwiper = null;
        this.isLoading = false;
        this.productData = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Extract product ID from URL
     */
    getProductIdFromUrl() {
        const url = window.location.href;
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    /**
     * Initialize the product details page
     */
    async init() {
        try {
            this.bindEvents();
            await this.fetchProductDetails();
        } catch (error) {
            console.error('Failed to initialize product details:', error);
            this.showNotification('Failed to load product details', 'error');
        }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Add to cart button
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddToCart();
            });
        }

        // Add to wishlist button
        const addToWishlistBtn = document.querySelector('.add-Saved-btn');
        if (addToWishlistBtn) {
            addToWishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddToWishlist();
            });
        }

        // Quantity controls
        const incrementBtn = document.querySelector('.qty-btn[onclick*="increment"]');
        const decrementBtn = document.querySelector('.qty-btn[onclick*="decrement"]');
        
        if (incrementBtn) {
            incrementBtn.addEventListener('click', () => this.incrementQuantity());
        }
        if (decrementBtn) {
            decrementBtn.addEventListener('click', () => this.decrementQuantity());
        }

        // Order form submission
        const submitBtn = document.querySelector('.submit-button');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleConfirmOrder();
            });
        }
    }

    /**
     * Show/hide loading spinner
     */
    toggleLoader(show = true) {
        const loader = document.querySelector('.spinre');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
        this.isLoading = show;
    }

    /**
     * Fetch product details from API
     */
    async fetchProductDetails() {
        if (this.isLoading) return;
        
        try {
            this.toggleLoader(true);
            
            const response = await fetch(`${mainDomain}products/details/${this.productId}/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Product data:', data);
            
            this.productData = data;
            this.renderProductDetails(data);
            this.renderProductImages(data);
            this.renderRatingInfo(data);
            
        } catch (error) {
            console.error('Error fetching product details:', error);
            this.showNotification('Failed to load product details', 'error');
        } finally {
            this.toggleLoader(false);
        }
    }

    /**
     * Render product images and initialize Swiper
     */
    renderProductImages(data) {
        try {
            // Get all image fields from the API response
            const images = [];
            for (let i = 1; i <= 10; i++) {
                const imageKey = `image_${i}`;
                if (data[imageKey]) {
                    images.push(data[imageKey]);
                }
            }

            if (images.length === 0) {
                console.warn('No images found for product');
                // Use a default image if no images are available
                images.push('/static/imges/istockphoto-1147544807-612x612.jpg');
            }

            const mainWrapper = document.getElementById('main-image-wrapper');
            const thumbsWrapper = document.getElementById('thumbs-wrapper');

            if (!mainWrapper || !thumbsWrapper) {
                console.warn('Image wrapper elements not found');
                return;
            }

            // Clear existing content
            mainWrapper.innerHTML = '';
            thumbsWrapper.innerHTML = '';

            // Add images to main slider
            images.forEach((src, index) => {
                const mainSlide = document.createElement('div');
                mainSlide.className = 'swiper-slide';
                mainSlide.innerHTML = `<img src="${src}" alt="Product image ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">`;
                mainWrapper.appendChild(mainSlide);

                const thumbSlide = document.createElement('div');
                thumbSlide.className = 'swiper-slide';
                thumbSlide.innerHTML = `<img src="${src}" alt="Product thumbnail ${index + 1}" loading="lazy">`;
                thumbsWrapper.appendChild(thumbSlide);
            });

            // Initialize Swiper with responsive settings
            this.initializeSwiper();

        } catch (error) {
            console.error('Error rendering product images:', error);
        }
    }

    /**
     * Initialize Swiper with responsive configuration
     */
    initializeSwiper() {
        try {
            // Destroy existing swipers
            if (this.thumbsSwiper) this.thumbsSwiper.destroy(true, true);
            if (this.mainSwiper) this.mainSwiper.destroy(true, true);

            // Initialize thumbnails swiper
            this.thumbsSwiper = new Swiper('.thumbs-swiper', {
                spaceBetween: 10,
                slidesPerView: 'auto',
                freeMode: true,
                watchSlidesProgress: true,
                breakpoints: {
                    320: {
                        slidesPerView: 3,
                        spaceBetween: 8
                    },
                    768: {
                        slidesPerView: 5,
                        spaceBetween: 10
                    }
                }
            });

            // Initialize main swiper
            this.mainSwiper = new Swiper('.main-swiper', {
                spaceBetween: 10,
                thumbs: { 
                    swiper: this.thumbsSwiper 
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                keyboard: {
                    enabled: true,
                },
                touchRatio: 1,
                touchAngle: 45,
                grabCursor: true
            });

        } catch (error) {
            console.error('Error initializing Swiper:', error);
        }
    }

    /**
     * Render product details with enhanced data handling
     */
    renderProductDetails(data) {
        try {
            // Basic product information
            this.setElementText('products-name-section', data.name);
            
            // Format prices with currency
            const currency = window.currencySymbol || '$';
            this.setElementText('products-main-price', `${data.price}${currency}`);
            
            // Handle old price - only show if different from main price
            if (data.old_price && parseFloat(data.old_price) > parseFloat(data.price)) {
                this.setElementText('products-old-price', `${data.old_price}${currency}`);
                
                // Calculate and display discount percentage
                const discountPercent = Math.round(((parseFloat(data.old_price) - parseFloat(data.price)) / parseFloat(data.old_price)) * 100);
                this.setElementText('products-descounte-count', discountPercent.toString());
            } else {
                // Hide discount section if no valid old price
                const discountSection = document.querySelector('.products-descounte');
                if (discountSection) {
                    discountSection.style.display = 'none';
                }
            }

            // Descriptions
            this.setElementText('product-description-main', data.description_1);
            this.setElementText('desctiption_1', data.description_1);
            this.setElementText('desctiption_2', data.description_2);
            this.setElementText('desctiption_3', data.description_3);

            // Sales count in orders section
            const ordersCount = document.querySelector('.orsers-count span:nth-child(2)');
            if (ordersCount && data.sales_count) {
                ordersCount.textContent = data.sales_count;
            }

            // Render product options
            this.renderProductOptions(data);
            
        } catch (error) {
            console.error('Error rendering product details:', error);
        }
    }

    /**
     * Render rating and review information
     */
    renderRatingInfo(data) {
        try {
            // Update main rating display
            const ratingElement = document.querySelector('.range-count');
            if (ratingElement && data.average_rating !== undefined) {
                ratingElement.textContent = data.average_rating.toFixed(1);
            }

            // Update "out of 5" rating
            const outOfElement = document.querySelector('.out-of');
            if (outOfElement && data.average_rating !== undefined) {
                outOfElement.textContent = `${data.average_rating.toFixed(1)} out of 5`;
            }

            // Update total reviews count
            const globalRatingElement = document.querySelector('.review-section-title-2');
            if (globalRatingElement && data.total_reviews !== undefined) {
                globalRatingElement.textContent = `${data.total_reviews} global ratings`;
            }

            // Update star ratings display
            this.updateStarRating(data.average_rating);

            // Update ratings breakdown bars
            if (data.ratings_breakdown) {
                this.updateRatingsBars(data.ratings_breakdown, data.total_reviews);
            }

        } catch (error) {
            console.error('Error rendering rating info:', error);
        }
    }

    /**
     * Update star rating display
     */
    updateStarRating(rating) {
        const starContainers = document.querySelectorAll('.range-stars, .review-section-title div');
        
        starContainers.forEach(container => {
            const stars = container.querySelectorAll('i[class*="star"]');
            stars.forEach((star, index) => {
                if (index < Math.floor(rating)) {
                    star.className = star.className.replace('bi-star-fill2', '').replace('bi bi-star-fill', 'bi bi-star-fill');
                } else if (index < rating) {
                    star.className = 'bi bi-star-half';
                } else {
                    star.className = 'bi bi-star-fill bi-star-fill2';
                }
            });
        });
    }

    /**
     * Update ratings breakdown bars
     */
    updateRatingsBars(breakdown, totalReviews) {
        const ratingInfos = document.querySelectorAll('.review-info');
        
        ratingInfos.forEach((info, index) => {
            const ratingNumber = 5 - index; // 5 stars, 4 stars, etc.
            const count = breakdown[ratingNumber] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            const bar = info.querySelector('.review-info-dev-range');
            if (bar) {
                bar.style.width = `${percentage}%`;
            }
        });
    }

    /**
     * Safely set element text content
     */
    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element && text) {
            element.textContent = text;
        }
    }

    /**
     * Render product options (colors, sizes, options) with enhanced data handling
     */
    renderProductOptions(data) {
        // Colors
        this.renderColorOptions(data.color || []);
        // Sizes  
        this.renderSizeOptions(data.size || []);
        // Other options
        this.renderOtherOptions(data.options || []);
    }

    /**
     * Render color options with enhanced handling
     */
    renderColorOptions(colors) {
        const colorSection = document.getElementById('product-color-section-sectopn');
        const colorContainer = document.getElementById('main-color-section-box');
        
        if (!colors || colors.length === 0) {
            if (colorSection) colorSection.style.display = 'none';
            return;
        }

        if (colorSection) colorSection.style.display = 'block';

        if (colorContainer) {
            colorContainer.innerHTML = '';
            colors.forEach((color, index) => {
                const inputId = `color-${color.id}`;
                const colorValue = color.name.startsWith('#') ? color.name : color.name.toLowerCase();
                
                const colorHtml = `
                    <input type="radio" id="${inputId}" name="color" value="${color.name}" class="option-input">
                    <label for="${inputId}" class="color-label" style="background-color: ${colorValue};" 
                           title="${color.name}" aria-label="Color: ${color.name}"></label>
                `;
                colorContainer.innerHTML += colorHtml;
            });
        }
    }

    /**
     * Render size options with enhanced handling
     */
    renderSizeOptions(sizes) {
        const sizeSection = document.getElementById('product-size-section-sectopn');
        const sizeContainer = document.getElementById('main-size-section-box');
        
        if (!sizes || sizes.length === 0) {
            if (sizeSection) sizeSection.style.display = 'none';
            return;
        }

        if (sizeSection) sizeSection.style.display = 'block';

        if (sizeContainer) {
            sizeContainer.innerHTML = '';
            sizes.forEach((size, index) => {
                const inputId = `size-${size.id}`;
                const sizeHtml = `
                    <input type="radio" id="${inputId}" name="size" value="${size.name}" class="option-input">
                    <label for="${inputId}" class="size-label" aria-label="Size: ${size.name}">${size.name}</label>
                `;
                sizeContainer.innerHTML += sizeHtml;
            });
        }
    }

    /**
     * Render other options with enhanced handling
     */
    renderOtherOptions(options) {
        const optionSection = document.getElementById('product-option-section-sectopn');
        const optionContainer = document.getElementById('main-option-section-box');
        
        if (!options || options.length === 0) {
            if (optionSection) optionSection.style.display = 'none';
            return;
        }

        if (optionSection) optionSection.style.display = 'block';

        if (optionContainer) {
            optionContainer.innerHTML = '';
            options.forEach((option, index) => {
                const inputId = `option-${option.id}`;
                const optionHtml = `
                    <input type="radio" id="${inputId}" name="option" value="${option.name}" class="option-input">
                    <label for="${inputId}" class="option-label" aria-label="Option: ${option.name}">${option.name}</label>
                `;
                optionContainer.innerHTML += optionHtml;
            });
        }
    }

    /**
     * Enhanced validation with better error handling
     */
    validateOptions() {
        const optionSections = [
            { id: 'product-color-section-sectopn', name: 'color', displayName: 'Color' },
            { id: 'product-size-section-sectopn', name: 'size', displayName: 'Size' },
            { id: 'product-option-section-sectopn', name: 'option', displayName: 'Option' }
        ];

        let hasError = false;
        let firstErrorElement = null;

        // Clear previous errors
        this.clearOptionErrors();

        optionSections.forEach(section => {
            const sectionEl = document.getElementById(section.id);
            if (sectionEl && sectionEl.style.display !== 'none') {
                const inputs = sectionEl.querySelectorAll(`input[name="${section.name}"]`);
                if (inputs.length > 0) {
                    const checked = sectionEl.querySelector(`input[name="${section.name}"]:checked`);
                    if (!checked) {
                        this.showOptionError(sectionEl, `Please select a ${section.displayName.toLowerCase()}`);
                        hasError = true;
                        if (!firstErrorElement) firstErrorElement = sectionEl;
                    }
                }
            }
        });

        if (hasError && firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return !hasError;
    }

    /**
     * Clear option validation errors
     */
    clearOptionErrors() {
        const errorElements = document.querySelectorAll('.option-error');
        errorElements.forEach(error => error.remove());
    }

    /**
     * Show option validation error
     */
    showOptionError(sectionElement, message) {
        const errorId = `error-${Date.now()}`;
        const errorEl = document.createElement('div');
        errorEl.id = errorId;
        errorEl.className = 'option-error error-message';
        errorEl.textContent = message;
        errorEl.style.color = '#ef4444';
        errorEl.style.fontSize = '0.875rem';
        errorEl.style.marginTop = '5px';
        sectionElement.appendChild(errorEl);
    }

    /**
     * Handle add to cart action with enhanced data
     */
    async handleAddToCart() {
        try {
            if (!this.validateOptions()) {
                return;
            }

            const quantityEl = document.getElementById('quantity');
            const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

            const selectedOptions = this.getSelectedOptions();

            const payload = {
                product_id: this.productData.id || this.productId,
                quantity: quantity,
                ...selectedOptions
            };

            await this.addToCart(payload);
            
        } catch (error) {
            console.error('Error in handleAddToCart:', error);
            this.showNotification('Failed to add product to cart', 'error');
        }
    }

    /**
     * Handle add to wishlist action
     */
    async handleAddToWishlist() {
        try {
            const productId = this.productData.id || this.productId;
            await this.addToWishlist(productId);
        } catch (error) {
            console.error('Error in handleAddToWishlist:', error);
            this.showNotification('Failed to add product to wishlist', 'error');
        }
    }

    /**
     * Get selected product options with IDs
     */
    getSelectedOptions() {
        const selectedColor = document.querySelector('input[name="color"]:checked');
        const selectedSize = document.querySelector('input[name="size"]:checked');
        const selectedOption = document.querySelector('input[name="option"]:checked');

        return {
            color: selectedColor ? selectedColor.value : null,
            size: selectedSize ? selectedSize.value : null,
            options: selectedOption ? selectedOption.value : null
        };
    }

    /**
     * Add product to cart
     */
    async addToCart(payload) {
        try {
            const response = await fetch('/orders/add-to-cart/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showNotification(data.message || 'Added to cart successfully', 'success');
                this.updateCartCounter();
            } else {
                if (response.status === 401) {
                    this.showAuthMessage();
                } else {
                    this.showNotification(data.message || 'Error adding to cart', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add product to cart', 'error');
        }
    }

    /**
     * Add product to wishlist
     */
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
                this.updateWishlistUI();
            } else {
                if (response.status === 401) {
                    this.showAuthMessage();
                } else {
                    this.showNotification(data.message || 'Failed to add to wishlist', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            this.showNotification('Failed to add product to wishlist', 'error');
        }
    }

    /**
     * Update cart counter in UI
     */
    updateCartCounter() {
        const cartCounter = document.querySelector('.cart-counter');
        if (cartCounter) {
            const currentCount = parseInt(cartCounter.textContent) || 0;
            cartCounter.textContent = currentCount + 1;
        }
    }

    /**
     * Update wishlist UI state
     */
    updateWishlistUI() {
        const wishlistBtn = document.querySelector('.add-Saved-btn');
        if (wishlistBtn) {
            wishlistBtn.classList.add('added-to-wishlist');
        }
    }

    /**
     * Handle order confirmation with product data
     */
    async handleConfirmOrder() {
        try {
            if (!this.validateOrderForm()) {
                return;
            }

            const orderData = this.getOrderFormData();
            const productId = this.productData.id || this.productId;
            await this.createOrder(orderData, productId);
            
        } catch (error) {
            console.error('Error in handleConfirmOrder:', error);
            this.showNotification('Failed to create order', 'error');
        }
    }

    /**
     * Validate order form
     */
    validateOrderForm() {
        const requiredFields = [
            { id: 'firstName', name: 'First name' },
            { id: 'lastName', name: 'Last name' },
            { id: 'address', name: 'Address' },
            { id: 'phone', name: 'Phone number' }
        ];

        let hasError = false;
        let firstErrorElement = null;

        // Clear previous errors
        this.clearFormErrors();

        // Validate required fields
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                this.showFormError(field.id, `${field.name} is required`);
                hasError = true;
                if (!firstErrorElement) firstErrorElement = element;
            }
        });

        // Validate options
        if (!this.validateOptions()) {
            hasError = true;
        }

        if (hasError && firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return !hasError;
    }

    /**
     * Clear form validation errors
     */
    clearFormErrors() {
        const errorFields = ['firstName', 'lastName', 'address', 'phone'];
        errorFields.forEach(field => {
            const errorEl = document.getElementById(`error-${field}`);
            if (errorEl) errorEl.textContent = '';
        });
        this.clearOptionErrors();
    }

    /**
     * Show form validation error
     */
    showFormError(fieldId, message) {
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    /**
     * Get order form data with selected options
     */
    getOrderFormData() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const address = document.getElementById('address').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const quantityEl = document.getElementById('quantity');
        const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

        const selectedOptions = this.getSelectedOptions();

        return {
            customer_name: `${firstName} ${lastName}`,
            customer_email: "",
            customer_phone: phone,
            customer_address: address,
            city: "",
            quantity: quantity,
            ...selectedOptions
        };
    }

    /**
     * Create order with enhanced data
     */
    async createOrder(orderData, productId) {
        try {
            this.toggleOrderLoader(true);
            this.toggleFormInputs(false);

            const response = await fetch(`${mainDomain}orders/api/orders/create/${productId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCookie('csrftoken')
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Order created successfully:', result);

            if (result.order_id) {
                this.showNotification('Order created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = `/confirmation/${result.order_id}`;
                }, 1000);
            } else {
                throw new Error('Order ID not returned from server');
            }

        } catch (error) {
            console.error('Error creating order:', error);
            this.showNotification('Failed to create order', 'error');
        } finally {
            this.toggleOrderLoader(false);
            this.toggleFormInputs(true);
        }
    }

    /**
     * Toggle order loading state
     */
    toggleOrderLoader(show = true) {
        const loader = document.getElementById('Orderloader');
        const submitBtn = document.querySelector('.submit-button');
        
        if (loader) {
            loader.style.display = show ? 'inline-block' : 'none';
        }
        
        if (submitBtn) {
            submitBtn.disabled = show;
            submitBtn.style.backgroundColor = show ? 'var(--main-color2)' : 'var(--main-color)';
        }
    }

    /**
     * Toggle form inputs
     */
    toggleFormInputs(enabled = true) {
        const inputs = document.querySelectorAll('.form-group input');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    }

    /**
     * Quantity controls
     */
    incrementQuantity() {
        const qtyInput = document.getElementById('quantity');
        if (qtyInput) {
            const currentValue = parseInt(qtyInput.value) || 1;
            qtyInput.value = currentValue + 1;
        }
    }

    decrementQuantity() {
        const qtyInput = document.getElementById('quantity');
        if (qtyInput) {
            const currentValue = parseInt(qtyInput.value) || 1;
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        }
    }

    /**
     * Show notification with enhanced styling
     */
    showNotification(message, type = 'info', duration = 3000) {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: none;
                min-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(notification);
        }

        // Set colors based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-triangle' : 
                    type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fa-solid ${icon}" style="margin-right: 8px;"></i>
            <span>${message}</span>
        `;

        notification.style.display = 'block';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 50);

        // Auto hide
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * Show authentication message
     */
    showAuthMessage() {
        const authAlert = document.createElement("div");
        authAlert.className = "auth-alert auth-alert-warning";
        authAlert.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 20px;
            background-color: #f59e0b;
            color: white;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        authAlert.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="margin-right:8px;"></i>
            Please log in to perform this action.
        `;

        document.body.appendChild(authAlert);

        setTimeout(() => {
            authAlert.style.opacity = '1';
            authAlert.style.transform = 'translateX(-50%) translateY(0)';
        }, 50);

        setTimeout(() => {
            authAlert.style.opacity = '0';
            authAlert.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (authAlert.parentNode) {
                    authAlert.remove();
                }
            }, 300);
        }, 4000);
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                return decodeURIComponent(cookie.substring(name.length + 1));
            }
        }
        return null;
    }

    /**
     * Utility method to format currency
     */
    formatPrice(price, currency = null) {
        const currencySymbol = currency || window.currencySymbol || '$';
        const numPrice = parseFloat(price);
        return `${numPrice.toFixed(2)}${currencySymbol}`;
    }

    /**
     * Utility method to check if product is active
     */
    isProductActive() {
        return this.productData && this.productData.is_active;
    }

    /**
     * Get product categories for breadcrumb or navigation
     */
    getProductCategories() {
        return this.productData ? this.productData.categories || [] : [];
    }

    /**
     * Handle product availability display
     */
    updateProductAvailability() {
        if (!this.productData) return;

        const availabilityEl = document.querySelector('.product-availability');
        if (availabilityEl) {
            if (this.productData.is_active) {
                availabilityEl.innerHTML = `
                    <i class="fa-solid fa-check-circle" style="color: #10b981; margin-right: 5px;"></i>
                    <span style="color: #10b981;">In Stock</span>
                `;
            } else {
                availabilityEl.innerHTML = `
                    <i class="fa-solid fa-times-circle" style="color: #ef4444; margin-right: 5px;"></i>
                    <span style="color: #ef4444;">Out of Stock</span>
                `;
                
                // Disable add to cart if out of stock
                const addToCartBtn = document.querySelector('.add-to-cart-btn');
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.style.opacity = '0.6';
                    addToCartBtn.style.cursor = 'not-allowed';
                }
            }
        }
    }

    /**
     * Enhanced error handling for API responses
     */
    handleApiError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message.includes('Failed to fetch')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes('404')) {
            message = 'Product not found.';
        } else if (error.message.includes('500')) {
            message = 'Server error. Please try again later.';
        }
        
        this.showNotification(message, 'error');
    }

    /**
     * Debounce utility for performance optimization
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Initialize product sharing functionality
     */
    initializeSharing() {
        const shareBtn = document.querySelector('.share-product-btn');
        if (shareBtn && navigator.share) {
            shareBtn.addEventListener('click', () => {
                navigator.share({
                    title: this.productData.name,
                    text: this.productData.description_1,
                    url: window.location.href
                });
            });
        }
    }

    /**
     * Handle keyboard navigation for better accessibility
     */
    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals or notifications
                const notification = document.getElementById('notification');
                if (notification) {
                    notification.remove();
                }
            }
            
            if (e.key === 'Enter') {
                const focusedElement = document.activeElement;
                if (focusedElement && focusedElement.classList.contains('option-label')) {
                    focusedElement.click();
                }
            }
        });
    }

    /**
     * Performance monitoring
     */
    trackPerformance(action, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`${action} took ${duration.toFixed(2)} milliseconds`);
        
        // Log slow operations (> 1000ms)
        if (duration > 1000) {
            console.warn(`Slow operation detected: ${action} took ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Initialize all additional features
     */
    initializeEnhancements() {
        this.initializeSharing();
        this.initializeKeyboardNavigation();
        this.updateProductAvailability();
    }

    /**
     * Cleanup method for proper resource management
     */
    destroy() {
        if (this.mainSwiper) {
            this.mainSwiper.destroy(true, true);
            this.mainSwiper = null;
        }
        
        if (this.thumbsSwiper) {
            this.thumbsSwiper.destroy(true, true);
            this.thumbsSwiper = null;
        }
        
        // Remove event listeners
        const elements = [
            '.add-to-cart-btn',
            '.add-Saved-btn', 
            '.qty-btn',
            '.submit-button'
        ];
        
        elements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.replaceWith(el.cloneNode(true));
            }
        });
    }
}

/**
 * Global utility functions for backwards compatibility
 */
function viewProductdetailes(product_Id) {
    window.location.href = `/product-details/${String(product_Id)}`;
}

// Backwards compatibility functions
function incrementQuantity() {
    if (window.productManager) {
        window.productManager.incrementQuantity();
    }
}

function decrementQuantity() {
    if (window.productManager) {
        window.productManager.decrementQuantity();
    }
}

function ConfirmOrder() {
    if (window.productManager) {
        window.productManager.handleConfirmOrder();
    }
}

// Initialize the product details manager
document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductDetailsManager();
    
    // Initialize enhancements after product data is loaded
    if (window.productManager.productData) {
        window.productManager.initializeEnhancements();
    } else {
        // Wait for product data to load
        const checkData = setInterval(() => {
            if (window.productManager.productData) {
                window.productManager.initializeEnhancements();
                clearInterval(checkData);
            }
        }, 100);
    }
});