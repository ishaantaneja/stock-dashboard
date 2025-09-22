# Set the source folder and output file
$srcFolder = Join-Path -Path $PSScriptRoot -ChildPath "src"
$outputFile = Join-Path -Path $PSScriptRoot -ChildPath "src-structure.txt"

# Clear previous output
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Recursive function to export folder structure and file contents
function Export-FolderStructure {
    param (
        [string]$Path,
        [string]$Indent = ""
    )

    # Get all directories first
    $directories = Get-ChildItem -Path $Path -Directory
    foreach ($dir in $directories) {
        Add-Content -Path $outputFile -Value "$Indent📁 $($dir.Name)"
        Export-FolderStructure -Path $dir.FullName -Indent ("$Indent    ")
    }

    # Get all files in current folder
    $files = Get-ChildItem -Path $Path -File
    foreach ($file in $files) {
        Add-Content -Path $outputFile -Value "$Indent📄 $($file.Name)"
        Add-Content -Path $outputFile -Value '```'  # Start code block
        Get-Content -Path $file.FullName | ForEach-Object {
            Add-Content -Path $outputFile -Value $_
        }
        Add-Content -Path $outputFile -Value '```'  # End code block
    }
}

# Run the function on src folder
Export-FolderStructure -Path $srcFolder

Write-Host "File structure and code exported to $outputFile"
