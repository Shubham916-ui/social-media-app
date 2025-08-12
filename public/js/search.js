// Top search: user lookup and quick navigation
(function(){
  const API = `${window.location.origin}/api`;

  function debounce(fn, wait){
    let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
  }

  function createResultsContainer(bar){
    let el = bar.querySelector('.search-results');
    if(el) return el;
    el = document.createElement('div');
    el.className = 'search-results';
    bar.appendChild(el);
    return el;
  }

  async function fetchUsers(q){
    try {
      const res = await fetch(`${API}/users/search/${encodeURIComponent(q)}`);
      if(!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 8) : [];
    } catch { return []; }
  }

  function renderResults(container, users){
    if(!users.length){ container.innerHTML = '<div class="search-empty">No results</div>'; return; }
    container.innerHTML = users.map(u => `
      <div class="search-result-item" data-id="${u._id}">
        <img class="search-result-avatar" src="${u.avatar || `https://picsum.photos/seed/${u.username}/40/40.jpg`}" alt="${u.name || u.username}">
        <div class="search-result-info">
          <div class="name">${u.name || u.username}</div>
          <div class="username">@${u.username}</div>
        </div>
      </div>
    `).join('');
  }

  function setupTopSearch(){
    const bar = document.querySelector('.search-bar');
    if(!bar) return;
    const input = bar.querySelector('input');
    if(!input) return;

    const results = createResultsContainer(bar);

    const doSearch = debounce(async () => {
      const q = input.value.trim();
      if(q.length < 2){ results.style.display = 'none'; results.innerHTML = ''; return; }
      results.style.display = 'block';
      results.innerHTML = '<div class="search-loading">Searching...</div>';
      const users = await fetchUsers(q);
      renderResults(results, users);
    }, 250);

    input.addEventListener('input', doSearch);
    input.addEventListener('focus', () => { if(results.innerHTML) results.style.display='block'; });

    // Keyboard: Enter opens first result
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        const first = results.querySelector('.search-result-item');
        if(first){ const id = first.getAttribute('data-id'); window.location.href = `/profile?id=${id}`; }
      } else if(e.key === 'Escape') {
        results.style.display = 'none';
      }
    });

    // Click on result
    bar.addEventListener('click', (e)=>{
      const item = e.target.closest('.search-result-item');
      if(item){
        const id = item.getAttribute('data-id');
        window.location.href = `/profile?id=${id}`;
      }
    });

    // Click outside to close
    document.addEventListener('click', (e)=>{
      if(!bar.contains(e.target)) results.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', setupTopSearch);
})();

