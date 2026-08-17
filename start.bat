@echo off
echo Installing new SQLite dependencies...
call npm install --legacy-peer-deps

echo.
echo Cleaning old MySQL migrations...
if exist drizzle\meta rmdir /s /q drizzle\meta
if exist drizzle\*.sql del /q drizzle\*.sql

echo.
echo Skipping db:push to avoid data loss...
echo.
echo Starting the application...
call npm run dev
