// استخراج معرف المنتج من رابط الصفحة
const url = window.location.href;
const parts = url.split('/');
const productId = parts[parts.length - 1];

// عرض وإخفاء اللودر
function showLoader() {
    const loader = document.querySelector('.spinre');
    if (loader) loader.style.display = 'flex';
}
function hideLoader() {
    const loader = document.querySelector('.spinre');
    if (loader) loader.style.display = 'none';
}

// متغيرات للاحتفاظ بكائنات Swiper لتفادي إعادة التهيئة
let mainSwiper = null;
let thumbsSwiper = null;

// جلب بيانات المنتج والتهيئة
async function fetchProductDetails() {
    try {
        showLoader();
        const response = await fetch(`${mainDomain}products/details/${productId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        renderProductDetails(data);
        renderProductImages(data);
    } catch (error) {
        console.error('Error fetching product details:', error);
        showNotification('Failed to load product details', 'error');
    } finally {
        hideLoader();
    }
}

// عرض تفاصيل المنتج (الأسعار، الوصف، الألوان، المقاسات، الخيارات)
function renderProductDetails(data) {
    // عناصر DOM
    const productNameSection = document.getElementById('products-name-section');
    const productsOldPrice = document.getElementById('products-old-price');
    const productsMainPrice = document.getElementById('products-main-price');
    const productsDiscountCount = document.getElementById('products-descounte-count');
    const productDescriptionMain = document.getElementById('product-description-main');
    const description1 = document.getElementById('desctiption_1');
    const description2 = document.getElementById('desctiption_2');
    const description3 = document.getElementById('desctiption_3');

    // تعيين القيم مع تحقق من وجودها
    productNameSection.textContent = data.name || '';
    productsOldPrice.textContent = data.old_price || '';
    productsMainPrice.textContent = data.price || '';
    productsDiscountCount.textContent = data.discount || '';
    productDescriptionMain.textContent = data.description_1 || '';
    description1.textContent = data.description_1 || '';
    description2.textContent = data.description_2 || '';
    description3.textContent = data.description_3 || '';

    // الألوان
    const colorSection = document.getElementById('product-color-section-sectopn');
    const colorOption = document.getElementById('main-color-section-box');
    if (!data.color || data.color.length === 0) {
        colorSection.style.display = 'none';
    } else {
        colorSection.style.display = 'block';
        colorOption.innerHTML = '';
        data.color.forEach(color => {
            colorOption.innerHTML += `
                <label>
                    <input data-name="${color.name}" type="radio" name="color" value="${color.name}">
                    <span class="colorName" style="background-color: ${color.name};"></span>
                </label>
            `;
        });
    }

    // المقاسات
    const sizeSection = document.getElementById('product-size-section-sectopn');
    const sizeOption = document.getElementById('main-size-section-box');
    if (!data.size || data.size.length === 0) {
        sizeSection.style.display = 'none';
    } else {
        sizeSection.style.display = 'block';
        sizeOption.innerHTML = '';
        data.size.forEach(size => {
            sizeOption.innerHTML += `
                <label>
                    <input data-name="${size.name}" type="radio" name="size" value="${size.name}">
                    <span>${size.name}</span>
                </label>
            `;
        });
    }

    // الخيارات
    const optionSection = document.getElementById('product-option-section-sectopn');
    const optionBox = document.getElementById('main-option-section-box');
    if (!data.options || data.options.length === 0) {
        optionSection.style.display = 'none';
    } else {
        optionSection.style.display = 'block';
        optionBox.innerHTML = '';
        data.options.forEach(opt => {
            optionBox.innerHTML += `
                <label>
                    <input data-name="${opt.name}" type="radio" name="option" value="${opt.name}">
                    <span>${opt.name}</span>
                </label>
            `;
        });
    }
}

// عرض الصور في السلايدر
function renderProductImages(data) {
    const images = Object.keys(data)
        .filter(key => key.startsWith("image_") && data[key])
        .map(key => data[key]);

    const mainWrapper = document.getElementById('main-image-wrapper');
    const thumbsWrapper = document.getElementById('thumbs-wrapper');

    mainWrapper.innerHTML = '';
    thumbsWrapper.innerHTML = '';

    images.forEach(src => {
        const mainSlide = document.createElement('div');
        mainSlide.className = 'swiper-slide';
        mainSlide.innerHTML = `<img src="${src}" alt="Product Image">`;
        mainWrapper.appendChild(mainSlide);

        const thumbSlide = document.createElement('div');
        thumbSlide.className = 'swiper-slide';
        thumbSlide.innerHTML = `<img src="${src}" alt="Thumbnail Image">`;
        thumbsWrapper.appendChild(thumbSlide);
    });

    // تهيئة Swiper فقط مرة واحدة
    if (thumbsSwiper) thumbsSwiper.destroy(true, true);
    if (mainSwiper) mainSwiper.destroy(true, true);

    thumbsSwiper = new Swiper('.thumbs-swiper', {
        spaceBetween: 10,
        slidesPerView: 5,
        freeMode: true,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
    });

    mainSwiper = new Swiper('.main-swiper', {
        spaceBetween: 10,
        thumbs: {
            swiper: thumbsSwiper,
        },
    });
}

// إضافة المنتج إلى السلة
async function addToCart(product_Id) {
    try {
        const response = await fetch('/orders/add-to-cart/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ product_id: product_Id })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || 'Failed to add product to cart', 'error');
        } else {
            showNotification(data.message || 'Product added to cart', 'success');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add product to cart', 'error');
    }
}

// إضافة المنتج إلى قائمة المفضلات
async function addToWishlist(product_Id) {
    try {
        const response = await fetch('/orders/add-to-wishlist/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ product_id: product_Id })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message || 'Product added to wishlist', 'success');
        } else {
            showNotification(data.message || 'Failed to add product to wishlist', 'error');
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('Failed to add product to wishlist', 'error');
    }
}

// التأكد من وجود الكوكيز
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

// إظهار الإشعارات (رسائل صغيرة بالصفحة)
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }

    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// تأكيد الطلب
function clearErrors() {
    ['firstName', 'lastName', 'address', 'phone'].forEach(field => {
        const errElem = document.getElementById('error-' + field);
        if (errElem) errElem.textContent = '';
    });
}

function disableInputs() {
    document.querySelectorAll('.form-group input').forEach(input => input.disabled = true);
}
function enableInputs() {
    document.querySelectorAll('.form-group input').forEach(input => input.disabled = false);
}

async function fetchConfirmOrder(data, productId) {
    showOrderLoader();
    disableInputs();

    try {
        const response = await fetch(`${mainDomain}orders/api/orders/create/${productId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log('Order created successfully:', result);
        showNotification('Order created successfully!', 'success');
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('Failed to create order', 'error');
    } finally {
        hideOrderLoader();
        enableInputs();
    }
}

function showOrderLoader() {
    const orderLoader = document.getElementById('Orderloader');
    const submitButton = document.querySelector('.submit-button');
    if (orderLoader) orderLoader.style.display = 'inline-block';
    if (submitButton) submitButton.style.backgroundColor = 'var(--main-color2)';
}

function hideOrderLoader() {
    const orderLoader = document.getElementById('Orderloader');
    const submitButton = document.querySelector('.submit-button');
    if (orderLoader) orderLoader.style.display = 'none';
    if (submitButton) submitButton.style.backgroundColor = 'var(--main-color)';
}

// التعامل مع نموذج تأكيد الطلب
function ConfirmOrder() {
    clearErrors();

    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const address = document.getElementById('address');
    const phone = document.getElementById('phone');
    const quantity = document.getElementById('quantity'); // اختياري

    let hasError = false;

    if (!firstName || !firstName.value.trim()) {
        document.getElementById('error-firstName').textContent = 'First name is required';
        hasError = true;
    }
    if (!lastName || !lastName.value.trim()) {
        document.getElementById('error-lastName').textContent = 'Last name is required';
        hasError = true;
    }
    if (!address || !address.value.trim()) {
        document.getElementById('error-address').textContent = 'Address is required';
        hasError = true;
    }
    if (!phone || !phone.value.trim()) {
        document.getElementById('error-phone').textContent = 'Phone number is required';
        hasError = true;
    }

    if (hasError) return;

    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`;

    const data = {
        customer_name: fullName,
        customer_email: "",  // إذا متوفر
        customer_phone: phone.value.trim(),
        customer_address: address.value.trim(),
        city: "",            // إذا متوفر
        quantity: quantity ? quantity.value.trim() : 1
    };

    const btn = document.querySelector('.submit-button');
    const loader = document.getElementById('Orderloader');
    if (btn) btn.disabled = true;
    if (loader) loader.innerHTML = `<span class="loader"></span>`;

    fetchConfirmOrder(data, productId)
        .finally(() => {
            if (btn) btn.disabled = false;
            if (loader) loader.innerHTML = '';
        });
}

// زيادة أو تقليل الكمية
function incrementQuantity() {
    const qtyInput = document.getElementById('quantity');
    if (!qtyInput) return;
    let currentValue = parseInt(qtyInput.value) || 1;
    qtyInput.value = currentValue + 1;
}

function decrementQuantity() {
    const qtyInput = document.getElementById('quantity');
    if (!qtyInput) return;
    let currentValue = parseInt(qtyInput.value) || 1;
    if (currentValue > 1) qtyInput.value = currentValue - 1;
}

// روابط أزرار الإضافة للسلة والمفضلة
document.addEventListener('DOMContentLoaded', () => {
    fetchProductDetails();

    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) addToCartBtn.addEventListener('click', () => addToCart(productId));

    const addToSavedBtn = document.querySelector('.add-Saved-btn');
    if (addToSavedBtn) addToSavedBtn.addEventListener('click', () => addToWishlist(productId));
});
