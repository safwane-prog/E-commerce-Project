/**
 * Product Details Management using Functions only
 * Enhanced Product Details Management - Function Based
 */

// Global variables
let productId = null;
let mainSwiper = null;
let thumbsSwiper = null;
let isLoading = false;
let productData = null;

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

/**
 * Extract product ID from URL
 */
function getProductIdFromUrl() {
    const url = window.location.href;
    const parts = url.split('/');
    return parts[parts.length - 1];
}

/**
 * Show/hide loading screen
 */
function toggleLoader(show = true) {
    const loader = document.querySelector('.spinre');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
    isLoading = show;
}

/**
 * Get cookie value
 */
function getCookie(name) {
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
 * Check authentication status
 */
function isAuthenticated() {
    return !!getCookie('sessionid'); // Assumes sessionid is used for Django authentication
}

/**
 * Show notifications
 */
function showNotification(message, type = 'info', duration = 3000) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px 15px 15px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            display: none;
            min-width: 400px;
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
            transition: all 0.3s ease;
            font-family: 'Arial', sans-serif;
        `;
        document.body.appendChild(notification);
    }

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
        <div style="display:flex; align-items:center; justify-content: space-between;">
            <div style="display:flex; align-items:center;">
                <i class="fa-solid ${icon}" style="margin-right: 10px; font-size:18px;"></i>
                <span style="font-size:16px;">${message}</span>
            </div>
            <button id="close-notification" style="
                background: transparent;
                border: none;
                color: white;
                font-size: 27px;
                line-height: 1;
                cursor: pointer;
            ">&times;</button>
        </div>
    `;

    notification.style.display = 'block';
    notification.style.transform = 'translateX(100%)';

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 50);

    // إغلاق يدوي عند الضغط على زر الإغلاق
    const closeBtn = document.getElementById('close-notification');
    if (closeBtn) {
        closeBtn.onclick = () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 0);
        };
    }

    // الإغلاق التلقائي بعد المدة المحددة
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 0);
    }, duration);
}

/**
 * Fetch product details from API
 */
