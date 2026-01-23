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
  function getEventGroupRows(evt) {
    const dateKey = toYYYYMMDD(evt.date);
    const events = eventDatabase[dateKey] || [];

    const evtKey = getEventCompositeKey(evt);

    return events.filter(e => getEventCompositeKey(e) === evtKey);
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
        e.zoho_id === evt.zoho_id &&
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
         if (tab === 'travel' && activeEvent) {
            loadTravelDetails(activeEvent);
        }
        // ✅ Populate insights table ONLY when Insights tab is clicked
        if (tab === 'insights' && activeEvent) {
          populateInsightsTable(activeEvent);
        }
      });
    });
  }


 function toggleViewSwitcher(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('viewSwitcherDropdown');
    
    // Update options before showing
    updateViewSwitcherOptions();
    
    dropdown.classList.toggle('active');
}

  async function selectViewType(type) {
    console.log("Select view type");
    
    if (currentViewType === type) return;
    
    showLoader();
    currentViewType = type;
    
    // Update UI - display text
    let displayText = '';
    if (type === 'employee') {
        displayText = 'Employee';
    } else if (type === 'run') {
        displayText = 'Run View';
    } else if (type === 'person') {
        displayText = 'Person';
    }
    document.getElementById('currentViewType').textContent = displayText;
    
    // ✅ Update selected state and checkmarks
    document.querySelectorAll('.view-switcher-option').forEach(opt => {
        opt.classList.remove('selected');
        
        // Remove any existing checkmark icons
        const existingCheck = opt.querySelector('.fa-check');
        if (existingCheck) {
            existingCheck.remove();
        }
    });
    
    // ✅ Add checkmark to the selected option based on type
    const selectedOption = Array.from(document.querySelectorAll('.view-switcher-option')).find(opt => {
        const spanText = opt.querySelector('span').textContent.toLowerCase();
        if (type === 'employee' && spanText === 'employee') return true;
        if (type === 'run' && spanText === 'run view') return true;
        if (type === 'person' && spanText === 'person') return true;
        return false;
    });
    
    if (selectedOption) {
        selectedOption.classList.add('selected');
        
        // Create and append checkmark icon
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fa fa-check';
        selectedOption.appendChild(checkIcon);
    }
    
    // Close dropdown
    document.getElementById('viewSwitcherDropdown').classList.remove('active');
    
    // Re-render current view
    try {
        if (currentView === 'day') {
            if (type === 'employee') {
                await renderDayView();
            } else if (type === 'run') {
                await renderRunView();
            }
        } else {
            // Week view
            if (type === 'employee') {
                await renderWeekView();
            } else if (type === 'person') {
                await renderWeekPersonView();
            }
        }
    } catch (error) {
        console.error('Error rendering view:', error);
    }
    
    hideLoader();
}

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
      const dropdown = document.getElementById('viewSwitcherDropdown');
      if (dropdown) {
          dropdown.classList.remove('active');
      }
  });
  
  function getEventsForRunGroup(runGroup, dateKey) {
      const allEvents = eventDatabase[dateKey] || [];
      return allEvents.filter(evt => {    
          if (runGroup === '') {
            // Show events with no run_view or run_view === ''
            if (evt.run_view && evt.run_view !== '') return false;
        } else {
            // Show events matching this specific run group
            if (evt.run_view !== runGroup) return false;
        }

          // Apply other filters
          return appliedFilters.every(f => {
              let search_key = null;
              if (f.field === "persons") {
                  search_key = 'title';
              } else if (f.field === 'staff' || f.field === 'employee') {
                  search_key = 'employee';
              } else if (f.field === 'service') {
                  search_key = 'service';
              } else {
                  search_key = f.field;
              }
              
              const eventValue = evt[search_key];
              if (eventValue == null) return false;

              if (f.filterType === 'contains') {
                  return f.searchValues.some(v =>
                      String(eventValue)
                          .toLowerCase()
                          .includes(String(v).toLowerCase())
                  );
              } else if (f.filterType === 'is') {
                  return f.searchValues.some(v =>
                      String(eventValue).trim().toLowerCase() ===
                      String(v).trim().toLowerCase()
                  );
              } else if (f.filterType === 'isNot') {
                  return !f.searchValues.some(v =>
                      String(eventValue) === String(v)
                  );
              } else if (f.filterType === 'isEmpty') {
                  return isEmptyValue(eventValue);
              } else if (f.filterType === 'isNotEmpty') {
                  return !isEmptyValue(eventValue);
              }
              
              return true;
          });
      });
  }
  async function renderRunViewRows() {
      const rowsContainer = document.getElementById('calendarRows');
      rowsContainer.innerHTML = '';

      const dateKey = getCurrentDateKey();
      const rowHeightsMap = {};
      
      const fillHeight = calculateFillHeight();
      
      // Use runGroups for display
      let displayRunGroups = [...runGroups];
      
      displayRunGroups.forEach(runGroup => {
          const rawEvents = getEventsForRunGroup(runGroup, dateKey);
          const events = detectOverlaps([...rawEvents]);

          const maxConcurrent = events.length ? Math.max(...events.map(e => e.maxConcurrent)) : 1;
          const dynamicHeight = (maxConcurrent * (EVENT_HEIGHT + EVENT_GAP)) + (ROW_PADDING * 2);
          
          const finalRowHeight = Math.max(fillHeight, dynamicHeight);
          rowHeightsMap[runGroup] = finalRowHeight;

          const runRow = document.createElement('div');
          runRow.className = 'employee-calendar-row';
          runRow.dataset.runGroup = runGroup;
          runRow.style.height = finalRowHeight + 'px';

          const grid = document.createElement('div');
          grid.className = 'calendar-grid';

          for (let h = 0; h < 24; h++) {
              const hourCol = document.createElement('div');
              hourCol.className = 'hour-column';
              const innerGrid = document.createElement('div');
              innerGrid.className = 'hour-column-inner';
              for (let i = 0; i < 4; i++) {
                  const line = document.createElement('div');
                  line.className = 'quarter-line';
                  innerGrid.appendChild(line);
              }
              hourCol.appendChild(innerGrid);

              for (let q = 0; q < 4; q++) {
                  const slot = document.createElement('div');
                  slot.className = 'quarter-slot';
                  slot.dataset.hour = h;
                  slot.dataset.quarter = q;
                  slot.dataset.runGroup = runGroup;
                  slot.dataset.viewType = 'run';
                  
                  
                      slot.addEventListener('dragover', handleRunDragOver);
                      slot.addEventListener('drop', handleRunDrop);
                      slot.addEventListener('dragleave', handleDragLeave);
                  
                  hourCol.appendChild(slot);
              }
              grid.appendChild(hourCol);
          }
          
          const eventsContainer = document.createElement('div');
          eventsContainer.className = 'events-container';
          eventsContainer.dataset.runGroup = runGroup;
          renderRunEventsForGroup(eventsContainer, events);

          grid.appendChild(eventsContainer);
          runRow.appendChild(grid);
          rowsContainer.appendChild(runRow);
      });

      renderRunViewColumn(rowHeightsMap);
  }
  function renderRunViewColumn(rowHeightsMap = {}) {
      const column = document.getElementById('employeeColumn');
      column.innerHTML = '';

      const dateKey = getCurrentDateKey();
      
      runGroups.forEach(runGroup => {
          const row = document.createElement('div');
          row.className = 'employee-row';

          if (runGroup === '') {
              row.innerHTML = `
                  <div class="employee-label">
                      <div class="employee-name-row">
                          <span class="employee-name">Unassigned</span>
                      </div>
                  </div>
              `;
          } else {
              let total_mins = 0;
              const events = getEventsForRunGroup(runGroup, dateKey);
              events.forEach(evt => {
                  total_mins += (evt.endMinutes - evt.startMinutes);
              });
              
              const workingHours = total_mins / 60;
              let displayHours = workingHours > 0 ? workingHours.toFixed(1) : '0.0';
              
              row.innerHTML = `
                  <div class="employee-label">
                      <div class="employee-name-row">
                          <span class="employee-name">${runGroup}</span>
                          <span class="employee-count">${displayHours}</span>
                      </div>
                  </div>
              `;
          }

          const height = rowHeightsMap[runGroup] || MIN_ROW_HEIGHT;
          row.style.height = height + 'px';
          column.appendChild(row);
      });
  }
  function renderRunEventsForGroup(container, events) {
      const hourWidth = 100;

      events.forEach(evt => {
          const startHour = Math.floor(evt.startMinutes / 60);
          const startMinute = evt.startMinutes % 60;
          const duration = evt.endMinutes - evt.startMinutes;

          const el = document.createElement('div');
          el.className = `event status-${evt.status}`;
          el.draggable = true;

          el.dataset.eventId = evt.id;
          el.dataset.viewType = 'run';
          el.dataset.runGroup = evt.run_view || '';
          el.dataset.serviceUser = evt.title || '';
          el.dataset.staff = evt.employee || '—';
          el.dataset.start = minutesToTime(evt.startMinutes).hour.toString().padStart(2,'0') + ':' +
                          minutesToTime(evt.startMinutes).minute.toString().padStart(2,'0');
          el.dataset.end = minutesToTime(evt.endMinutes).hour.toString().padStart(2,'0') + ':' +
                          minutesToTime(evt.endMinutes).minute.toString().padStart(2,'0');

          el.dataset.mismatch = evt.status ? evt.status.replace("_"," ") : "";
          el.dataset.status = evt.event_status;
          el.dataset.travel = evt.travel || '';

          const left = (startHour * hourWidth) + ((startMinute / 60) * hourWidth);
          const width = (duration / 60) * hourWidth;
          const top = ROW_PADDING + (evt.stackLevel * (EVENT_HEIGHT + EVENT_GAP));

          el.style.left = left + 'px';
          el.style.width = width + 'px';
          el.style.top = top + 'px';
          el.style.height = EVENT_HEIGHT + 'px';

          const title = document.createElement('div');
          title.className = 'event-title';
          title.textContent = evt.title;

          if (evt.no_of_staff && evt.no_of_staff > 1) {
              const staffBadge = document.createElement('div');
              staffBadge.className = 'event-staff-badge';
              staffBadge.innerHTML = `<i class="fa fa-users"></i>${evt.no_of_staff}`;
              staffBadge.title = `${evt.no_of_staff} staff required`;
              el.appendChild(staffBadge);
          }
          
          if (evt.status === "Completed") {
              el.appendChild(title);
          } else {
              const leftHandle = document.createElement('div');
              leftHandle.className = 'resize-handle left';
              leftHandle.addEventListener('mousedown', e => {
                  e.preventDefault();   
                  e.stopPropagation();
                  startResize(e, evt, 'left');
              });

              const rightHandle = document.createElement('div');
              rightHandle.className = 'resize-handle right';
              rightHandle.addEventListener('mousedown', e => {
                  e.preventDefault();    
                  e.stopPropagation();
                  startResize(e, evt, 'right');
              });

              el.appendChild(leftHandle);
              el.appendChild(rightHandle);
              el.appendChild(title);

              el.addEventListener('dragstart', handleRunDragStart);
              el.addEventListener('dragend', handleRunDragEnd);

              el.addEventListener('mousedown', (e) => {
                  mouseDownX = e.clientX;
                  mouseDownY = e.clientY;
                  if ((e.ctrlKey || e.metaKey) && e.button === 0) {
                      e.preventDefault();
                      e.stopPropagation();   
                      toggleEventSelection(el);
                  }
              });

              el.addEventListener('mouseup', (e) => {
                  if (e.ctrlKey || e.metaKey) return;
                  if (e.target.closest('.resize-handle')) return;
                  if (e.target.closest('.event-edit')) return;

                  const dx = Math.abs(e.clientX - mouseDownX);
                  const dy = Math.abs(e.clientY - mouseDownY);

                  if (dx > CLICK_TOLERANCE || dy > CLICK_TOLERANCE) return;
                  openEventModal(evt);
              });
          }
          
          container.appendChild(el);
      });
  }
  function handleRunDragStart(e) {
      const baseEl = e.currentTarget;
      const baseId = parseInt(baseEl.dataset.eventId);

      if (!selectedEventIds.has(baseId)) {
          clearEventSelection();
          selectedEventIds.add(baseId);
          baseEl.classList.add('selected');
      }

      draggedElement = baseEl;
      draggedEventId = baseId;

      const dateKey = getCurrentDateKey();
      const events = eventDatabase[dateKey] || [];

      draggedEventData = [...selectedEventIds].map(id => {
          const evt = events.find(e => e.id === id);
          return {
              ...evt,
              originalDateKey: dateKey
          };
      });

      selectedEventIds.forEach(id => {
          const el = document.querySelector(`.event[data-event-id="${id}"]`);
          if (el) {
              el.classList.add('dragging');
          }
      });

      document.body.classList.add('dragging-active');
      e.dataTransfer.effectAllowed = 'move';
  }

  function handleRunDragEnd(e) {
      e.currentTarget.classList.remove('dragging');
      document.body.classList.remove('dragging-active');
      document.querySelectorAll('.drop-highlight').forEach(el => el.classList.remove('drop-highlight'));
      
      document.querySelectorAll('.event.dragging').forEach(el => {
          el.classList.remove('dragging');
      });
      
      draggedElement = null;
      draggedEventId = null;
      draggedEventData = null;
  }

  function handleRunDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const slot = e.currentTarget;
      if (!slot.classList.contains('drop-highlight')) {
          document.querySelectorAll('.drop-highlight').forEach(el => el.classList.remove('drop-highlight'));
          slot.classList.add('drop-highlight');
      }
  }

  function handleRunDrop(e) {
      e.preventDefault();
      e.stopPropagation();

      const slot = e.currentTarget;
      slot.classList.remove('drop-highlight');
      console.log(!Array.isArray(draggedEventData) || draggedEventData.length === 0);
      
      if (!Array.isArray(draggedEventData) || draggedEventData.length === 0) {
          return;
      }

      const newHour = parseInt(slot.dataset.hour, 10);
      const newQuarter = parseInt(slot.dataset.quarter, 10);
      const newRunGroup = slot.dataset.runGroup;
      const currentDateKey = getCurrentDateKey();

      const anchorEvent = draggedEventData[0];
      const anchorStart = anchorEvent.startMinutes;
      const newAnchorStart = newHour * 60 + newQuarter * 15;

      const timeChanged = draggedEventData.length === 1 && newAnchorStart !== anchorStart;

      if (timeChanged) {
          pendingTimeChange = {
              draggedEventData: draggedEventData,
              newHour: newHour,
              newQuarter: newQuarter,
              newRunGroup: newRunGroup,
              currentDateKey: currentDateKey,
              anchorStart: anchorStart,
              newAnchorStart: newAnchorStart,
              type: 'run-drag'
          };
          showRunTimeChangeConfirmation();
      } else {
          applyRunDragChanges(draggedEventData, newHour, newQuarter, newRunGroup, currentDateKey, anchorStart, newAnchorStart);
      }
      
      clearEventSelection();
  }
  async function applyRunDragChanges(draggedEventData, newHour, newQuarter, newRunGroup, currentDateKey, anchorStart, newAnchorStart) {
      showLoader();
      
      if (!eventDatabase[currentDateKey]) {
          eventDatabase[currentDateKey] = [];
      }

      if (draggedEventData.length > 1) {
          draggedEventData.forEach(evt => {
              if (eventDatabase[evt.originalDateKey]) {
                  eventDatabase[evt.originalDateKey] =
                      eventDatabase[evt.originalDateKey].filter(e => e.id !== evt.id);
              }

              const updatedEvent = {
                  ...evt,
                  startMinutes: evt.startMinutes,
                  endMinutes: evt.endMinutes,
                  run_view: newRunGroup,
                  run_view_id: newRunGroup ? runGroupDetails[newRunGroup] : null
              };

              eventDatabase[currentDateKey].push(updatedEvent);

              updateRunEventZoho(updatedEvent);
          });
      } else {
          draggedEventData.forEach(evt => {
              const offsetFromAnchor = evt.startMinutes - anchorStart;
              const duration = evt.endMinutes - evt.startMinutes;

              const finalStart = newAnchorStart + offsetFromAnchor;
              const finalEnd = finalStart + duration;

              if (eventDatabase[evt.originalDateKey]) {
                  eventDatabase[evt.originalDateKey] =
                      eventDatabase[evt.originalDateKey].filter(e => e.id !== evt.id);
              }

              const updatedEvent = {
                  ...evt,
                  startMinutes: finalStart,
                  endMinutes: finalEnd,
                  run_view: newRunGroup,
                  run_view_id: newRunGroup ? runGroupDetails[newRunGroup] : null
              };
              
              eventDatabase[currentDateKey].push(updatedEvent);
              
              updateRunEventZoho({
                  ...evt,
                  startMinutes: finalStart,
                  endMinutes: finalEnd,
                  from: minutesToHHMM(finalStart),
                  to: minutesToHHMM(finalEnd),
                  run_view: newRunGroup,
                  run_view_id: newRunGroup ? runGroupDetails[newRunGroup] : null
              });
          });
      }

      await renderRunView();
      hideLoader();
  }
  async function updateRunEventZoho(evt) {
      const key = toYYYYMMDD(evt.date);
      if (!eventDatabase[key]) {
          eventDatabase[key] = [];
      }
      
      const final_emp = getEmployeeIdsForEvent(evt);
      let sts = evt.event_status.replace("_", " ");
      let duration = evt.endMinutes - evt.startMinutes;
      
      const payload = {
          "data": {
              "Care_Providers": final_emp,
              "Start_time": `${minutesToHHMM(evt.startMinutes)}`,
              "End_time": `${minutesToHHMM(evt.endMinutes)}`,
              "Duration": `${minutesToHHMM(duration)}`,
              "From_Date_Time": formatDateStringWithMinutes(evt.date, evt.startMinutes),
              "To_Date_Time": formatDateStringWithMinutes(evt.date, evt.endMinutes),
              "Status": sts,
              "Manager_notes": evt.Manager_Notes,
              "Date_field1": evt.date
          }
      };
      
      // Add run_view if it exists
      if (evt.run_view_id) {
          payload.data.Care_Group = evt.run_view_id;
      } else {
          // Clear the Care_Group if moving to unassigned
          payload.data.Care_Group = null;
      }
      
      var update_config = {
          app_name: app_name,
          report_name: "Bookings_Backend",
          id: evt.zoho_id,
          payload: payload
      };
      
      try {
          const res = await ZOHO.CREATOR.DATA.updateRecordById(update_config);
          console.log("Run update successful:", res);
      } catch (err) {
          console.error("Error updating run:", err);
          showToast("Failed to update run assignment", "error");
      }
  }
  function showRunTimeChangeConfirmation() {
      const modal = document.getElementById('timeChangeConfirmModal');
      
      if (pendingTimeChange.type === 'run-drag') {
          const evt = pendingTimeChange.draggedEventData[0];
          const duration = evt.endMinutes - evt.startMinutes;
          const newEnd = pendingTimeChange.newAnchorStart + duration;
          
          document.getElementById('confirmOldTime').textContent = 
              `${minutesToHHMM(evt.startMinutes)} - ${minutesToHHMM(evt.endMinutes)}`;
          document.getElementById('confirmNewTime').textContent = 
              `${minutesToHHMM(pendingTimeChange.newAnchorStart)} - ${minutesToHHMM(newEnd)}`;
          document.getElementById('confirmEventTitle').textContent = evt.title || 'Untitled';
          
          if (pendingTimeChange.draggedEventData.length > 1) {
              document.getElementById('confirmEventStaff').textContent = 
                  `${pendingTimeChange.draggedEventData.length} events`;
          } else {
              const oldRun = evt.run_view || 'Unassigned';
              const newRun = pendingTimeChange.newRunGroup || 'Unassigned';
              document.getElementById('confirmEventStaff').textContent = 
                  `${oldRun} → ${newRun}`;
          }
      }
      
      modal.classList.remove('hidden');
  }
  async function confirmTimeChange() {
      const modal = document.getElementById('timeChangeConfirmModal');
      modal.classList.add('hidden');
      
      showLoader();
      
      if (pendingTimeChange.type === 'resize') {
          clearTimeout(resizeDebounceTimer);
          await updateEventZoho(pendingTimeChange.event);
          currentView === 'day' ? 
              (currentViewType === 'employee' ? renderDayView() : renderRunView()) : 
              renderWeekView();
      } else if (pendingTimeChange.type === 'drag') {
          const {
              draggedEventData,
              newHour,
              newQuarter,
              newEmployee,
              currentDateKey,
              anchorStart,
              newAnchorStart
          } = pendingTimeChange;
          
          await applyDragChanges(draggedEventData, newHour, newQuarter, newEmployee, currentDateKey, anchorStart, newAnchorStart);
      } else if (pendingTimeChange.type === 'run-drag') {
          const {
              draggedEventData,
              newHour,
              newQuarter,
              newRunGroup,
              currentDateKey,
              anchorStart,
              newAnchorStart
          } = pendingTimeChange;
          
          await applyRunDragChanges(draggedEventData, newHour, newQuarter, newRunGroup, currentDateKey, anchorStart, newAnchorStart);
      }
      
      pendingTimeChange = null;
      resizeDirtyEvent = null;
      hideLoader();
  }
  async function renderRunView() {
      showLoader();
      await getBookings();
      renderHourHeaders();
      await renderRunViewRows();
      syncScroll();
      hideLoader();
  }
  async function getRunGroups() {
      runGroups = [];
      runGroups.push(''); // Empty group first
      
      const serviceList = `[${services.join(",")}]`;
      
      try {
          const run_config = {
              app_name: app_name,
              report_name: "Care_Group_Report", // Adjust to your actual report name
              criteria: `Site_Name.ID == ${serviceList}`
          };
          
          const run_resp = await ZOHO.CREATOR.DATA.getRecords(run_config);
          
          if (run_resp.code === 3000 && Array.isArray(run_resp.data)) {
              run_resp.data.forEach(rec => {
                  const runName = rec.Care_Group_Name; // Adjust field name
                  const runId = rec.ID;
                  
                  if (!runGroups.includes(runName)) {
                      runGroups.push(runName);
                      runGroupDetails[runName] = runId;
                  }
              });
          }
          
          runGroups.sort();
      } catch (err) {
          console.error("Error fetching run groups:", err);
      }
  }

  /**
 * Fetch and display travel details for an event
 */
