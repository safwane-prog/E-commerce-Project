
async function getproductsindatabase(category,option,price_min,price_max,name,page=1){
    const productapiurl = `${mainDomain}/products/products-list/shop/?category=${category}&option=${option}&price_min=${price_min}&price_max=${price_max}&name=${name}&page=${page}`
    console.log(productapiurl);
    
    const respones = await fetch(productapiurl,{

    })
}

function renderproducts(){

}
document.addEventListener('DOMContentLoaded',getproductsindatabase)