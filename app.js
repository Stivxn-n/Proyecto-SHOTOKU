const storageKey = 'shotoku_entries';
let entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
let editingId = null;

/* ELEMENTOS */
const form = document.getElementById('entryForm');
const typeEl = document.getElementById('type');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const descEl = document.getElementById('description');
const tbody = document.querySelector('#entriesTable tbody');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');

const monthFilter = document.getElementById('monthFilter');
const searchEl = document.getElementById('search');

const add100Btn = document.getElementById('add100');
const clearBtn = document.getElementById('clearBtn');
const exportPDFBtn = document.getElementById('exportPDFBtn');

const toastEl = document.getElementById('toast');
const categoryTotalsEl = document.getElementById('categoryTotals');
const editIndicator = document.getElementById('editIndicator');

const chartCanvas = document.getElementById('summaryChart');
let chartInstance = null;

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

/* UTILIDADES */
const save = () => localStorage.setItem(storageKey, JSON.stringify(entries));
const today = () => new Date().toISOString().slice(0,10);
dateEl.value = today();

const money = v => 'COP $' + Number(v).toLocaleString('es-CO',{minimumFractionDigits:2});

function toast(msg){
  toastEl.textContent = msg;
  toastEl.style.display='block';
  setTimeout(()=>toastEl.style.display='none',1800);
}

/* GRÁFICA */
function updateChart(income, expense){
  if(chartInstance) chartInstance.destroy();

  const isDark = document.body.classList.contains('dark');

  chartInstance = new Chart(chartCanvas,{
    type:'doughnut',
    data:{
      labels:['Ingresos','Gastos'],
      datasets:[{
        data:[income, expense],
        backgroundColor:[
          isDark ? '#22c55e' : '#16a34a',
          isDark ? '#f87171' : '#ef4444'
        ]
      }]
    },
    options:{ plugins:{ legend:{ position:'bottom' } } }
  });
}

/* RENDER */
function render(){
  const months = [...new Set(entries.map(e => e.date.slice(0,7)))];
  monthFilter.innerHTML =
    '<option value="all">Todos</option>' +
    months.map(m=>`<option value="${m}">${m}</option>`).join('');

  const q = searchEl.value.toLowerCase();

  const filtered = entries.filter(e=>{
    if(monthFilter.value !== 'all' && !e.date.startsWith(monthFilter.value)) return false;
    return e.category.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
  });

  tbody.innerHTML = filtered.length ? filtered.map(e=>`
    <tr>
      <td class="${e.type==='income'?'type-income':'type-expense'}">
        ${e.type === 'income' ? 'Ingreso' : 'Gasto'}
      </td>
      <td>${money(e.amount)}</td>
      <td>${e.category}</td>
      <td>${e.date}</td>
      <td>${e.description || '—'}</td>
      <td>
        <button class="secondary edit" data-id="${e.id}">Editar</button>
        <button class="secondary delete" data-id="${e.id}">Eliminar</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6">Sin registros</td></tr>';

  const income = entries.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const expense = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0);

  totalIncomeEl.textContent = money(income);
  totalExpenseEl.textContent = money(expense);

  const bal = income - expense;
  balanceEl.textContent = money(bal);
  balanceEl.className = 'amount ' + (bal>0?'balance-positive':bal<0?'balance-negative':'balance-zero');

  renderCategoryTotals();
  updateChart(income, expense);
}

/* TOTALES POR CATEGORÍA */
function renderCategoryTotals(){
  const totals = {};
  entries.filter(e=>e.type==='expense').forEach(e=>{
    totals[e.category]=(totals[e.category]||0)+e.amount;
  });

  categoryTotalsEl.innerHTML = Object.keys(totals).length
    ? Object.entries(totals).map(([c,v])=>`<li>${c}: ${money(v)}</li>`).join('')
    : '<li>No hay gastos</li>';
}

/* FORMULARIO */
form.addEventListener('submit',e=>{
  e.preventDefault();

  const category = categoryEl.value.trim();
  if(!category) return toast('Elige o escribe una categoría');

  if(editingId){
    const item = entries.find(e=>e.id===editingId);
    Object.assign(item,{
      type:typeEl.value,
      amount:+amountEl.value,
      category,
      date:dateEl.value,
      description:descEl.value.trim()
    });
    editingId=null;
    form.classList.remove('editing');
    editIndicator.style.display='none';
    toast('Entrada actualizada');
  }else{
    entries.push({
      id:'id'+Date.now(),
      type:typeEl.value,
      amount:+amountEl.value,
      category,
      date:dateEl.value,
      description:descEl.value.trim()
    });
    toast('Entrada agregada');
  }

  save(); render(); form.reset(); dateEl.value=today();
});

/* TABLA */
tbody.addEventListener('click',e=>{
  const id = e.target.dataset.id;
  if(e.target.classList.contains('delete')){
    entries = entries.filter(x=>x.id!==id);
    save(); render(); toast('Eliminado');
  }
  if(e.target.classList.contains('edit')){
    const item = entries.find(x=>x.id===id);
    editingId=id;
    form.classList.add('editing');
    editIndicator.style.display='block';
    typeEl.value=item.type;
    amountEl.value=item.amount;
    categoryEl.value=item.category;
    dateEl.value=item.date;
    descEl.value=item.description;
  }
});

/* BOTONES */
add100Btn.onclick = ()=> amountEl.value=(+amountEl.value||0)+100;
clearBtn.onclick = ()=>{ entries=[]; save(); render(); toast('Todo borrado'); };
searchEl.oninput = render;
monthFilter.onchange = render;

/* TEMA OSCURO */
(function(){
  const saved = localStorage.getItem('theme') || 'light';
  if(saved === 'dark'){
    document.body.classList.add('dark');
    themeIcon.className = 'bi bi-sun';
  }
})();

themeToggle.onclick = ()=>{
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  themeIcon.className = dark ? 'bi bi-sun' : 'bi bi-moon-stars';
  localStorage.setItem('theme', dark?'dark':'light');
  render();
};

/* INIT */
render();
