document.addEventListener('DOMContentLoaded', function() {
    // العناصر الأساسية
    const profileImg = document.getElementById('profile-img');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const ordersCount = document.getElementById('orders-count');
    const wishlistCount = document.getElementById('wishlist-count');
    const reviewsCount = document.getElementById('reviews-count');
    const ordersList = document.getElementById('orders-list');
    const wishlistItems = document.getElementById('wishlist-items');
    const profileForm = document.getElementById('profile-form');
    
    // بيانات المستخدم
    let userData = null;
    let userOrders = [];
    let userWishlist = [];
    
    // التوكن الخاص بالمستخدم
    const token = localStorage.getItem('token');
    
    // تحقق من وجود توكن
    // if (!token) {
    //     window.location.href = '/profile';
    //     return;
    // }
    
    // تهيئة الصفحة
    initPage();
    
    // وظائف التبويب
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // إزالة الفعالية من جميع الألسنة والمحتويات
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // إضافة الفعالية للسان المختار
            tab.classList.add('active');
            
            // عرض المحتوى المناسب
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // إذا كان التبويب هو الطلبات ولم يتم تحميلها بعد
            if (tabId === 'orders' && userOrders.length === 0) {
                loadOrders();
            }
            
            // إذا كان التبويب هو المفضلة ولم يتم تحميلها بعد
            if (tabId === 'wishlist' && userWishlist.length === 0) {
                loadWishlist();
            }
        });
    });
    
    // تغيير صورة البروفايل
    document.querySelector('.change-image-btn').addEventListener('click', function() {
        document.getElementById('profile_image').click();
    });
    
    document.getElementById('profile_image').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            uploadProfileImage(e.target.files[0]);
        }
    });
    
    // تسجيل الخروج
    document.querySelector('.logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    });
    
    // تحديث بيانات البروفايل
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
    
    // تهيئة الصفحة
    async function initPage() {
        try {
            // جلب بيانات المستخدم
            const userResponse = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            userData = await userResponse.json();
            displayUserData(userData);
            
            // جلب عدد الطلبات والمفضلة
            const statsResponse = await fetch('/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                ordersCount.textContent = stats.orders;
                wishlistCount.textContent = stats.wishlist;
                reviewsCount.textContent = stats.reviews;
            }
            
            // تحميل الطلبات إذا كان التبويب نشط
            if (document.querySelector('.tab.active').getAttribute('data-tab') === 'orders') {
                loadOrders();
            }
            
        } catch (error) {
            console.error('Error initializing page:', error);
            showError('Failed to load profile data');
        }
    }
    
    // عرض بيانات المستخدم
    function displayUserData(data) {
        profileUsername.textContent = data.username;
        profileEmail.textContent = data.email;
        
        if (data.phone) {
            document.getElementById('phone').value = data.phone;
        }
        
        if (data.address) {
            document.getElementById('address').value = data.address;
        }
        
        if (data.profile_image) {
            profileImg.src = data.profile_image;
        }
        
        document.getElementById('username').value = data.username;
        document.getElementById('email').value = data.email;
    }
    
    // تحميل الطلبات
    async function loadOrders() {
        ordersList.innerHTML = '<div class="loading-spinner"></div>';
        
        try {
            const response = await fetch('/api/user/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            
            userOrders = await response.json();
            displayOrders(userOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="error-message">Failed to load orders</div>';
        }
    }
    
    // عرض الطلبات
    function displayOrders(orders) {
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <img src="/static/imges/icon/no-orders.svg" alt="No Orders">
                    <p>You haven't placed any orders yet</p>
                    <a href="/shop" class="shop-now-btn">Shop Now</a>
                </div>
            `;
            return;
        }
        
        let ordersHTML = '';
        
        orders.forEach(order => {
            let productsHTML = '';
            
            order.items.forEach(item => {
                productsHTML += `
                    <div class="order-product">
                        <img src="${item.product.image}" alt="${item.product.name}">
                        <div class="product-info">
                            <h4>${item.product.name}</h4>
                            <p>Qty: ${item.quantity}</p>
                            <p>Price: ${currencySymbol}${item.price}</p>
                        </div>
                    </div>
                `;
            });
            
            ordersHTML += `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">Order #${order.id}</span>
                        <span class="order-date">${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="order-products">
                        ${productsHTML}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            Total: ${currencySymbol}${order.total_price}
                        </div>
                        <button class="track-order" data-order-id="${order.id}">Track Order</button>
                        <button class="reorder" data-order-id="${order.id}">Reorder</button>
                    </div>
                </div>
            `;
        });
        
        ordersList.innerHTML = ordersHTML;
        
        // إضافة معالجات الأحداث للأزرار الجديدة
        document.querySelectorAll('.track-order').forEach(btn => {
            btn.addEventListener('click', function() {
                trackOrder(this.getAttribute('data-order-id'));
            });
        });
        
        document.querySelectorAll('.reorder').forEach(btn => {
            btn.addEventListener('click', function() {
                reorder(this.getAttribute('data-order-id'));
            });
        });
    }
    
    // تحميل المفضلة
    async function loadWishlist() {
        wishlistItems.innerHTML = '<div class="loading-spinner"></div>';
        
        try {
            const response = await fetch('/api/user/wishlist', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch wishlist');
            }
            
            userWishlist = await response.json();
            displayWishlist(userWishlist);
        } catch (error) {
            console.error('Error loading wishlist:', error);
            wishlistItems.innerHTML = '<div class="error-message">Failed to load wishlist</div>';
        }
    }
    
    // عرض المفضلة
    function displayWishlist(wishlist) {
        if (wishlist.length === 0) {
            wishlistItems.innerHTML = `
                <div class="no-wishlist">
                    <img src="/static/imges/icon/no-wishlist.svg" alt="No Wishlist Items">
                    <p>Your wishlist is empty</p>
                    <a href="/shop" class="shop-now-btn">Browse Products</a>
                </div>
            `;
            return;
        }
        
        let wishlistHTML = '';
        
        wishlist.forEach(item => {
            const oldPriceHTML = item.old_price ? `<span class="old-price">${currencySymbol}${item.old_price}</span>` : '';
            
            wishlistHTML += `
                <div class="wishlist-item" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <div class="item-price">
                            <span class="current-price">${currencySymbol}${item.price}</span>
                            ${oldPriceHTML}
                        </div>
                        <div class="item-actions">
                            <button class="add-to-cart">Add to Cart</button>
                            <button class="remove-wishlist">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        wishlistItems.innerHTML = wishlistHTML;
        
        // إضافة معالجات الأحداث للأزرار الجديدة
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.closest('.wishlist-item').getAttribute('data-product-id');
                addToCart(productId);
            });
        });
        
        document.querySelectorAll('.remove-wishlist').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.closest('.wishlist-item').getAttribute('data-product-id');
                removeFromWishlist(productId, this.closest('.wishlist-item'));
            });
        });
    }
    
    // رفع صورة البروفايل
    async function uploadProfileImage(file) {
        const formData = new FormData();
        formData.append('profile_image', file);
        
        try {
            const response = await fetch('/api/user/profile/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload image');
            }
            
            const result = await response.json();
            profileImg.src = result.image_url;
            showSuccess('Profile image updated successfully');
        } catch (error) {
            console.error('Error uploading profile image:', error);
            showError('Failed to upload profile image');
        }
    }
    
    // تحديث بيانات البروفايل
    async function updateProfile() {
        const formData = {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            current_password: document.getElementById('current_password').value,
            new_password: document.getElementById('new_password').value,
            confirm_password: document.getElementById('confirm_password').value
        };
        
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }
            
            const result = await response.json();
            showSuccess('Profile updated successfully');
            
            // تحديث البيانات المعروضة
            if (result.email) {
                profileEmail.textContent = result.email;
            }
            
            // مسح حقول كلمة المرور
            document.getElementById('current_password').value = '';
            document.getElementById('new_password').value = '';
            document.getElementById('confirm_password').value = '';
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showError(error.message || 'Failed to update profile');
        }
    }
    
    // تتبع الطلب
    function trackOrder(orderId) {
        window.location.href = `/orders/${orderId}`;
    }
    
    // إعادة الطلب
    async function reorder(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/reorder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to reorder');
            }
            
            showSuccess('Items added to cart for reorder');
            window.location.href = '/cart';
        } catch (error) {
            console.error('Error reordering:', error);
            showError('Failed to reorder');
        }
    }
    
    // إضافة إلى السلة
    async function addToCart(productId) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add to cart');
            }
            
            showSuccess('Product added to cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showError('Failed to add to cart');
        }
    }
    
    // إزالة من المفضلة
    async function removeFromWishlist(productId, itemElement) {
        try {
            const response = await fetch(`/api/wishlist/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to remove from wishlist');
            }
            
            // إزالة العنصر من الواجهة
            itemElement.style.opacity = '0';
            setTimeout(() => {
                itemElement.remove();
                
                // تحديث العداد
                const newCount = parseInt(wishlistCount.textContent) - 1;
                wishlistCount.textContent = newCount;
                
                // إذا كانت المفضلة فارغة الآن، عرض رسالة
                if (newCount === 0) {
                    wishlistItems.innerHTML = `
                        <div class="no-wishlist">
                            <img src="/static/imges/icon/no-wishlist.svg" alt="No Wishlist Items">
                            <p>Your wishlist is empty</p>
                            <a href="/shop" class="shop-now-btn">Browse Products</a>
                        </div>
                    `;
                }
            }, 300);
            
            showSuccess('Product removed from wishlist');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showError('Failed to remove from wishlist');
        }
    }
    
    // عرض رسالة نجاح
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // عرض رسالة خطأ
    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});