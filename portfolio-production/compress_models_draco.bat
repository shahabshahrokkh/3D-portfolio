@echo off
echo ========================================
echo Compressing GLB models with Draco
echo ========================================
echo.

set "MODEL_DIR=public\assets\models"
set "BACKUP_DIR=public\assets\models\backup_original"

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [1/4] Compressing hoodie.glb...
if exist "%MODEL_DIR%\hoodie.glb" (
    copy "%MODEL_DIR%\hoodie.glb" "%BACKUP_DIR%\hoodie.glb"
    gltf-pipeline -i "%MODEL_DIR%\hoodie.glb" -o "%MODEL_DIR%\hoodie_compressed.glb" -d
    if %ERRORLEVEL% EQU 0 (
        move /Y "%MODEL_DIR%\hoodie_compressed.glb" "%MODEL_DIR%\hoodie.glb"
        echo ✓ hoodie.glb compressed successfully
    ) else (
        echo ✗ Failed to compress hoodie.glb
    )
) else (
    echo ✗ hoodie.glb not found
)
echo.

echo [2/4] Compressing hoodie_black.glb...
if exist "%MODEL_DIR%\hoodie_black.glb" (
    copy "%MODEL_DIR%\hoodie_black.glb" "%BACKUP_DIR%\hoodie_black.glb"
    gltf-pipeline -i "%MODEL_DIR%\hoodie_black.glb" -o "%MODEL_DIR%\hoodie_black_compressed.glb" -d
    if %ERRORLEVEL% EQU 0 (
        move /Y "%MODEL_DIR%\hoodie_black_compressed.glb" "%MODEL_DIR%\hoodie_black.glb"
        echo ✓ hoodie_black.glb compressed successfully
    ) else (
        echo ✗ Failed to compress hoodie_black.glb
    )
) else (
    echo ✗ hoodie_black.glb not found
)
echo.

echo [3/4] Compressing white_tshirt_godzilla.glb...
if exist "%MODEL_DIR%\white_tshirt_godzilla.glb" (
    copy "%MODEL_DIR%\white_tshirt_godzilla.glb" "%BACKUP_DIR%\white_tshirt_godzilla.glb"
    gltf-pipeline -i "%MODEL_DIR%\white_tshirt_godzilla.glb" -o "%MODEL_DIR%\white_tshirt_godzilla_compressed.glb" -d
    if %ERRORLEVEL% EQU 0 (
        move /Y "%MODEL_DIR%\white_tshirt_godzilla_compressed.glb" "%MODEL_DIR%\white_tshirt_godzilla.glb"
        echo ✓ white_tshirt_godzilla.glb compressed successfully
    ) else (
        echo ✗ Failed to compress white_tshirt_godzilla.glb
    )
) else (
    echo ✗ white_tshirt_godzilla.glb not found
)
echo.

echo [4/4] Compressing t-shirt_low_poly.glb...
if exist "%MODEL_DIR%\t-shirt_low_poly.glb" (
    copy "%MODEL_DIR%\t-shirt_low_poly.glb" "%BACKUP_DIR%\t-shirt_low_poly.glb"
    gltf-pipeline -i "%MODEL_DIR%\t-shirt_low_poly.glb" -o "%MODEL_DIR%\t-shirt_low_poly_compressed.glb" -d
    if %ERRORLEVEL% EQU 0 (
        move /Y "%MODEL_DIR%\t-shirt_low_poly_compressed.glb" "%MODEL_DIR%\t-shirt_low_poly.glb"
        echo ✓ t-shirt_low_poly.glb compressed successfully
    ) else (
        echo ✗ Failed to compress t-shirt_low_poly.glb
    )
) else (
    echo ✗ t-shirt_low_poly.glb not found
)
echo.

echo ========================================
echo Compression complete!
echo Original files backed up to: %BACKUP_DIR%
echo ========================================
pause
