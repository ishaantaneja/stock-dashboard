# export-structure.ps1
# Run this script from backend root
# Example: pwsh ./export-structure.ps1

# Define paths
$root = Get-Location
$envFile = Join-Path $root ".env"
$srcFolder = Join-Path $root "src"

# Output file
$output = Join-Path $root "project-structure.txt"

# Clear previous output
"" | Out-File $output

# Function to build tree structure
function Get-Tree {
    param(
        [string]$Path,
        [string]$Prefix = ""
    )

    $items = Get-ChildItem -Path $Path -Force | Sort-Object PSIsContainer, Name
    $count = $items.Count
    for ($i = 0; $i -lt $count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq $count - 1)
        $connector = if ($isLast) { "└── " } else { "├── " }
        $nextPrefix = if ($isLast) { "$Prefix    " } else { "$Prefix│   " }

        Add-Content $output ("$Prefix$connector$item")

        if ($item.PSIsContainer) {
            Get-Tree -Path $item.FullName -Prefix $nextPrefix
        }
    }
}

# Write file structure section
Add-Content $output "### FILE STRUCTURE"
if (Test-Path $envFile) {
    Add-Content $output "├── .env"
}
if (Test-Path $srcFolder) {
    Add-Content $output "└── src"
    Get-Tree -Path $srcFolder -Prefix "    "
}

# Write file code contents
Add-Content $output "`n### FILE CONTENTS"

# Export .env
if (Test-Path $envFile) {
    Add-Content $output "`n--- .env ---"
    Get-Content $envFile | Out-File $output -Append
}

# Export src folder contents
if (Test-Path $srcFolder) {
    $files = Get-ChildItem -Path $srcFolder -Recurse -File
    foreach ($file in $files) {
        Add-Content $output "`n--- $($file.FullName.Substring($root.Path.Length + 1)) ---"
        Get-Content $file.FullName | Out-File $output -Append
    }
}

Write-Host "Project structure exported to $output"
