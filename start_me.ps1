Write-Host "📄 Watsap Facture - Lancement" -ForegroundColor Cyan
Write-Host "1. Démarrage du serveur..." -ForegroundColor Yellow
$p = Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002" -WorkingDirectory "$PSScriptRoot\backend"
Start-Sleep -Seconds 3
Write-Host "2. ✅ Serveur sur http://localhost:8002" -ForegroundColor Green
Write-Host "3. Dashboard: http://localhost:8002" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Pour le bot WhatsApp, ouvre un NOUVEAU PowerShell et colle:" -ForegroundColor Cyan
Write-Host "   cd $PSScriptRoot\whatsapp-bot && node bot.js" -ForegroundColor White
