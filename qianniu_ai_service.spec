# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

block_cipher = None

# 收集所有子模块
hiddenimports = [
    'langchain_text_splitters',
    'langchain_openai',
    'langchain_community',
    'langchain_core',
    'openai',
    'tiktoken',
    'yaml',
    'keyboard',
    'pyautogui',
    'pyperclip',
    'uiautomation',
    'comtypes',
    'comtypes.client',
    'onnxruntime',
    'tokenizers',
    'huggingface_hub',
]

# 收集 chromadb 所有子模块
hiddenimports += collect_submodules('chromadb')

# 收集数据文件
datas = collect_data_files('tiktoken')
datas += collect_data_files('chromadb')

a = Analysis(
    ['app_main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='qianniu_ai_service',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)