async function loadTravelDetails(evt) {
  const loadingEl = document.getElementById('travelLoading');
  const noDataEl = document.getElementById('travelNoData');
  const contentEl = document.getElementById('travelContent');
  const beforeSection = document.getElementById('beforeTravelSection');
  const afterSection = document.getElementById('afterTravelSection');

  // Show loading state
  loadingEl.style.display = 'block';
  noDataEl.style.display = 'none';
  contentEl.style.display = 'none';

  try {
    // Call your custom API
    const config = {
      'http_method': 'POST',
      'api_name': 'Distance_Duration', 
      'public_key': 'ahg0WmdMKZpOW8SMYFUOrsFv5',    
      'payload': {
        "id": evt.zoho_id
      }
    };

    const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);
    console.log(response);
    
    // Hide loading
    loadingEl.style.display = 'none';

    
    if (!response || Object.keys(response).length === 0) {
      noDataEl.style.display = 'block';
      return;
    }

    // Get travel data (assuming first key is the record ID)
    const recordId = Object.keys(response)[0];
    const empId = String(evt.employee_id);
    const travelMap = response.result;

    const travelData = travelMap?.[empId];

    
    if (!travelData) {
      noDataEl.style.display = 'block';
      return;
    }

    // Show content
    contentEl.style.display = 'block';
    console.log(travelData);
    
    
    // Populate "Before" travel section
    const hasBefore =
  Boolean(travelData?.BName) && travelData.BName !== 'N/A';
    console.log(hasBefore);
    console.log(evt.employee_id);
    
    
    if (travelData.BName) {
      beforeSection.style.display = 'block';
      document.getElementById('travelBeforeName').textContent = travelData.BName || '—';
      document.getElementById('travelBeforeDist').textContent = travelData.BDist || '—';
      document.getElementById('travelBeforeDur').textContent = travelData.BDur || '—';
      document.getElementById('travelAvail').textContent = travelData.Avail || '—';
    } else {
      beforeSection.style.display = 'none';
    }

    // Populate "After" travel section
    const hasAfter = travelData.AName && travelData.AName !== 'N/A';
    if (travelData.AName) {
      afterSection.style.display = 'block';
      document.getElementById('travelAfterName').textContent = travelData.AName || '—';
      document.getElementById('travelAfterDist').textContent = travelData.ADist || '—';
      document.getElementById('travelAfterDur').textContent = travelData.ADur || '—';
    } else {
      afterSection.style.display = 'none';
    }

    // If neither section has data, show no data message
    if (!hasBefore && !hasAfter) {
      contentEl.style.display = 'none';
      noDataEl.style.display = 'block';
    }

  } catch (error) {
    console.error('Error loading travel details:', error);
    loadingEl.style.display = 'none';
    noDataEl.style.display = 'block';
  }
}
function toggleInfoDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('infoDropdown');
    const wasActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.info-dropdown.active').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
    });
    
    dropdown.classList.toggle('active');
    
    // Calculate and update stats when opening
    if (!wasActive) {
        updateInfoStats();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.info-btn-wrapper')) {
        document.getElementById('infoDropdown')?.classList.remove('active');
    }
});

