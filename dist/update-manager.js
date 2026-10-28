// Never lose an activated update while a dialog or background tab delays refresh.
export function createUpdateGate({canRefresh,refresh,offer}){
 let pending=false,done=false;
 return {activated(){if(done)return;pending=true;offer();},resume(){if(pending&&!done)offer();},request(){if(!pending||done)return false;if(!canRefresh()){offer();return false;}done=true;refresh();return true;},get pending(){return pending&&!done;}};
}
