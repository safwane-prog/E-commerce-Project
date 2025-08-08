from django.shortcuts import render



# Home
def Home(request):
    return render(request,'home.html')

# Product_Details
def Product_Details(request,pk):
    return render(request,'product-details.html')