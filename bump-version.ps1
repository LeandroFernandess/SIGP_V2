# Script de Incremento de Versão - SIGP
# Atualiza automaticamente a versão do sistema seguindo Semantic Versioning

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Type = 'patch',
    
    [Parameter(Mandatory=$false)]
    [string]$Message = ''
)

$ErrorActionPreference = 'Stop'

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "SIGP - Sistema de Incremento de Versao"
Write-Output "==============================================="
Write-Output ""

# Caminho do arquivo version.json
$versionFile = Join-Path $PSScriptRoot "public\version.json"

if (-not (Test-Path $versionFile)) {
    Write-ColorOutput Red "Erro: Arquivo version.json nao encontrado!"
    Write-Output "   Caminho esperado: $versionFile"
    exit 1
}

try {
    # Lê o arquivo JSON
    Write-Output "Lendo versao atual..."
    $versionContent = Get-Content $versionFile -Raw | ConvertFrom-Json
    $currentVersion = $versionContent.version
    
    Write-ColorOutput Yellow "   Versão atual: v$currentVersion"
    Write-Output ""
    
    # Parse da versão (MAJOR.MINOR.PATCH)
    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    # Incrementa a versão baseado no tipo
    switch ($Type) {
        'major' {
            $major++
            $minor = 0
            $patch = 0
            Write-ColorOutput Magenta "Incrementando MAJOR (breaking changes)"
        }
        'minor' {
            $minor++
            $patch = 0
            Write-ColorOutput Blue "Incrementando MINOR (novas funcionalidades)"
        }
        'patch' {
            $patch++
            Write-ColorOutput Green "Incrementando PATCH (correcoes)"
        }
    }
    
    $newVersion = "{0}.{1}.{2}" -f $major, $minor, $patch
    Write-ColorOutput Green "   Nova versao: v$newVersion"
    Write-Output ""
    
    # Atualiza o objeto JSON
    $versionContent.version = $newVersion
    $versionContent.buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    # Adiciona entrada no changelog se houver mensagem
    if ($Message -and $Message.Length -gt 0) {
        Write-Output "Adicionando entrada ao changelog..."
        
        $changelogEntry = @{
            version = $newVersion
            date    = (Get-Date).ToString("yyyy-MM-dd")
            changes = @($Message)
        }

        
        # Adiciona no início do array de changelog
        $newChangelog = @($changelogEntry) + $versionContent.changelog
        $versionContent.changelog = $newChangelog
        
        Write-Output "   ✅ Changelog atualizado"
        Write-Output ""
    }
    
    # Salva o arquivo JSON com indentação bonita
    Write-Output "Salvando alterações..."
    $jsonOutput = $versionContent | ConvertTo-Json -Depth 10
    $jsonOutput | Set-Content $versionFile -Encoding UTF8
    
    Write-ColorOutput Green "Versão atualizada com sucesso!"
    Write-Output ""
    Write-Output "==============================================="
    Write-ColorOutput Cyan "Resumo das Alterações:"
    Write-Output "   Versão anterior: v$currentVersion"
    Write-Output "   Nova versão:     v$newVersion"
    Write-Output "   Data do build:   $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
    if ($Messages -and $Messages.Count -gt 0) {
        Write-Output "   Alterações:"
        foreach ($msg in $Messages) {
            Write-Output "     - $msg"
        }
    }

    Write-Output "==============================================="
    Write-Output ""
    
    # Pergunta se deseja fazer commit no Git
    $gitResponse = Read-Host "Deseja fazer commit das alterações no Git? (S/N)"
    
    if ($gitResponse -eq 'S' -or $gitResponse -eq 's') {
        Write-Output ""
        Write-Output "Criando commit no Git..."
        
        git add $versionFile
        $commitMessage = "chore: bump version to v$newVersion"
        if ($Message) {
            $commitMessage += " - $Message"
        }
        git commit -m $commitMessage
        
        Write-ColorOutput Green "Commit criado com sucesso!"
        Write-Output ""
        
        $pushResponse = Read-Host "Deseja fazer push para o repositório remoto? (S/N)"
        if ($pushResponse -eq 'S' -or $pushResponse -eq 's') {
            git push
            Write-ColorOutput Green "Push realizado com sucesso!"
        }
    }
    
    Write-Output ""
    Write-ColorOutput Cyan "Processo concluido!"
    Write-Output ""
    Write-ColorOutput Yellow "Proximos passos:"
    Write-Output "   1. Revisar as alterações no arquivo version.json"
    Write-Output "   2. Executar 'firebase deploy --only hosting' para deploy"
    Write-Output "   3. Verificar a nova versão no dashboard do sistema"
    Write-Output ""
    
} catch {
    Write-ColorOutput Red "Erro ao processar versao:"
    Write-Output "   $($_.Exception.Message)"
    exit 1
}
