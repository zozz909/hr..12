@echo off
echo 🔄 إعداد قاعدة البيانات باستخدام XAMPP MySQL...

REM التحقق من وجود XAMPP
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ❌ لم يتم العثور على XAMPP MySQL في المسار الافتراضي
    echo 💡 تأكد من تثبيت XAMPP في C:\xampp
    pause
    exit /b 1
)

echo ✅ تم العثور على XAMPP MySQL

REM تشغيل ملف SQL
echo 🔄 تنفيذ ملف إنشاء قاعدة البيانات...
C:\xampp\mysql\bin\mysql.exe -u root -p123 < database\create_users_and_settings.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ تم إنشاء قاعدة البيانات بنجاح!
    echo.
    echo 📋 المستخدمين الافتراضيين:
    echo    - admin@company.com (كلمة المرور: admin123)
    echo    - hr@company.com (كلمة المرور: hr123)  
    echo    - employee@company.com (كلمة المرور: emp123)
    echo.
    echo 🎉 النظام جاهز للاستخدام!
) else (
    echo ❌ خطأ في إنشاء قاعدة البيانات
    echo 💡 تأكد من:
    echo    - تشغيل خدمة MySQL في XAMPP
    echo    - صحة كلمة المرور (123)
    echo    - وجود ملف database\create_users_and_settings.sql
)

pause
