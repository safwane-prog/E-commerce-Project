// Function to get cookie value
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

// API configuration
const API_BASE_URL = mainDomain+'users/api/';

// Default placeholder paths
const DEFAULT_PROFILE_IMAGE = '/static/imges/user_Placeholder.png';
const DEFAULT_PRODUCT_IMAGE =  '/static/imges/user_Placeholder.png';


document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
    setupEventListeners();
});

async function fetchUserData() {
    toggleLoadingState(true);
    const token = getCookie('csrftoken');
    if (!token) {
        showNotification('Authentication token not found. Please log in.', 'error');
        setTimeout(() => window.location.href = '/login/', 2000);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}profile/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const userData = await response.json();
        updateUI(userData);
    } catch (error) {
        showNotification(`Failed to load user data: ${error.message}`, 'error');
        console.error('Error fetching user data:', error);
        // Show error state UI
        showErrorState('Failed to load profile data');
    } finally {
        toggleLoadingState(false);
    }
}

function updateUI(userData) {
    console.log(userData);
    
    try {
        // Safely access nested properties
        const profile = userData?.profile?.profile || {};
        const userProfile = userData?.profile || {};
        
        // Update profile picture with fallback
        const profileImg = document.getElementById('profile-picture');
        if (profileImg) {
            profileImg.src = profile.profile_img || DEFAULT_PROFILE_IMAGE;
            profileImg.onerror = () => profileImg.src = DEFAULT_PROFILE_IMAGE;
        }
        
        // Update user name with fallback
        const userName = document.getElementById('user-name');
        if (userName) {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            userName.textContent = fullName || userProfile.username || 'User';
        }
        
        // Update email with fallback
        const userEmail = document.getElementById('user-email');
        if (userEmail) {
            userEmail.textContent = userData.profile.profile.email || 'No email provided';
        }

        // Update statistics with safe defaults
        updateStatistic('total-orders', userData.order_count || 0);
        updateStatistic('wishlist-items', userData.wishlist_count || 0);
        updateStatistic('messages-count', userData.messages_count || 0);
        updateStatistic('total-spent', `$${parseFloat(userData.total_spent || 0).toFixed(2)}`);

        // Populate sections with error handling
        populateRecentOrders(userData.orders || []);
        populateProfileForm(userProfile);
        populateOrders(userData.orders || []);
        populateWishlist(userData.wishlist_items || []);
        populateMessages(userData.messages || []);
    } catch (error) {
        console.error('Error updating UI:', error);
        showNotification('Error updating interface', 'error');
    }
}

