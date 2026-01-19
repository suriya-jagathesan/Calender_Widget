let selectedStaff = [];
function initStaffMultiSelect(initialStaff = []) {
    console.log(activeEvent.id);
        
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
function isSameLogicalEvent(a, b) {
  return (
    a.date === b.date &&
    a.title === b.title &&
    a.service === b.service &&
    a.from === b.from &&
    a.to === b.to
  );
}
function getEventGroupRows(activeEvent) {
  const key = toYYYYMMDD(activeEvent.date);
  return (eventDatabase[key] || []).filter(evt =>
    isSameLogicalEvent(evt, activeEvent)
  );
}
function cloneEventForEmployee(base, employee, employee_id = null) {
    console.log(employee);
    
     if( employee ){
               employee_id =  employeeDetails.find(emp => emp.name === employee).id;
            }
            else{
                employee_id = null;
            }
  return {
    ...base,
    employee,
    employee_id
  };
}
function isUnassigned(evt) {
  return !evt.employee || evt.employee.trim() === "";
}

function ensurePlaceholderRow(activeEvent) {
  const dateKey = toYYYYMMDD(activeEvent.date);

  const rows = (eventDatabase[dateKey] || []).filter(evt =>
    isSameLogicalEvent(evt, activeEvent)
  );

  if (rows.length === 0) {
    const placeholder = {
      ...activeEvent,
      employee: "",
      employee_id: null
    };    
    eventDatabase[dateKey].push(placeholder);
  }
}
function getEmployeeIdsForEvent(evt) {
  const dateKey = toYYYYMMDD(evt.date);

  if (!eventDatabase[dateKey]) return [];

  const employeeIds = eventDatabase[dateKey]
    .filter(e =>
      e.date === evt.date &&
      e.title === evt.title &&
      e.service === evt.service &&
      e.from === evt.from &&
      e.to === evt.to &&
      e.employee
    )
    .map(e => {
      const emp = employeeDetails.find(emp => emp.name === e.employee);
      return emp ? emp.id : null;
    })
    .filter(Boolean);

  return employeeIds;
}
