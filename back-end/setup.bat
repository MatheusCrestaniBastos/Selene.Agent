@echo off
REM ============================================
REM Setup Script - Windows
REM Agente Pessoal/Empresarial
REM ============================================

echo.
echo ======================================
echo   Setup - Agente Pessoal/Empresarial
echo ======================================
echo.

REM ============================================
REM 1. VERIFICAR PYTHON
REM ============================================
echo Passo 1/5: Verificando Python...

python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Python nao esta instalado!
    echo.
    echo Baixe e instale Python 3.9 ou superior:
    echo https://www.python.org/downloads/
    echo.
    echo Certifique-se de marcar "Add Python to PATH" durante instalacao
    echo.
    pause
    exit /b 1
)

python --version
echo   OK - Python encontrado
echo.

REM ============================================
REM 2. VERIFICAR DIRETORIO
REM ============================================
echo Passo 2/5: Verificando diretorio...

if not exist "requirements.txt" (
    echo.
    echo [ERRO] Arquivo requirements.txt nao encontrado!
    echo.
    echo Execute este script dentro da pasta backend\
    echo   cd backend
    echo   setup.bat
    echo.
    pause
    exit /b 1
)

echo   OK - Diretorio correto
echo.

REM ============================================
REM 3. CRIAR AMBIENTE VIRTUAL
REM ============================================
echo Passo 3/5: Criando ambiente virtual...

if exist "venv\" (
    echo   Ambiente virtual ja existe, pulando...
) else (
    python -m venv venv
    echo   OK - Ambiente virtual criado
)
echo.

REM ============================================
REM 4. INSTALAR DEPENDENCIAS
REM ============================================
echo Passo 4/5: Instalando dependencias...
echo (Isso pode demorar alguns minutos...)
echo.

call venv\Scripts\activate.bat

python -m pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

echo   OK - Dependencias instaladas
echo.

REM ============================================
REM 5. GERAR ARQUIVO .ENV
REM ============================================
echo Passo 5/5: Configurando variaveis de ambiente...

if exist ".env" (
    echo.
    echo   Arquivo .env ja existe!
    set /p overwrite="   Deseja sobrescrever? (s/N): "
    
    if /i "%overwrite%"=="s" (
        del .env
        echo   Arquivo .env antigo removido
    ) else (
        echo   Mantendo .env existente
        goto :skip_env
    )
)

echo   Criando arquivo .env...
copy .env.example .env >nul

echo   Gerando chaves de seguranca...

REM Gerar SECRET_KEY (usando Python)
for /f "delims=" %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET_KEY=%%i

REM Gerar ENCRYPTION_KEY
for /f "delims=" %%i in ('python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"') do set ENCRYPTION_KEY=%%i

REM Gerar WHATSAPP_VERIFY_TOKEN
for /f "delims=" %%i in ('python -c "import secrets; print(secrets.token_hex(16))"') do set VERIFY_TOKEN=%%i

REM Substituir no arquivo .env usando PowerShell
powershell -Command "(Get-Content .env) -replace 'your_secret_key_here_generate_with_openssl', '%SECRET_KEY%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'your_32_byte_encryption_key_base64', '%ENCRYPTION_KEY%' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'your_verify_token', '%VERIFY_TOKEN%' | Set-Content .env"

echo.
echo   OK - Arquivo .env criado com chaves de seguranca!

:skip_env
echo.

REM ============================================
REM FINALIZACAO
REM ============================================
echo.
echo ======================================
echo   Setup concluido com sucesso!
echo ======================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Configure o Supabase:
echo    - Crie conta em: https://supabase.com
echo    - Crie um novo projeto
echo    - Acesse SQL Editor e execute: database\schema.sql
echo    - Copie URL e keys para o arquivo .env
echo.
echo 2. Edite o arquivo .env e configure:
echo    - SUPABASE_URL=...
echo    - SUPABASE_KEY=...
echo    - SUPABASE_SERVICE_KEY=...
echo.
echo 3. (Opcional) Configure integracoes:
echo    - Google: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
echo    - WhatsApp: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
echo.
echo 4. Inicie o servidor:
echo    venv\Scripts\activate
echo    uvicorn app.main:app --reload
echo.
echo 5. Acesse a documentacao:
echo    http://localhost:8000/docs
echo.
echo Mais informacoes: README.md
echo.
pause