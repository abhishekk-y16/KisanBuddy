import os, sys, json
from pathlib import Path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
	sys.path.insert(0, ROOT)

# Load backend/.env so DATAGOV_* keys are available to the imported module
try:
	from dotenv import load_dotenv
	env_path = Path(ROOT) / 'backend' / '.env'
	if env_path.exists():
		load_dotenv(dotenv_path=str(env_path))
except Exception:
	pass

from services.agmarknet import find_nearest_mandis

res = find_nearest_mandis('Wheat', (21.2293,81.3481), radius_km=100, top_n=10)
print(json.dumps(res, default=str))
