// client-side helpers; main checks should run server-side in Edge Function
const NG_WORDS = ["死ね","殺す","差別語","禁止ワード"];

export function checkContentForNG(text){
  if(!text) return true;
  for(const w of NG_WORDS) if(text.includes(w)) return false;
  return true;
}

// simple client cooldown using localStorage
const COOLDOWN_MS = 10000;
export function checkCooldown(){
  const last = Number(localStorage.getItem('lastPostTime') || 0);
  const now = Date.now();
  if(now - last < COOLDOWN_MS) return false;
  localStorage.setItem('lastPostTime', String(now));
  return true;
}
