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
    if (!data.color || data.color.length === 0) {
        document.getElementById('product-color-section-sectopn').style.display = 'none';
    } else {
        const colorOption = document.getElementById('main-color-section-box');
        colorOption.innerHTML = '';
        data.color.forEach(color => {
            colorOption.innerHTML += `
                <input data-name="${color.name}" type="radio" name="color" value="${color.name}">
                <span class="colorName" style="background-color: ${color.name};"></span>
            `;
        });
    }

    // المقاسات
    if (!data.size || data.size.length === 0) {
        document.getElementById('product-size-section-sectopn').style.display = 'none';
    } else {
        const sizeOption = document.getElementById('main-size-section-box');
        sizeOption.innerHTML = '';
        data.size.forEach(size => {
            sizeOption.innerHTML += `
                <input data-name="${size.name}" type="radio" name="size" value="${size.name}">
                <span>${size.name}</span>
            `;
        });
    }

    // الخيارات
    if (!data.options || data.options.length === 0) {
        document.getElementById('product-option-section-sectopn').style.display = 'none';
    } else {
        const optionBox = document.getElementById('main-option-section-box');
        optionBox.innerHTML = '';
        data.options.forEach(opt => {
            optionBox.innerHTML += `
                <input data-name="${opt.name}" type="radio" name="option" value="${opt.name}">
                <span>${opt.name}</span>
            `;
        });
    }
}

document.querySelector('.add-to-cart-btn').addEventListener('click', () => {
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
    })
    .finally(() => {
        hideOrderloader();
        enableInputs();
        showNotification('Order created successfully!', 'success');
    })
    .catch(error => {
        console.error('Error creating order:', error);
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
    const errorFields = ['firstName', 'lastName', 'address', 'phone'];
    errorFields.forEach(field => {
        document.getElementById('error-' + field).textContent = '';
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

    if (!firstName.value.trim()) {
        document.getElementById('error-firstName').textContent = 'First name is required';
        hasError = true;
    }
    if (!lastName.value.trim()) {
        document.getElementById('error-lastName').textContent = 'Last name is required';
        hasError = true;
    }
    if (!address.value.trim()) {
        document.getElementById('error-address').textContent = 'Address is required';
        hasError = true;
    }
    if (!phone.value.trim()) {
        document.getElementById('error-phone').textContent = 'Phone number is required';
        hasError = true;
    }

    if (hasError) return;

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
            showNotification(data.message, 'error');
        } 
        if (response.ok) {
            showNotification(data.message, 'success');
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
