const API_ORDER_URL = mainDomain + "orders/user/orders/create/";
const API_COUPON_URL = mainDomain + "orders/apply-promo/";

// State management
let orderData = null;
let isSubmitting = false;
let appliedCouponId = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadOrderSummary();
    // setupFormValidation();
    setupPaymentMethods();
    loadDraft();
    
    const form = document.getElementById("checkout-form");
    if (form) {
        form.addEventListener("submit", handleFormSubmit);
    }
});

// function setupFormValidation() {
//     const requiredFields = document.querySelectorAll('.form-group.required input, .form-group.required select');
    
//     requiredFields.forEach(field => {
//         field.addEventListener('blur', validateField);
//         field.addEventListener('input', clearError);
//     });
// }

function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
        });
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.name;
    
    clearError(e);
    
    if (field.closest('.form-group').classList.contains('required') && !value) {
        showError(field, 'This field is required');
        return false;
    }
    
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showError(field, 'Please enter a valid email');
            return false;
        }
    }
    
    if (fieldName === 'phone' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 8) {
            showError(field, 'Please enter a valid phone number');
            return false;
        }
    }
    
    return true;
}

function showError(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function clearError(e) {
    const field = e.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}


async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const form = e.target;
    const submitButton = form.querySelector('.btn-primary');
    const originalButtonText = submitButton.textContent;
    
    if (!validateForm(form)) {
        showNotification('Please correct the errors below', 'error');
        return;
    }
    
    if (!orderData || !orderData.order_summary || orderData.order_summary.length === 0) {
        showNotification('Shopping cart is empty', 'error');
        return;
    }
    
    try {
        isSubmitting = true;
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.innerHTML = '<span>Processing...</span>';
        
        const formData = new FormData(form);
        const activePayment = document.querySelector('.payment-method.active');
        const promoInput = document.getElementById('promo-code-input');
        
        const data = {
            customer_name: formData.get('firstName') + ' ' + formData.get('lastName'),
            customer_email: formData.get('email'),
            customer_phone: formData.get('phone'),
            customer_address: formData.get('address'),
            city: formData.get('city'),
            payment_method: activePayment ? activePayment.dataset.method : 'Cash on Delivery',
            coupon_code: promoInput ? promoInput.value.trim() : null,
            is_use_coupon: !!appliedCouponId,
            code_id: appliedCouponId,
            total: orderData.total // Send the calculated total including any discounts
        };

        const response = await fetch(API_ORDER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie('csrftoken')
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            showNotification(result.message, 'success');
            localStorage.removeItem('checkoutDraft');
            appliedCouponId = null;
            
            setTimeout(() => {
                window.location.href = `/confirmation/${result.order.id}`;
            }, 1500);
            
        } else {
            if (result.error && result.error.includes("Coupon")) {
                const errorMsg = result.error.includes("already used") ? 
                    "You have already used this coupon" : 
                    result.error;
                
                showNotification(errorMsg, 'error');
                
                if (result.error.includes("already used")) {
                    const promoSection = document.querySelector('.promo-code');
                    if (promoSection) promoSection.style.display = 'none';
                }
            } else {
                throw new Error(result.error || "Failed to create order");
            }
        }
        
    } catch (error) {
        console.error("Order Creation Error:", error);
        showNotification(error.message || "Network error while creating order", 'error');
        
    } finally {
        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = originalButtonText;
    }
}

// ... (keep the rest of the code the same)

function validateForm(form) {
    const requiredFields = form.querySelectorAll('.form-group.required input, .form-group.required select');
    let isValid = true;
    
    requiredFields.forEach(field => {
        const event = { target: field };
        if (!validateField(event)) {
            isValid = false;
        }
    });
    
    return isValid;
}

async function loadOrderSummary() {
    const container = document.querySelector(".order-summary");
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading" style="width: 40px; height: 40px; margin: 0 auto;"></div><p style="margin-top: 16px; color: var(--light-text);">Loading your order...</p></div>';
    
    try {
        const response = await fetch(API_ORDER_URL, {
            method: "GET",
            credentials: "include"
        });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load order summary");
        }

        orderData = data;
        renderOrderSummary(data);

    } catch (error) {
        console.error("Error loading order summary:", error);
        renderEmptyCart(container);
    }
}