function updateInfoStats() {
    if (currentView === 'day') {
        updateDayStats();
    } else {
        updateWeekStats();
    }
}

function updateDayStats() {
    const dateKey = getCurrentDateKey();
    const events = eventDatabase[dateKey] || [];
    
    // Required Hours: Sum of duration of all events
    let totalRequiredMinutes = 0;
    events.forEach(evt => {
        totalRequiredMinutes += (evt.endMinutes - evt.startMinutes);
    });
    const requiredHours = (totalRequiredMinutes / 60).toFixed(1);
    let totalCarerMinutes = 0;
    employees.forEach(employee => {
        const shift = shiftsMap[employee];
        if (shift) {
            totalCarerMinutes += (shift.endMinutes - shift.startMinutes);
        }
    });
    const carersHours = (totalCarerMinutes / 60).toFixed(1);
    // Update UI
    document.getElementById('statRequiredHours').textContent = `${requiredHours}h`;
    document.getElementById('statCarersWorking').textContent = employees.length - 1;
    document.getElementById('statCarersHours').textContent = `${carersHours}h`;
}

function updateWeekStats() {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    let totalRequiredMinutes = 0;
    const uniqueCarers = new Set();
    const carerDaysWorked = new Map(); // Track unique employee-day combinations
    
    // Loop through all 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const dateKey = getDateKey(d);
        const dateStr = formatDateDDMMYYYY(d);
        
        const events = eventDatabase[dateKey] || [];
        
        // Sum required hours
        events.forEach(evt => {
            totalRequiredMinutes += (evt.endMinutes - evt.startMinutes);
        });
        
        // Track unique carers
        events.forEach(evt => {
            if (evt.employee && evt.employee !== '') {
                uniqueCarers.add(evt.employee);
                
                // Track unique employee-day for shift calculation
                const key = `${evt.employee}-${dateStr}`;
                if (!carerDaysWorked.has(key)) {
                    carerDaysWorked.set(key, dateStr);
                }
            }
        });
    }
    
    const requiredHours = (totalRequiredMinutes / 60).toFixed(1);

    let totalCarerMinutes = 0;
    
    // For now, use the current shiftsMap (day view)
    // In a full implementation, you'd need to store shifts for each day
    employees.forEach(employee => {
        const shift = shiftsMap[employee];
        if (shift) {
            // Multiply by number of days they worked
            const daysWorked = Array.from(carerDaysWorked.keys())
                .filter(key => key.startsWith(employee + '-')).length;
            totalCarerMinutes += (shift.endMinutes - shift.startMinutes) * daysWorked;
        }
    });
    
    const carersHours = (totalCarerMinutes / 60).toFixed(1);
    
    // Update UI
    document.getElementById('statRequiredHours').textContent = `${requiredHours}h`;
    document.getElementById('statCarersWorking').textContent = employees.length - 1;
    document.getElementById('statCarersHours').textContent = `${carersHours}h`;
}

