@echo off
echo ========================================
echo  千牛 AI 客服系统打包脚本
echo ========================================
echo.

REM 安装依赖
echo [1/3] 安装依赖...
pip install -r requirements.txt
echo.

REM 打包
echo [2/3] 开始打包...
pyinstaller --onefile ^
    --name qianniu_ai_service ^
    --distpath ./dist ^
    --workpath ./build ^
    --specpath ./ ^
    --clean ^
    --noconfirm ^
    app_main.py
echo.

REM 复制外部依赖
echo [3/3] 复制外部配置文件...
if not exist "dist\data" mkdir "dist\data"
copy config.yaml dist\config.yaml
xcopy /E /I /Y data dist\data
echo.

echo ========================================
echo  打包完成！
echo  可执行文件: dist\qianniu_ai_service.exe
echo  配置文件: dist\config.yaml
echo  知识库: dist\data\
echo ========================================
echo.
echo 使用方法:
echo   1. 编辑 dist\config.yaml 配置 API Key 和坐标
echo   2. 编辑 dist\data\faq.md 添加知识库
echo   3. 双击运行 qianniu_ai_service.exe
echo.
pause