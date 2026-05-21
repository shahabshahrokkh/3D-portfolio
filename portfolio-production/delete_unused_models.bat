@echo off
echo ========================================
echo حذف فایل‌های مدل استفاده نشده
echo Delete Unused Model Files
echo ========================================
echo.
echo این فایل‌ها حذف خواهند شد:
echo 1. arcade_game_machine_001.glb (1 MB)
echo 2. black_marker.glb (134 KB)
echo 3. django.glb (1.2 MB)
echo 4. white_board_asset.glb (6 KB)
echo.
echo فایل backup حذف نمی‌شود (می‌توانید دستی حذف کنید):
echo - logo_backup.glb (28 KB)
echo.
echo صرفه‌جویی کل: ~2.4 MB
echo ========================================
echo.
pause
echo.
echo در حال حذف فایل‌ها...
echo.

cd public\assets\models

if exist "arcade_game_machine_001.glb" (
    del "arcade_game_machine_001.glb"
    echo ✓ حذف شد: arcade_game_machine_001.glb
) else (
    echo ✗ یافت نشد: arcade_game_machine_001.glb
)

if exist "black_marker.glb" (
    del "black_marker.glb"
    echo ✓ حذف شد: black_marker.glb
) else (
    echo ✗ یافت نشد: black_marker.glb
)

if exist "django.glb" (
    del "django.glb"
    echo ✓ حذف شد: django.glb
) else (
    echo ✗ یافت نشد: django.glb
)

if exist "white_board_asset.glb" (
    del "white_board_asset.glb"
    echo ✓ حذف شد: white_board_asset.glb
) else (
    echo ✗ یافت نشد: white_board_asset.glb
)

cd ..\..\..

echo.
echo ========================================
echo تمام شد!
echo ========================================
echo.
pause