// Helper function to format hours with decimal
function formatHoursDecimal(minutes) {
    return (minutes / 60).toFixed(1);
}

function updateViewSwitcherOptions() {
    const dropdown = document.getElementById('viewSwitcherDropdown');
    dropdown.innerHTML = '';
    console.log(currentView);
    
    if (currentView === 'day') {
        // Day view options: Employee and Run View
        const employeeOption = document.createElement('div');
        employeeOption.className = 'view-switcher-option' + (currentViewType === 'employee' ? ' selected' : '');
        employeeOption.innerHTML = `
            <span>Employee</span>
            ${currentViewType === 'employee' ? '<i class="fa fa-check"></i>' : ''}
        `;
        employeeOption.onclick = () => selectViewType('employee');
        
        const runOption = document.createElement('div');
        runOption.className = 'view-switcher-option' + (currentViewType === 'run' ? ' selected' : '');
        runOption.innerHTML = `
            <span>Run View</span>
            ${currentViewType === 'run' ? '<i class="fa fa-check"></i>' : ''}
        `;
        runOption.onclick = () => selectViewType('run');
        
        dropdown.appendChild(employeeOption);
        dropdown.appendChild(runOption);
    } else {
        // Week view options: Employee and Person
        const employeeOption = document.createElement('div');
        employeeOption.className = 'view-switcher-option' + (currentViewType === 'employee' ? ' selected' : '');
        employeeOption.innerHTML = `
            <span>Employee</span>
            ${currentViewType === 'employee' ? '<i class="fa fa-check"></i>' : ''}
        `;
        employeeOption.onclick = () => selectViewType('employee');
        
        const personOption = document.createElement('div');
        personOption.className = 'view-switcher-option' + (currentViewType === 'person' ? ' selected' : '');
        personOption.innerHTML = `
            <span>Person</span>
            ${currentViewType === 'person' ? '<i class="fa fa-check"></i>' : ''}
        `;
        personOption.onclick = () => selectViewType('person');
        
        dropdown.appendChild(employeeOption);
        dropdown.appendChild(personOption);
    }
}
function getEventsForPerson(personName, dateKey) {
    const allEvents = eventDatabase[dateKey] || [];
    
    return allEvents.filter(evt => {
        if (evt.title !== personName) return false;
        
        return appliedFilters.every(f => {
            let search_key = null;
            if (f.field === "persons") {
                search_key = 'title';
            } else if (f.field === 'staff' || f.field === 'employee') {
                search_key = 'employee';
            } else if (f.field === 'service') {
                search_key = 'service';
            } else {
                search_key = f.field;
            }
            
            const eventValue = evt[search_key];
            if (eventValue == null) return false;
            
            if (f.filterType === 'contains') {
                return f.searchValues.some(v =>
                    String(eventValue)
                        .toLowerCase()
                        .includes(String(v).toLowerCase())
                );
            } else if (f.filterType === 'is') {
                return f.searchValues.some(v =>
                    String(eventValue).trim().toLowerCase() ===
                    String(v).trim().toLowerCase()
                );
            } else if (f.filterType === 'isNot') {
                return !f.searchValues.some(v =>
                    String(eventValue) === String(v)
                );
            } else if (f.filterType === 'isEmpty') {
                return isEmptyValue(eventValue);
            } else if (f.filterType === 'isNotEmpty') {
                return !isEmptyValue(eventValue);
            }
            
            return true;
        });
    });
}