function updateStatistic(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function populateRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = createEmptyState('orders', 'No recent orders yet', 'Start shopping to see your orders here');
        return;
    }
    
    container.innerHTML = '';
    orders.slice(0, 3).forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="order-header">
                <span>Order #${order.order_number || order.id || 'N/A'}</span>
                <span class="${order.state === 'Pending' ? 'order-status-pending' : 'order-status-paid'}">${order.state || 'Unknown'}</span>
            </div>
            <div class="order-date">${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date not available'}</div>
        `;
        container.appendChild(orderItem);
    });
}

function populateProfileForm(user) {
    if (!user) return;
    
    const profile = user.profile || {};
    
    const fields = [
        { id: 'firstName', value: profile.first_name },
        { id: 'lastName', value: profile.last_name },
        { id: 'email', value: profile.email },
        { id: 'phone', value: profile.phone_number },
        { id: 'address', value: profile.address },
        { id: 'city', value: profile.city },
        { id: 'country', value: profile.country }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value || '';
        }
    });
}

function populateOrders(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = createEmptyState('orders', 'No orders found', 'Your order history will appear here');
        return;
    }
    
    container.innerHTML = '';
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        orderItem.innerHTML = `
            <div class="order-header">
                <span>Order #${order.order_number || order.id || 'N/A'}</span>
                <span class="${order.state === 'Pending' ? 'order-status-pending' : 'order-status-paid'}">
                    ${order.state || 'Unknown'}
                </span>
            </div>
            <div class="order-date">${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date not available'}</div>
            <button class="view-details-btn" onclick="toggleOrderDetails('${order.id}')">View Details</button>
            <div id="order-details-${order.id}" class="order-details">
                ${(order.products || []).map(product => {
                    const fullName = product.name || 'Product name not available';
                    const shortName = fullName.length > 60 ? fullName.substring(0, 60) + '...' : fullName;
                    return `
                        <div class="order-product">
                            <img class="viewDetails" 
                                 onclick="viewDetails('${product.id}')" 
                                 src="${product.image_1 || DEFAULT_PRODUCT_IMAGE}" 
                                 alt="${product.name || 'Product'}"
                                 onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'">
                            <div class="order-product-details">
                                <div class="order-product-image">
                                    <div class="order-product-title" title="${fullName}">${shortName}</div>
                                    <div class="order-product-price">$${parseFloat(product.price || 0).toFixed(2)}</div>
                                </div>
                                <button class="rate-product-btn" 
                                        onclick="openRatingModal('${product.id}', '${(product.name || 'Product').replace(/'/g, "\\'")}')" 
                                        ${product.is_rated_by_user ? 'disabled aria-disabled="true"' : ''}>
                                    ${product.is_rated_by_user ? 'Rated' : 'Add Review'}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        container.appendChild(orderItem);
    });
}


function populateWishlist(wishlist) {
    const container = document.getElementById('wishlist-grid');
    if (!container) return;
    
    if (!wishlist || wishlist.length === 0) {
        container.innerHTML = createEmptyState('wishlist', 'Your wishlist is empty', 'Add products you love to see them here');
        return;
    }
    
    container.innerHTML = '';
    wishlist.forEach(item => {
        if (!item.product) return; // Skip if product data is missing
        
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        wishlistItem.innerHTML = `
            <img class="viewDetails" 
                 onclick="viewDetails('${item.product.id}')" 
                 src="${item.product.image_1 || DEFAULT_PRODUCT_IMAGE}" 
                 alt="${item.product.name || 'Product'}"
                 onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'">
            <div class="title">${item.product.name || 'Product name not available'}</div>
            <div class="price">$${parseFloat(item.product.price || 0).toFixed(2)}</div>
            <div class="actions">
                <button class="add-to-cart" onclick="addToCart('${item.product.id}')">Add to Cart</button>
                <button class="remove" onclick="removeFromWishlist('${item.product.id}',this)">Remove</button>
            </div>
        `;
        container.appendChild(wishlistItem);
    });
}

function populateMessages(messages) {
    const container = document.getElementById('messages-list');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = createEmptyState('messages', 'No messages yet', 'Your conversations with support will appear here');
        return;
    }
    
    container.innerHTML = '';
    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.className = 'message-item';
        messageItem.innerHTML = `
            <div class="message-header">
                <h4>${message.subject || 'No subject'}</h4>
                <span class="message-date">${message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Date not available'}</span>
            </div>
            <div class="message-content">${message.message || 'No message content'}</div>
            ${(message.replies && message.replies.length > 0) ? `
                <div class="message-replied-by">
                    Replied by ${message.replies[0].admin_name || 'Admin'}: ${message.replies[0].reply_message || 'No reply content'}
                    <br><span class="message-date">${message.replies[0].created_at ? new Date(message.replies[0].created_at).toLocaleDateString() : 'Date not available'}</span>
                </div>
            ` : ''}
        `;
        container.appendChild(messageItem);
    });
}

function createEmptyState(type, title, description) {
    const icons = {
        orders: `<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="m1 1 4 4 15 2 1 7H6"></path>
                 </svg>`,
        wishlist: `<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                   </svg>`,
        messages: `<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                   </svg>`
    };
    
    return `
        <div class="empty-state">
            ${icons[type] || icons.orders}
            <h3 class="empty-title">${title}</h3>
            <p class="empty-description">${description}</p>
        </div>
    `;
}

function showErrorState(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-state">
                <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h3 class="error-title">Oops! Something went wrong</h3>
                <p class="error-description">${message}</p>
                <button class="retry-button" onclick="fetchUserData()">Try Again</button>
            </div>
        `;
    }
}

function viewDetails(productId) {
    if (productId && productId !== 'undefined') {
        window.location.href = `/product-details/${productId}`;
    }
}

function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    const ratingForm = document.getElementById('rating-form');
    if (ratingForm) {
        ratingForm.addEventListener('submit', handleRatingSubmission);
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseover', handleStarHover);
        star.addEventListener('mouseout', handleStarMouseOut);
        star.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') handleStarClick(e);
        });
    });
    
    window.addEventListener('click', event => {
        const modal = document.getElementById('rating-modal');
        if (event.target === modal) closeRatingModal();
    });
    
    const profileUpload = document.getElementById('profile-picture-upload');
    if (profileUpload) {
        profileUpload.addEventListener('change', previewProfilePicture);
    }
}

