from django.http import JsonResponse, HttpResponse

def home(_request):
    return JsonResponse({
        "name": "StockPlant API",
        "version": "dev",
        "endpoints": [
            "/api/auth/login/",
            "/api/auth/refresh/",
            "/api/auth/me/",
            "/api/health/",
        ],
    })

def health(_request):
    return JsonResponse({"status": "ok"})

