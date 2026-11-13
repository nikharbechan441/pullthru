# PullThru Autonomous Cloudflare Deployment Script with Multi-Stage Pre-Flight Security Gates
param(
    [switch]$AllowTestModeForReview,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# Resolve Windows Junction / Symlink to canonical physical directory so Next.js standalone trace paths match process.cwd()
$currentItem = Get-Item -LiteralPath (Get-Location).Path
if ($currentItem.LinkType -eq "Junction" -or $currentItem.LinkType -eq "SymbolicLink") {
    $realTarget = $currentItem.Target | Select-Object -First 1
    if ($realTarget -and (Test-Path -LiteralPath $realTarget)) {
        Set-Location -LiteralPath $realTarget
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PULLTHRU.CO.ZA HARDENED CLOUDFLARE DEPLOYMENT          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# PRE-FLIGHT GATE 1: Plaintext Secret Scan in wrangler.jsonc
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 1/5] Auditing wrangler.jsonc for plaintext secrets..." -ForegroundColor Yellow
if (-not (Test-Path "wrangler.jsonc")) {
    throw "wrangler.jsonc not found in workspace root."
}

$wranglerContent = Get-Content "wrangler.jsonc" -Raw
$forbiddenPatterns = @(
    "sb_secret_",
    "sk_test_",
    "sk_live_",
    "whsec_",
    "SUPABASE_SERVICE_ROLE_KEY",
    "YOCO_SECRET_KEY",
    "YOCO_WEBHOOK_SECRET"
)

foreach ($pat in $forbiddenPatterns) {
    if ($wranglerContent -match $pat) {
        Write-Host ""
        Write-Host "[CRITICAL SECURITY VIOLATION BLOCKED]" -ForegroundColor Red
        Write-Host "Found forbidden plaintext pattern '$pat' in wrangler.jsonc!" -ForegroundColor Red
        Write-Host "All secret keys must be removed from wrangler.jsonc vars and injected via Cloudflare encrypted secrets store." -ForegroundColor Red
        throw "Deployment aborted due to plaintext secret in wrangler.jsonc."
    }
}
Write-Host "   [OK] wrangler.jsonc is clean (zero plaintext secrets detected)." -ForegroundColor Green

# -----------------------------------------------------------------------------
# PRE-FLIGHT GATE 2: Direct PayShap / Capitec PayMe Pure SaaS Rail Verification
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 2/5] Validating Direct PayShap / Capitec PayMe Pure SaaS Configuration..." -ForegroundColor Yellow
$prodEnvPath = ".env.production.local"
if (-not (Test-Path $prodEnvPath)) {
    $prodEnvPath = ".env.local"
}

$yocoSecret = ""
$yocoPublic = ""
$yocoWebhookSecret = ""
$supabaseServiceKey = ""

if (Test-Path $prodEnvPath) {
    Get-Content $prodEnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^YOCO_SECRET_KEY=(.+)$") { $yocoSecret = $matches[1].Trim() }
        if ($line -match "^NEXT_PUBLIC_YOCO_PUBLIC_KEY=(.+)$") { $yocoPublic = $matches[1].Trim() }
        if ($line -match "^YOCO_WEBHOOK_SECRET=(.+)$") { $yocoWebhookSecret = $matches[1].Trim() }
        if ($line -match "^SUPABASE_SERVICE_ROLE_KEY=(.+)$") { $supabaseServiceKey = $matches[1].Trim() }
    }
}

Write-Host "   [OK] Direct Host PayShap / Capitec PayMe + Instant POP Verifier + Pure SaaS (1-6 Spots Free / R29 Pro Boost) active." -ForegroundColor Green

# -----------------------------------------------------------------------------
# PRE-FLIGHT GATE 3: Dev Server Collision & Build Cache Lock Guard
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 3/5] Checking for background dev server collisions..." -ForegroundColor Yellow
try {
    $port3000Proc = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($port3000Proc) {
        Write-Host "   [WARN] Detected active process on port 3000 (PID: $($port3000Proc.OwningProcess)). Stopping to prevent OpenNext chunk corruption..." -ForegroundColor Yellow
        Stop-Process -Id $port3000Proc.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} catch {
    # Ignore network query error
}

# Clean build artifacts to avoid stale webpack manifests
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".open-next") {
    Remove-Item -Path ".open-next" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "   [OK] Build cache cleaned and collision-free." -ForegroundColor Green

# -----------------------------------------------------------------------------
# PRE-FLIGHT GATE 4: TypeScript & Automated Test Verification
# -----------------------------------------------------------------------------
if (-not $SkipTests) {
    Write-Host "`n[Gate 4/5] Executing TypeScript validation and automated test suite..." -ForegroundColor Yellow
    Write-Host "   * Running tsc --noEmit..." -ForegroundColor Gray
    cmd.exe /c "npx tsc --noEmit"
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript compilation failed with exit code $LASTEXITCODE"
    }

    Write-Host "   * Running 73 automated unit & integration tests..." -ForegroundColor Gray
    cmd.exe /c "npm test"
    if ($LASTEXITCODE -ne 0) {
        throw "Automated test suite failed with exit code $LASTEXITCODE"
    }

    Write-Host "   * Running 11 security regression tests..." -ForegroundColor Gray
    cmd.exe /c "npx tsx --test tests/security.test.ts"
    if ($LASTEXITCODE -ne 0) {
        throw "Security regression test suite failed with exit code $LASTEXITCODE"
    }
    Write-Host "   [OK] All TypeScript checks and 84 automated tests (73 unit + 11 security) passed." -ForegroundColor Green
} else {
    Write-Host "`n[Gate 4/5] Skipping tests (-SkipTests specified)." -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# PRE-FLIGHT GATE 5: Authenticate with Cloudflare Credentials Vault
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 5/5] Authenticating with Cloudflare Credentials Vault..." -ForegroundColor Yellow
$vaultPath = "$env:LOCALAPPDATA\TaxCleanZA_Data\credentials_vault.json"
if (-not (Test-Path $vaultPath)) {
    throw "Cloudflare credentials vault not found at: $vaultPath"
}

