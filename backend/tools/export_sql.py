import os
import datetime as ddt
from pathlib import Path
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stockplant.settings')
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
import django
django.setup()

from django.conf import settings
from django.db import connection
from django.apps import apps
import decimal
import datetime

ts = ddt.datetime.now().strftime('%Y%m%d-%H%M%S')
out_dir = Path(__file__).resolve().parent.parent / 'backups'
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / f'db-backup-{ts}.sql'

def esc(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float, decimal.Decimal)):
        return str(v)
    if isinstance(v, (datetime.date, datetime.datetime, datetime.time)):
        return "'" + str(v).replace("'", "''") + "'"
    return "'" + str(v).replace("'", "''") + "'"

engine = settings.DATABASES['default']['ENGINE']
if engine == 'django.db.backends.sqlite3':
    import sqlite3
    db = settings.DATABASES['default']['NAME']
    conn = sqlite3.connect(db)
    with open(out_path, 'w', encoding='utf-8') as f:
        for line in conn.iterdump():
            f.write(line + '\n')
    conn.close()
else:
    tables = sorted({m._meta.db_table for m in apps.get_models()})
    count_tables = 0
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('BEGIN;\n')
        with connection.cursor() as cur:
            for tbl in tables:
                try:
                    cur.execute(f'SELECT * FROM "{tbl}"')
                except Exception:
                    continue
                cols = [c[0] for c in cur.description]
                count_tables += 1
                rows = cur.fetchall()
                for row in rows:
                    vals = ','.join(esc(v) for v in row)
                    cols_sql = ','.join('"' + c + '"' for c in cols)
                    f.write(f'INSERT INTO "{tbl}" ({cols_sql}) VALUES ({vals});\n')
        f.write('COMMIT;\n')

print(json.dumps({'path':str(out_path), 'engine':engine}, ensure_ascii=False))