async function fetchProductDetails() {
    if (isLoading) return;

    try {
        toggleLoader(true);

        const response = await fetchWithAuth(`${mainDomain}products/details/${productId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Product data:', data);

        productData = data;
        renderProductDetails(data);
        renderProductImages(data);
        renderRatingInfo(data);
        updateProductAvailability();

    } catch (error) {
        console.error('Error fetching product details:', error);
        
        // Handle session expired error specifically
        if (error.message === "Session expired, please log in again.") {
            showNotification('Session expired, please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification('Failed to load product details', 'error');
        }
    } finally {
        toggleLoader(false);
    }
}

/**
 * Safe element text setting
 */
function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element && text) {
        element.textContent = text;
    }
}

/**
 * Render product details
 */
function renderProductDetails(data) {
    try {
        const name = data.name.length > 50 ? data.name.slice(0, 100) + '...' : data.name;
        setElementText('products-name-section', name);

        const currency = window.currencySymbol || '$';
        setElementText('products-main-price', `${data.price}${currency}`);

        if (data.old_price && parseFloat(data.old_price) > parseFloat(data.price)) {
            setElementText('products-old-price', `${data.old_price}${currency}`);

            const discountPercent = Math.round(((parseFloat(data.old_price) - parseFloat(data.price)) / parseFloat(data.old_price)) * 100);
            setElementText('products-descounte-count', discountPercent.toString());
        } else {
            const discountSection = document.querySelector('.products-descounte');
            if (discountSection) {
                discountSection.style.display = 'none';
            }
        }

        setElementText('product-description-main', data.description_1);
        setElementText('desctiption_1', data.description_1);
        setElementText('desctiption_2', data.description_2);
        setElementText('desctiption_3', data.description_3);

        const ordersCount = document.querySelector('.orsers-count span:nth-child(2)');
        if (ordersCount && data.sales_count) {
            ordersCount.textContent = data.sales_count;
        }

        renderProductOptions(data);

    } catch (error) {
        console.error('Error rendering product details:', error);
    }
}

/**
 * Render product images and initialize Swiper
 */
function renderProductImages(data) {
    try {
        const images = [];
        for (let i = 1; i <= 10; i++) {
            const imageKey = `image_${i}`;
            if (data[imageKey]) {
                images.push(data[imageKey]);
            }
        }

        if (images.length === 0) {
            console.warn('No images found for product');
            images.push('/static/imges/istockphoto-1147544807-612x612.jpg');
        }

        const mainWrapper = document.getElementById('main-image-wrapper');
        const thumbsWrapper = document.getElementById('thumbs-wrapper');

        if (!mainWrapper || !thumbsWrapper) {
            console.warn('Image wrapper elements not found');
            return;
        }

        mainWrapper.innerHTML = '';
        thumbsWrapper.innerHTML = '';

        images.forEach((src, index) => {
            const mainSlide = document.createElement('div');
            mainSlide.className = 'swiper-slide';
            mainSlide.innerHTML = `<img src="${src}" alt="Product image ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">`;
            mainWrapper.appendChild(mainSlide);

            const thumbSlide = document.createElement('div');
            thumbSlide.className = 'swiper-slide';
            thumbSlide.innerHTML = `<img src="${src}" alt="Thumbnail ${index + 1}" loading="lazy">`;
            thumbsWrapper.appendChild(thumbSlide);
        });

        initializeSwiper();

    } catch (error) {
        console.error('Error rendering product images:', error);
    }
}

/**
 * Initialize Swiper
 */
function initializeSwiper() {
    try {
        if (thumbsSwiper) thumbsSwiper.destroy(true, true);
        if (mainSwiper) mainSwiper.destroy(true, true);

        thumbsSwiper = new Swiper('.thumbs-swiper', {
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

        mainSwiper = new Swiper('.main-swiper', {
            spaceBetween: 10,
            thumbs: {
                swiper: thumbsSwiper
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
 * Render rating information
 */
function renderRatingInfo(data) {
    try {
        const ratingElement = document.querySelector('.range-count');
        if (ratingElement && data.average_rating !== undefined) {
            ratingElement.textContent = data.average_rating.toFixed(1);
        }

        const outOfElement = document.querySelector('.out-of');
        if (outOfElement && data.average_rating !== undefined) {
            outOfElement.textContent = `${data.average_rating.toFixed(1)} out of 5`;
        }

        const globalRatingElement = document.querySelector('.review-section-title-2');
        if (globalRatingElement && data.total_reviews !== undefined) {
            globalRatingElement.textContent = `${data.total_reviews} global ratings`;
        }

        updateStarRating(data.average_rating);

        if (data.ratings_breakdown) {
            updateRatingsBars(data.ratings_breakdown, data.total_reviews);
        }

    } catch (error) {
        console.error('Error rendering rating info:', error);
    }
}

/**
 * Update star rating display
 */
function updateStarRating(rating) {
    const starContainers = document.querySelectorAll('.range-stars, .review-section-title div');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('i[class*="star"]');
        stars.forEach((star, index) => {
            star.setAttribute('aria-label', `${index + 1} star${index + 1 > 1 ? 's' : ''}`);
            star.setAttribute('role', 'button');
            star.setAttribute('tabindex', '0');
            if (index < Math.floor(rating)) {
                star.className = star.className.replace('bi-star-fill2', '').replace('bi bi-star-fill', 'bi bi-star-fill');
                star.setAttribute('aria-checked', 'true');
            } else if (index < rating) {
                star.className = 'bi bi-star-half';
                star.setAttribute('aria-checked', 'mixed');
            } else {
                star.className = 'bi bi-star-fill bi-star-fill2';
                star.setAttribute('aria-checked', 'false');
            }
        });
    });
}

/**
 * Update rating breakdown bars
 */
function updateRatingsBars(breakdown, totalReviews) {
    const ratingInfos = document.querySelectorAll('.review-info');

    ratingInfos.forEach((info, index) => {
        const ratingNumber = 5 - index;
        const count = breakdown[ratingNumber.toString()] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        const bar = info.querySelector('.review-info-dev-range');
        if (bar) {
            bar.style.width = `${percentage}%`;
            bar.setAttribute('aria-valuenow', percentage);
            bar.setAttribute('aria-label', `${ratingNumber}-star ratings: ${count}`);
        }

        const countEl = info.querySelector('.review-count');
        if (countEl) {
            countEl.textContent = count;
        }
    });
}

/**
 * Render product options
 */
function renderProductOptions(data) {
    renderColorOptions(data.color || []);
    renderSizeOptions(data.size || []);
    renderOtherOptions(data.options || []);
}

/**
 * Render color options
 */
function renderColorOptions(colors) {
    const colorSection = document.getElementById('product-color-section-sectopn');
    const colorContainer = document.getElementById('main-color-section-box');

    if (!colors || colors.length === 0) {
        if (colorSection) colorSection.style.display = 'none';
        return;
    }

    if (colorSection) colorSection.style.display = 'block';

    if (colorContainer) {
        colorContainer.innerHTML = '';
        colors.forEach((color) => {
            const inputId = `color-${color.id || Math.random().toString(36).substr(2, 9)}`;
            const colorValue = color.name && color.name.startsWith('#') ? color.name : color.name ? color.name.toLowerCase() : '#000000';

            const colorHtml = `
                <input type="radio" id="${inputId}" name="color" value="${color.name}" class="color-input">
                <label for="${inputId}" class="color-label" 
                       style="background-color: ${colorValue};" 
                       title="${color.name || 'Color'}" 
                       aria-label="Color: ${color.name || 'Unknown'}"></label>
            `;
            colorContainer.innerHTML += colorHtml;
        });

        const inputs = colorContainer.querySelectorAll('.color-input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                colorContainer.querySelectorAll('.color-label').forEach(label => label.classList.remove('selected'));
                if (input.checked) {
                    input.nextElementSibling.classList.add('selected');
                }
            });
        });
    }
}

/**
 * Render size options
 */
function renderSizeOptions(sizes) {
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
            const inputId = `size-${size.id || index}`;
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
function renderOtherOptions(options) {
    const optionSection = document.getElementById('product-option-section-sectopn');
    const optionContainer = document.getElementById('main-option-section-box');

    if (!options || options.length === 0) {
        if (optionSection) optionSection.style.display = 'none';
        return;
    }

    if (optionSection) optionSection.style.display = 'block';

    if (optionContainer) {
        optionContainer.innerHTML = '';
        options.forEach((option) => {
            const inputId = `option-${option.id || Math.random().toString(36).substr(2, 9)}`;
            const shortName = option.name && option.name.length > 15
                ? option.name.slice(0, 15) + "..."
                : option.name || 'Option';

            const optionHtml = `
                <input type="radio" id="${inputId}" name="option" value="${option.name}" class="option-input">
                <label for="${inputId}" class="option-label" aria-label="Option: ${option.name || 'Unknown'}">${shortName}</label>
            `;
            optionContainer.innerHTML += optionHtml;
        });
    }
}

/**
 * Validate selected options
 */
function validateOptions() {
    const optionSections = [
        { id: 'product-color-section-sectopn', name: 'color', displayName: 'color' },
        { id: 'product-size-section-sectopn', name: 'size', displayName: 'size' },
        { id: 'product-option-section-sectopn', name: 'option', displayName: 'option' }
    ];

    let hasError = false;
    let firstErrorElement = null;

    // مسح الأخطاء القديمة
    clearOptionErrors();

    optionSections.forEach(section => {
        const sectionEl = document.getElementById(section.id);
        if (sectionEl && sectionEl.style.display !== 'none') {
            const inputs = sectionEl.querySelectorAll(`input[name="${section.name}"]`);
            if (inputs.length > 0) {
                const checked = sectionEl.querySelector(`input[name="${section.name}"]:checked`);
                if (!checked) {
                    // عرض إشعار تنبيه لكل input
                    showNotification(`Please select a ${section.displayName}`, 'warning');
                    
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
function clearOptionErrors() {
    const errorElements = document.querySelectorAll('.option-error');
    errorElements.forEach(error => error.remove());
}

/**
 * Show option validation error
 */
function showOptionError(sectionElement, message) {
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
 * Get selected options
 */
function getSelectedOptions() {
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
 * Handle add to cart action
 */
async function handleAddToCart() {
    try {
        if (!validateOptions()) {
            return;
        }

        const quantityEl = document.getElementById('quantity');
        const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

        const selectedOptions = getSelectedOptions();

        const payload = {
            product_id: productData.id || productId,
            quantity: quantity || 1,
            ...selectedOptions
        };

        await addToCart(payload);

    } catch (error) {
        console.error('Error in handleAddToCart:', error);
        showNotification('Failed to add product to cart', 'error');
    }
}

/**
 * Add product to cart via API
 */
async function addToCart(payload) {
    try {
        const response = await fetchWithAuth('/orders/add-to-cart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || 'Product added to cart successfully', 'success');
            updateCartCounter();
        } else {
            if (response.status === 401) {
                showNotification('Please login to perform this action', 'warning');
            } else {
                showNotification(data.message || 'Failed to add product to cart', 'error');
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        
        // Handle session expired error specifically
        if (error.message === "Session expired, please log in again.") {
            showNotification('Session expired, please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification('Failed to add product to cart', 'error');
        }
    }
}

/**
 * Handle add to wishlist action
 */
async function handleAddToWishlist() {
    try {
        const productIdToAdd = productData.id || productId;
        await addToWishlist(productIdToAdd);
    } catch (error) {
        console.error('Error in handleAddToWishlist:', error);
        showNotification('Failed to add product to wishlist', 'error');
    }
}

/**
 * Add product to wishlist via API
 */
async function addToWishlist(productIdToAdd) {
    try {
        const response = await fetchWithAuth('/orders/add-to-wishlist/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ product_id: productIdToAdd })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || 'Product added to wishlist', 'success');
            updateWishlistUI();
        } else {
            if (response.status === 401) {
                showNotification('Please login to perform this action', 'warning');
            } else {
                showNotification(data.message || 'Failed to add product to wishlist', 'error');
            }
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        
        // Handle session expired error specifically
        if (error.message === "Session expired, please log in again.") {
            showNotification('Session expired, please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification('Failed to add product to wishlist', 'error');
        }
    }
}

/**
 * Update cart counter
 */
function updateCartCounter() {
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        const currentCount = parseInt(cartCounter.textContent) || 0;
        cartCounter.textContent = currentCount + 1;
    }
}

/**
 * Update wishlist UI
 */
function updateWishlistUI() {
    const wishlistBtn = document.querySelector('.add-Saved-btn');
    if (wishlistBtn) {
        wishlistBtn.classList.add('added-to-wishlist');
    }
}

/**
 * Increment quantity
 */
function incrementQuantity() {
    const qtyInput = document.getElementById('quantity');
    if (qtyInput) {
        const currentValue = parseInt(qtyInput.value) || 1;
        qtyInput.value = currentValue + 1;
    }
}

/**
 * Decrement quantity
 */
function decrementQuantity() {
    const qtyInput = document.getElementById('quantity');
    if (qtyInput) {
        const currentValue = parseInt(qtyInput.value) || 1;
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    }
}

/**
 * Validate order form
 */
function validateOrderForm() {
    const requiredFields = [
        { id: 'firstName', name: 'first name' },
        { id: 'lastName', name: 'last name' },
        { id: 'address', name: 'address' },
        { id: 'phone', name: 'phone number' }
    ];

    let hasError = false;
    let firstErrorElement = null;

    clearFormErrors();

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            // highlightErrorField(field.id);
            showNotification(`Please enter your ${field.name}`, 'warning');
            hasError = true;
            if (!firstErrorElement) firstErrorElement = element;
        }
    });

    if (!validateOptions()) {
        hasError = true;
    }

    if (hasError && firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return !hasError;
}

/**
 * Highlight error field
 */
function highlightErrorField(fieldId) {
    const element = document.getElementById(fieldId);
    if (!element) return;

    element.classList.add('error-highlight');
    element.style.animation = 'shake 0.5s ease-in-out';

    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

/**
 * Clear form errors
 */
function clearFormErrors() {
    const fields = ['firstName', 'lastName', 'address', 'phone'];
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.classList.remove('error-highlight');
            element.style.animation = '';
        }
    });
}

/**
 * Get order form data
 */
function getOrderFormData() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const quantityEl = document.getElementById('quantity');
    const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

    const selectedOptions = getSelectedOptions();

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
 * Handle order confirmation
 */
async function handleConfirmOrder() {
    try {
        if (!validateOrderForm()) {
            return;
        }

        const orderData = getOrderFormData();
        const productIdForOrder = productData.id || productId;
        await createOrder(orderData, productIdForOrder);

    } catch (error) {
        console.error('Error in handleConfirmOrder:', error);
        showNotification('Failed to create order', 'error');
    }
}

/**
 * Create order via API
 */
async function createOrder(orderData, productIdForOrder) {
    try {
        toggleOrderLoader(true);
        toggleFormInputs(false);

        const response = await fetchWithAuth(`${mainDomain}orders/api/orders/create/${productIdForOrder}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Order created successfully:', result);

        if (result.order_id) {
            showNotification('Order created successfully!', 'success');
            setTimeout(() => {
                window.location.href = `/confirmation/${result.order_id}`;
            }, 1000);
        } else {
            throw new Error('No order ID returned from server');
        }

    } catch (error) {
        console.error('Error creating order:', error);
        
        // Handle session expired error specifically
        if (error.message === "Session expired, please log in again.") {
            showNotification('Session expired, please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification('Failed to create order', 'error');
        }
    } finally {
        toggleOrderLoader(false);
        toggleFormInputs(true);
    }
}

/**
 * Toggle order loader
 */
function toggleOrderLoader(show = true) {
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
function toggleFormInputs(enabled = true) {
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.disabled = !enabled;
    });
}

/**
 * Update product availability
 */
function updateProductAvailability() {
    if (!productData) return;

    const availabilityEl = document.querySelector('.product-availability');
    if (availabilityEl) {
        if (productData.is_active) {
            availabilityEl.innerHTML = `
                <i class="fa-solid fa-check-circle" style="color: #10b981; margin-right: 5px;"></i>
                <span style="color: #10b981;">Available</span>
            `;
        } else {
            availabilityEl.innerHTML = `
                <i class="fa-solid fa-times-circle" style="color: #ef4444; margin-right: 5px;"></i>
                <span style="color: #ef4444;">Not available</span>
            `;

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
 * Bind all events
 */
function bindEvents() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAddToCart();
        });
    }

    const addToWishlistBtn = document.querySelector('.add-Saved-btn');
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAddToWishlist();
        });
    }

    const incrementBtn = document.querySelector('.qty-btn[onclick*="increment"]');
    const decrementBtn = document.querySelector('.qty-btn[onclick*="decrement"]');

    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => incrementQuantity());
    }
    if (decrementBtn) {
        decrementBtn.addEventListener('click', () => decrementQuantity());
    }

    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleConfirmOrder();
        });
    }
}