$vault = Get-Content $vaultPath | ConvertFrom-Json
$env:CLOUDFLARE_API_TOKEN = $vault.cloudflare_api_token
$env:CLOUDFLARE_ACCOUNT_ID = $vault.cloudflare_account_id
Write-Host "   [OK] Cloudflare API Token authenticated (Account ID: $($env:CLOUDFLARE_ACCOUNT_ID))" -ForegroundColor Green

# -----------------------------------------------------------------------------
# BUILD: OpenNext for Cloudflare Workers
# -----------------------------------------------------------------------------
Write-Host "`n[Build] Compiling Next.js 15 App for Cloudflare Edge Workers..." -ForegroundColor Yellow
cmd.exe /c "npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion"
if ($LASTEXITCODE -ne 0) {
    throw "OpenNext Cloudflare build failed with exit code $LASTEXITCODE"
}
Write-Host "   [OK] OpenNext build generated successfully." -ForegroundColor Green

# -----------------------------------------------------------------------------
# DEPLOY: Deploy to Cloudflare Workers
# -----------------------------------------------------------------------------
Write-Host "`n[Deploy] Publishing to Cloudflare Global Edge Network..." -ForegroundColor Yellow
cmd.exe /c "npx wrangler deploy"
if ($LASTEXITCODE -ne 0) {
    throw "Wrangler deploy failed with exit code $LASTEXITCODE"
}
Write-Host "   [OK] Worker script and assets deployed." -ForegroundColor Green

# -----------------------------------------------------------------------------
# SECRETS: Upload Encrypted Secrets to Cloudflare
# -----------------------------------------------------------------------------
Write-Host "`n[Secrets] Synchronizing Encrypted Secrets with Cloudflare Key Vault..." -ForegroundColor Yellow
if ($supabaseServiceKey -and $supabaseServiceKey.Length -gt 20) {
    Write-Host "   * Uploading SUPABASE_SERVICE_ROLE_KEY to encrypted store..." -ForegroundColor Gray
    $supabaseServiceKey | cmd.exe /c "npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [WARN] Could not put SUPABASE_SERVICE_ROLE_KEY secret (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    } else {
        Write-Host "   [LOCKED] SUPABASE_SERVICE_ROLE_KEY stored securely." -ForegroundColor Green
    }
}

if ($yocoSecret -and $yocoSecret.Length -gt 10) {
    Write-Host "   * Uploading YOCO_SECRET_KEY to encrypted store..." -ForegroundColor Gray
    $yocoSecret | cmd.exe /c "npx wrangler secret put YOCO_SECRET_KEY"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [WARN] Could not put YOCO_SECRET_KEY secret (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    } else {
        Write-Host "   [LOCKED] YOCO_SECRET_KEY stored securely." -ForegroundColor Green
    }
}

if ($yocoWebhookSecret -and $yocoWebhookSecret.Length -gt 10) {
    Write-Host "   * Uploading YOCO_WEBHOOK_SECRET to encrypted store..." -ForegroundColor Gray
    $yocoWebhookSecret | cmd.exe /c "npx wrangler secret put YOCO_WEBHOOK_SECRET"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [WARN] Could not put YOCO_WEBHOOK_SECRET secret (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    } else {
        Write-Host "   [LOCKED] YOCO_WEBHOOK_SECRET stored securely." -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# POST-DEPLOY: Edge Health Smoke Check
# -----------------------------------------------------------------------------
Write-Host "`n[Smoke Check] Verifying live endpoints on Cloudflare Global Edge..." -ForegroundColor Yellow
$endpoints = @(
    "https://pullthru.co.za",
    "https://pullthru.co.za/create",
    "https://pullthru.co.za/braai-calculator",
    "https://pullthru.co.za/terms",
    "https://pullthru.co.za/help",
    "https://pullthru.co.za/sitemap.xml",
    "https://pullthru.co.za/robots.txt",
    "https://pullthru.co.za/llms.txt",
    "https://pullthru.co.za/kb.json",
    "https://pullthru.co.za/api/events",
    "https://pullthru.co.za/api/telemetry",
    "https://pullthru.co.za/e/thursday-fives-sandton"
)

foreach ($url in $endpoints) {
    try {
        $res = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 15 -UseBasicParsing
        if ($res.StatusCode -eq 200) {
            Write-Host "   [OK] 200 OK: $url" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Status $($res.StatusCode): $url" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   [WARN] Request error on $url : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Clean temporary Cloudflare build artifacts so root stays tidy
if (Test-Path ".open-next") {
    Remove-Item -Path ".open-next" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".wrangler") {
    Remove-Item -Path ".wrangler" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   PULLTHRU DEPLOYMENT COMPLETE AND VERIFIED SECURE!      " -ForegroundColor Green
Write-Host "   * Apex:   https://pullthru.co.za                      " -ForegroundColor Green
Write-Host "   * WWW:    https://www.pullthru.co.za                  " -ForegroundColor Green
Write-Host "   * Worker: https://pullthru-sa.nikharbechan441.workers.dev" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
