// Example Edge Function / Cloudflare Worker to accept posts and write to Supabase securely.
// Deploy this as an Edge Function and set env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// minimal NG words; consider storing in DB for management
const NG_WORDS = ["死ね","殺す","差別語","禁止ワード"];
const COOLDOWN_SECONDS = 10;

export default {
  async fetch(request) {
    try {
      if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
      const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
      const ua = request.headers.get('user-agent') || '';
      const payload = await request.json();
      const { thread_id, name='名無しさん', content, image_path=null } = payload;
      if(!content && !image_path) return new Response(JSON.stringify({ error:'content or image required' }), { status:400});

      const safeContent = sanitize(content || '');

      for(const w of NG_WORDS) if(safeContent.includes(w)) return new Response(JSON.stringify({ error:'NG_WORD_FOUND' }), { status:403 });

      // rate limit check: last post by this IP
      const { data: last } = await supabase.from('responses').select('id,body,created_at').eq('poster_ip', ip).order('created_at', { ascending:false }).limit(1);
      if(last && last.length>0){
        const lastAt = new Date(last[0].created_at).getTime();
        if(Date.now() - lastAt < COOLDOWN_SECONDS*1000) return new Response(JSON.stringify({ error:'TOO_SOON' }), { status:429 });
        if(last[0].body === safeContent) return new Response(JSON.stringify({ error:'DUPLICATE' }), { status:409 });
      }

      // thread full check
      const { count } = await supabase.from('responses').select('id', { count:'exact', head:true }).eq('thread_id', thread_id);
      if(count >= 1000) return new Response(JSON.stringify({ error:'THREAD_FULL' }), { status:403 });

      // resolve public URL if image_path provided
      let image_url = null;
      if(image_path){
        const { data } = supabase.storage.from('images').getPublicUrl(image_path);
        image_url = data.publicURL;
      }

      const insert = {
        thread_id,
        name,
        body: safeContent,
        image_url,
        poster_ip: ip,
        user_agent: ua,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('responses').insert([insert]);
      if(error) return new Response(JSON.stringify({ error:'DB_ERROR', detail: error }), { status:500 });

      // increment cached count
      await supabase.rpc('increment_thread_count', { thread_id_param: thread_id }).catch(()=>{});

      return new Response(JSON.stringify({ ok:true }), { status:200 });
    } catch(err){
      console.error(err);
      return new Response(JSON.stringify({ error:'SERVER_ERROR' }), { status:500 });
    }
  }
};

function sanitize(s){ return s? s.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
