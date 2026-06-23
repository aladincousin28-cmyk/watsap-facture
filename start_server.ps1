Write-Host "Starting Watsap Facture Server..." -ForegroundColor Green
Set-Location "$PSScriptRoot\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
