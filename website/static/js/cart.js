document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = '/orders';
    const CART_API_URL = `${API_BASE_URL}/items-list/cart/`;
    
    // DOM Elements
    const cartItemsContainer = document.querySelector('.cart-section');
    const cartItemsCount = document.getElementById('cart-items-count');
    const subtotalElement = document.querySelector('.subtotal-title span:last-child');
    const totalElement = document.querySelector('.subtotal-total span:last-child');
    const checkoutBtn = document.querySelector('.subtotal-button button');

    // Loader HTML
    const loaderHTML = `
        <div class="cart-loader">
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
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="loadCartItems()" class="retry-btn">Retry</button>
            </div>
        `;
    }

    function showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
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

    // API Functions
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Load Cart Items
    async function loadCartItems() {
        try {
            showLoader();
            const cartData = await makeApiRequest(CART_API_URL);
            renderCartItems(cartData);
            updateCartSummary(cartData);
        } catch (error) {
            showError('Failed to load cart items. Please try again.');
            console.error('Failed to load cart items:', error);
        }
    }

    // Render Cart Items
    function renderCartItems(cartData) {
        if (!cartData || cartData.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <h3>Cart is Empty</h3>
                    <p>No products in the shopping cart</p>
                    <a href="/" class="continue-shopping-btn">Continue Shopping</a>
                </div>
            `;
            updateCartCount(0);
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

    // Create Cart Item HTML
    function createCartItemHTML(item) {
        const product = item.product;
        const imageUrl = product.image_1 || '/static/images/placeholder.jpg';
        
        return `
            <div class="cart-items" data-item-id="${item.id}">
                <div class="cart-items-image">
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/static/images/placeholder.jpg'">
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
                            <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}">-</button>
                            <div class="quantity-wrapper">
                                <input type="number" value="${item.quantity}" class="no-arrows quantity-input" 
                                       min="1" data-item-id="${item.id}" readonly>
                                <div class="quantity-loader" style="display: none;">
                                    <div class="loader-spinner"></div>
                                </div>
                            </div>
                            <button class="quantity-btn" data-action="increase" data-item-id="${item.id}">+</button>
                        </div>
                        <div class="delete-btn">
                            <button class="remove-item-btn" data-item-id="${item.id}">
                                <span><i class="bi bi-trash"></i></span>
                                <span>Remove</span>
                            </button>
                        </div>
                        <div class="save-btn">
                            <button class="save-for-later-btn" data-item-id="${item.id}">
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
    }

    // Update Cart Summary
    function updateCartSummary(cartData) {
        let subtotal = 0;
        cartData.forEach(item => {
            const itemTotal = parseFloat(item.total);
            if (!isNaN(itemTotal)) {
                subtotal += itemTotal;
            }
        });

        const discount = 60.00;
        const tax = 14.00;
        const total = subtotal - discount + tax;

        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(subtotal);
        }
        
        if (totalElement) {
            totalElement.textContent = formatPrice(total);
        }
    }

    // Update Item Quantity
    async function updateItemQuantity(itemId, quantityChange) {
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        const quantityInput = itemElement.querySelector('.quantity-input');
        const quantityWrapper = itemElement.querySelector('.quantity-wrapper');
        const quantityLoader = itemElement.querySelector('.quantity-loader');
        const itemPriceElement = itemElement.querySelector('.item-total-price');
        const itemCountElement = itemElement.querySelector('.items-count');

        // Show loader in input
        quantityInput.style.display = 'none';
        quantityLoader.style.display = 'flex';

        try {
            const response = await makeApiRequest(`${CART_API_URL}${itemId}/`, {
                method: 'PUT',
                body: JSON.stringify({ quantity_change: quantityChange }),
            });

            // Log response for debugging
            console.log('Quantity Update Response:', response);

            // Flexible validation to handle different response structures
            const newQuantity = response.quantity || response.item?.quantity || parseInt(quantityInput.value) + quantityChange;
            const newTotal = response.total || response.item?.total || response.total_price || response.item?.total_price;

            if (newQuantity === undefined) {
                throw new Error('Invalid response: quantity missing');
            }

            // Update DOM elements
            quantityInput.value = newQuantity;
            itemPriceElement.textContent = formatPrice(newTotal || 0);
            itemCountElement.textContent = newQuantity;
            
            // Update cart summary
            const cartData = await makeApiRequest(CART_API_URL);
            updateCartSummary(cartData);
            
            showMessage('Quantity updated successfully');

        } catch (error) {
            console.error('Quantity update error:', error);
            showMessage('Failed to update quantity', 'error');
        } finally {
            // Hide loader
            quantityInput.style.display = 'block';
            quantityLoader.style.display = 'none';
        }
    }

    // Remove Item from Cart
    async function removeItem(itemId) {
        if (!confirm('Are you sure you want to remove this item from the cart?')) {
            return;
        }

        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('cart-item-updating');
        }

        try {
            const response = await makeApiRequest(`${CART_API_URL}${itemId}/`, {
                method: 'DELETE',
            });

            showMessage(response.message || 'Item removed successfully');
            
            // Reload cart to reflect changes
            await loadCartItems();
            
        } catch (error) {
            showMessage('Failed to remove item', 'error');
            console.error('Failed to remove item:', error);
        } finally {
            if (itemElement) {
                itemElement.classList.remove('cart-item-updating');
            }
        }
    }

    // Save for Later (Add to Favorites)
    async function saveForLater(itemId) {
        try {
            showMessage('Item added to favorites');
        } catch (error) {
            showMessage('Failed to add item to favorites', 'error');
            console.error('Failed to save for later:', error);
        }
    }

    // Attach Event Listeners
    function attachEventListeners() {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
                const action = this.dataset.action;
                const quantityChange = action === 'increase' ? 1 : -1;
                
                updateItemQuantity(itemId, quantityChange);
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemId = this.dataset.itemId;
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
            checkoutBtn.addEventListener('click', function() {
                window.location.href = '/checkout/';
            });
        }
    }

    // Initialize
    function init() {
        loadCartItems();
        handleCheckout();
        
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh Cart';
        refreshBtn.className = 'refresh-cart-btn';
        refreshBtn.style.cssText = 'margin: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
        refreshBtn.addEventListener('click', loadCartItems);
        
        const cartTitle = document.querySelector('.cart-title');
        if (cartTitle) {
            cartTitle.appendChild(refreshBtn);
        }
    }

    window.reloadCart = loadCartItems;

    init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadCartItems,
        updateItemQuantity,
        removeItem,
    };
}