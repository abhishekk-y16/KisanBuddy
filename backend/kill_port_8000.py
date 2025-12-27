import subprocess
import sys

try:
    out = subprocess.check_output(['netstat','-ano'], universal_newlines=True)
except Exception as e:
    print('ERR_NETSTAT', e)
    sys.exit(1)

pids = set()
for line in out.splitlines():
    if ':8000' in line:
        parts = line.split()
        if parts:
            pid = parts[-1]
            try:
                int(pid)
                pids.add(pid)
            except Exception:
                pass

if not pids:
    print('NO_PID')
    sys.exit(0)

for pid in pids:
    print('KILLING', pid)
    try:
        subprocess.check_call(['taskkill','/PID',pid,'/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print('KILLED', pid)
    except Exception as e:
        print('KILL_ERR', pid, e)

sys.exit(0)
