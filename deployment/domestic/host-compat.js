// Keep the host's visible branding while protecting the app's bottom controls.
function applyHostCompatibility(){
 const footer=document.getElementById('mulepage-footer');
 document.body.toggleAttribute('data-host-branding',!!footer);
 for(const [id,label] of [['mulepage-bar','托管平台品牌信息'],['mulepage-footer','托管平台品牌入口']]){
  const element=document.getElementById(id);
  if(element&&!element.hasAttribute('role')){element.setAttribute('role','complementary');element.setAttribute('aria-label',label);}
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyHostCompatibility,{once:true});else applyHostCompatibility();
new MutationObserver(applyHostCompatibility).observe(document.body,{childList:true});
