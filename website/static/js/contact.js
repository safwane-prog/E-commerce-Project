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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // إظهار تحميل
        const submitBtn = form.querySelector(".submit-btn");
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        // اجلب القيم من الفورم
        const data = {
            foll_name: form.first_name.value.trim(),
            email: form.email.value.trim(),  
            subject: form.subject.value.trim(),
            message: form.message.value.trim(),
        };

        try {
            const response = await fetchWithAuth("/contact/create/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                // رسالة النجاح باللون الأخضر
                Swal.fire({
                    title: 'Submitted successfully!',
                    text: 'Thank you for contacting us, we will respond to you as soon as possible.',
                    icon: 'success',
                    confirmButtonColor: 'var(--main-color)',
                    timer: 5000
                });
                form.reset();
            } else {
                const errorData = await response.json();
                // رسالة الخطأ باللون الأحمر
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to send message: ' + (errorData.detail || JSON.stringify(errorData)),
                    icon: 'error',
                    confirmButtonColor: 'var(--main-color)'
                });
            }
        } catch (error) {
            if (error.message === "Session expired, please log in again.") {
                Swal.fire({
                    title: 'Session Expired!',
                    text: 'Your session has expired. Please log in again to continue.',
                    icon: 'warning',
                    confirmButtonColor: 'var(--main-color)',
                    showCancelButton: true,
                    confirmButtonText: 'Log In',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/login/';
                    }
                });
            } else {
                Swal.fire({
                    title: 'Network Error!',
                    text: 'Failed to send message: ' + error.message,
                    icon: 'error',
                    confirmButtonColor: 'var(--main-color)'
                });
            }
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});

// دالة لاستخراج CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}