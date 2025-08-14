# PowerShell deployment script for Vercel

Write-Host "🚀 Deploying Social Media App to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy to production
Write-Host "Deploying to production..." -ForegroundColor Blue
vercel --prod

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "📝 Don't forget to set environment variables in Vercel dashboard:" -ForegroundColor Yellow
Write-Host "   - MONGODB_URI" -ForegroundColor Cyan
Write-Host "   - JWT_SECRET" -ForegroundColor Cyan
Write-Host "   - NODE_ENV=production" -ForegroundColor Cyan
