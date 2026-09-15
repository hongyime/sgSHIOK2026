import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute=promisify(execFile);
export async function helperProcess(command,args,{cwd,env,timeout}){
  if(!Number.isFinite(timeout)||timeout<=0)throw Error('Helper deadline exhausted');
  return execute(command,args,{cwd,env,timeout,windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});
}
