$ports = @(3000,3001,3002,8000)
foreach($p in $ports){
  $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
  if($conns){
    $pids = $conns | Select-Object -ExpandProperty OwningProcess | Where-Object { $_ -gt 0 } | Sort-Object -Unique
    if(-not $pids -or $pids.Count -eq 0){
      Write-Output "Port ${p}: only system PID 0 found; skipping"
      continue
    }
    Write-Output "Port ${p} PIDs: $($pids -join ', ')"
    foreach($thePid in $pids){
      try{
        $proc = Get-Process -Id $thePid -ErrorAction SilentlyContinue
        if($proc){
          Write-Output "Killing PID ${thePid} ($($proc.ProcessName))"
          Stop-Process -Id $thePid -Force
          Write-Output "Killed ${thePid}"
        } else {
          Write-Output "PID ${thePid} not found via Get-Process, attempting taskkill"
          cmd /c "taskkill /PID ${thePid} /F" | Write-Output
        }
      } catch {
        Write-Output "Failed to kill ${thePid}: ${_}"
      }
    }
  } else {
    Write-Output "Port ${p}: no process"
  }
}