function previewProfilePicture(event) {
    const file = event.target.files[0];
    const profileImg = document.getElementById('profile-picture');
    
    if (file && profileImg) {
        const reader = new FileReader();
        reader.onload = e => profileImg.src = e.target.result;
        reader.onerror = () => profileImg.src = DEFAULT_PROFILE_IMAGE;
        reader.readAsDataURL(file);
    }
}

function handleStarClick(e) {
    const rating = parseInt(e.target.getAttribute('data-rating'));
    const ratingValue = document.getElementById('rating-value');
    if (ratingValue) {
        ratingValue.value = rating;
        updateStarDisplay(rating);
    }
}

function handleStarHover(e) {
    const rating = parseInt(e.target.getAttribute('data-rating'));
    updateStarDisplay(rating, true);
}

function handleStarMouseOut() {
    const ratingValue = document.getElementById('rating-value');
    const currentRating = ratingValue ? parseInt(ratingValue.value) : 0;
    updateStarDisplay(currentRating);
}

function updateStarDisplay(rating, isHover = false) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add(isHover ? 'hover' : 'active');
            star.classList.remove(isHover ? 'active' : 'hover');
            star.setAttribute('aria-checked', !isHover);
        } else {
            star.classList.remove('active', 'hover');
            star.setAttribute('aria-checked', 'false');
        }
    });
}

function openRatingModal(productId, productTitle) {
    if (!productId || productId === 'undefined') {
        showNotification('Product information not available.', 'error');
        return;
    }
    
    const wishlistButton = document.querySelector(`button[onclick*="${productId}"]`);
    const isRated = wishlistButton && wishlistButton.disabled;
    if (isRated) {
        showNotification('You have already rated this product.', 'error');
        return;
    }
    
    const productIdInput = document.getElementById('product-id');
    const productTitleEl = document.getElementById('rating-product-title');
    const ratingValue = document.getElementById('rating-value');
    const reviewComment = document.getElementById('review-comment');
    const modal = document.getElementById('rating-modal');
    
    if (productIdInput) productIdInput.value = productId;
    if (productTitleEl) productTitleEl.textContent = `Rate: ${productTitle}`;
    if (ratingValue) ratingValue.value = 0;
    if (reviewComment) reviewComment.value = '';
    
    updateStarDisplay(0);
    
    if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
    }
    
    const firstStar = document.querySelector('.star[data-rating="1"]');
    if (firstStar) firstStar.focus();
}

