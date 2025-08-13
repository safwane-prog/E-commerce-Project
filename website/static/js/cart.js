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
        updateCartSummary([]);
    }

    function showMessage(message, type = 'success') {
        // Remove existing messages first
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast-message';
        messageDiv.innerHTML = `
            <div class="toast-content">
                <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
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

    // API Functions with better error handling including 401
    async function makeApiRequest(url, options = {}) {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        };

        try {
            const response = await fetch(url, {
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

    // Load Cart Items with 401 handling
    async function loadCartItems() {
        try {
            showLoader();
            const cartData = await makeApiRequest(CART_API_URL);
            renderCartItems(cartData);
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

    // Render Cart Items
    function renderCartItems(cartData) {
        if (!cartData || cartData.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="bi bi-cart-x" style="font-size: 48px; color: ${mainColor}; margin-bottom: 15px;"></i>
                    <h3>Cart is Empty</h3>
                    <p>No products in the shopping cart</p>
                    <a href="/shop" class="continue-shopping-btn">Continue Shopping</a>
                </div>
            `;
            updateCartCount(0);
            updateCartSummary([]);
            return;
        }

        let cartHTML = '';
        cartData.forEach(item => {
            cartHTML += createCartItemHTML(item);
        });

        cartItemsContainer.innerHTML = cartHTML;
        updateCartCount(cartData.length);
        attachEventListeners();
    }

    function viewProductDetails(productId) {
        window.location.href = `/product-details/${String(productId)}`;
    }

    // Create Cart Item HTML
    function createCartItemHTML(item) {
        const product = item.product;
        const imageUrl = product.image_1 || '/static/images/placeholder.jpg';
        
        return `
            <div class="cart-items" data-item-id="${item.id}">
                <div class="cart-items-image">
                    <img  onclick="viewProductDetails('${product.id}')" src="${imageUrl}" alt="${product.name}" 
                         onerror="this.src='/static/images/placeholder.jpg'"
                         loading="lazy">
                </div>
                <div class="cart-items-detailes">
                    <div class="cart-items-detailes-name">
                        ${product.name}
                    </div>
                    <div class="cart-items-detailes-options">
                        ${product.size ? `
                            <div class="option-name">
                                <span class="ferst-span">Size:</span>
                                <span>${product.size}</span>
                            </div>
                        ` : ''}
                        ${product.color ? `
                            <div class="option-name">
                                <span class="ferst-span">Color:</span>
                                <span>${product.color}</span>
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

    // Update Cart Summary
    function updateCartSummary(cartData) {
        if (!Array.isArray(cartData) || cartData.length === 0) {
            if (subtotalElement) subtotalElement.textContent = formatPrice(0);
            if (totalElement) totalElement.textContent = formatPrice(0);
            return;
        }

        let subtotal = 0;
        cartData.forEach(item => {
            const itemTotal = parseFloat(item.total);
            if (!isNaN(itemTotal)) {
                subtotal += itemTotal;
            }
        });

        // You can make these dynamic from server
        const discount = 60.00;
        const tax = 14.00;
        const total = Math.max(0, subtotal - discount + tax);

        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(subtotal);
        }
        
        if (totalElement) {
            totalElement.textContent = formatPrice(total);
        }

        // Enable/disable checkout button based on cart contents
        if (checkoutBtn) {
            checkoutBtn.disabled = cartData.length === 0;
            checkoutBtn.style.opacity = cartData.length === 0 ? '0.5' : '1';
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

        // Show loader
        quantityInput.style.visibility = 'hidden';
        quantityLoader.style.display = 'flex';

        // Disable buttons during update
        const quantityBtns = itemElement.querySelectorAll('.quantity-btn');
        quantityBtns.forEach(btn => btn.disabled = true);

        try {
            const response = await makeApiRequest(`${CART_API_URL}${itemId}/`, {
                method: 'PUT',
                body: JSON.stringify({ quantity_change: quantityChange }),
            });

            console.log('Quantity Update Response:', response);

            // Handle different response structures
            const newQuantity = response.quantity || response.item?.quantity || parseInt(quantityInput.value) + quantityChange;
            const newTotal = response.total || response.item?.total || response.total_price || response.item?.total_price;

            if (newQuantity === undefined || newQuantity <= 0) {
                throw new Error('Invalid quantity');
            }

            // Update DOM elements
            quantityInput.value = newQuantity;
            itemPriceElement.textContent = formatPrice(newTotal || 0);
            itemCountElement.textContent = newQuantity;
            
            // Enable/disable decrease button
            decreaseBtn.disabled = newQuantity <= 1;
            
            // Update cart summary
            const cartData = await makeApiRequest(CART_API_URL);
            updateCartSummary(cartData);
            
            showMessage('Quantity updated successfully');

        } catch (error) {
            if (error.message === 'AUTHENTICATION_REQUIRED') {
                showAuthRequired();
                return;
            }
            console.error('Quantity update error:', error);
            showMessage('Failed to update quantity', 'error');
        } finally {
            // Hide loader and re-enable buttons
            quantityInput.style.visibility = 'visible';
            quantityLoader.style.display = 'none';
            quantityBtns.forEach(btn => btn.disabled = false);
            
            // Re-check decrease button state
            const currentQuantity = parseInt(quantityInput.value);
            decreaseBtn.disabled = currentQuantity <= 1;
        }
    }

    // Remove Item from Cart with confirmation and 401 handling
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
            itemElement.style.transition = 'all 0.3s ease';
            itemElement.style.transform = 'translateX(-100%)';
            itemElement.style.maxHeight = '0px';
            itemElement.style.padding = '0px';
            itemElement.style.margin = '0px';
            
            setTimeout(async () => {
                await loadCartItems(); // Reload cart to reflect changes
            }, 300);
            
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

// Module exports for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCartItems,
        updateItemQuantity,
        removeItem,
    };
}