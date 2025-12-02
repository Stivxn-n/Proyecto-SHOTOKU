const storageKey = 'home_book_entries_v1';
let entries = JSON.parse(localStorage.getItem(storageKey) || '[]');

// ELEMENTOS
const form = document.getElementById('entryForm');
const typeEl = document.getElementById('type');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const descEl = document.getElementById('description');
const clearBtn = document.getElementById('clearBtn');
const tbody = document.querySelector('#entriesTable tbody');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const balanceEl = document.getElementById('balance');
const monthFilter = document.getElementById('monthFilter');
const filterChip = document.getElementById('filterMonth');
const searchEl = document.getElementById('search');
const add100Btn = document.getElementById('add100');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const toastEl = document.getElementById('toast');
const chartCanvas = document.getElementById('summaryChart');
const exportPDFBtn = document.getElementById('exportPDFBtn');

let chartInstance = null;

// UTILIDADES
const save = () => localStorage.setItem(storageKey, JSON.stringify(entries));

const todayISO = () => {
  let d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

if (!dateEl.value) dateEl.value = todayISO();

const formatMoney = v =>
  'COP $' + Number(v).toLocaleString('es-CO', { minimumFractionDigits: 2 });

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  toastEl.style.opacity = '1';
  setTimeout(() => {
    toastEl.style.opacity = '0';
    setTimeout(() => (toastEl.style.display = 'none'), 250);
  }, 1400);
}

// CHART
function updateChart(income, expense) {
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Ingresos', 'Gastos'],
      datasets: [{ data: [income, expense] }]
    },
    options: { responsive: true }
  });
}

// RENDER
function render() {
  // MESES
  const months = [...new Set(entries.map(e => e.date?.slice(0, 7)))].filter(Boolean);

  monthFilter.innerHTML =
    `<option value="all">Todos</option>` +
    months.map(m => `<option value="${m}">${m}</option>`).join('');

  filterChip.textContent =
    'Mes: ' + (monthFilter.value === 'all' ? 'Todos' : monthFilter.value);

  // FILTROS
  const query = searchEl.value.toLowerCase();
  const filtered = entries.filter(e => {
    const matchesMonth =
      monthFilter.value === 'all' || e.date.startsWith(monthFilter.value);

    const matchesSearch =
      e.description?.toLowerCase().includes(query) ||
      e.category?.toLowerCase().includes(query);

    return matchesMonth && matchesSearch;
  });

  // TABLA 
  tbody.innerHTML =
    filtered.length > 0
      ? filtered
          .map(
            e => `
      <tr>
        <td class="${e.type === 'income' ? 'type-income' : 'type-expense'}">
          ${e.type === 'income' ? 'Ingreso' : 'Gasto'}
        </td>
        <td>${formatMoney(e.amount)}</td>
        <td>${e.category || '—'}</td>
        <td>${e.date}</td>
        <td>${e.description || '—'}</td>
        <td>
          <button class="secondary edit" data-id="${e.id}">Editar</button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="6" class="muted">No hay entradas</td></tr>`;

  // RESUMEN
  const income = entries
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);

  const expense = entries
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + e.amount, 0);

  totalIncomeEl.textContent = formatMoney(income);
  totalExpenseEl.textContent = formatMoney(expense);
  balanceEl.textContent = formatMoney(income - expense);

  updateChart(income, expense);
}

// AGREGAR
form.addEventListener('submit', e => {
  e.preventDefault();

  if (amountEl.value <= 0) {
    showToast('Monto inválido');
    return;
  }

  entries.push({
    id: 'id' + Date.now(),
    type: typeEl.value,
    amount: parseFloat(amountEl.value),
    category: categoryEl.value.trim(),
    date: dateEl.value,
    description: descEl.value.trim()
  });

  save();
  render();
  showToast('Entrada agregada');

  form.reset();
  dateEl.value = todayISO();
});

// EDITAR
tbody.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains('edit')) {
    const item = entries.find(x => x.id === id);
    if (!item) return;

    typeEl.value = item.type;
    amountEl.value = item.amount;
    categoryEl.value = item.category;
    dateEl.value = item.date;
    descEl.value = item.description;

    // BORRAR PARA REEMPLAZAR
    entries = entries.filter(x => x.id !== id);

    save();
    render();
    showToast('Edita y presiona Agregar');
  }
});

// +100
add100Btn.addEventListener('click', () => {
  amountEl.value = (parseFloat(amountEl.value) || 0) + 100;
});

// FILTROS
monthFilter.addEventListener('change', render);
searchEl.addEventListener('input', render);

// PDF EXPORT
exportPDFBtn.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Reporte Financiero - SHOTOKU", 14, 15);

  const data = entries.map(e => [
    e.type === 'income' ? 'Ingreso' : 'Gasto',
    formatMoney(e.amount),
    e.category || '—',
    e.date,
    e.description || '—'
  ]);

  doc.autoTable({
    head: [['Tipo', 'Monto', 'Categoría', 'Fecha', 'Descripción']],
    body: data,
    startY: 25,
    styles: { fontSize: 9 }
  });

  doc.save("shotoku_reporte.pdf");
});

// MODO OSCURO
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  if (document.body.classList.contains('dark')) {
    themeIcon.classList.remove('bi-moon-stars');
    themeIcon.classList.add('bi-sun');
  } else {
    themeIcon.classList.remove('bi-sun');
    themeIcon.classList.add('bi-moon-stars');
  }
});

// INICIO
render();
