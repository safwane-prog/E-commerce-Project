/**
 * Product Details Management
 * Enhanced with better error handling, performance optimizations, and mobile responsiveness
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
            // Filter existing images
            const images = Object.keys(data)
                .filter(key => key.startsWith("image_") && data[key])
                .map(key => data[key]);

            if (images.length === 0) {
                console.warn('No images found for product');
                return;
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
                // Add touch gestures for mobile
                touchRatio: 1,
                touchAngle: 45,
                grabCursor: true
            });

        } catch (error) {
            console.error('Error initializing Swiper:', error);
        }
    }

    /**
     * Render product details
     */
    renderProductDetails(data) {
        try {
            // Basic product information
            this.setElementText('products-name-section', data.name);
            this.setElementText('products-old-price', data.old_price);
            this.setElementText('products-main-price', data.price);
            this.setElementText('products-descounte-count', data.discount);
            this.setElementText('product-description-main', data.description_1);
            this.setElementText('desctiption_1', data.description_1);
            this.setElementText('desctiption_2', data.description_2);
            this.setElementText('desctiption_3', data.description_3);

            // Render options
            this.renderProductOptions(data);
            
        } catch (error) {
            console.error('Error rendering product details:', error);
        }
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
     * Render product options (colors, sizes, options)
     */
    renderProductOptions(data) {
        // Colors
        this.renderColorOptions(data.color);
        // Sizes
        this.renderSizeOptions(data.size);
        // Other options
        this.renderOtherOptions(data.options);
    }

    /**
     * Render color options
     */
    renderColorOptions(colors) {
        const colorSection = document.getElementById('product-color-section-sectopn');
        const colorContainer = document.getElementById('main-color-section-box');
        
        if (!colors || colors.length === 0) {
            if (colorSection) colorSection.style.display = 'none';
            return;
        }

        if (colorContainer) {
            colorContainer.innerHTML = '';
            colors.forEach((color, index) => {
                const inputId = `color-${index}`;
                const colorHtml = `
                    <input type="radio" id="${inputId}" name="color" value="${color.name}" class="option-input">
                    <label for="${inputId}" class="color-label" style="background-color: ${color.name};" 
                           title="${color.name}" aria-label="Color: ${color.name}"></label>
                `;
                colorContainer.innerHTML += colorHtml;
            });
        }
    }

    /**
     * Render size options
     */
    renderSizeOptions(sizes) {
        const sizeSection = document.getElementById('product-size-section-sectopn');
        const sizeContainer = document.getElementById('main-size-section-box');
        
        if (!sizes || sizes.length === 0) {
            if (sizeSection) sizeSection.style.display = 'none';
            return;
        }

        if (sizeContainer) {
            sizeContainer.innerHTML = '';
            sizes.forEach((size, index) => {
                const inputId = `size-${index}`;
                const sizeHtml = `
                    <input type="radio" id="${inputId}" name="size" value="${size.name}" class="option-input">
                    <label for="${inputId}" class="size-label" aria-label="Size: ${size.name}">${size.name}</label>
                `;
                sizeContainer.innerHTML += sizeHtml;
            });
        }
    }

    /**
     * Render other options
     */
    renderOtherOptions(options) {
        const optionSection = document.getElementById('product-option-section-sectopn');
        const optionContainer = document.getElementById('main-option-section-box');
        
        if (!options || options.length === 0) {
            if (optionSection) optionSection.style.display = 'none';
            return;
        }

        if (optionContainer) {
            optionContainer.innerHTML = '';
            options.forEach((option, index) => {
                const inputId = `option-${index}`;
                const optionHtml = `
                    <input type="radio" id="${inputId}" name="option" value="${option.name}" class="option-input">
                    <label for="${inputId}" class="option-label" aria-label="Option: ${option.name}">${option.name}</label>
                `;
                optionContainer.innerHTML += optionHtml;
            });
        }
    }

    /**
     * Validate required options
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
     * Handle add to cart action
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
                product_id: this.productId,
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
            await this.addToWishlist(this.productId);
        } catch (error) {
            console.error('Error in handleAddToWishlist:', error);
            this.showNotification('Failed to add product to wishlist', 'error');
        }
    }

    /**
     * Get selected product options
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
        // Implementation depends on your cart counter element
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
            // You can add visual feedback here
        }
    }

    /**
     * Handle order confirmation
     */
    async handleConfirmOrder() {
        try {
            if (!this.validateOrderForm()) {
                return;
            }

            const orderData = this.getOrderFormData();
            await this.createOrder(orderData);
            
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
     * Get order form data
     */
    getOrderFormData() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const address = document.getElementById('address').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const quantityEl = document.getElementById('quantity');
        const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

        return {
            customer_name: `${firstName} ${lastName}`,
            customer_email: "",
            customer_phone: phone,
            customer_address: address,
            city: "",
            quantity: quantity
        };
    }

    /**
     * Create order
     */
    async createOrder(orderData) {
        try {
            this.toggleOrderLoader(true);
            this.toggleFormInputs(false);

            const response = await fetch(`${mainDomain}orders/api/orders/create/${this.productId}/`, {
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
                // Redirect after short delay for user feedback
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
     * Show notification
     */
    showNotification(message, type = 'info', duration = 3000) {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }

        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;

        notification.style.display = 'block';

        // Auto hide
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, duration);
    }

    /**
     * Show authentication message
     */
    showAuthMessage() {
        const authAlert = document.createElement("div");
        authAlert.className = "auth-alert auth-alert-warning";
        authAlert.innerHTML = `
            <i class="fa-solid fa-exclamation-triangle" style="margin-right:8px;"></i>
            Please log in to perform this action.
        `;

        document.body.appendChild(authAlert);

        setTimeout(() => {
            authAlert.classList.add("auth-alert-show");
        }, 50);

        setTimeout(() => {
            authAlert.classList.remove("auth-alert-show");
            setTimeout(() => {
                if (authAlert.parentNode) {
                    authAlert.remove();
                }
            }, 500);
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
}

/**
 * Global utility functions for backwards compatibility
 */
function viewProductdetailes(product_Id) {
    window.location.href = `/product-details/${String(product_Id)}`;
}

// Initialize the product details manager
const productManager = new ProductDetailsManager();