function renderOrderSummary(data) {
    const container = document.querySelector(".order-summary");
    if (!container) return;

    if (!data.order_summary || data.order_summary.length === 0) {
        renderEmptyCart(container);
        return;
    }

    let itemsHTML = "";
    data.order_summary.forEach(item => {
        const product = item.product;
        const itemTotal = parseFloat(product.price) * parseInt(item.quantity);
        
        itemsHTML += `
            <div class="order-item">
                <div class="item-image">
                    ${product.image_1 ? 
                        `<img src="${product.image_1}" alt="${product.name}" onerror="this.style.display='none'; this.parentNode.innerHTML='📦';">` :
                        '<span style="font-size: 24px;">📦</span>'
                    }
                </div>
                <div class="item-details">
                    <div class="item-name">${escapeHtml(product.name)}</div>
                    <div class="item-quantity">Quantity: ${item.quantity}</div>
                </div>
                <div class="item-price">${formatPrice(itemTotal)}</div>
            </div>
        `;
    });

    container.innerHTML = `
        <h2>Order Summary</h2>
        <div class="order-items">
            ${itemsHTML}
        </div>
        <div class="promo-code">
            <input type="text" id="promo-code-input" placeholder="Enter promo code" maxlength="20">
            <button type="button" onclick="applyPromoCode()">Apply</button>
        </div>
        <div class="order-totals">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatPrice(data.subtotal)}</span>
            </div>
            ${data.discount > 0 ? `
                <div class="summary-row">
                    <span>Discount:</span>
                    <span class="discount">-${formatPrice(data.discount)}</span>
                </div>
            ` : ''}
            ${data.tax > 0 ? `
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>${formatPrice(data.tax)}</span>
                </div>
            ` : ''}
            <div class="summary-row">
                <span>Shipping:</span>
                <span>${formatPrice(data.shipping)}</span>
            </div>
            ${data.service_fee > 0 ? `
                <div class="summary-row">
                    <span>Service Fee:</span>
                    <span>${formatPrice(data.service_fee)}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span>Total:</span>
                <span>${formatPrice(data.total)}</span>
            </div>
        </div>
    `;
}

function renderEmptyCart(container) {
    container.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">🛒</div>
            <h3>Shopping cart is empty</h3>
            <p>Add some products to your cart to proceed to checkout.</p>
            <button class="btn btn-primary" onclick="window.location.href='/shop'" style="margin-top: 20px; max-width: 200px;">
                Browse Products
            </button>
        </div>
    `;
}
// ... (keep all previous code until applyPromoCode function)

async function applyPromoCode() {
    const promoInput = document.getElementById('promo-code-input');
    const promoCode = promoInput.value.trim();
    
    if (!promoCode) {
        showNotification('Please enter a promo code', 'warning');
        return;
    }
    
    try {
        const response = await fetch(API_COUPON_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include',
            body: JSON.stringify({ code: promoCode })
        });
        
        const result = await response.json();
        console.log('Coupon response:', result);
        
        if (response.ok) {
            appliedCouponId = result.code_id;
            console.log(appliedCouponId);
            
            // Calculate new total with discount
            if (result.discount_percent) {
                console.log('Applying discount:', result.discount_percent);
                
                const discountPercentage = parseFloat(result.discount_percent);
                const originalTotal = orderData.total;
                const discountAmount = (originalTotal * discountPercentage) / 100;
                
                // Update orderData with new values
                orderData.discount = discountAmount;
                orderData.total = originalTotal - discountAmount;
                
                showNotification(`Discount of ${discountPercentage}% applied successfully!`, 'success');
            } else {
                showNotification(result.message, 'success');
            }
            
            // Re-render the order summary with updated values
            renderOrderSummary(orderData);
            
        } else {
            if (result.error) {
                let errorMsg = result.error;
                
                if (result.error.includes("already used")) {
                    errorMsg = "You have already used this coupon";
                }
                
                showNotification(errorMsg, 'error');
            } else {
                showNotification(result.error, 'error');
            }
        }
        
    } catch (error) {
        console.error('Coupon error:', error);
        showNotification('Failed to apply coupon', 'error');
    }
}
function formatPrice(amount) {
    const currencySymbol = "SAR ";
    const numAmount = parseFloat(amount) || 0;
    return currencySymbol + numAmount.toFixed(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    const colors = {
        success: '#48bb78',
        error: '#e53e3e',
        warning: '#ed8936',
        info: '#3348FF'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function saveDraft() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const draftData = {};
    
    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }
    
    localStorage.setItem('checkoutDraft', JSON.stringify(draftData));
}

function loadDraft() {
    const draftData = localStorage.getItem('checkoutDraft');
    if (!draftData) return;
    
    try {
        const data = JSON.parse(draftData);
        const form = document.getElementById('checkout-form');
        if (!form) return;
        
        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    } catch (error) {
        console.error('Error loading draft:', error);
    }
}

// Auto-save every 30 seconds
setInterval(saveDraft, 30000);

// Handle beforeunload event
window.addEventListener('beforeunload', (e) => {
    saveDraft();
    
    const form = document.getElementById('checkout-form');
    if (form && !isSubmitting) {
        const formData = new FormData(form);
        let hasData = false;
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                hasData = true;
                break;
            }
        }
        
        if (hasData) {
            e.preventDefault();
            e.returnValue = '';
        }
    }
});