function closeRatingModal() {
    const modal = document.getElementById('rating-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

async function handleRatingSubmission(e) {
    e.preventDefault();
    toggleLoadingState(true);
    
    const productIdInput = document.getElementById('product-id');
    const ratingValueInput = document.getElementById('rating-value');
    const reviewComment = document.getElementById('review-comment');
    
    if (!productIdInput || !ratingValueInput) {
        showNotification('Form elements not found.', 'error');
        toggleLoadingState(false);
        return;
    }
    
    const productId = productIdInput.value;
    const rating = parseInt(ratingValueInput.value);
    const comment = reviewComment ? reviewComment.value.trim() : '';
    
    if (rating === 0) {
        showNotification('Please select a rating.', 'error');
        toggleLoadingState(false);
        return;
    }
    
    const token = getCookie('csrftoken');
    if (!token) {
        showNotification('Authentication token not found. Please log in.', 'error');
        toggleLoadingState(false);
        setTimeout(() => window.location.href = '/login/', 2000);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}profile/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                rating,
                review: comment
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        
        showNotification('Rating submitted successfully.', 'success');
        
        document.querySelectorAll(`button[onclick*="${productId}"]`).forEach(button => {
            if (button.textContent.includes('Add Review')) {
                button.disabled = true;
                button.setAttribute('aria-disabled', 'true');
                button.textContent = 'Rated';
            }
        });
        
        closeRatingModal();
        fetchUserData();
    } catch (error) {
        showNotification(`Failed to submit rating: ${error.message}`, 'error');
        console.error('Error submitting rating:', error);
    } finally {
        toggleLoadingState(false);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    toggleLoadingState(true);
    
    const token = getCookie('csrftoken'); 
    if (!token) {
        showNotification('Authentication token not found. Please log in.', 'error');
        toggleLoadingState(false);
        setTimeout(() => window.location.href = '/login/', 2000);
        return;
    }
    
    const formData = new FormData();
    const fields = [
        { id: 'firstName', name: 'first_name' },
        { id: 'lastName', name: 'last_name' },
        { id: 'email', name: 'email' },
        { id: 'phone', name: 'phone_number' },
        { id: 'address', name: 'address' },
        { id: 'city', name: 'city' },
        { id: 'country', name: 'country' }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            formData.append(field.name, element.value);
        }
    });
    
    const profilePictureUpload = document.getElementById('profile-picture-upload');
    if (profilePictureUpload && profilePictureUpload.files[0]) {
        formData.append('profile_img', profilePictureUpload.files[0]);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}profile/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        showNotification('Profile updated successfully!', 'success');
        fetchUserData();
    } catch (error) {
        showNotification(`Failed to update profile: ${error.message}`, 'error');
        console.error('Error updating profile:', error);
    } finally {
        toggleLoadingState(false);
    }
}

function handleNavigation(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(nav => {
        nav.classList.remove('active');
        nav.removeAttribute('aria-current');
    });
    this.classList.add('active');
    this.setAttribute('aria-current', 'page');
    
    const sectionId = this.getAttribute('data-section');
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.setAttribute('aria-hidden', 'true');
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.setAttribute('aria-hidden', 'false');
    }
}

function logout() {
    // إظهار modal التأكيد
    showLogoutModal();
}

function showLogoutModal() {
    // إنشاء modal HTML إذا لم يكن موجوداً
    let modal = document.getElementById('logout-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'logout-modal';
        modal.className = 'logout-modal';
        modal.innerHTML = `
            <div class="logout-modal-content">
                <div class="logout-modal-header">
                    <h3>Confirm logout</h3>
                </div>
                <div class="logout-modal-body">
                    <p>Are you sure you want to log out?</p>
                </div>
                <div class="logout-modal-footer">
                    <button class="cancel-btn" onclick="closeLogoutModal()">Cancel</button>
                    <button class="confirm-btn" onclick="confirmLogout()">Sign Out</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // إضافة event listener للإغلاق عند النقر خارج Modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLogoutModal();
            }
        });
        
        // إضافة event listener لمفتاح Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeLogoutModal();
            }
        });
    }
    
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    
    // التركيز على زر الإلغاء
    const cancelBtn = modal.querySelector('.cancel-btn');
    if (cancelBtn) cancelBtn.focus();
}

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

async function confirmLogout() {
    closeLogoutModal();
    toggleLoadingState(true);
    
    try {
        const response = await fetch('http://127.0.0.1:8000/users/auth/users/logout/', {
            method: 'POST',
            credentials: 'include',  // إرسال الكوكيز مع الطلب
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('csrftoken') || ''}`
            }
        });
        
        if (response.ok || response.status === 204) {
            // مسح الكوكيز المحلية
            document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            
            showNotification('You have successfully logged out! Redirecting...', 'success');
            
            // التوجيه لصفحة تسجيل الدخول بعد ثانيتين
            setTimeout(() => {
                window.location.href = '/login/';
            }, 2000);
        } else {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        
        // حتى لو فشل الطلب، قم بمسح البيانات المحلية والتوجيه
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        
        showNotification('تم تسجيل الخروج محلياً. جاري التوجيه...', 'warning');
        
        setTimeout(() => {
            window.location.href = '/login/';
        }, 2000);
    } finally {
        toggleLoadingState(false);
    }
}

