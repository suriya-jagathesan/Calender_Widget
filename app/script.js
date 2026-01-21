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
    showToast(`You can select a maximum of ${activeEvent.no_of_staff} staff only`);
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
      e.id === evt.id &&
      e.employee
    )
    .map(e => {
      const emp = employeeDetails.find(emp => emp.name === e.employee);
      return emp ? emp.id : null;
    })
    .filter(Boolean);

  return employeeIds;
}

function setupTabSwitching() {
  // Remove any existing listeners to prevent duplicates
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    // Clone and replace to remove old event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });
  
  // Add new event listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Update active tab button
      document.querySelectorAll('.tab-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active tab panel
      document.querySelectorAll('.tab-panel')
        .forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');

      // ✅ Show/Hide Save and Cancel buttons based on active tab
      const visitButtons = document.getElementById('visitTabButtons');
      if (tab === 'visit') {
        visitButtons.style.display = 'flex';
      } else {
        visitButtons.style.display = 'none';
      }

      // ✅ Populate insights table ONLY when Insights tab is clicked
      if (tab === 'insights' && activeEvent) {
        populateInsightsTable(activeEvent);
      }
    });
  });
}
let currentViewType = 'employee'; // Default view type

function toggleViewSwitcher(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('viewSwitcherDropdown');
    dropdown.classList.toggle('active');
}

function selectViewType(viewType) {
    currentViewType = viewType;
    
    // Update display text
    const displayText = viewType === 'employee' ? 'Employee View' : 'Run View';
    document.getElementById('currentViewType').textContent = displayText;
    
    // Update selected state in dropdown
    document.querySelectorAll('.view-switcher-option').forEach(opt => {
        opt.classList.remove('selected');
        const checkIcon = opt.querySelector('.fa-check');
        if (checkIcon) checkIcon.remove();
    });
    
    const selectedOption = document.querySelector(`.view-switcher-option:nth-child(${viewType === 'employee' ? '1' : '2'})`);
    selectedOption.classList.add('selected');
    selectedOption.innerHTML += '<i class="fa fa-check"></i>';
    
    // Close dropdown
    document.getElementById('viewSwitcherDropdown').classList.remove('active');
    
    // Re-render view based on selection
    if (viewType === 'run') {
        // TODO: Implement run view rendering
        console.log('Run view selected - implement rendering logic');
        showToast('Run view coming soon', 'error');
    } else {
        // Re-render current view (employee view)
        if (currentView === 'day') {
            renderDayView();
        } else {
            renderWeekView();
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('viewSwitcherDropdown');
    const switcher = document.querySelector('.view-switcher');
    
    if (dropdown && switcher && 
        !switcher.contains(e.target) && 
        dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    }
});