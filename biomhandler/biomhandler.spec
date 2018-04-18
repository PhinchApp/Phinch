# -*- mode: python -*-

block_cipher = None

# from PyInstaller.utils.hooks import collect_dynamic_libs

a = Analysis(['biomhandler.py'],
             pathex=['/Users/jamesproctor_Pitch/Dropbox/Documents/Professional/Pitch/Projects/Phinch/electron-loader'],
             binaries=[],
             datas=[],
             hiddenimports=['scipy._lib.messagestream','pandas._libs.tslibs.timedeltas'],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='biomhandler',
          debug=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,
          console=True )
