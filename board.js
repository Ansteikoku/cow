import { supabase } from './supabase.js';

const params = new URL(location.href).searchParams;
const boardId = params.get('id');

async function loadBoards() {
  const { data } = await supabase.from('boards').select('*').order('id');
  const el = document.getElementById('board-list');
  if (!data) { el.textContent='読み込み失敗'; return; }
  el.innerHTML = data.map(b=>`<div><a class="board-link" href="board.html?id=${b.id}">${escapeHtml(b.name)}</a> - ${escapeHtml(b.description || '')}</div>`).join('');
}

async function loadBoard() {
  if (!boardId) {
    document.getElementById('board-title').textContent = '板が見つかりません';
    return;
  }
  const { data: board } = await supabase.from('boards').select('*').eq('id', boardId).single();
  document.getElementById('board-title').textContent = board ? board.name : '板';

  await loadThreads();
}

async function loadThreads(page=1, perPage=20, q='') {
  const offset = (page-1)*perPage;
  let query = supabase.from('threads').select('id,title,created_at,response_count').eq('board_id', boardId).order('created_at', {ascending:false}).range(offset, offset+perPage-1);
  if (q) query = query.ilike('title', `%${q}%`);
  const { data } = await query;
  const el = document.getElementById('thread-list');
  if (!data) { el.textContent='読み込み失敗'; return; }
  el.innerHTML = data.map(t=>{
    return `<div class="thread-item"><a href="thread.html?id=${t.id}">${escapeHtml(t.title)}</a> <span class="meta">(${t.response_count||0}レス) - ${new Date(t.created_at).toLocaleString()}</span></div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  if (boardId) await loadBoard(); else await loadBoards();

  const createBtn = document.getElementById('create-thread');
  if (createBtn) createBtn.addEventListener('click', async ()=>{
    const title = document.getElementById('thread-title').value.trim();
    const content = document.getElementById('thread-content').value.trim();
    const file = document.getElementById('thread-image').files[0];
    if (!title) return alert('タイトルを入力してください');
    // upload image if exists
    let image_path = null;
    if (file) {
      const path = `threads/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('images').upload(path, file);
      if (error) { console.error(error); alert('画像アップロード失敗'); return; }
      image_path = data.path;
    }
    const { error } = await supabase.from('threads').insert([{ board_id: boardId, title, created_at: new Date().toISOString(), image_url: image_path }]);
    if (error) { console.error(error); alert('スレ作成失敗'); return; }
    document.getElementById('thread-title').value=''; document.getElementById('thread-content').value='';
    await loadThreads();
  });

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.addEventListener('click', ()=> {
    const q = document.getElementById('search-q').value.trim();
    loadThreads(1,20,q);
  });
});

function escapeHtml(s){ return s? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