/**
 * Initialize keyboard navigation
 */
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.remove();
            }
            const modal = document.getElementById('reviewModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        }

        if (e.key === 'Enter') {
            const focusedElement = document.activeElement;
            if (focusedElement && (focusedElement.classList.contains('option-label') || focusedElement.classList.contains('review-star'))) {
                focusedElement.click();
            }
        }
    });
}

/**
 * Initialize sharing functionality
 */
function initializeSharing() {
    const shareBtn = document.querySelector('.share-product-btn');
    if (shareBtn && navigator.share && productData) {
        shareBtn.addEventListener('click', () => {
            navigator.share({
                title: productData.name,
                text: productData.description_1,
                url: window.location.href
            });
        });
    }
}

/**
 * Format price
 */
function formatPrice(price, currency = null) {
    const currencySymbol = currency || window.currencySymbol || '$';
    const numPrice = parseFloat(price);
    return `${numPrice.toFixed(2)}${currencySymbol}`;
}

/**
 * Check if product is active
 */
function isProductActive() {
    return productData && productData.is_active;
}

/**
 * Get product categories
 */
function getProductCategories() {
    return productData ? productData.categories || [] : [];
}

/**
 * Enhanced API error handling
 */
function handleApiError(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred';

    if (error.message.includes('Failed to fetch')) {
        message = 'Network error. Please check your connection.';
    } else if (error.message.includes('404')) {
        message = 'Product not found.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    }

    showNotification(message, 'error');
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
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
 * Performance tracking
 */
function trackPerformance(action, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`${action} took ${duration.toFixed(2)} milliseconds`);

    if (duration > 1000) {
        console.warn(`Slow operation detected: ${action} took ${duration.toFixed(2)}ms`);
    }
}

/**
 * Initialize all enhancements
 */
function initializeEnhancements() {
    initializeSharing();
    initializeKeyboardNavigation();
    updateProductAvailability();
}

/**
 * Clean up resources
 */
function destroyResources() {
    if (mainSwiper) {
        mainSwiper.destroy(true, true);
        mainSwiper = null;
    }

    if (thumbsSwiper) {
        thumbsSwiper.destroy(true, true);
        thumbsSwiper = null;
    }

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

/**
 * Main initialization
 */
async function initializeProductDetails() {
    try {
        productId = getProductIdFromUrl();
        bindEvents();
        await fetchProductDetails();

        // Initialize enhancements after product data is loaded
        if (productData) {
            initializeEnhancements();
        } else {
            // Wait for product data to load
            const checkData = setInterval(() => {
                if (productData) {
                    initializeEnhancements();
                    clearInterval(checkData);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Failed to initialize product details:', error);
        showNotification('Failed to load product details', 'error');
    }
}

/**
 * Legacy compatibility functions
 */
function viewProductdetailes(product_Id) {
    window.location.href = `/product-details/${String(product_Id)}`;
}

function ConfirmOrder() {
    handleConfirmOrder();
}

// Add review functionality
/**
 * Initialize review modal
 */
function initializeReviewModal() {
    const modal = document.getElementById('reviewModal');
    const openBtn = document.getElementById('openReviewModal');
    const closeBtn = document.querySelector('.review-modal-close');
    const submitReviewBtn = document.querySelector('.review-submit-btn');
    const stars = document.querySelectorAll('.review-star');

    // Initialize rating stars
    let selectedRating = 0;
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < selectedRating);
                s.setAttribute('aria-checked', i < selectedRating ? 'true' : 'false');
            });
            updateRatingText(selectedRating);
        });
        star.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                star.click();
            }
        });
    });

    // Update rating text
    function updateRatingText(rating) {
        // const ratingText = document.querySelector('.review-rating-text');
        // if (ratingText) {
        //     const texts = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        //     ratingText.textContent = texts[rating - 1] || '';
        // }
    }

    // Open/close modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            resetReviewForm();
            // Auto-fill fields for logged-in users if needed
            if (isAuthenticated()) {
                const nameInput = document.querySelector('#review-name');
                const emailInput = document.querySelector('#review-email');
                if (nameInput) nameInput.disabled = true;
                if (emailInput) emailInput.disabled = true;
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Submit review
    if (submitReviewBtn) {
        const debouncedSubmitReview = debounce(handleSubmitReview, 300);
        submitReviewBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (validateReviewForm(selectedRating)) {
                await debouncedSubmitReview(selectedRating);
            }
        });
    }
}

