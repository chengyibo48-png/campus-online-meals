let audio;
export function playFeedback(kind,settings={}){
 if(settings.haptics&&typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(kind==='decide'?18:8);
 if(!settings.sound||typeof window==='undefined')return;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio??=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(kind==='decide'?660:kind==='reveal'?440:260,t);osc.frequency.exponentialRampToValueAtTime(kind==='decide'?880:520,t+.08);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.05,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.14);}catch{}
}
