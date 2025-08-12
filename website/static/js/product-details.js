const url = window.location.href;
const parts = url.split('/');
const productId = parts[parts.length - 1];

function showloader(){
    const loader = document.querySelector('.spinre');
    loader.style.display = 'flex';
}

function hideloader(){
    const loader = document.querySelector('.spinre');
    loader.style.display = 'none';
}

async function fetchProductDetails() {
    showloader()
    const response = await fetch(`${mainDomain}products/details/${productId}/`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    });
    const data = await response.json();
    console.log(data);
    renderProductDetails(data);
    renderproductimgae(data);
}

function renderproductimgae(data) {
    // تصفية الصور الموجودة
    const images = Object.keys(data)
        .filter(key => key.startsWith("image_") && data[key])
        .map(key => data[key]);

    // عناصر الـ DOM
    const mainWrapper = document.getElementById('main-image-wrapper');
    const thumbsWrapper = document.getElementById('thumbs-wrapper');
    mainWrapper.innerHTML = '';
    thumbsWrapper.innerHTML = '';

    // إضافة الصور للسلايد الرئيسي
    images.forEach(src => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<img src="${src}" alt="">`;
        mainWrapper.appendChild(slide);
    });

    // إضافة الصور لسلايد الثمبنيل
    images.forEach(src => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<img src="${src}" alt="">`;
        thumbsWrapper.appendChild(slide);
    });

    // تهيئة Swiper
    const thumbsSwiper = new Swiper('.thumbs-swiper', {
        spaceBetween: 10,
        slidesPerView: 5,
        freeMode: true,
        watchSlidesProgress: true,
    });

    const mainSwiper = new Swiper('.main-swiper', {
        spaceBetween: 10,
        thumbs: { swiper: thumbsSwiper }
    });

    hideloader();
}

