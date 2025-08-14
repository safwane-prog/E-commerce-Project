    const API_ORDER_URL = mainDomain + "/orders/user/orders/create/";

    // عند تحميل الصفحة
    document.addEventListener("DOMContentLoaded", async () => {
        await loadOrderSummary();

        const form = document.getElementById("checkout-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();  // منع إعادة تحميل الصفحة

            // جمع بيانات النموذج
            const data = {
                customer_name: `${form.firstName.value} ${form.lastName.value}`,
                customer_email: form.email.value,
                customer_phone: form.phone.value,
                customer_address: form.address.value,
                city: form.city.value,
            };

            // تحقق بسيط من البيانات (يمكنك تحسينه)
            if (!data.customer_name || !data.customer_phone || !data.customer_address || !data.city) {
                alert("Please fill in all required fields.");
                return;
            }

            try {
                const response = await fetch(API_ORDER_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie('csrftoken')  // تابع أدناه
                    },
                    credentials: "include",
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    window.location.href = "/confirmation/"+ result.order.id; // مثال
                    console.log(result);
                    
                } else {
                    alert("Error: " + (result.error || "Failed to create order"));
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Network error while creating order.");
            }
        });
    });

    // تحميل ملخص الطلب وعرضه في الصفحة
    async function loadOrderSummary() {
        try {
            const response = await fetch(API_ORDER_URL, {
                method: "GET",
                credentials: "include"
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load order summary");
            }

            renderOrderSummary(data);

        } catch (error) {
            console.error("Error loading order summary:", error);
            // يمكنك إظهار رسالة خطأ في الصفحة هنا
        }
    }

    // عرض ملخص الطلب في القسم المخصص (Order Summary)
    function renderOrderSummary(data) {
        const container = document.querySelector(".order-summary");
        if (!container) return;

        // بناء HTML للعناصر داخل ملخص الطلب (بدل المحتوى الثابت)
        let itemsHTML = "";
        data.items.forEach(item => {
            const product = item.product;
            itemsHTML += `
                <div class="order-item">
                    <div class="item-image"><img src="${product.image_1 || '/static/images/placeholder.jpg'}" alt="${product.name}" style="max-width:50px;"></div>
                    <div class="item-details">
                        <div class="item-name">${product.name}</div>
                        <div class="item-quantity">Qty: ${item.quantity}</div>
                    </div>
                    <div class="item-price">${formatPrice(product.price * item.quantity)}</div>
                </div>
            `;
        });

        // أضف العناصر وملخص المبالغ
        container.innerHTML = `
            <h2>Order Summary</h2>
            ${itemsHTML}
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatPrice(data.subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>${formatPrice(data.shipping)}</span>
            </div>
            <div class="summary-row">
                <span>Discount:</span>
                <span style="color: #48bb78;">-${formatPrice(data.discount)}</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>${formatPrice(data.total)}</span>
            </div>
        `;
    }

    // تنسيق السعر مع رمز العملة
    function formatPrice(amount) {
        const currencySymbol = "{{ currency|escapejs }}" || "$";  // عدل حسب العملة الخاصة بك
        return currencySymbol + parseFloat(amount).toFixed(2);
    }

    // دالة جلب csrf token من الكوكيز
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // تحقق إذا كان اسم الكوكيز يطابق المطلوب
                if (cookie.substring(0, name.length + 1) === (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }