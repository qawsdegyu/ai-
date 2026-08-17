@echo off
echo ===================================================
echo Cleaning up the project for the client...
echo ===================================================

echo Deleting node_modules...
rmdir /s /q node_modules

echo Deleting dist folders...
rmdir /s /q dist
rmdir /s /q dist-server

echo Deleting temporary environment file...
del .env

echo ===================================================
echo Clean up complete! The folder is now ready to be zipped.
echo ===================================================
pause