async function addToCart(productId) {
    if (!productId || productId === 'undefined') {
        showNotification('Product information not available.', 'error');
        return;
    }
    
    toggleLoadingState(true);
    const token = getCookie('csrftoken');
    if (!token) {
        showNotification('Authentication token not found. Please log in.', 'error');
        toggleLoadingState(false);
        setTimeout(() => window.location.href = '/login/', 2000);
        return;
    }
    
    try {
        const response = await fetch(`/orders/add-to-cart/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        showNotification(data.message || 'Added to cart successfully', 'success');
    } catch (error) {
        showNotification(`Failed to add to cart: ${error.message}`, 'error');
        console.error('Error adding to cart:', error);
    } finally {
        toggleLoadingState(false);
    }
}

async function removeFromWishlist(product_id, buttonElement) {
    if (!product_id || product_id === 'undefined') {
        showNotification('Product information not available.', 'error');
        return;
    }
    
    toggleLoadingState(true);
    const token = getCookie('csrftoken');
    if (!token) {
        showNotification('Authentication token not found. Please log in.', 'error');
        toggleLoadingState(false);
        setTimeout(() => window.location.href = '/login/', 2000);
        return;
    }
    
    try {
        const response = await fetch(`/orders/add-to-wishlist/${product_id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        if (buttonElement) {
            const wishlistItem = buttonElement.closest('.wishlist-item');
            if (wishlistItem) wishlistItem.remove();
        }
        
        showNotification('Product removed from wishlist.', 'success');
        
        const wishlistCountEl = document.getElementById('wishlist-items');
        if (wishlistCountEl) {
            const currentCount = parseInt(wishlistCountEl.textContent) || 0;
            wishlistCountEl.textContent = Math.max(0, currentCount - 1);
        }
    } catch (error) {
        showNotification(`Failed to remove from wishlist: ${error.message}`, 'error');
        console.error('Error removing from wishlist:', error);
    } finally {
        toggleLoadingState(false);
    }
}

function toggleOrderDetails(orderId) {
    if (!orderId || orderId === 'undefined') return;
    
    const detailsSection = document.getElementById(`order-details-${orderId}`);
    const button = event.target;
    
    if (detailsSection && button) {
        detailsSection.classList.toggle('active');
        button.textContent = detailsSection.classList.contains('active') ? 'Hide Details' : 'View Details';
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleLoadingState(isLoading) {
    const mainContent = document.querySelector('.main-content');
    const spinner = document.getElementById('loading-spinner');
    
    if (isLoading) {
        if (mainContent) {
            mainContent.style.opacity = '0.5';
            mainContent.style.pointerEvents = 'none';
        }
        if (spinner) spinner.style.display = 'block';
    } else {
        if (mainContent) {
            mainContent.style.opacity = '1';
            mainContent.style.pointerEvents = 'auto';
        }
        if (spinner) spinner.style.display = 'none';
    }
}
