async function loadReadme() {
  try {
    const response = await fetch('README.md');
    const text = await response.text();
    
    // 提取标题和描述
    const titleMatch = text.match(/^#\s+(.*)/);
    const descMatch = text.match(/^#.*\n\n([^#]*)/);
    
    if (titleMatch) {
      document.querySelector('header h1').textContent = titleMatch[1];
    }
    if (descMatch) {
      document.querySelector('header p').textContent = descMatch[1].trim();
    }
    
    // 解析表格
    const tableMatch = text.match(/\|(.|\n)*?\|[\s-]+\|(.|\n)*?(?=\n---|$)/);
    let projects = [];
    if (tableMatch) {
      const lines = tableMatch[0].split('\n').filter(l=>l.trim().startsWith('|'));
      // 跳过表头和分隔线
      for(let i=2;i<lines.length;i++) {
        const cols = lines[i].split('|').map(c=>c.trim());
        projects.push({
          title: cols[1].replace(/\[(.*?)\]\(.*?\)/g, '$1'),
          detail: (cols[1].match(/\((.*?)\)/)||[])[1],
          desc: cols[2],
          link: (cols[3].match(/\((.*?)\)/)||[])[1],
          img: (cols[4].match(/!\[.*?\]\((.*?)\)/)||[])[1],
          md: lines[i] // 保留原始markdown行
        });
      }
    }
    renderProjects(projects, text);
  } catch (error) {
    document.getElementById('cards').innerHTML = '<p>❌ 无法加载 README.md</p>';
    console.error('读取 README.md 失败:', error);
  }
}

function renderProjects(projects, readmeText) {
  const cardsContainer = document.getElementById('cards');
  cardsContainer.innerHTML = '';

  projects.forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${proj.img}" alt="${proj.title}">
      <div class="card-content">
        <h3 class="card-title">${proj.title}</h3>
        <div class="card-desc">${proj.desc || '暂无描述'}</div>
        <a class="card-link" href="${proj.link}" target="_blank">立即体验</a>
      </div>
    `;
    // 点击卡片弹窗
    card.addEventListener('click', function(e){
      // 避免点击“立即体验”时也弹窗
      if(e.target.classList.contains('card-link')) return;
      
      // 加载项目README.md
      fetch(proj.detail)
        .then(response => response.text())
        .then(text => {
          document.getElementById('modal-content').innerHTML = marked.parse(text);
          // 隐藏链接地址的原始文本
          document.querySelectorAll('#modal-content a').forEach(link => {
            if(link.textContent === link.href) {
              link.textContent = '点击查看';
            }
          });
          document.getElementById('modal').style.display = 'flex';
          
          // 添加点击外部关闭功能
          document.getElementById('modal').addEventListener('click', function(e) {
            if(e.target === this) {
              this.style.display = 'none';
            }
          });
          
          // 添加ESC键关闭功能
          document.addEventListener('keydown', function(e) {
            if(e.key === 'Escape') {
              document.getElementById('modal').style.display = 'none';
            }
          });
        })
        .catch(error => {
          document.getElementById('modal-content').innerHTML = `<p>无法加载项目README: ${error}</p>`;
          document.getElementById('modal').style.display = 'flex';
          
          // 添加点击外部关闭功能
          document.getElementById('modal').addEventListener('click', function(e) {
            if(e.target === this) {
              this.style.display = 'none';
            }
          });
          
          // 添加ESC键关闭功能
          document.addEventListener('keydown', function(e) {
            if(e.key === 'Escape') {
              document.getElementById('modal').style.display = 'none';
            }
          });
        });
    });
    cardsContainer.appendChild(card);
  });

  // 搜索功能
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', function() {
    const keyword = this.value.toLowerCase();
    const cards = cardsContainer.querySelectorAll('.card');
    projects.forEach((proj, idx) => {
      const card = cards[idx];
      const text = (proj.title + ' ' + (proj.desc || '')).toLowerCase();
      card.style.display = text.includes(keyword) ? 'flex' : 'none';
    });
  });

  document.getElementById("toggle-theme").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

    // 页面加载时自动读取主题
  window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
  });
}

// 新增弹窗相关样式
const modalStyle = `
#modal {
  position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999;
}
#modal-content {
  background: var(--card-bg); color: var(--text-color);
  border-radius: 12px; max-width: 600px; width: 90vw; max-height: 80vh; overflow-y: auto;
  padding: 32px 24px 24px 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  position: relative;
}
#modal-close {
  position: absolute; right: 24px; top: 16px; font-size: 2em; cursor: pointer; color: #888;
  transition: color 0.2s;
}
#modal-close:hover { color: #e74c3c; }
`;
const styleTag = document.createElement('style');
styleTag.innerHTML = modalStyle;
document.head.appendChild(styleTag);

// 初始化加载
loadReadme();