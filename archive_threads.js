// Cloudflare Worker / Node compatible archive script
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const THIRTY_DAYS_MS = 1000*60*60*24*30;
const MAX_RESPONSES = 1000;

async function shouldArchive(thread){
  const { count } = await supabase.from('responses').select('id', { count:'exact', head:true }).eq('thread_id', thread.id);
  if(count >= MAX_RESPONSES) return true;
  const { data: last } = await supabase.from('responses').select('created_at').eq('thread_id', thread.id).order('created_at', { ascending:false }).limit(1);
  if(!last || last.length===0){
    const created = new Date(thread.created_at).getTime();
    return (Date.now() - created) > THIRTY_DAYS_MS;
  }
  const lastTime = new Date(last[0].created_at).getTime();
  return (Date.now() - lastTime) > THIRTY_DAYS_MS;
}

async function archiveThread(thread){
  console.log('Archiving', thread.id);
  const { data: responses } = await supabase.from('responses').select('*').eq('thread_id', thread.id).order('id', {ascending:true});
  // insert thread metadata
  await supabase.from('threads_archived').insert([{
    id: thread.id,
    original_thread_id: thread.id,
    board_id: thread.board_id,
    title: thread.title,
    created_at: thread.created_at,
    archived_at: new Date().toISOString()
  }]);
  // chunk insert responses
  const chunk = 500;
  for(let i=0;i<responses.length;i+=chunk){
    const part = responses.slice(i,i+chunk).map(r=>({
      id: r.id,
      original_response_id: r.id,
      thread_id: r.thread_id,
      name: r.name,
      body: r.body,
      image_url: r.image_url,
      created_at: r.created_at
    }));
    await supabase.from('responses_archived').insert(part);
  }
  // flag original
  await supabase.from('threads').update({ is_archived:true, archived_at:new Date().toISOString() }).eq('id', thread.id);
  // optionally delete original responses (commented)
  // await supabase.from('responses').delete().eq('thread_id', thread.id);
}

export async function handler(){
  const { data: threads } = await supabase.from('threads').select('*').eq('is_archived', false);
  for(const t of threads){
    try{
      if(await shouldArchive(t)) await archiveThread(t);
    }catch(err){
      console.error('archive error',t.id,err);
    }
  }
  return { ok:true };
}

// local invocation
if(require.main === module){
  (async ()=>{ await handler(); process.exit(0); })();
}