async function renderWeekPersonView() {
    renderWeekDaysHeaderPerson();
    renderWeekPersonRows();
    syncWeekScroll();
}

// New function: Render week days header for person view
function renderWeekDaysHeaderPerson() {
    const header = document.getElementById('weekDaysHeader');
    header.innerHTML = '';
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        
        if (dayDate.toDateString() === todayDate.toDateString()) {
            dayHeader.classList.add('today');
        }
        
        const dName = dayNames[i].toUpperCase();
        const dNum = dayDate.getDate();
        const mName = monthNames[dayDate.getMonth()].toUpperCase();
        
        dayHeader.innerHTML = `
            <div class="week-day-name">${dName}, ${dNum} ${mName}</div>
        `;
        header.appendChild(dayHeader);
    }
}

// New function: Render person rows
function renderWeekPersonRows() {
    const rowsContainer = document.getElementById('weekCalendarRows');
    rowsContainer.innerHTML = '';
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const rowHeightsMap = {};
    
    const fillHeight = calculateFillHeight();
    
    // Get unique persons from the persons array
    const displayPersons = persons.length > 0 ? [...new Set(persons)] : ['—'];
    
    displayPersons.forEach(person => {
        let maxEventsInDay = 1;
        
        if (person !== '—') {
            for (let day = 0; day < 7; day++) {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + day);
                const events = getEventsForPerson(person, getDateKey(dayDate));
                if (events.length > 0) maxEventsInDay = Math.max(maxEventsInDay, events.length);
            }
        }
        
        const eventNeededHeight = (maxEventsInDay * (EVENT_HEIGHT + EVENT_GAP)) + (ROW_PADDING * 2);
        const finalRowHeight = Math.max(fillHeight, eventNeededHeight);
        rowHeightsMap[person] = finalRowHeight;
        
        const personRow = document.createElement('div');
        personRow.className = 'week-employee-calendar-row';
        personRow.style.height = finalRowHeight + 'px';
        
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + day);
            const dateKey = getDateKey(dayDate);
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            dayColumn.style.flex = "1 1 0";
            
            // No drag and drop for person view
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'week-events-container';
            const events = person === '—' ? [] : getEventsForPerson(person, dateKey);
            renderWeekEventsForPerson(eventsContainer, events, dateKey);
            
            dayColumn.appendChild(eventsContainer);
            personRow.appendChild(dayColumn);
        }
        rowsContainer.appendChild(personRow);
    });
    
    renderWeekPersonColumn(rowHeightsMap);
}

