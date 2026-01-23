#!/usr/bin/env pwsh

# Script to resolve Git merge conflicts by accepting HEAD version
# This removes conflict markers and keeps the HEAD version

Write-Host "Resolving merge conflicts..." -ForegroundColor Cyan

# Find all files with merge conflicts
$conflictFiles = git diff --name-only --diff-filter=U

if ($conflictFiles) {
    Write-Host "Found $($conflictFiles.Count) files with conflicts" -ForegroundColor Yellow
    
    foreach ($file in $conflictFiles) {
        Write-Host "Resolving: $file" -ForegroundColor Green
        git checkout --ours $file
        git add $file
    }
    
    Write-Host "`nAll conflicts resolved! Files staged for commit." -ForegroundColor Green
} else {
    Write-Host "No merge conflicts found via git diff." -ForegroundColor Yellow
    Write-Host "Searching for conflict markers in files..." -ForegroundColor Cyan
    
    # Search for files with conflict markers
    $filesWithMarkers = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | 
        Where-Object { (Get-Content $_.FullName -Raw) -match '<<<<<<<|=======|>>>>>>>' }
    
    if ($filesWithMarkers) {
        Write-Host "Found $($filesWithMarkers.Count) files with conflict markers" -ForegroundColor Yellow
        
        foreach ($file in $filesWithMarkers) {
            Write-Host "Cleaning: $($file.FullName)" -ForegroundColor Green
            
            $content = Get-Content $file.FullName -Raw
            
            # Remove conflict markers and keep HEAD version
            # Pattern: <<<<<<< HEAD\n(content)\n=======\n(other content)\n>>>>>>> hash
            $pattern = '<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?\r?\n>>>>>>> [^\r\n]+'
            $cleaned = $content -replace $pattern, '$1'
            
            # Write back the cleaned content
            Set-Content -Path $file.FullName -Value $cleaned -NoNewline
        }
        
        Write-Host "`nAll conflict markers removed!" -ForegroundColor Green
    } else {
        Write-Host "No files with conflict markers found." -ForegroundColor Green
    }
}
