import py_compile, sys
try:
    py_compile.compile('backend/services/weather.py', doraise=True)
    py_compile.compile('backend/main.py', doraise=True)
    print('PY_COMPILE_OK')
except Exception as e:
    print('PY_COMPILE_ERROR')
    print(e)
    sys.exit(1)