/**
 * Validate review form
 */
function validateReviewForm(rating) {
    if (rating === 0) {
        showNotification('Please select a rating', 'warning');
        return false;
    }

    const comment = document.querySelector('.review-form-textarea')?.value.trim();
    if (!comment) {
        showNotification('Please add a review', 'warning');
        return false;
    }

    if (!isAuthenticated()) {
        const name = document.querySelector('#review-name')?.value.trim();
        if (!name) {
            showNotification('Please provide your name', 'warning');
            return false;
        }
    }

    return true;
}

/**
 * Collect review data
 */
function getReviewData(selectedRating) {
    const comment = document.querySelector('.review-form-textarea')?.value.trim();
    const data = {
        product: productData.id || productId,
        rating: selectedRating,
        review: comment
    };

    if (!isAuthenticated()) {
        data.name = document.querySelector('#review-name')?.value.trim();
        data.email = document.querySelector('#review-email')?.value.trim();
    }

    return data;
}

/**
 * Handle review submission
 */
async function handleSubmitReview(selectedRating) {
    try {
        toggleReviewLoader(true);
        const reviewData = getReviewData(selectedRating);
        await addReview(reviewData);
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Failed to submit review', 'error');
    } finally {
        toggleReviewLoader(false);
    }
}

/**
 * Add review via API
 */
