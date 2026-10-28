const VERSION='campus-v2-42e515b8658c',SHELL=VERSION+'-shell',IMAGES=VERSION+'-images';
const CORE=["./","./app.js","./assets.js","./calendar.js","./catalog-stats.js","./catalog.js","./dish-detail.js","./draw-empty.js","./draw-view.js","./feedback.js","./final-details.css","./food-model.js","./health-profile.js","./inspiration-model.js","./manifest.webmanifest","./meal-engine.js","./menu-query.js","./menu-view.js","./nutrition-foods.js","./nutrition-view.js","./nutrition.js","./personal-state.js","./place-view.js","./profile-view.js","./restaurant-view.js","./router.js","./state-store.js","./styles.css","./update-manager.js","./venue-registry.js","./venues.js","./weather.js","./icons/app.svg","./icons/app-192.png","./icons/app-512.png"];
async function plainResponse(response){const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');return new Response(await response.arrayBuffer(),{status:response.status,statusText:response.statusText,headers});}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);
 for(const path of CORE){const response=await fetch(new Request(path,{cache:'reload',redirect:'follow'}));if(!response.ok)throw Error('Shell resource unavailable: '+path);if(path==='./'){const html=await response.clone().text();if(!html.includes('id="pageTitle"')||!html.includes('src="app.js"'))throw Error('Refusing to cache a sign-in or error page');}await cache.put(path,await plainResponse(response));}
 // Repair only the known broken navigation cache. Ordinary updates still wait for confirmation.
 for(const name of await caches.keys()){if(name===SHELL||!name.startsWith('campus-v2-')||!name.endsWith('-shell'))continue;const old=await (await caches.open(name)).match('./index.html');if(old?.redirected){await self.skipWaiting();break;}}
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('campus-v2-')&&![SHELL,IMAGES].includes(key))await caches.delete(key);await self.clients.claim();})()));
let imageQueue=Promise.resolve();
async function saveImage(request,response){imageQueue=imageQueue.catch(()=>{}).then(async()=>{const cache=await caches.open(IMAGES);await cache.delete(request);const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-29)))await cache.delete(key);await cache.put(request,response);});await imageQueue;}
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.includes('/assets/dishes/')){event.respondWith((async()=>{const cache=await caches.open(IMAGES),hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok)event.waitUntil(saveImage(request,response.clone()));return response;})());return;}
 const relative=url.pathname.split('/').at(-1)||'index.html';if(request.mode==='navigate'){event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match('./'))??fetch(request)));return;}
 if(CORE.some(path=>path==='./'+relative||path.slice(2)===url.pathname.replace(/^\//,'')))event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match(request,{ignoreSearch:true}))??fetch(request)));
});
