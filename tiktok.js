'use strict';
// Official Embed Player API: https://developers.tiktok.com/docs/en/embed-player
// No playback state is claimed unless the provider emits its official event.
(()=>{
  const origin='https://www.tiktok.com';
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const players=[...document.querySelectorAll('iframe[data-tiktok-player]')].map(frame=>({
    frame,ratio:0,observed:false,ready:false,attempted:false,blocked:false
  }));
  const diagnostics=[];
  window.LA_EXQUISITA_TIKTOK_DIAGNOSTICS=diagnostics;
  function record(player,event,detail={}){
    diagnostics.push({id:new URL(player.frame.src).pathname.split('/').pop(),event,...detail});
    if(diagnostics.length>100)diagnostics.shift();
  }
  // Keep the entire official 325 × 578 player inside the existing photo-height slot.
  // Scaling is uniform; the separate original link never covers native controls.
  players.filter(p=>p.frame.hasAttribute('data-compact-player')).forEach(p=>{
    const host=p.frame.parentElement;
    const fit=()=>{const scale=Math.min(host.clientWidth/325,host.clientHeight/578,1);if(scale>0)host.style.setProperty('--player-scale',String(scale));};
    new ResizeObserver(fit).observe(host);fit();
  });
  let active=null;
  function command(player,type){
    try{player.frame.contentWindow?.postMessage({'x-tiktok-player':true,type},origin);}
    catch{record(player,'message-send-failed',{command:type});player.blocked=true;}
  }
  function pauseOthers(except=null){players.forEach(p=>{if(p!==except)command(p,'pause');});}
  function sync(){
    if(document.hidden){pauseOthers();active=null;return;}
    if(motion.matches)return;
    const next=active&&active.ratio>=.6?active:
      players.filter(p=>p.ratio>=.6&&!p.blocked).sort((a,b)=>b.ratio-a.ratio)[0];
    if(active&&active!==next)command(active,'pause');
    active=next||null;
    if(!next||!next.ready||next.attempted)return;
    pauseOthers(next);next.attempted=true;command(next,'mute');command(next,'play');
  }
  if(typeof IntersectionObserver!=='undefined'){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const p=players.find(player=>player.frame.parentElement===entry.target);if(!p)return;
        p.observed=true;p.ratio=entry.isIntersecting?entry.intersectionRatio:0;
        if(p.ratio===0){command(p,'pause');p.attempted=false;if(active===p)active=null;}
      });sync();
    },{threshold:[0,.25,.6,1]});
    players.forEach(p=>observer.observe(p.frame.parentElement));
  }
  players.forEach(p=>p.frame.addEventListener('error',()=>{
    p.blocked=true;record(p,'iframe-error');command(p,'pause');if(active===p)active=null;
  }));
  players.forEach(p=>p.frame.addEventListener('load',()=>{
    record(p,'iframe-document-loaded');
    // An iframe load is not proof that TikTok media loaded or played.
    setTimeout(()=>{if(!p.ready)record(p,'ready-not-received',{note:'Check provider restrictions, consent and browser console; manual controls and original link remain available.'});},12000);
  }));
  window.addEventListener('message',event=>{
    if(event.origin!==origin||!event.data||event.data['x-tiktok-player']!==true)return;
    const p=players.find(player=>player.frame.contentWindow===event.source);if(!p)return;
    if(event.data.type==='onPlayerReady'){p.ready=true;record(p,'player-ready');sync();}
    else if(event.data.type==='onStateChange'&&event.data.value===1){
      // Native manual playback also pauses any other player.
      if(document.hidden||(p.observed&&p.ratio===0)){command(p,'pause');return;}
      pauseOthers(p);active=p;p.attempted=true;record(p,'playing');
    }else if(event.data.type==='onStateChange'&&event.data.value===2){
      record(p,'paused');
    }else if(['onError','onPlayerError'].includes(event.data.type)){
      p.blocked=true;command(p,'pause');
      const code=typeof event.data.value==='number'?event.data.value:event.data.value?.errorCode??event.data.errorCode;
      record(p,'provider-error',{code:code??null,errorType:event.data.value?.errorType||event.data.errorType||null});
      // Do not remove the provider's message or native manual controls on errors.
      // Autoplay remains blocked for this player; the original external link stays visible.
      if(active===p)active=null;
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseOthers();active=null;}else sync();});
  window.addEventListener('pagehide',()=>pauseOthers());
  const motionChanged=()=>{pauseOthers();active=null;players.forEach(p=>{p.attempted=false;});if(!motion.matches)sync();};
  if(motion.addEventListener)motion.addEventListener('change',motionChanged);
  else motion.addListener?.(motionChanged);
})();
