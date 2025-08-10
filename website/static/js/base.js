
const apiUrls = '/orders/supplier-inquiry/'

function saarchfunstion(value,categorie){
    window.location.href = `/shop/?${value}&${categorie}`
}


function handlphonetap(){
    const phone_grye=  document.getElementById('phone-modal-grye')
    const phonemodal=  document.getElementById('phone-modal')
    phonemodal.style.left = '100%'
    phonemodal.style.animation = 'showphoneanimtion 0.5s linear'
    phone_grye.style.display = 'none'
}

function showphoneModat(){
    const phone_grye=  document.getElementById('phone-modal-grye')
    const phonemodal=  document.getElementById('phone-modal')
    phonemodal.style.left = '0px'
    phonemodal.style.animation = 'showphoneanimtion2 0.5s'
    phone_grye.style.display = 'block'
    phone_grye.style.animation = 'showphoneanimtion3 0.3s'
}


function showSection(type) {
    const pagesTab = document.querySelectorAll('.phone-tap-pages');
    const sections = document.querySelectorAll('.phone-tap-section');

    // إزالة active من جميع التابس
    pagesTab.forEach(tab => tab.classList.remove('phone-tap-active'));

    // إخفاء جميع الأقسام
    sections.forEach(section => section.classList.remove('active'));

    if (type === 'pages') {
        document.querySelector('.phone-tap-pages').classList.add('phone-tap-active');
        document.querySelector('.phone-tap-pages-section').classList.add('active');
    } else if (type === 'categories') {
        document.querySelectorAll('.phone-tap-pages')[1].classList.add('phone-tap-active');
        document.querySelector('.phone-tap-all-category-section').classList.add('active');
    }
}

