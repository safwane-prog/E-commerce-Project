async function Sendinquiry() {
    const suppliersInput = document.getElementById('suppliers-input');
    const detailsInput = document.getElementById('Sendinquiry_details');
    const phoneInput = document.getElementById('Sendinquiry_phone');
    const qtyInput = document.getElementById('Sendinquiry_Qty');
    const loader = document.getElementById('sendinquiry_loudre');
    const messageElement = document.getElementById('Sendinquiry_message');

    clearMessage();

    // تجميع الأخطاء
    let errors = [];

    if (!suppliersInput.value.trim()) {
        errors.push(suppliersInput);
    }
    if (!qtyInput.value.trim() || isNaN(qtyInput.value)) {
        errors.push(qtyInput);
    }
    if (!phoneInput.value.trim()|| isNaN(phoneInput.value)) {
        errors.push(phoneInput);
    }
    if (!detailsInput.value.trim()) {
        errors.push(detailsInput);
    }
    // إذا فيه أخطاء
    if (errors.length > 0) {
        errors.forEach(input => {
            input.classList.add('input-error', 'shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        });
        showErrorMessage('Please fill in all required fields correctly');
        return;
    }

    const data = {
        item: suppliersInput.value.trim(),
        details: detailsInput.value.trim(),
        quantity: parseInt(qtyInput.value.trim()),
        phone: phoneInput.value.trim()
    };
    
    loader.innerHTML = '<div class="spinner"></div>';
    const button = document.querySelector('#Sendinquiry-form button');
    button.disabled = true;

    try {
        const response = await fetch(`${mainDomain}/orders/supplier-inquiry/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to send inquiry');
        }

        showSuccessMessage('Your inquiry has been sent successfully!');
        suppliersInput.value = '';
        detailsInput.value = '';
        qtyInput.value = '';
        phoneInput.value = '';
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(error.message || 'An error occurred while sending your inquiry');
    } finally {
        loader.innerHTML = '';
        button.disabled = false;
    }
}

function showSuccessMessage(message) {
    const messageElement = document.getElementById('Sendinquiry_message');
    messageElement.textContent = message;
    messageElement.className = 'success-message animate-message';
}

function showErrorMessage(message) {
    const messageElement = document.getElementById('Sendinquiry_message');
    messageElement.textContent = message;
    messageElement.className = 'error-message animate-message';
}

function clearMessage() {
    const messageElement = document.getElementById('Sendinquiry_message');
    messageElement.textContent = '';
    messageElement.className = '';
    document.querySelectorAll('.input-error').forEach(el => {
        el.classList.remove('input-error');
    });
}

function getCSRFToken() {
    const cookieValue = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
    return cookieValue ? cookieValue.pop() : '';
}
