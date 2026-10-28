import {loadState,saveState,STORAGE_KEY} from './personal-state.js';

// All writes share one compare-and-save boundary, including undo and import.
export function createStateStore(storage){
 const loaded=loadState(storage);let state=loaded.state,raw=loaded.raw,readOnly=!!loaded.readOnly;
 return {
  loaded,get state(){return state;},get raw(){return raw;},get readOnly(){return readOnly;},
  reload(){const next=loadState(storage);if(!next.readOnly){state=next.state;raw=next.raw;readOnly=false;}else readOnly=true;return next;},
  save(next,{recover=false}={}){
   if(recover){try{raw=storage.getItem(STORAGE_KEY);readOnly=false;}catch{readOnly=true;}}
   if(readOnly){state=next;return {ok:true,sessionOnly:true,warning:'仅本次会话有效，原始数据未修改。请导出备份。'};}
   const result=saveState(storage,next,raw);
   if(result.conflict)return {ok:false,conflict:true};
   state=next;if(result.ok)raw=result.raw;
   return {ok:true,sessionOnly:!result.ok,warning:result.warning??''};
  },
  replaceMemory(next){state=next;},
  reset(next){state=next;raw=null;readOnly=false;}
 };
}