async function addReview(reviewData) {
    try {
        const response = await fetchWithAuth(`${mainDomain}products/ratings/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Review added successfully', 'success');
            document.getElementById('reviewModal').classList.remove('active');
            await fetchProductDetails();
        } else {
            if (response.status === 401 && !isAuthenticated()) {
                showNotification('Please login to perform this action', 'warning');
            } else {
                showNotification(data.error, 'warning');
            }
        }
    } catch (error) {
        console.error('Error adding review:', error);
        
        // Handle session expired error specifically
        if (error.message === "Session expired, please log in again.") {
            showNotification('Session expired, please log in again.', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showNotification('Failed to add review', 'error');
        }
    }
}

/**
 * Toggle review loader
 */
function toggleReviewLoader(show = true) {
    const loader = document.querySelector('.review-spinner');
    const submitBtn = document.querySelector('.review-submit-btn');

    if (loader) {
        loader.style.display = show ? 'inline-block' : 'none';
    }

    if (submitBtn) {
        submitBtn.disabled = show;
    }
}

/**
 * Reset review form
 */
function resetReviewForm() {
    const stars = document.querySelectorAll('.review-star');
    stars.forEach(star => {
        star.classList.remove('active');
        star.setAttribute('aria-checked', 'false');
    });
    const comment = document.querySelector('.review-form-textarea');
    if (comment) comment.value = '';
    const ratingText = document.querySelector('.review-rating-text');
    if (ratingText) ratingText.textContent = '';
    const nameInput = document.querySelector('#review-name');
    if (nameInput) nameInput.value = '';
    const emailInput = document.querySelector('#review-email');
    if (emailInput) emailInput.value = '';
}

// Add CSS for visual effects
function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .error-highlight {
            border: 2px solid #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            background-color: rgba(254, 242, 242, 0.5) !important;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .color-label.selected {
            transform: scale(1.1);
            box-shadow: 0 0 0 3px rgba(51, 72, 255, 0.3);
            border: 2px solid #3348FF;
        }

        .option-error {
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .notification {
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }

        .added-to-wishlist {
            background-color: #10b981 !important;
            color: white !important;
        }

        .added-to-wishlist::before {
            content: "✓ ";
        }
    `;
    document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    addCustomStyles();
    initializeProductDetails();
    initializeReviewModal();
});

// In case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addCustomStyles();
        initializeProductDetails();
        initializeReviewModal();
    });
} else {
    addCustomStyles();
    initializeProductDetails();
    initializeReviewModal();
}