// New function: Render person column
function renderWeekPersonColumn(rowHeightsMap = {}) {
    const column = document.getElementById('weekEmployeeColumn');
    column.innerHTML = '';
    
    const displayPersons = persons.length > 0 ? [...new Set(persons)] : ['—'];
    
    displayPersons.forEach(person => {
        const row = document.createElement('div');
        row.className = 'week-employee-row';
        
        if (person !== '—') {
            row.innerHTML = `
                <div class="employee-label">
                    <div class="employee-name">${person}</div>
                </div>
            `;
        }
        
        const height = rowHeightsMap[person] || MIN_ROW_HEIGHT;
        row.style.height = height + 'px';
        column.appendChild(row);
    });
}

// New function: Render events for person (no drag & drop)
function renderWeekEventsForPerson(container, events, dateKey) {
    events.forEach((evt, index) => {
        const el = document.createElement('div');
        el.className = `event status-${evt.status}`;
        el.draggable = false; // Disable dragging
        
        el.dataset.eventId = evt.id;
        el.dataset.viewType = 'week-person';
        el.dataset.eventDate = dateKey;
        el.dataset.person = evt.title;
        el.dataset.serviceUser = evt.title || '';
        el.dataset.staff = evt.employee || '—';
        el.dataset.start = minutesToTime(evt.startMinutes).hour.toString().padStart(2,'0') + ':' +
                        minutesToTime(evt.startMinutes).minute.toString().padStart(2,'0');
        el.dataset.end = minutesToTime(evt.endMinutes).hour.toString().padStart(2,'0') + ':' +
                        minutesToTime(evt.endMinutes).minute.toString().padStart(2,'0');
        el.dataset.mismatch = evt.status === 'Missed' ? 'Visit missed' : '';
        el.dataset.status = evt.event_status;
        el.dataset.travel = evt.travel || '';
        
        const topPosition = ROW_PADDING + (index * (EVENT_HEIGHT + EVENT_GAP));
        
        el.style.top = `${topPosition}px`;
        el.style.height = `${EVENT_HEIGHT}px`;
        el.style.left = '2px';
        el.style.right = '2px';
        el.style.width = 'auto';
        
        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = evt.employee || 'Unassigned';
        
        const time = document.createElement('div');
        time.className = 'event-time';
        time.textContent = formatTimeRange(evt.startMinutes, evt.endMinutes);
        
        el.appendChild(title);
        el.appendChild(time);
        
        // Click to view details only
        el.addEventListener('mousedown', (e) => {
            mouseDownX = e.clientX;
            mouseDownY = e.clientY;
        });
        
        el.addEventListener('mouseup', (e) => {
            const dx = Math.abs(e.clientX - mouseDownX);
            const dy = Math.abs(e.clientY - mouseDownY);
            
            if (dx > CLICK_TOLERANCE || dy > CLICK_TOLERANCE) return;
            
            openEventModal(evt);
        });
        
        container.appendChild(el);
    });
}

function getEventCompositeKey(evt) {
    if (!evt || !evt.zoho_id) {
        throw new Error("getEventCompositeKey: zoho_id is mandatory");
    }

    return `${evt.zoho_id}-${evt.employee || 'unassigned'}-${evt.employee_id || 'none'}`;
}
function hasEmployeeConflict(zohoId, employee, dateKey, draggedEventKey) {
    const events = eventDatabase[dateKey] || [];
    console.log( eventDatabase[dateKey] );
    console.log( zohoId, employee, dateKey, draggedEventKey );
    
    return events.some(e =>
        e.zoho_id === zohoId &&
        e.employee === employee &&
        `${e.zoho_id}-${e.employee || 'unassigned'}-${e.employee_id || 'none'}`
            !== draggedEventKey
    );
}
