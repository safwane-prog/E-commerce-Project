



function viewProductdetailes(productId){
    window.location.href = `/product-details/${String(productId)}`;
}

const apiUrls = '/orders/supplier-inquiry/'

function saarchfunstion(value,categorie){
    window.location.href = `/shop/?search=${value}&category=${categorie}`
}
function saarchfunstionforphon(){
    const inputValue = document.getElementById('searsh-head-inpurfor-pahon').value;
    const encodedValue = encodeURIComponent(inputValue); // تشفير النص
    window.location.href = `/shop/?search=${encodedValue}`;
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

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('show-5-category-name');
  const popup = document.querySelector('.show_category_name');

  const showMoreBtn = document.getElementById('Shwocategories_itms_smolemore');
  const showMorePopup = document.querySelector('.shop-more-all-categories');

  let isOverTrigger = false;
  let isOverPopup = false;

  let isOverShowMoreBtn = false;
  let isOverShowMorePopup = false;

  function showPopupFunc() {
    popup.style.display = 'flex';
  }
  function hidePopupFunc() {
    popup.style.display = 'none';
  }

  function showMorePopupFunc() {
    if(showMorePopup) showMorePopup.style.display = 'flex';
  }
  function hideMorePopupFunc() {
    if(showMorePopup) showMorePopup.style.display = 'none';
  }

  // تحكم بالظهور والإخفاء للقائمة الأساسية
  trigger.addEventListener('mouseenter', () => {
    isOverTrigger = true;
    showPopupFunc();
  });
  trigger.addEventListener('mouseleave', () => {
    isOverTrigger = false;
    setTimeout(() => {
      if (!isOverTrigger && !isOverPopup) hidePopupFunc();
    }, 100);
  });
  popup.addEventListener('mouseenter', () => {
    isOverPopup = true;
    showPopupFunc();
  });
  popup.addEventListener('mouseleave', () => {
    isOverPopup = false;
    setTimeout(() => {
      if (!isOverTrigger && !isOverPopup) hidePopupFunc();
    }, 100);
  });

  // تحكم بالظهور والإخفاء لقائمة "Show more"
  if(showMoreBtn && showMorePopup) {
    showMoreBtn.addEventListener('mouseenter', () => {
      isOverShowMoreBtn = true;
      showMorePopupFunc();
    });
    showMoreBtn.addEventListener('mouseleave', () => {
      isOverShowMoreBtn = false;
      setTimeout(() => {
        if (!isOverShowMoreBtn && !isOverShowMorePopup) hideMorePopupFunc();
      }, 100);
    });
    showMorePopup.addEventListener('mouseenter', () => {
      isOverShowMorePopup = true;
      showMorePopupFunc();
    });
    showMorePopup.addEventListener('mouseleave', () => {
      isOverShowMorePopup = false;
      setTimeout(() => {
        if (!isOverShowMoreBtn && !isOverShowMorePopup) hideMorePopupFunc();
      }, 100);
    });
  }
});