// دالة لجلب بيانات المنتج
async function fetchProductDetails() {
    const response = await fetch(`${mainDomain}products/details/${productId}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    });
    const data = await response.json();
    console.log(data);
    renderProductDetails(data);
    renderproductimgae(data);
}


function renderProductDetails(data) {
    const productNameSection = document.getElementById('products-name-section');
    const products_old_price = document.getElementById('products-old-price');
    const products_main_price = document.getElementById('products-main-price');
    const products_descounte_count = document.getElementById('products-descounte-count');
    const product_description_main = document.getElementById('product-description-main');
    const desctiption_1 = document.getElementById('desctiption_1');
    const desctiption_2 = document.getElementById('desctiption_2');
    const desctiption_3 = document.getElementById('desctiption_3');

    // تعيين النصوص
    desctiption_1.textContent = data.description_1;
    desctiption_2.textContent = data.description_2;
    desctiption_3.textContent = data.description_3;
    productNameSection.textContent = data.name;
    products_old_price.textContent = data.old_price;
    products_main_price.textContent = data.price;
    products_descounte_count.textContent = data.discount;
    product_description_main.textContent = data.description_1;

    // الألوان
   // الألوان
if (!data.color || data.color.length === 0) {
    document.getElementById('product-color-section-sectopn').style.display = 'none';
} else {
    const colorOption = document.getElementById('main-color-section-box');
    colorOption.innerHTML = '';
    data.color.forEach((color, index) => {
        const inputId = `color-${index}`;
        colorOption.innerHTML += `
            <input type="radio" id="${inputId}" name="color" value="${color.name}">
            <label for="${inputId}" class="color-label" style="background-color: ${color.name};"></label>
        `;
    });
}

// الأحجام
if (!data.size || data.size.length === 0) {
    document.getElementById('product-size-section-sectopn').style.display = 'none';
} else {
    const sizeOption = document.getElementById('main-size-section-box');
    sizeOption.innerHTML = '';
    data.size.forEach((size, index) => {
        const inputId = `size-${index}`;
        sizeOption.innerHTML += `
            <input type="radio" id="${inputId}" name="size" value="${size.name}">
            <label for="${inputId}" class="size-label">${size.name}</label>
        `;
    });
}

// الخيارات
if (!data.options || data.options.length === 0) {
    document.getElementById('product-option-section-sectopn').style.display = 'none';
} else {
    const optionBox = document.getElementById('main-option-section-box');
    optionBox.innerHTML = '';
    data.options.forEach((opt, index) => {
        const inputId = `option-${index}`;
        optionBox.innerHTML += `
            <input type="radio" id="${inputId}" name="option" value="${opt.name}">
            <label for="${inputId}" class="option-label">${opt.name}</label>
        `;
    });
    }
}

document.querySelector('.add-to-cart-btn').addEventListener('click', () => {
    let hasError = false;
    let firstErrorElement = null;

    // أقسام الخيارات اللي نتحقق منها
    const optionSections = [
        { id: 'product-color-section-sectopn', name: 'color', errorId: 'error-color' },
        { id: 'product-size-section-sectopn', name: 'size', errorId: 'error-size' },
        { id: 'product-option-section-sectopn', name: 'option', errorId: 'error-option' }
    ];

    // مسح أي رسائل خطأ قديمة
    optionSections.forEach(section => {
        const oldError = document.getElementById(section.errorId);
        if (oldError) oldError.remove();
    });

    // التحقق من كل قسم إذا كان ظاهر ومطلوب
    optionSections.forEach(section => {
        const sectionEl = document.getElementById(section.id);
        if (sectionEl && sectionEl.style.display !== 'none') {
            const inputs = sectionEl.querySelectorAll(`input[name="${section.name}"]`);
            if (inputs.length > 0) {
                const checked = sectionEl.querySelector(`input[name="${section.name}"]:checked`);
                if (!checked) {
                    // إنشاء رسالة خطأ تحت القسم
                    let errorEl = document.getElementById(section.errorId);
                    if (!errorEl) {
                        errorEl = document.createElement('div');
                        errorEl.id = section.errorId;
                        errorEl.style.color = 'red';
                        errorEl.style.marginTop = '5px';
                        sectionEl.appendChild(errorEl);
                    }
                    errorEl.textContent = `Please select a ${section.name}`;
                    hasError = true;
                    if (!firstErrorElement) firstErrorElement = sectionEl;
                }
            }
        }
    });

    // إذا فيه خطأ، نسكرول لأول خطأ ونوقف
    if (hasError) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    // إذا مافيه خطأ، نضيف للعربة
    addToCart(productId);
});


document.querySelector('.add-Saved-btn').addEventListener('click', () => {
    addToWishlist(productId);
});

function viewProductdetailes(product_Id){
    window.location.href = `/product-details/${String(product_Id)}`;
}

function fetchConfirmOrder(data, productId) {
    showOrderloader();
    disableInputs();

    return fetch(`${mainDomain}orders/api/orders/create/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(result => {
        console.log('Order created successfully:', result);

        if (result.order_id) {
            // عرض رسالة نجاح سريعة
            showNotification('Order created successfully!', 'success');
            // إعادة التوجيه لصفحة التأكيد
            window.location.href = `/confirmation/${result.order_id}`;
        } else {
            throw new Error('Order ID not returned from server');
        }
    })
    .catch(error => {
        console.error('Error creating order:', error);
        showNotification('Failed to create order', 'error');
    })
    .finally(() => {
        hideOrderloader();
        enableInputs();
    });
}



function showOrderloader() {
    const Orderloader = document.getElementById('Orderloader');
    const submit_button = document.querySelector('.submit-button');
    Orderloader.style.display = 'inline-block';
    submit_button.style.backgroundColor = 'var(--main-color2)';
}

function hideOrderloader() {
    document.getElementById('Orderloader').style.display = 'none';
    const submit_button = document.querySelector('.submit-button');
    submit_button.style.backgroundColor = 'var(--main-color)';
}

function clearErrors() {
    const errorFields = ['firstName', 'lastName', 'address', 'phone', 'color', 'size', 'option'];
    errorFields.forEach(field => {
        const el = document.getElementById('error-' + field);
        if (el) el.textContent = '';
    });
}


function disableInputs() {
  const inputs = document.querySelectorAll('.form-group input');
  inputs.forEach(input => {
    input.disabled = true;
  });
}

function enableInputs() {
  const inputs = document.querySelectorAll('.form-group input');
  inputs.forEach(input => {
    input.disabled = false;
  });
}

function ConfirmOrder() {
    clearErrors();

    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const address = document.getElementById('address');
    const phone = document.getElementById('phone');
    const quantity = document.getElementById('quantity'); // لو عندك

    let hasError = false;
    let firstErrorElement = null;

    // ===== تحقق من الحقول الأساسية =====
    if (!firstName.value.trim()) {
        document.getElementById('error-firstName').textContent = 'First name is required';
        hasError = true;
        if (!firstErrorElement) firstErrorElement = firstName;
    }
    if (!lastName.value.trim()) {
        document.getElementById('error-lastName').textContent = 'Last name is required';
        hasError = true;
        if (!firstErrorElement) firstErrorElement = lastName;
    }
    if (!address.value.trim()) {
        document.getElementById('error-address').textContent = 'Address is required';
        hasError = true;
        if (!firstErrorElement) firstErrorElement = address;
    }
    if (!phone.value.trim()) {
        document.getElementById('error-phone').textContent = 'Phone number is required';
        hasError = true;
        if (!firstErrorElement) firstErrorElement = phone;
    }

    // ===== تحقق من الخيارات =====
    const optionSections = [
        { id: 'product-color-section-sectopn', name: 'color', errorId: 'error-color' },
        { id: 'product-size-section-sectopn', name: 'size', errorId: 'error-size' },
        { id: 'product-option-section-sectopn', name: 'option', errorId: 'error-option' }
    ];

    optionSections.forEach(section => {
        const sectionEl = document.getElementById(section.id);
        if (sectionEl && sectionEl.style.display !== 'none') {
            const inputs = sectionEl.querySelectorAll(`input[name="${section.name}"]`);
            if (inputs.length > 0) {
                const checked = sectionEl.querySelector(`input[name="${section.name}"]:checked`);
                if (!checked) {
                    // إضافة رسالة الخطأ (لو ما عندك عنصر خطأ جاهز ممكن تضيفه ديناميكي)
                    let errorEl = document.getElementById(section.errorId);
                    if (!errorEl) {
                        errorEl = document.createElement('div');
                        errorEl.id = section.errorId;
                        errorEl.style.color = 'red';
                        errorEl.style.marginTop = '5px';
                        sectionEl.appendChild(errorEl);
                    }
                    errorEl.textContent = `Please select a ${section.name}`;
                    hasError = true;
                    if (!firstErrorElement) firstErrorElement = sectionEl;
                }
            }
        }
    });

    // ===== إذا فيه خطأ، رفع السكرول لأول خطأ =====
    if (hasError) {
        if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    // ===== لو ما فيه أخطاء =====
    const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`;
    const data = {
        customer_name: fullName,
        customer_email: "",  // عيّنها لو متوفرة
        customer_phone: phone.value.trim(),
        customer_address: address.value.trim(),
        city: "",            // عيّنها لو متوفرة
        quantity: quantity ? quantity.value.trim() : 1
    };

    // loader كما في السابق
    const btn = document.querySelector('.submit-button');
    const loader = document.getElementById('Orderloader');
    btn.disabled = true;
    loader.innerHTML = `<span class="loader"></span>`;

    fetchConfirmOrder(data, productId)
    .finally(() => {
        btn.disabled = false;
        loader.innerHTML = '';
    });
}

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

async function addToCart(product_Id) {
    try {
        // قراءة الكمية
        const quantityEl = document.getElementById('quantity');
        const quantity = quantityEl ? parseInt(quantityEl.value.trim()) || 1 : 1;

        // قراءة اللون إذا متوفر
        const selectedColor = document.querySelector('input[name="color"]:checked');
        const colorValue = selectedColor ? selectedColor.value : null;

        // قراءة الحجم إذا متوفر
        const selectedSize = document.querySelector('input[name="size"]:checked');
        const sizeValue = selectedSize ? selectedSize.value : null;

        // قراءة الخيار إذا متوفر
        const selectedOption = document.querySelector('input[name="option"]:checked');
        const optionValue = selectedOption ? selectedOption.value : null;

        const payload = {
            product_id: product_Id,
            quantity: quantity,
            color: colorValue,
            size: sizeValue,
            options: optionValue
        };

        const response = await fetch('/orders/add-to-cart/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            showNotification(data.message || 'Error adding to cart', 'error');
        } else {
            showNotification(data.message || 'Added to cart successfully', 'success');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add product to cart', 'error');
    }
}


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
            showNotification(data.message, 'success');
        } 
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('Failed to add product to wishlist', 'error');
    }
}

function incrementQuantity() {
  const qtyInput = document.getElementById('quantity');
  let currentValue = parseInt(qtyInput.value) || 1;
  qtyInput.value = currentValue + 1;
}

function decrementQuantity() {
  const qtyInput = document.getElementById('quantity');
  let currentValue = parseInt(qtyInput.value) || 1;
  if (currentValue > 1) {
    qtyInput.value = currentValue - 1;
  }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchProductDetails();
});
