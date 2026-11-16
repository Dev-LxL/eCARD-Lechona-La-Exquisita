'use strict';
// Official API: https://developers.tiktok.com/docs/en/embed-player
// Manual only: visibility autoplay is unverified for these publications.
(()=>{
  const origin='https://www.tiktok.com', motion=matchMedia('(prefers-reduced-motion: reduce)');
  const diagnostics=[];
  window.LA_EXQUISITA_TIKTOK_DIAGNOSTICS=diagnostics;
  const players=[...document.querySelectorAll('iframe[data-tiktok-player]')].map(frame=>({
    frame,host:frame.parentElement,id:new URL(frame.dataset.src).pathname.split('/').pop(),
    running:false,playing:false,confirmed:false,lastTime:null,timer:null,slow:null
  }));
  function record(p,event,detail={}){
    diagnostics.push({id:p.id,event,...detail});
    if(diagnostics.length>100)diagnostics.shift();
  }
  function command(p,type){p.frame.contentWindow?.postMessage({'x-tiktok-player':true,type},origin);}
  function restore(p,event='photo',text=''){
    clearTimeout(p.timer);clearTimeout(p.slow);
    if(p.running)command(p,'pause');
    // Unload too: internal cross-origin errors need not emit official messages.
    p.running=false;p.playing=false;p.confirmed=false;p.lastTime=null;
    p.frame.hidden=true;p.frame.removeAttribute('src');
    p.host.classList.remove('player-confirmed');
    const returnFocus=p.host.contains(document.activeElement);
    p.start.hidden=false;p.cancel.hidden=true;p.status.textContent=text;
    if(returnFocus)p.start.focus();
    record(p,event);
  }
  function deadline(p){
    clearTimeout(p.timer);
    p.timer=setTimeout(()=>restore(p,'playback-unconfirmed','Puedes volver a intentarlo o ver el video en TikTok.'),30000);
  }
  players.forEach(p=>{
    p.start=p.host.querySelector('[data-tiktok-start]');
    p.cancel=p.host.querySelector('[data-tiktok-cancel]');
    p.status=p.host.querySelector('[data-tiktok-status]');
    p.start.addEventListener('click',()=>{
      players.forEach(other=>{if(other.running)restore(other);});
      p.running=true;p.start.hidden=true;p.cancel.hidden=false;
      p.status.textContent='Cargando video…';p.frame.hidden=false;
      p.frame.src=p.frame.dataset.src;record(p,'manual-attempt');deadline(p);
      p.slow=setTimeout(()=>{if(!p.confirmed)p.status.textContent='La carga está tardando. Puedes esperar o ver el video en TikTok.';},12000);
    });
    p.cancel.addEventListener('click',()=>{restore(p);p.start.focus();});
    p.frame.addEventListener('load',()=>{if(p.running)record(p,'iframe-document-loaded');});
    p.frame.addEventListener('error',()=>{if(p.running)restore(p,'iframe-error','Puedes ver el video en TikTok.');});
    if(p.frame.hasAttribute('data-compact-player')){
      const fit=()=>{const scale=Math.min(p.host.clientWidth/325,p.host.clientHeight/578,1);if(scale>0)p.host.style.setProperty('--player-scale',String(scale));};
      new ResizeObserver(fit).observe(p.host);fit();
    }
  });
  window.addEventListener('message',event=>{
    if(event.origin!==origin||event.data?.['x-tiktok-player']!==true)return;
    const p=players.find(p=>p.frame.contentWindow===event.source);
    if(!p?.running)return;
    const {type,value}=event.data;
    if(type==='onPlayerReady'){record(p,'player-ready');command(p,'mute');command(p,'play');}
    else if(type==='onStateChange'){
      p.playing=value===1;record(p,'state',{value});
      if(value===1&&document.hidden){restore(p,'hidden');return;}
      if(value===1||value===3)deadline(p);
      else if(p.confirmed)clearTimeout(p.timer);
    }else if(type==='onCurrentTime'){
      const time=value?.currentTime;
      if(p.playing&&Number.isFinite(time)&&p.lastTime!==null&&time>p.lastTime){
        if(!p.confirmed){
          p.confirmed=true;p.host.classList.add('player-confirmed');
          p.status.textContent='';clearTimeout(p.slow);record(p,'playback-confirmed');
        }
        deadline(p);
      }
      if(Number.isFinite(time))p.lastTime=time;
    }else if(type==='onError'||type==='onPlayerError'){
      record(p,'provider-error',{code:typeof value==='number'?value:value?.errorCode??null,errorType:value?.errorType??null});
      restore(p,'error-fallback','Puedes ver el video en TikTok.');
    }
  });
  if(typeof IntersectionObserver!=='undefined'){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const p=players.find(p=>p.host===entry.target);
      if(p?.running&&!entry.isIntersecting)restore(p,'outside-viewport');
    }),{threshold:0});
    players.forEach(p=>observer.observe(p.host));
  }
  const stop=()=>players.forEach(p=>{if(p.running)restore(p,'paused');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  // No automatic motion; preference changes also stop manual playback.
  if(motion.addEventListener)motion.addEventListener('change',stop);
  else motion.addListener?.(stop);
})();
