param(
  [int]$Port = 8791,
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

Add-Type -AssemblyName System.Net.HttpListener -ErrorAction SilentlyContinue

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

$mime = @{
  '.html' = 'text/html'; '.htm' = 'text/html'; '.js' = 'application/javascript';
  '.css' = 'text/css'; '.json' = 'application/json'; '.png' = 'image/png';
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.svg' = 'image/svg+xml';
  '.mp3' = 'audio/mpeg'; '.m4a' = 'audio/mp4'; '.mp4' = 'video/mp4';
  '.wav' = 'audio/wav'; '.ico' = 'image/x-icon'; '.woff' = 'font/woff';
  '.woff2' = 'font/woff2';
}

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    $res.KeepAlive = $false
    $path = [System.Uri]::UnescapeDataString($req.Url.LocalPath)
    if ($path -eq '/') { $path = '/index.html' }
    $filePath = Join-Path $Root ($path.TrimStart('/'))

    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = 'application/octet-stream' }
      $res.ContentType = $contentType
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $res.ContentLength64 = [int64]$bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.OutputStream.Flush()
    } else {
      $res.StatusCode = 404
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.ContentLength64 = [int64]$notFound.Length
      $res.OutputStream.Write($notFound, 0, $notFound.Length)
      $res.OutputStream.Flush()
    }
    $res.Close()
  } catch {
    Write-Host "Error: $_"
  }
}
