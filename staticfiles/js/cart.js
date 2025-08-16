// دالة عامة لعمل fetch مع نظام التجديد
async function fetchWithAuth(url, options = {}) {
    try {
        let response = await fetch(url, {
            ...options,
            credentials: "include" // مهم لإرسال الكوكيز (access, refresh)
        });

        if (response.status === 401) {
            // حاول تجديد التوكن
            const refreshResponse = await fetch(mainDomain + "users/auth/jwt/refresh/", {
                method: "POST",
                credentials: "include"
            });

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

function viewProductDetails(productId) {
    window.location.href = `/product-details/${String(productId)}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = mainDomain + '/orders';
    const CART_API_URL = `${API_BASE_URL}/items-list/cart/`;
    
    // DOM Elements
    const cartItemsContainer = document.querySelector('.cart-section');
    const cartItemsCount = document.getElementById('cart-items-count');
    const subtotalElement = document.querySelector('.subtotal-title span:last-child');
    const totalElement = document.querySelector('.subtotal-total span:last-child');
    const checkoutBtn = document.querySelector('.subtotal-button button');

    // Get CSS variables
    function getCSSVariable(variable) {
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    }

    const mainColor = getCSSVariable('--main-color') || '#3348FF';
    const mainColor2 = getCSSVariable('--main-color2') || '#0066c0';

    // Enhanced Loader HTML
    const loaderHTML = `
        <div class="loading-spinner">
            <div class="loader-spinner"></div>
            <p>Loading...</p>
        </div>
    `;

    // Empty cart HTML
    function getEmptyCartHTML() {
        return `
            <div class="empty-cart">
                <i class="bi bi-cart-x" style="font-size: 48px; color: ${mainColor}; margin-bottom: 15px;"></i>
                <h3>Cart is Empty</h3>
                <p>No products in the shopping cart</p>
                <a href="/shop" class="continue-shopping-btn">Continue Shopping</a>
            </div>
        `;
    }

    // Utility Functions
    function showLoader() {
        cartItemsContainer.innerHTML = loaderHTML;
    }

    function showError(message) {
        cartItemsContainer.innerHTML = `
            <div class="cart-error">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Loading Error</h3>
                <p>${message}</p>
                <button onclick="loadCartItems()" class="retry-btn">Try Again</button>
            </div>
        `;
    }

    // New function to show authentication required message
    function showAuthRequired() {
        cartItemsContainer.innerHTML = `
            <div class="auth-required" style="text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; width: 100%; margin: 0 auto;">
                <i class="bi bi-person-lock" style="font-size: 64px; color: ${mainColor}; margin-bottom: 20px; display: block;"></i>
                <h3 style="color: #495057; margin-bottom: 15px; font-size: 24px; font-weight: 600;">Login required</h3>
                <p style="color: #6c757d; margin-bottom: 25px; font-size: 16px; line-height: 1.6;">
                    You must log in first to view your cart items.
                </p>
                <div class="auth-buttons" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.history.back()" class="back-btn" style="
                        padding: 12px 24px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        text-decoration: none;
                        min-width: 120px;
                        justify-content: center;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        <i class="bi bi-arrow-left"></i>
                        Go back
                    </button>
                    <a href="/login/" class="login-btn" style="
                        padding: 12px 24px;
                        background: ${mainColor};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        text-decoration: none;
                        min-width: 120px;
                        justify-content: center;
                    " onmouseover="this.style.background='${mainColor2}'" onmouseout="this.style.background='${mainColor}'">
                        <i class="bi bi-person-check"></i>
                        Log in
                    </a>
                </div>
            </div>
        `;
        
        // Update cart count to 0
        updateCartCount(0);
        updateCartSummary(null);
    }

    function showMessage(message, type = 'success') {
        // Remove existing messages first
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast-message';
        messageDiv.innerHTML = `
            <div class="toast-content">
                <i class="${type === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c);'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            font-size: 14px;
            font-weight: 500;
            min-width: 250px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Slide in animation
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }, 3000);
    }

    function formatPrice(price) {
        const validPrice = isNaN(parseFloat(price)) ? 0 : parseFloat(price);
        return `${currencySymbol}${validPrice.toFixed(2)}`;
    }

    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
               document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }

    // API Functions with fetchWithAuth
    async function makeApiRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        };

        try {
            const response = await fetchWithAuth(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
                credentials: 'include',
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                throw new Error('AUTHENTICATION_REQUIRED');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Load Cart Items with 401 handling - UPDATED for new API structure
    async function loadCartItems() {
        try {
            showLoader();
            const cartData = await makeApiRequest(CART_API_URL);
            console.log('Cart API Response:', cartData);
            
            // Handle the new API structure
            const items = cartData.items || [];
            renderCartItems(items);
            updateCartSummary(cartData);
        } catch (error) {
            if (error.message === 'AUTHENTICATION_REQUIRED') {
                showAuthRequired();
                return;
            }
            
            const errorMessage = error.message.includes('Failed to fetch') 
                ? 'Unable to connect to server. Please check your internet connection.'
                : 'Failed to load cart items. Please try again.';
            showError(errorMessage);
            console.error('Failed to load cart items:', error);
        }
    }

    // Render Cart Items - UPDATED
    function renderCartItems(items) {
        if (!items || items.length === 0) {
            cartItemsContainer.innerHTML = getEmptyCartHTML();
            updateCartCount(0);
            updateCartSummary(null);
            return;
        }

        let cartHTML = '';
        items.forEach(item => {
            cartHTML += createCartItemHTML(item);
        });

        cartItemsContainer.innerHTML = cartHTML;
        updateCartCount(items.length);
        attachEventListeners();
    }

    // Create Cart Item HTML - UPDATED for new structure
    function createCartItemHTML(item) {
        const product = item.product;
        const imageUrl = product.image_1 || '/static/images/placeholder.jpg';
        
        // Handle color and size arrays from new API
        const color = Array.isArray(product.color) && product.color.length > 0 ? product.color[0] : null;
        const size = Array.isArray(product.size) && product.size.length > 0 ? product.size[0] : null;
        const option = Array.isArray(product.options) && product.options.length > 0 ? product.options[0] : null;
        console.log(item);
        
        return `
            <div class="cart-items" data-item-id="${item.id}">
                <div class="cart-items-image">
                    <img onclick="viewProductDetails('${product.id}')" src="${imageUrl}" alt="${product.name}" 
                         onerror="this.src='/static/images/placeholder.jpg'"
                         loading="lazy">
                </div>
                <div class="cart-items-detailes">
                    <div class="cart-items-detailes-name">
                        ${product.name}
                    </div>
                    <div class="cart-items-detailes-options">
                        ${ `
                            <div class="option-name">
                                <span class="ferst-span">${option_1}:</span>
                                <span>${item.size ?item.size : "---"}</span>
                            </div>
                        `}
                        <span class="options-space"></span>
                        ${ `
                            <div class="option-name">
                                <span class="ferst-span">${option_2}:</span>
                                <span>${ item.color ? item.color : "---"}</span>
                            </div>
                        `}
                        <span class="options-space"></span>
                        ${item.options ? `
                            <div class="option-name">
                                <span class="ferst-span">${option_3}:</span>
                                
                                <span>${item.options}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="cart-items-detailes-buttons">
                        <div class="qontity-section">
                            <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}" 
                                    title="Decrease quantity" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <div class="quantity-wrapper">
                                <input type="number" value="${item.quantity}" class="no-arrows quantity-input" 
                                       min="1" data-item-id="${item.id}" readonly>
                                <div class="quantity-loader" style="display: none;">
                                    <div class="loader-spinner"></div>
                                </div>
                            </div>
                            <button class="quantity-btn" data-action="increase" data-item-id="${item.id}" 
                                    title="Increase quantity">+</button>
                        </div>
                        <div class="delete-btn">
                            <button class="remove-item-btn" data-item-id="${item.id}" title="Remove from cart">
                                <span><i class="bi bi-trash"></i></span>
                                <span>Remove</span>
                            </button>
                        </div>
                        <div class="save-btn">
                            <button class="save-for-later-btn" data-item-id="${item.id}" title="Save for later">
                                <span><i class="bi bi-heart"></i></span>
                                <span>Save for later</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="cart-items-prices">
                    <span class="item-total-price">${formatPrice(item.total)}</span>
                    <span>Price for <span class="items-count">${item.quantity}</span> item(s)</span>
                </div>
            </div>
        `;
    }

    // Update Cart Count
    function updateCartCount(count) {
        if (cartItemsCount) {
            cartItemsCount.textContent = count;
        }
        
        // Update page title with count
        const baseTitle = document.title.split('(')[0].trim();
        document.title = count > 0 ? `${baseTitle} (${count})` : baseTitle;
    }

    // Update Cart Summary - UPDATED for new API structure
    function updateCartSummary(cartData) {
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            if (subtotalElement) subtotalElement.textContent = formatPrice(0);
            if (totalElement) totalElement.textContent = formatPrice(0);
            return;
        }

        // Use the values directly from API response
        const subtotal = cartData.subtotal || 0;
        const total = cartData.total || 0;

        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(subtotal);
        }
        
        if (totalElement) {
            totalElement.textContent = formatPrice(total);
        }

        // Enable/disable checkout button based on cart contents
        if (checkoutBtn) {
            const hasItems = cartData.items && cartData.items.length > 0;
            checkoutBtn.disabled = !hasItems;
            checkoutBtn.style.opacity = hasItems ? '1' : '0.5';
        }
    }

    // Update Item Quantity with 401 handling
    async function updateItemQuantity(itemId, quantityChange) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemElement) return;

        const quantityInput = itemElement.querySelector('.quantity-input');
        const quantityLoader = itemElement.querySelector('.quantity-loader');
        const itemPriceElement = itemElement.querySelector('.item-total-price');
        const itemCountElement = itemElement.querySelector('.items-count');
        const decreaseBtn = itemElement.querySelector('[data-action="decrease"]');

        // عرض لودر
        quantityInput.style.visibility = 'hidden';
        quantityLoader.style.display = 'flex';

        // تعطيل الأزرار
        const quantityBtns = itemElement.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => btn.disabled = true);

        try {
            const response = await makeApiRequest(`${CART_API_URL}${itemId}/`, {
                method: 'PUT',
                body: JSON.stringify({ quantity_change: quantityChange }),
            });

            console.log('Quantity Update Response:', response);

            // قيم جديدة
            let newQuantity, newTotal;

            // إذا كانت الاستجابة كاملة ككل الكارت
            if (response.items) {
                const updatedItem = response.items.find(i => i.id === itemId);
                if (updatedItem) {
                    newQuantity = updatedItem.quantity;
                    newTotal = updatedItem.total;
                }
            }
            // إذا كانت الاستجابة تحتوي فقط على المنتج
            else if (response.item) {
                newQuantity = response.item.quantity;
                newTotal = response.item.total;
            }
            // إذا كانت الاستجابة مباشرة بالقيم
            else if (response.quantity !== undefined) {
                newQuantity = response.quantity;
                newTotal = response.total;
            }

            // إذا المجموع غير موجود أو صفر، نحسبه من السعر
            if (!newTotal || newTotal === 0) {
                const pricePerUnit = parseFloat(itemPriceElement.dataset.price) || parseFloat(itemElement.dataset.price) || 0;
                newTotal = pricePerUnit * newQuantity;
            }

            if (newQuantity === undefined || newQuantity <= 0) {
                throw new Error('Invalid quantity received from server');
            }

            // تحديث الـ DOM
            quantityInput.value = newQuantity;
            itemPriceElement.textContent = formatPrice(newTotal || 0);
            itemCountElement.textContent = newQuantity;
            decreaseBtn.disabled = newQuantity <= 1;

            // تحديث الملخص
            await updateCartSummaryFromServer();

            showMessage('Quantity updated successfully');

        } catch (error) {
            if (error.message === 'AUTHENTICATION_REQUIRED') {
                showAuthRequired();
                return;
            }
            console.error('Quantity update error:', error);
            showMessage('Failed to update quantity', 'error');

            // إعادة تحميل الكارت عند الخطأ
            setTimeout(() => {
                loadCartItems();
            }, 1000);
        } finally {
            // إرجاع الحالة الطبيعية
            quantityInput.style.visibility = 'visible';
            quantityLoader.style.display = 'none';
            quantityBtns.forEach(btn => btn.disabled = false);

            // تأكد من حالة زر الإنقاص
            const currentQuantity = parseInt(quantityInput.value);
            decreaseBtn.disabled = currentQuantity <= 1;
        }
    }

    // Update cart summary from server without full page reload - UPDATED
    async function updateCartSummaryFromServer() {
        try {
            const cartData = await makeApiRequest(CART_API_URL);
            const items = cartData.items || [];
            updateCartSummary(cartData);
            updateCartCount(items.length);
        } catch (error) {
            console.error('Failed to update cart summary:', error);
        }
    }

    // Remove Item from Cart - Enhanced version with direct removal
    async function removeItem(itemId) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (!itemElement) return;

        // Add visual feedback
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none';

        try {
            const response = await makeApiRequest(`${CART_API_URL}${itemId}/`, {
                method: 'DELETE',
            });

            showMessage(response.message || 'Item removed successfully');
            
            // Smooth removal animation
            itemElement.style.display = 'none';
            itemElement.style.transition = 'all 0s ease';
            itemElement.style.transform = 'translateX(-100%)';
            itemElement.style.maxHeight = '0px';
            itemElement.style.padding = '0px';
            itemElement.style.margin = '0px';
            itemElement.style.overflow = 'hidden';
            itemElement.style.padding = '0px';
            
                // Remove the item from DOM
                itemElement.remove();
                
                // Check if cart is now empty
                const remainingItems = document.querySelectorAll('.cart-items[data-item-id]');
                if (remainingItems.length === 0) {
                    // Show empty cart message
                    cartItemsContainer.innerHTML = getEmptyCartHTML();
                    updateCartCount(0);
                    updateCartSummary(null);
                } else {
                    // Update cart count and summary
                    updateCartCount(remainingItems.length);
                    updateCartSummaryFromServer();
                }
            
        } catch (error) {
            if (error.message === 'AUTHENTICATION_REQUIRED') {
                showAuthRequired();
                return;
            }
            showMessage('Failed to remove item', 'error');
            console.error('Failed to remove item:', error);
            
            // Restore visual state on error
            itemElement.style.opacity = '1';
            itemElement.style.pointerEvents = 'auto';
        }
    }

    // Save for Later (Add to Favorites) with 401 handling
    async function saveForLater(itemId) {
        try {
            // Here you would make actual API call
            // const response = await makeApiRequest(`/favorites/${itemId}/`, { method: 'POST' });
            showMessage('Item added to favorites');
        } catch (error) {
            if (error.message === 'AUTHENTICATION_REQUIRED') {
                showAuthRequired();
                return;
            }
            showMessage('Failed to add item to favorites', 'error');
            console.error('Failed to save for later:', error);
        }
    }

    // Attach Event Listeners
    function attachEventListeners() {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (this.disabled) return;
                
                const itemId = this.dataset.itemId;
                const action = this.dataset.action;
                const quantityChange = action === 'increase' ? 1 : -1;
                const quantityInput = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
                const currentQuantity = parseInt(quantityInput.value) || 1;

                // Prevent decrease if quantity is 1
                if (quantityChange < 0 && currentQuantity <= 1) {
                    showMessage('Quantity must be greater than zero', 'error');
                    return;
                }

                updateItemQuantity(itemId, quantityChange);
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
                
                // Simple confirmation
                removeItem(itemId);
            });
        });

        document.querySelectorAll('.save-for-later-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
                saveForLater(itemId);
            });
        });
    }
    
    // Checkout functionality
    function handleCheckout() {
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function(e) {
                if (this.disabled) {
                    e.preventDefault();
                    showMessage('Cart is empty', 'error');
                    return;
                }
                
                // Show loading state
                const originalText = this.textContent;
                this.textContent = 'Redirecting...';
                this.disabled = true;
                
                window.location.href = '/checkout/';
            });
        }
    }

    // Initialize
    function init() {
        loadCartItems();
        handleCheckout();
        
        // Create refresh button with proper styling
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        refreshBtn.className = 'refresh-cart-btn';
        refreshBtn.addEventListener('click', () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
            
            loadCartItems().finally(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            });
        });
        
        const cartTitle = document.querySelector('.cart-title');
        if (cartTitle) {
            cartTitle.appendChild(refreshBtn);
        }

        // Auto-refresh every 5 minutes if page is visible
        setInterval(() => {
            if (!document.hidden) {
                loadCartItems();
            }
        }, 300000); // 5 minutes
    }

    // Expose functions globally for debugging/external use
    window.reloadCart = loadCartItems;
    window.cartAPI = {
        loadCartItems,
        updateItemQuantity,
        removeItem,
        saveForLater
    };

    // Initialize the cart
    init();
});