from django.shortcuts import render



# Home
def Home(request):
    return render(request,'home.html')