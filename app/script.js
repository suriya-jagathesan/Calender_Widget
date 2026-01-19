let selectedStaff = [];
function initStaffMultiSelect(initialStaff = []) {
  selectedStaff = [...initialStaff];

  renderStaffPills();
  renderStaffDropdown('');

  const input = document.getElementById('staffSearchInput');
  const dropdown = document.getElementById('staffDropdown');

  input.onfocus = () => dropdown.classList.add('active');

  input.oninput = () => {
    renderStaffDropdown(input.value);
  };

  input.onkeydown = (e) => {
    if (e.key === 'Backspace' && input.value === '' && selectedStaff.length) {
      selectedStaff.pop();
      renderStaffPills();
      renderStaffDropdown('');
    }
  };

  document.addEventListener('click', (e) => {
    if (!document.getElementById('staffMultiSelect').contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}
function renderStaffPills() {
  const container = document.getElementById('staffMultiInput');
  const input = document.getElementById('staffSearchInput');

  container.querySelectorAll('.multi-pill').forEach(p => p.remove());

  selectedStaff.forEach((name, index) => {
    const pill = document.createElement('div');
    pill.className = 'multi-pill';
    pill.innerHTML = `
      <span>${name}</span>
      <button>&times;</button>
    `;
    pill.querySelector('button').onclick = () => {
      selectedStaff.splice(index, 1);
      renderStaffPills();
      renderStaffDropdown('');
    };
    container.insertBefore(pill, input);
  });
}
function renderStaffDropdown(query) {
  const dropdown = document.getElementById('staffDropdown');
  dropdown.innerHTML = '';

  const q = query.toLowerCase();

  employees
    .filter(name =>
      name &&
      !selectedStaff.includes(name) &&
      name.toLowerCase().includes(q)
    )
    .forEach(name => {
      const opt = document.createElement('div');
      opt.className = 'multi-option';
      opt.textContent = name;

      opt.onclick = () => {
  if (selectedStaff.length >= activeEvent.no_of_staff ) {
    showToast('You can select a maximum of 2 staff only');
    return;
  }

  selectedStaff.push(name);
  document.getElementById('staffSearchInput').value = '';
  renderStaffPills();
  renderStaffDropdown('');
};


      dropdown.appendChild(opt);
    });

  dropdown.classList.add('active');
}
