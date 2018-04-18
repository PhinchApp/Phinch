from PyInstaller.utils.hooks import collect_dynamic_libs

print 'biom - - - - -';
print collect_dynamic_libs('biom')
print 'hashlib - - - - -';
print collect_dynamic_libs('hashlib')
print 'md5 - - - - -';
print collect_dynamic_libs('md5')