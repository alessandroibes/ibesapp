$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force .local | Out-Null
if (-not (Test-Path .env)) {
    function New-LocalSecret {
        $bytes = New-Object byte[] 24
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        return [BitConverter]::ToString($bytes).Replace('-', '')
    }
    $databasePassword = New-LocalSecret
    $certificatePassword = New-LocalSecret
    $bootstrapPassword = 'Aa1!' + (New-LocalSecret)
    @("POSTGRES_PASSWORD=$databasePassword", "CERT_PASSWORD=$certificatePassword", "BOOTSTRAP_PASSWORD=$bootstrapPassword") | Set-Content .env
}
$configuration = @{}
Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object { $parts = $_ -split '=', 2; $configuration[$parts[0]] = $parts[1] }
dotnet dev-certs https --export-path .local/localhost.pfx --password $configuration.CERT_PASSWORD
if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar certificado.' }
dotnet dev-certs https --export-path .local/localhost.pem --format PEM --no-password
if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar certificado PEM.' }
Write-Output 'Configuração local criada. Credenciais em .env (não versionado). Confie no certificado com dotnet dev-certs https --trust.'
