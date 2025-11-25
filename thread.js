import { supabase } from './supabase.js';
import { convertAnchors } from './anchor.js';
import { checkContentForNG, checkCooldown } from './anti_spam.js';

const params = new URL(location.href).searchParams;
const threadId = params.get('id');
let responsesCache = [];

async function loadThread(){
  if (!threadId) { document.getElementById('posts').textContent='スレが指定されていません'; return; }
  const { data: thread } = await supabase.from('threads').select('*').eq('id', threadId).single();
  if (!thread) { document.getElementById('posts').textContent='スレが見つかりません'; return; }
  document.getElementById('thread-title').textContent = thread.title;
  document.getElementById('thread-meta').textContent = `作成: ${new Date(thread.created_at).toLocaleString()}`;

  // responses
  const { data: responses } = await supabase.from('responses').select('*').eq('thread_id', threadId).order('id', {ascending:true});
  responsesCache = responses || [];
  renderResponses();
}

function renderResponses(){
  const container = document.getElementById('posts');
  if (!responsesCache || responsesCache.length===0) { container.innerHTML='<p>まだレスがありません</p>'; return; }
  container.innerHTML = responsesCache.map((r, idx)=>{
    const num = idx+1;
    const body = escapeHtml(r.body || '');
    const bodyWithAnchors = convertAnchors(body);
    return `<div class="post" id="res-${num}"><span class="response-number">${num}:</span><div class="response-body">${bodyWithAnchors}</div>${r.image_url?`<img src="${supabase.storage.from('images').getPublicUrl(r.image_url).publicURL}" class="response-image">`:''}</div>`;
  }).join('');

  // anchor click smooth scroll
  document.querySelectorAll('a.anchor').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });

  // next-thread notice
  if (responsesCache.length >= 1000) {
    document.getElementById('next-thread').innerHTML = '<div class="alert">このスレは1000レスに達しました。次スレを作成してください。</div>';
    document.getElementById('reply-area').style.display = 'none';
  } else {
    document.getElementById('next-thread').innerHTML = '';
    document.getElementById('reply-area').style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadThread();

  document.getElementById('send').addEventListener('click', async ()=>{
    const name = document.getElementById('name').value.trim() || '名無しさん';
    const content = document.getElementById('message').value.trim();
    const file = document.getElementById('image').files[0];

    // client-side NG check
    if (!checkContentForNG(content)) { alert('NGワードが含まれています'); return; }
    if (!checkCooldown()) { alert('連投禁止: 少し待ってください'); return; }

    // compress image if present
    let image_path = null;
    if (file) {
      // compress via compress.js
      try {
        const compress = new window.Compress();
        const results = await compress.compress([file], { size: 3, quality: 0.5, maxWidth:800, maxHeight:800, resize:true });
        const bf = results[0];
        const blob = Compress.convertBase64ToFile(bf.data, bf.ext);
        const path = `responses/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('images').upload(path, blob);
        if (error) { console.error(error); alert('画像アップロードできませんでした'); return; }
        image_path = data.path;
      } catch (e) {
        console.warn('compress failed', e);
      }
    }

    // call post API (Edge Function)
    try {
      const res = await fetch('/.netlify/functions/post_handler', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ thread_id: Number(threadId), name, content, image_path })
      });
      const j = await res.json();
      if (!res.ok) { alert('投稿に失敗: '+ (j.error || res.status)); return; }
      // success: reload
      document.getElementById('message').value='';
      document.getElementById('image').value='';
      await loadThread();
    } catch (err) {
      console.error(err);
      alert('投稿中にエラーが発生しました');
    }
  });
});

function escapeHtml(s){ return s? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
