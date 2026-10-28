import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import path from 'node:path';
const bundled=path.join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const python=process.env.CODEX_PYTHON_BIN??(existsSync(bundled)?bundled:process.platform==='win32'?'python':'python3');
const result=spawnSync(python,[path.join(import.meta.dirname,'audit-assets.py'),...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;
process.exitCode=result.status??1;
