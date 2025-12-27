Start-Sleep -Seconds 3

Try {
    $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/healthz' -TimeoutSec 10 -ErrorAction Stop
    Write-Output "BACKEND_OK"
    if ($r -is [string]) { Write-Output $r } else { $r | ConvertTo-Json -Compress | Write-Output }
} Catch {
    Write-Output "BACKEND_FAIL"
    Write-Output $_.Exception.Message
}

Try {
    $f = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -TimeoutSec 10 -ErrorAction Stop
    Write-Output "FRONTEND_OK"
    Write-Output $f.StatusCode
} Catch {
    Write-Output "FRONTEND_FAIL"
    Write-Output $_.Exception.Message
}
