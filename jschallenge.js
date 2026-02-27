(function(){
(function gpuCheck(){
var canvas=document.createElement('canvas');
var gl=canvas.getContext('webgl2')||canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
if(gl){
document.cookie='gpu_ok=1; path=/; max-age=3600; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
}
})();
const s=document.createElement('style');
s.textContent='body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:#0d1117;color:#c9d1d9;display:flex;justify-content:center;align-items:center;min-height:100vh}.container{text-align:center;padding:40px;background:#161b22;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);max-width:400px;width:90%}h1{margin:20px 0 10px;font-size:24px;font-weight:600;color:#58a6ff}.task{margin:20px 0;color:#8b949e;font-size:14px}.error{display:none;margin:20px 0;padding:12px;background:#f85149;color:#fff;border-radius:6px;font-size:14px}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #30363d;color:#8b949e;font-size:12px}.spinner{border:4px solid #30363d;border-top:4px solid #58a6ff;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}';
document.head.appendChild(s);
const c=document.createElement('div');
c.className='container';
c.innerHTML='<div class=spinner></div><h1>Проверка браузера...</h1><div class=task>Подождите несколько секунд</div><div class=error id=error></div><div class=footer>Protected by <a href=https://satx.cloud style="color:inherit;text-decoration:none">🪐 SatxCloud</a></div>';
document.body.appendChild(c);
let r=0;
function h(t){return((t*31+17)%997).toString()}
function v(){
if(r>=3){
document.getElementById('error').textContent='Failed. Refresh.';
document.getElementById('error').style.display='block';
return;
}
try{
const t=Math.floor(Date.now()/1000),k=t+'.'+h(t);
document.cookie='__js_challenge='+k+';path=/;max-age=300;SameSite=Lax'+(location.protocol==='https:'?';Secure':'');
fetch('/js-challenge/verify',{method:'POST',credentials:'include'})
.then(function(e){
if(e.ok){
e.json().then(function(d){
if(d.success){
window.location.reload();
}
});
}else{throw new Error();}
})
.catch(function(){r++;setTimeout(v,500);});
}catch(e){r++;setTimeout(v,500);}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',v):v();
})();
