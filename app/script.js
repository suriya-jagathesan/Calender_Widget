let selectedStaff = [];
function initStaffMultiSelect(initialStaff = []) {
  console.log(activeEvent.id);

  selectedStaff = [...initialStaff];

  renderStaffPills();
  renderStaffDropdown("");

  const input = document.getElementById("staffSearchInput");
  const dropdown = document.getElementById("staffDropdown");

  input.onfocus = () => dropdown.classList.add("active");

  input.oninput = () => {
    renderStaffDropdown(input.value);
  };

  input.onkeydown = (e) => {
    if (e.key === "Backspace" && input.value === "" && selectedStaff.length) {
      selectedStaff.pop();
      renderStaffPills();
      renderStaffDropdown("");
    }
  };

  document.addEventListener("click", (e) => {
    if (!document.getElementById("staffMultiSelect").contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
}
function renderStaffPills() {
  const container = document.getElementById("staffMultiInput");
  const input = document.getElementById("staffSearchInput");

  container.querySelectorAll(".multi-pill").forEach((p) => p.remove());

  selectedStaff.forEach((name, index) => {
    const pill = document.createElement("div");
    pill.className = "multi-pill";
    pill.innerHTML = `
        <span>${name}</span>
        <button>&times;</button>
      `;
    pill.querySelector("button").onclick = () => {
      selectedStaff.splice(index, 1);
      renderStaffPills();
      renderStaffDropdown("");
    };
    container.insertBefore(pill, input);
  });
}
function renderStaffDropdown(query) {
  const service = document.getElementById("mService").value;
  const dropdown = document.getElementById("staffDropdown");
  dropdown.innerHTML = "";

  const q = query.toLowerCase();

  const staffList = allStaffDetails
    .filter((s) => s.service?.includes(service))
    .map((s) => s.name);

  staffList
    .filter(
      (name) =>
        name && !selectedStaff.includes(name) && name.toLowerCase().includes(q),
    )
    .forEach((name) => {
      const opt = document.createElement("div");
      opt.className = "multi-option";
      opt.textContent = name;

      opt.onclick = () => {
        // if (selectedStaff.length >= activeEvent.no_of_staff) {
        //   showToast(`You can select a maximum of ${activeEvent.no_of_staff} staff only`);
        //   return;
        // }

        selectedStaff.push(name);

        document.getElementById("staffSearchInput").value = "";

        renderStaffPills();
        renderStaffDropdown("");
      };

      dropdown.appendChild(opt);
    });

  dropdown.classList.add("active");
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

  return events.filter((e) => getEventCompositeKey(e) === evtKey);
}
function cloneEventForEmployee(base, employee, employee_id = null) {
  console.log(employee);

  if (employee) {
    employee_id = allStaffDetails.find((emp) => emp.name === employee).id;
  } else {
    employee_id = null;
  }
  return {
    ...base,
    employee,
    employee_id,
  };
}
function isUnassigned(evt) {
  return !evt.employee || evt.employee.trim() === "";
}

function ensurePlaceholderRow(activeEvent) {
  const dateKey = toYYYYMMDD(activeEvent.date);

  const rows = (eventDatabase[dateKey] || []).filter((evt) =>
    isSameLogicalEvent(evt, activeEvent),
  );

  if (rows.length === 0) {
    const placeholder = {
      ...activeEvent,
      employee: "",
      employee_id: null,
    };
    eventDatabase[dateKey].push(placeholder);
  }
}
function getEmployeeIdsForEvent(evt) {
  const dateKey = toYYYYMMDD(evt.date);
  if (!eventDatabase[dateKey]) return [];

  const employeeIds = eventDatabase[dateKey]
    .filter((e) => e.zoho_id === evt.zoho_id && e.employee)
    .map((e) => {
      const emp = allStaffDetails.find((emp) => emp.name === e.employee);
      return emp ? emp.id : null;
    })
    .filter(Boolean);

  return employeeIds;
}

function setupTabSwitching() {
  // Remove any existing listeners to prevent duplicates
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((btn) => {
    // Clone and replace to remove old event listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Add new event listeners
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      // Update active tab button
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update active tab panel
      document
        .querySelectorAll(".tab-panel")
        .forEach((p) => p.classList.remove("active"));
      document.getElementById(`tab-${tab}`).classList.add("active");

      // ✅ Show/Hide Save and Cancel buttons based on active tab
      const visitButtons = document.getElementById("visitTabButtons");
      if (tab === "visit") {
        visitButtons.style.display = "flex";
      } else {
        visitButtons.style.display = "none";
      }
      if (tab === "travel" && activeEvent) {
        loadTravelDetails(activeEvent);
      }
      // ✅ Populate insights table ONLY when Insights tab is clicked
      if (tab === "insights" && activeEvent) {
        populateInsightsTable(activeEvent);
      }
    });
  });
}

function toggleViewSwitcher(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("viewSwitcherDropdown");

  // Update options before showing
  updateViewSwitcherOptions();

  dropdown.classList.toggle("active");
}

async function selectViewType(type) {
  if (currentViewType === type) return;

  showLoader();
  // clearAllFilters();
  const employeeSearchInput = document.getElementById("employeeSearchInput");
  if (employeeSearchInput) {
    employeeSearchInput.value = "";
  }
  currentViewType = type;

  // Update UI - display text
  let displayText = "";
  if (type === "employee") {
    if (currentView === "week") {
      displayText = "Visit";
    } else {
      displayText = "Staff";
    }
  } else if (type === "run") {
    displayText = "Run";
  } else if (type === "person") {
    displayText = "Person";
  } else if (type === "staff") {
    displayText = "Staff";
  }
  document.getElementById("currentViewType").textContent = displayText;

  document.querySelectorAll(".view-switcher-option").forEach((opt) => {
    opt.classList.remove("selected");

    // Remove any existing checkmark icons
    const existingCheck = opt.querySelector(".fa-check");
    if (existingCheck) {
      existingCheck.remove();
    }
  });

  // ✅ Add checkmark to the selected option based on type
  const selectedOption = Array.from(
    document.querySelectorAll(".view-switcher-option"),
  ).find((opt) => {
    const spanText = opt.querySelector("span").textContent.toLowerCase();
    console.log(`${type} - ${spanText}`);

    if (type === "employee" && spanText === "employee") return true;
    if (type === "run" && spanText === "run") return true;
    if (type === "person" && spanText === "person") return true;
    if (type === "staff" && spanText === "staff") return true;
    return false;
  });
  if (selectedOption) {
    selectedOption.classList.add("selected");
    // Create and append checkmark icon
    const existingCheck = selectedOption.querySelector(".fa-check");
    if (!existingCheck) {
      // Create and append checkmark icon
      const checkIcon = document.createElement("i");
      checkIcon.className = "fa fa-check";
      selectedOption.appendChild(checkIcon);
    }
  }

  // Close dropdown
  document.getElementById("viewSwitcherDropdown").classList.remove("active");

  try {
    if (currentView === "day") {
      if (type === "employee") {
        await renderDayView();
      } else if (type === "run") {
        await renderRunView();
      }
    } else {
      if (type === "employee") {
        await renderWeekView();
      } else if (type === "person") {
        await renderWeekPersonView();
      } else if (type === "run") {
        await renderWeekRunView();
      } else if (type === "staff") {
        await renderWeekStaffView();
      }
    }
  } catch (error) {
    console.error("Error rendering view:", error);
  }

  hideLoader();
}

document.addEventListener("click", () => {
  const dropdown = document.getElementById("viewSwitcherDropdown");
  if (dropdown) {
    dropdown.classList.remove("active");
  }
});

function getEventsForRunGroup(runGroup, dateKey) {
  const allEvents = eventDatabase[dateKey] || [];
  return allEvents
    .filter((evt) => {
      if (runGroup === "") {
        // Show events with no run_view or run_view === ''
        if (evt.run_view && evt.run_view !== "") return false;
      } else {
        // Show events matching this specific run group
        if (evt.run_view !== runGroup) return false;
      }

      // Apply other filters
      return appliedFilters.every((f) => {
        let search_key = null;
        if (f.field === "persons") {
          search_key = "title";
        } else if (f.field === "staff" || f.field === "employee") {
          search_key = "employee";
        } else if (f.field === "service") {
          search_key = "service";
        } else if (f.field === "run") {
          search_key = "run_view";
        } else {
          search_key = f.field;
        }

        const eventValue = evt[search_key];
        if (eventValue == null) return false;

        if (f.filterType === "contains") {
          return f.searchValues.some((v) =>
            String(eventValue).toLowerCase().includes(String(v).toLowerCase()),
          );
        } else if (f.filterType === "is") {
          return f.searchValues.some(
            (v) =>
              String(eventValue).trim().toLowerCase() ===
              String(v).trim().toLowerCase(),
          );
        } else if (f.filterType === "isNot") {
          return !f.searchValues.some((v) => String(eventValue) === String(v));
        } else if (f.filterType === "isEmpty") {
          return isEmptyValue(eventValue);
        } else if (f.filterType === "isNotEmpty") {
          return !isEmptyValue(eventValue);
        }

        return true;
      });
    })
    .sort((a, b) => {
      if (a.startMinutes == null) return 1;
      if (b.startMinutes == null) return -1;
      return a.startMinutes - b.startMinutes;
    });
}
async function renderRunViewRows() {
  const rowsContainer = document.getElementById("calendarRows");
  rowsContainer.innerHTML = "";

  const dateKey = getCurrentDateKey();
  const rowHeightsMap = {};

  const fillHeight = calculateFillHeight();

  let displayRunGroups = getRunFromEvents();

  displayRunGroups.forEach((runGroup) => {
    const rawEvents = getEventsForRunGroup(runGroup, dateKey);
    const events = detectOverlaps([...rawEvents]);

    const maxConcurrent = events.length
      ? Math.max(...events.map((e) => e.maxConcurrent))
      : 1;
    const dynamicHeight =
      maxConcurrent * (EVENT_HEIGHT + EVENT_GAP) + ROW_PADDING * 2;

    const finalRowHeight = Math.max(fillHeight, dynamicHeight);
    rowHeightsMap[runGroup] = finalRowHeight;

    const runRow = document.createElement("div");
    runRow.className = "employee-calendar-row";
    runRow.dataset.runGroup = runGroup;
    runRow.style.height = finalRowHeight + "px";

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    for (let h = 0; h < 24; h++) {
      const hourCol = document.createElement("div");
      hourCol.className = "hour-column";
      const innerGrid = document.createElement("div");
      innerGrid.className = "hour-column-inner";
      for (let i = 0; i < 4; i++) {
        const line = document.createElement("div");
        line.className = "quarter-line";
        innerGrid.appendChild(line);
      }
      hourCol.appendChild(innerGrid);

      for (let q = 0; q < 4; q++) {
        const slot = document.createElement("div");
        slot.className = "quarter-slot";
        slot.dataset.hour = h;
        slot.dataset.quarter = q;
        slot.dataset.runGroup = runGroup;
        slot.dataset.viewType = "run";

        slot.addEventListener("dragover", handleRunDragOver);
        slot.addEventListener("drop", handleRunDrop);
        slot.addEventListener("dragleave", handleDragLeave);

        hourCol.appendChild(slot);
      }
      grid.appendChild(hourCol);
    }

    const eventsContainer = document.createElement("div");
    eventsContainer.className = "events-container";
    eventsContainer.dataset.runGroup = runGroup;
    renderRunEventsForGroup(eventsContainer, events);

    grid.appendChild(eventsContainer);
    runRow.appendChild(grid);
    rowsContainer.appendChild(runRow);
  });

  renderRunViewColumn(rowHeightsMap);
}
function renderRunViewColumn(rowHeightsMap = {}) {
  const column = document.getElementById("employeeColumn");
  column.innerHTML = "";

  const dateKey = getCurrentDateKey();
  let displayRunGroups = getRunFromEvents();
  displayRunGroups.forEach((runGroup) => {
    const row = document.createElement("div");
    row.className = "employee-row";

    if (runGroup === "") {
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
      let emp = [];
      events.forEach((evt) => {
        if (evt.employee && !emp.includes(evt.employee)) {
          emp.push(evt.employee);
        }
        if (evt.event_status !== "Cancelled") {
          total_mins += evt.endMinutes - evt.startMinutes;
        }
      });

      const workingHours = total_mins / 60;
      let displayHours = workingHours > 0 ? workingHours.toFixed(1) : "0.0";

      row.innerHTML = `
  <div class="employee-label">
    <div class="employee-name-row">
      <span
        class="employee-name"
        title="${runGroup} ${emp.length > 0 ? `- ${emp.join(", ")}` : ""}"
      >
        ${runGroup}
      </span>
    </div>

    <div class="employee-hours-info">
      <span
        class="hours-value"
        data-tooltip="Actual Hours"
      >
        ${displayHours}
      </span>
    </div>
  </div>
`;
    }

    const height = rowHeightsMap[runGroup] || MIN_ROW_HEIGHT;
    row.style.height = height + "px";
    column.appendChild(row);
  });
}
function renderRunEventsForGroup(container, events) {
  const hourWidth = 100;

  events.forEach((evt) => {
    const startHour = Math.floor(evt.startMinutes / 60);
    const startMinute = evt.startMinutes % 60;
    const duration = evt.endMinutes - evt.startMinutes;

    const el = document.createElement("div");
    el.className = `event status-${evt.status}`;
    el.draggable = true;
    if (evt.Time_Critical_Visit === "Yes") {
      el.classList.add("time-critical");
    }
    el.dataset.eventId = evt.id;
    el.dataset.timeCritical = evt.Time_Critical_Visit || "No";
    el.dataset.female = evt.Female_Only || "No";
    const compositeKey = `${evt.zoho_id}-${evt.employee || "unassigned"}-${evt.employee_id || "none"}`;
    el.dataset.eventKey = compositeKey;
    el.dataset.viewType = "run";
    el.dataset.runGroup = evt.run_view || "";
    el.dataset.serviceUser = evt.title || "";
    el.dataset.staff = evt.employee || "—";
    el.dataset.start =
      minutesToTime(evt.startMinutes).hour.toString().padStart(2, "0") +
      ":" +
      minutesToTime(evt.startMinutes).minute.toString().padStart(2, "0");
    el.dataset.end =
      minutesToTime(evt.endMinutes).hour.toString().padStart(2, "0") +
      ":" +
      minutesToTime(evt.endMinutes).minute.toString().padStart(2, "0");

    el.dataset.mismatch = evt.status ? evt.status.replace("_", " ") : "";
    el.dataset.status = evt.event_status;
    el.dataset.travel = evt.travel || "";

    const left = startHour * hourWidth + (startMinute / 60) * hourWidth;
    const width = (duration / 60) * hourWidth;
    const top = ROW_PADDING + evt.stackLevel * (EVENT_HEIGHT + EVENT_GAP);

    el.style.left = left + "px";
    el.style.width = width + "px";
    el.style.top = top + "px";
    el.style.height = EVENT_HEIGHT + "px";

    const title = document.createElement("div");
    title.className = "event-title";
    title.textContent = evt.title;

    if (evt.no_of_staff && evt.no_of_staff > 1) {
      const staffBadge = document.createElement("div");
      staffBadge.className = "event-staff-badge";
      staffBadge.innerHTML = `<i class="fa fa-users"></i>${evt.no_of_staff}`;
      staffBadge.title = `${evt.no_of_staff} staff required`;
      el.appendChild(staffBadge);
    }
    if (evt.Time_Critical_Visit === "Yes") {
      const lockIcon = document.createElement("div");
      lockIcon.className = "event-lock-icon";
      lockIcon.innerHTML = '<i class="fa fa-lock"></i>';
      lockIcon.title = "Time Critical Visit - Time cannot be changed";
      el.appendChild(lockIcon);
    }
    if (evt.status === "Completed") {
      el.appendChild(title);
    } else {
      //   const leftHandle = document.createElement('div');
      //   leftHandle.className = 'resize-handle left';
      //   leftHandle.addEventListener('mousedown', e => {
      //       e.preventDefault();
      //       e.stopPropagation();
      //     //   startResize(e, evt, 'left');
      //   });

      //   const rightHandle = document.createElement('div');
      //   rightHandle.className = 'resize-handle right';
      //   rightHandle.addEventListener('mousedown', e => {
      //       e.preventDefault();
      //       e.stopPropagation();
      //     //   startResize(e, evt, 'right');
      //   });

      //   el.appendChild(leftHandle);
      //   el.appendChild(rightHandle);
      el.appendChild(title);

      el.addEventListener("dragstart", handleRunDragStart);
      el.addEventListener("dragend", handleRunDragEnd);

      el.addEventListener("mousedown", (e) => {
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;
        if ((e.ctrlKey || e.metaKey) && e.button === 0) {
          e.preventDefault();
          e.stopPropagation();
          toggleEventSelection(el);
        }
      });

      el.addEventListener("mouseup", (e) => {
        if (e.ctrlKey || e.metaKey) return;
        if (e.target.closest(".resize-handle")) return;
        if (e.target.closest(".event-edit")) return;

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
  const baseEventKey = baseEl.dataset.eventKey;

  if (!selectedEventIds.has(baseEventKey)) {
    clearEventSelection();
    selectedEventIds.add(baseEventKey);
    baseEl.classList.add("selected");
  }

  draggedElement = baseEl;
  draggedEventId = baseId;

  const dateKey = getCurrentDateKey();
  const events = eventDatabase[dateKey] || [];

  draggedEventData = [...selectedEventIds]
    .map((eventKey) => {
      const evt = events.find((e) => {
        const eKey = `${e.zoho_id}-${e.employee || "unassigned"}-${e.employee_id || "none"}`;
        return eKey === eventKey;
      });
      if (!evt) {
        console.error(`❌ Event not found for key: ${eventKey}`);
        console.log("Available events:", events);
        return null;
      }
      console.log("✅ Found event:", evt);
      return evt
        ? {
            ...evt,
            originalDateKey: dateKey,
            eventKey: eventKey,
          }
        : null;
    })
    .filter(Boolean);

  selectedEventIds.forEach((eventKey) => {
    const el = document.querySelector(`.event[data-event-key="${eventKey}"]`);
    if (el) {
      el.classList.add("dragging");
    }
  });

  document.body.classList.add("dragging-active");
  e.dataTransfer.effectAllowed = "move";
}

function handleRunDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document.body.classList.remove("dragging-active");
  document
    .querySelectorAll(".drop-highlight")
    .forEach((el) => el.classList.remove("drop-highlight"));

  document.querySelectorAll(".event.dragging").forEach((el) => {
    el.classList.remove("dragging");
  });

  draggedElement = null;
  draggedEventId = null;
  draggedEventData = null;
}

function handleRunDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const slot = e.currentTarget;
  if (!slot.classList.contains("drop-highlight")) {
    document
      .querySelectorAll(".drop-highlight")
      .forEach((el) => el.classList.remove("drop-highlight"));
    slot.classList.add("drop-highlight");
  }
}

function handleRunDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const slot = e.currentTarget;
  slot.classList.remove("drop-highlight");
  console.log(draggedEventData);

  if (!Array.isArray(draggedEventData) || draggedEventData.length === 0) {
    return;
  }

  const newHour = parseInt(slot.dataset.hour, 10);
  const newQuarter = parseInt(slot.dataset.quarter, 10);
  const newRunGroup = slot.dataset.runGroup;
  const currentDateKey = getCurrentDateKey();
  const hasTimeCritical = draggedEventData.some(
    (evt) => evt.Time_Critical_Visit === "Yes",
  );

  if (hasTimeCritical) {
    const anchorEvent = draggedEventData[0];
    const originalStartMinutes = anchorEvent.startMinutes;
    const newAnchorStart = newHour * 60 + newQuarter * 15;

    if (newAnchorStart !== originalStartMinutes) {
      if (
        draggedEventData.time_reason != "" &&
        draggedEventData.time_reason != null
      ) {
        showToast(
          `Time Critical Visits cannot be moved to a different time.<br><strong>Reason:</strong> ${draggedEventData.time_reason}`,
          "error",
        );
      } else {
        showToast(
          `Time Critical Visits cannot be moved to a different time.`,
          "error",
        );
      }
    }
    clearEventSelection();
    return;
  }

  const anchorEvent = draggedEventData[0];
  const anchorStart = anchorEvent.startMinutes;
  const newAnchorStart = newHour * 60 + newQuarter * 15;

  const timeChanged =
    draggedEventData.length === 1 && newAnchorStart !== anchorStart;

  if (timeChanged) {
    pendingTimeChange = {
      draggedEventData: draggedEventData,
      newHour: newHour,
      newQuarter: newQuarter,
      newRunGroup: newRunGroup,
      currentDateKey: currentDateKey,
      anchorStart: anchorStart,
      newAnchorStart: newAnchorStart,
      type: "run-drag",
    };
    showRunTimeChangeConfirmation();
  } else {
    applyRunDragChanges(
      draggedEventData,
      newHour,
      newQuarter,
      newRunGroup,
      currentDateKey,
      anchorStart,
      newAnchorStart,
    );
  }

  clearEventSelection();
}
async function applyRunDragChanges(
  draggedEventData,
  newHour,
  newQuarter,
  newRunGroup,
  currentDateKey,
  anchorStart,
  newAnchorStart,
) {
  showLoader();

  if (!eventDatabase[currentDateKey]) {
    eventDatabase[currentDateKey] = [];
  }

  const processedZohoIds = new Set();
  const currentDateDDMMYYYY = convertYYYYMMDDtoDDMMYYYY(currentDateKey);
  console.log(draggedEventData);

  for (const evt of draggedEventData) {
    if (processedZohoIds.has(evt.zoho_id)) continue;
    processedZohoIds.add(evt.zoho_id);

    const originalDateKey = evt.originalDateKey;

    const groupEvents =
      eventDatabase[originalDateKey]?.filter(
        (e) => e.zoho_id === evt.zoho_id,
      ) || [];

    eventDatabase[originalDateKey] =
      eventDatabase[originalDateKey]?.filter(
        (e) => e.zoho_id !== evt.zoho_id,
      ) || [];

    const offsetFromAnchor = evt.startMinutes - anchorStart;
    const duration =
      evt.duration_mins || evt.actualEndMinutes - evt.actualStartMinutes;

    const finalStart = newAnchorStart + offsetFromAnchor;
    const finalEnd = finalStart + duration;

    // 🔥 Multi-day calculation (same as applyDragChanges)
    let newFromDate = currentDateDDMMYYYY;
    let newToDate = currentDateDDMMYYYY;

    let newFromMinutes = finalStart;
    let newToMinutes = finalEnd;

    let startMinutes = finalStart;
    let endMinutes = finalEnd;

    if (endMinutes >= 1440) {
      newToDate = addDaysToDate(currentDateDDMMYYYY, 1);
      newToMinutes = endMinutes - 1440;
      endMinutes = 1440;
    }

    if (startMinutes < 0) {
      newFromDate = addDaysToDate(currentDateDDMMYYYY, -1);
      newFromMinutes = 1440 + startMinutes;
    }

    let zohoPayload = null;
    if (evt.zoho_id == "235935000010212880") {
      console.log(`${startMinutes} - ${endMinutes}`);
    }

    for (const e of groupEvents) {
      const updated = {
        ...e,
        startMinutes,
        endMinutes,
        actualStartMinutes: newFromMinutes,
        actualEndMinutes: newToMinutes,
        from_date: newFromDate,
        to_date: newToDate,
        isMultiDay: newFromDate !== newToDate,
        run_view: newRunGroup,
        run_view_id: newRunGroup ? runGroupDetails[newRunGroup] : null,
      };

      zohoPayload ??= updated;
      eventDatabase[currentDateKey].push(updated);
    }

    // 🔥 Zoho update once per zoho_id
    if (zohoPayload) {
      await updateRunEventZoho({
        ...zohoPayload,
        from: minutesToHHMM(zohoPayload.startMinutes),
        to: minutesToHHMM(zohoPayload.endMinutes),
        From_Date_Time: formatDateStringWithMinutes(
          zohoPayload.from_date,
          zohoPayload.actualStartMinutes,
        ),
        To_Date_Time: formatDateStringWithMinutes(
          zohoPayload.to_date,
          zohoPayload.actualEndMinutes,
        ),
      });
    }
  }

  await re_renderRunView();
  hideLoader();
}

async function updateRunEventZoho(evt) {
  console.log("Zoho Update Function called");

  const key = toYYYYMMDD(evt.date);
  if (!eventDatabase[key]) {
    eventDatabase[key] = [];
  }

  const final_emp = getEmployeeIdsForEvent(evt);
  let sts = evt.event_status.replace("_", " ");
  let duration = evt.endMinutes - evt.startMinutes;

  const fromDateTime =
    evt.From_Date_Time ||
    formatDateStringWithMinutes(evt.from_date, evt.actualStartMinutes);
  const toDateTime =
    evt.To_Date_Time ||
    formatDateStringWithMinutes(evt.to_date, evt.actualEndMinutes);

  const payload = {
    data: {
      Care_Providers: final_emp,
      Start_time: `${minutesToHHMM(evt.actualStartMinutes || evt.startMinutes)}`,
      End_time: `${minutesToHHMM(evt.actualEndMinutes || evt.endMinutes)}`,

      From_Date_Time: fromDateTime,
      To_Date_Time: toDateTime,
      Status: sts,
      Manager_notes: evt.Manager_Notes,
      Date_field1: evt.date,
    },
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
    payload: payload,
  };

  try {
    console.log(JSON.stringify(update_config));

    const res = await ZOHO.CREATOR.DATA.updateRecordById(update_config);
    console.log("Run update successful:", res);
  } catch (err) {
    console.error("Error updating run:", err);
    showToast("Failed to update run assignment", "error");
  }
}
function showRunTimeChangeConfirmation() {
  const modal = document.getElementById("timeChangeConfirmModal");

  if (pendingTimeChange.type === "run-drag") {
    const evt = pendingTimeChange.draggedEventData[0];

    const duration =
      evt.duration_mins || evt.actualEndMinutes - evt.actualStartMinutes;

    const newAnchorStart = pendingTimeChange.newAnchorStart;
    const newActualEnd = newAnchorStart + duration;

    // OLD TIME
    let oldTimeText = `${minutesToHHMM(evt.actualStartMinutes)} - ${minutesToHHMM(evt.actualEndMinutes)}`;

    // NEW TIME (default same-day)
    let newTimeText = `${minutesToHHMM(newAnchorStart % 1440)} - ${minutesToHHMM(newActualEnd % 1440)}`;

    // Date handling (same rules as drag)
    const currentDateKey = pendingTimeChange.currentDateKey;
    const currentDateDDMMYYYY = convertYYYYMMDDtoDDMMYYYY(currentDateKey);

    if (newActualEnd >= 1440) {
      const nextDate = addDaysToDate(currentDateDDMMYYYY, 1);
      newTimeText = `${minutesToHHMM(newAnchorStart % 1440)} - ${minutesToHHMM(newActualEnd - 1440)}`;
    } else if (newAnchorStart < 0) {
      const prevDate = addDaysToDate(currentDateDDMMYYYY, -1);
      newTimeText = `${minutesToHHMM(1440 + newAnchorStart)} - ${minutesToHHMM(newActualEnd)}`;
    }

    document.getElementById("confirmOldTime").textContent = oldTimeText;
    document.getElementById("confirmNewTime").textContent = newTimeText;
    document.getElementById("confirmEventTitle").textContent =
      evt.title || "Untitled";

    if (pendingTimeChange.draggedEventData.length > 1) {
      document.getElementById("confirmEventStaff").textContent =
        `${pendingTimeChange.draggedEventData.length} events`;
    } else {
      const oldRun = evt.run_view || "Unassigned";
      const newRun = pendingTimeChange.newRunGroup || "Unassigned";
      document.getElementById("confirmEventStaff").textContent =
        `${oldRun} → ${newRun}`;
    }
  }

  modal.classList.remove("hidden");
}

async function confirmTimeChange() {
  const modal = document.getElementById("timeChangeConfirmModal");
  modal.classList.add("hidden");

  showLoader();
  console.log(currentViewType, currentViewType);
  console.log(pendingTimeChange.type);

  if (pendingTimeChange.type === "resize") {
    clearTimeout(resizeDebounceTimer);
    await updateEventZoho(pendingTimeChange.event);
    currentView === "day"
      ? currentViewType === "employee"
        ? renderDayView()
        : renderRunView()
      : renderWeekView();
  } else if (pendingTimeChange.type === "drag") {
    const {
      draggedEventData,
      newHour,
      newQuarter,
      newEmployee,
      currentDateKey,
      anchorStart,
      newAnchorStart,
    } = pendingTimeChange;

    await applyDragChanges(
      draggedEventData,
      newHour,
      newQuarter,
      newEmployee,
      currentDateKey,
      anchorStart,
      newAnchorStart,
    );
  } else if (pendingTimeChange.type === "run-drag") {
    const {
      draggedEventData,
      newHour,
      newQuarter,
      newRunGroup,
      currentDateKey,
      anchorStart,
      newAnchorStart,
    } = pendingTimeChange;

    await applyRunDragChanges(
      draggedEventData,
      newHour,
      newQuarter,
      newRunGroup,
      currentDateKey,
      anchorStart,
      newAnchorStart,
    );
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
async function re_renderRunView() {
  showLoader();
  renderHourHeaders();
  const query = document.getElementById("employeeSearchInput").value ?? "";
  const q = query.trim().toLowerCase();
  if (q !== "") {
    if (currentViewType === "employee") {
      const visibleEmployees = employees.filter((e) =>
        e.toLowerCase().includes(q),
      );
      visibleEmployees.unshift("");
      renderFilteredEmployeeRows(visibleEmployees);
    } else if (currentViewType === "run") {
      const visibleRuns = runGroups.filter((r) => r.toLowerCase().includes(q));
      visibleRuns.unshift("");
      renderFilteredRunRows(visibleRuns);
    }
  } else {
    await renderRunViewRows();
  }
  syncScroll();
  hideLoader();
}
let site_run_details = {};
async function getRunGroups() {
  site_run_details = {};
  runGroups = [];
  runGroups.push(""); // Empty group first

  const serviceList = `[${services.join(",")}]`;

  try {
    const run_config = {
      app_name: app_name,
      report_name: "Care_Groups_Report",
      criteria: `Site_Name.ID == ${serviceList} && Status == "Active"`,
    };

    const run_resp = await ZOHO.CREATOR.DATA.getRecords(run_config);

    if (run_resp.code === 3000 && Array.isArray(run_resp.data)) {
      run_resp.data.forEach((rec) => {
        const site = rec.Site_Name?.zc_display_value?.trim();
        const careGroup = rec.Care_Group_Name?.trim();

        if (!site || !careGroup) return;

        if (!site_run_details[site]) {
          site_run_details[site] = [];
        }
        if (
          rec?.Care_Group_Name != null &&
          rec?.Care_Group?.Care_Group_Name != "undefined"
        ) {
          runRowDetails[rec?.Care_Group_Name] = rec?.ID;
        }
        site_run_details[site].push(careGroup);
        const runName = rec.Care_Group_Name; // Adjust field name
        const runId = rec.ID;

        if (!runGroups.includes(runName)) {
          runGroups.push(runName);
          runGroupDetails[runName] = runId;
        }
      });
    }

    runGroups.sort();
    console.log(JSON.stringify(site_run_details));
  } catch (err) {
    console.error("Error fetching run groups:", err);
  }
}

/**
 * Fetch and display travel details for an event
 */
async function loadTravelDetails(evt) {
  const loadingEl = document.getElementById("travelLoading");
  const noDataEl = document.getElementById("travelNoData");
  const contentEl = document.getElementById("travelContent");
  const beforeSection = document.getElementById("beforeTravelSection");
  const afterSection = document.getElementById("afterTravelSection");

  // Show loading state
  loadingEl.style.display = "block";
  noDataEl.style.display = "none";
  contentEl.style.display = "none";

  try {
    // Call your custom API
    const config = {
      http_method: "POST",
      api_name: "Distance_Duration",
      public_key: "ahg0WmdMKZpOW8SMYFUOrsFv5",
      payload: {
        id: evt.zoho_id,
        app_name: app_name,
      },
    };

    const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);
    console.log(response);

    // Hide loading
    loadingEl.style.display = "none";

    if (!response || Object.keys(response).length === 0) {
      noDataEl.style.display = "block";
      return;
    }

    // Get travel data (assuming first key is the record ID)
    const recordId = Object.keys(response)[0];
    const empId = String(evt.employee_id);
    const travelMap = response.result;

    const travelData = travelMap?.[empId];

    if (!travelData) {
      noDataEl.style.display = "block";
      return;
    }

    // Show content
    contentEl.style.display = "block";
    console.log(travelData);

    // Populate "Before" travel section
    const hasBefore = Boolean(travelData?.BName) && travelData.BName !== "N/A";
    console.log(hasBefore);
    console.log(evt.employee_id);

    if (travelData.BName) {
      beforeSection.style.display = "block";
      document.getElementById("travelBeforeName").textContent =
        travelData.BName || "—";
      document.getElementById("travelBeforeDist").textContent =
        travelData.BDist || "—";
      document.getElementById("travelBeforeDur").textContent =
        travelData.BDur || "—";
      document.getElementById("travelAvail").textContent =
        travelData.Avail || "—";
    } else {
      beforeSection.style.display = "none";
    }

    // Populate "After" travel section
    const hasAfter = travelData.AName && travelData.AName !== "N/A";
    if (travelData.AName) {
      afterSection.style.display = "block";
      document.getElementById("travelAfterName").textContent =
        travelData.AName || "—";
      document.getElementById("travelAfterDist").textContent =
        travelData.ADist || "—";
      document.getElementById("travelAfterDur").textContent =
        travelData.ADur || "—";
    } else {
      afterSection.style.display = "none";
    }

    // If neither section has data, show no data message
    if (!hasBefore && !hasAfter) {
      contentEl.style.display = "none";
      noDataEl.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading travel details:", error);
    loadingEl.style.display = "none";
    noDataEl.style.display = "block";
  }
}
function toggleInfoDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("infoDropdown");
  const wasActive = dropdown.classList.contains("active");

  // Close all other dropdowns
  document.querySelectorAll(".info-dropdown.active").forEach((d) => {
    if (d !== dropdown) d.classList.remove("active");
  });

  dropdown.classList.toggle("active");

  // Calculate and update stats when opening
  if (!wasActive) {
    updateInfoStats();
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".info-btn-wrapper")) {
    document.getElementById("infoDropdown")?.classList.remove("active");
  }
});

function updateInfoStats() {
  if (currentView === "day") {
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
  events.forEach((evt) => {
    if (evt.event_status === "Cancelled") return;
    totalRequiredMinutes += evt.endMinutes - evt.startMinutes;
  });
  const requiredHours = (totalRequiredMinutes / 60).toFixed(1);
  let totalCarerMinutes = 0;
  employees.forEach((employee) => {
    const shift = shiftsMap[employee];
    if (shift) {
      shift.forEach((s) => {
        totalCarerMinutes += s.endMinutes - s.startMinutes;
      });
    }
  });

  const carersHours = (totalCarerMinutes / 60).toFixed(1);
  // Update UI
  const spareCapacityEl = document.getElementById("spareCapcity");
  const spare = carersHours - requiredHours;
  document.getElementById("statRequiredHours").textContent =
    `${requiredHours}h`;
  document.getElementById("statCarersWorking").textContent =
    employees.length - 1;
  document.getElementById("statCarersHours").textContent = `${carersHours}h`;
  document.getElementById("spareCapcity").textContent =
    `${(carersHours - requiredHours).toFixed(1)}h`;
  spareCapacityEl.classList.toggle("negative", spare < 0);
}

function updateWeekStats() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

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
    events.forEach((evt) => {
      if (evt.event_status === "Cancelled") return;
      totalRequiredMinutes += evt.endMinutes - evt.startMinutes;
    });

    // Track unique carers
    events.forEach((evt) => {
      if (evt.employee && evt.employee !== "") {
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
  employees.forEach((employee) => {
    const shift = shiftsMap[employee];
    if (shift) {
      // Multiply by number of days they worked
      const daysWorked = Array.from(carerDaysWorked.keys()).filter((key) =>
        key.startsWith(employee + "-"),
      ).length;
      totalCarerMinutes += (shift.endMinutes - shift.startMinutes) * daysWorked;
    }
  });

  employees.forEach((employee) => {
    const shift = shiftsMap[employee];
    if (shift) {
      shift.forEach((s) => {
        totalCarerMinutes += s.endMinutes - s.startMinutes;
      });
    }
  });

  const carersHours = (totalCarerMinutes / 60).toFixed(1) * 6;
  const spareCapacityEl = document.getElementById("spareCapcity");
  const spare = carersHours - requiredHours;

  // Update UI
  document.getElementById("statRequiredHours").textContent =
    `${requiredHours}h`;
  document.getElementById("statCarersWorking").textContent =
    employees.length - 1;
  document.getElementById("statCarersHours").textContent = `${carersHours}h`;
  document.getElementById("spareCapcity").textContent =
    `${(carersHours - requiredHours).toFixed(1)}h`;
  spareCapacityEl.classList.toggle("negative", spare < 0);
}

// Helper function to format hours with decimal
function formatHoursDecimal(minutes) {
  return (minutes / 60).toFixed(1);
}

function updateViewSwitcherOptions() {
  console.log(updateViewSwitcherOptions);

  const dropdown = document.getElementById("viewSwitcherDropdown");
  dropdown.innerHTML = "";
  console.log(currentView);

  if (currentView === "day") {
    // Day view options: Employee and Run View
    const employeeOption = document.createElement("div");
    employeeOption.className =
      "view-switcher-option" +
      (currentViewType === "employee" ? " selected" : "");
    employeeOption.innerHTML = `
            <span>Staff</span>
            ${currentViewType === "employee" ? '<i class="fa fa-check"></i>' : ""}
        `;
    employeeOption.onclick = () => selectViewType("employee");

    const runOption = document.createElement("div");
    runOption.className =
      "view-switcher-option" + (currentViewType === "run" ? " selected" : "");
    runOption.innerHTML = `
            <span>Run</span>
            ${currentViewType === "run" ? '<i class="fa fa-check"></i>' : ""}
        `;
    runOption.onclick = () => selectViewType("run");

    dropdown.appendChild(employeeOption);
    dropdown.appendChild(runOption);
  } else {
    // Week view options: Employee and Person
    const employeeOption = document.createElement("div");

    const staffOption = document.createElement("div");
    staffOption.className =
      "view-switcher-option" + (currentViewType === "staff" ? " selected" : "");
    staffOption.innerHTML = `
            <span>Staff</span>
            ${currentViewType === "staff" ? '<i class="fa fa-check"></i>' : ""}
        `;
    staffOption.onclick = () => selectViewType("staff");

    employeeOption.className =
      "view-switcher-option" +
      (currentViewType === "employee" ? " selected" : "");
    employeeOption.innerHTML = `
            <span>Visit</span>
            ${currentViewType === "employee" ? '<i class="fa fa-check"></i>' : ""}
        `;
    employeeOption.onclick = () => selectViewType("employee");

    const personOption = document.createElement("div");
    personOption.className =
      "view-switcher-option" +
      (currentViewType === "person" ? " selected" : "");
    personOption.innerHTML = `
            <span>Person</span>
            ${currentViewType === "person" ? '<i class="fa fa-check"></i>' : ""}
        `;
    personOption.onclick = () => selectViewType("person");

    const runOption = document.createElement("div");
    runOption.className =
      "view-switcher-option" + (currentViewType === "run" ? " selected" : "");
    runOption.innerHTML = `
            <span>Run</span>
            ${currentViewType === "run" ? '<i class="fa fa-check"></i>' : ""}
        `;
    runOption.onclick = () => selectViewType("run");

    dropdown.appendChild(staffOption);
    dropdown.appendChild(runOption);
    dropdown.appendChild(employeeOption);
    dropdown.appendChild(personOption);
  }
}
function getEventsForStaffRun(staffName, dateKey) {
  const allEvents = staffRunEventDatabase[dateKey] || [];

  const runFilter = appliedFilters.find((f) => f.field === "run");

  return allEvents.filter((evt) => {
    // staff match
    if (normalize(evt.staff) !== normalize(staffName)) return false;

    // no run filter
    if (!runFilter) return true;

    const eventRun = normalize(evt.run_name);

    return runFilter.searchValues.some((v) => eventRun === normalize(v));
  });
}

function normalize(val) {
  return String(val).trim().replace(/\s+/g, " ").toLowerCase();
}

function getEventsForWeekRun(runName, dateKey) {
  const allEvents = runEventDatabase[dateKey] || [];

  return allEvents.filter((evt) => {
    // ✅ No filters → STRICT run match only
    if (appliedFilters.length === 0) {
      return evt.run_name === runName;
    }

    // With filters, still require run match
    if (evt.run_name !== runName) return false;

    return appliedFilters.every((f) => {
      let search_key;

      if (f.field === "persons") {
        search_key = "title";
      } else if (f.field === "staff" || f.field === "employee") {
        search_key = "staff";
      } else if (f.field === "service") {
        search_key = "service";
      } else if (f.field === "run") {
        search_key = "run_name";
      } else {
        search_key = f.field;
      }

      const eventValue = evt[search_key];
      if (eventValue == null) return false;

      if (f.filterType === "contains") {
        return f.searchValues.some((v) =>
          String(eventValue).toLowerCase().includes(String(v).toLowerCase()),
        );
      }

      if (f.filterType === "is") {
        return f.searchValues.some(
          (v) =>
            String(eventValue).trim().toLowerCase() ===
            String(v).trim().toLowerCase(),
        );
      }

      if (f.filterType === "isNot") {
        return !f.searchValues.some((v) => String(eventValue) === String(v));
      }

      if (f.filterType === "isEmpty") {
        return isEmptyValue(eventValue);
      }

      if (f.filterType === "isNotEmpty") {
        return !isEmptyValue(eventValue);
      }

      return true;
    });
  });
}

function getEventsForPerson(personName, dateKey) {
  const allEvents = eventDatabase[dateKey] || [];

  return allEvents
    .filter((evt) => {
      if (evt.title !== personName) return false;

      return appliedFilters.every((f) => {
        let search_key = null;
        if (f.field === "persons") {
          search_key = "title";
        } else if (f.field === "staff" || f.field === "employee") {
          search_key = "employee";
        } else if (f.field === "service") {
          search_key = "service";
        } else if (f.field === "run") {
          search_key = "run_view";
        } else {
          search_key = f.field;
        }

        const eventValue = evt[search_key];
        if (eventValue == null) return false;

        if (f.filterType === "contains") {
          return f.searchValues.some((v) =>
            String(eventValue).toLowerCase().includes(String(v).toLowerCase()),
          );
        } else if (f.filterType === "is") {
          return f.searchValues.some(
            (v) =>
              String(eventValue).trim().toLowerCase() ===
              String(v).trim().toLowerCase(),
          );
        } else if (f.filterType === "isNot") {
          return !f.searchValues.some((v) => String(eventValue) === String(v));
        } else if (f.filterType === "isEmpty") {
          return isEmptyValue(eventValue);
        } else if (f.filterType === "isNotEmpty") {
          return !isEmptyValue(eventValue);
        }

        return true;
      });
    })
    .sort((a, b) => {
      if (a.startMinutes == null) return 1;
      if (b.startMinutes == null) return -1;
      return a.startMinutes - b.startMinutes;
    });
}
let runEventDatabase = {};
let runRows = [];
let runRowDetails = {};
let staffRunEventDatabase = {};
let runStaffList = [];
async function getWeekStaffRunDetails() {
  console.log(runRowDetails);

  runRows = [];
  staffRunEventDatabase = {};
  runStaffList = [];

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  let zoho_start_date = formatDateDDMMYYYY(weekStart);
  let zoho_end_date = formatDateDDMMYYYY(weekEnd);

  const serviceList = `[${services.join(",")}]`;
  const criteria_2 = `Site_Name.ID == ${serviceList} && Date_From >= '${zoho_start_date}' && Date_From <= '${zoho_end_date}'`;

  const booking = {
    app_name: app_name,
    report_name: "Daily_schedule_for_Staff",
    criteria: criteria_2,
    max_records: 1000,
  };

  let booking_resp;

  try {
    booking_resp = await ZOHO.CREATOR.DATA.getRecords(booking);
  } catch (err) {
    console.error("Zoho API error:", err);
    return;
  }

  // ✅ Handle no records safely
  if (
    !booking_resp ||
    !Array.isArray(booking_resp.data) ||
    booking_resp.data.length === 0
  ) {
    console.warn("No staff run records found for the selected week.");
    return;
  }

  booking_resp.data.forEach((rec) => {
    let data = {};

    const isActualRun =
      rec?.Care_Group &&
      Object.keys(rec.Care_Group).length > 0 &&
      rec.Care_Group.Care_Group_Name;

    const run_name = rec?.Care_Group?.Care_Group_Name
      ? rec.Care_Group.Care_Group_Name
      : rec?.Available_Status === "Off"
        ? rec?.leave_Type
        : rec?.Available_Status;

    data.off = rec?.Available_Status === "Off" ? "true" : "false";
    data.zoho_id = rec.ID;
    data.run_name = run_name;
    data.service = rec?.Site_Name?.zc_display_value;
    data.leave_Type = rec?.leave_Type;
    data.reason_for_leave = rec?.Reason_for_Leave;
    data.endMinutes = getMinutes(rec?.To_Time_Line);
    data.startMinutes = getMinutes(rec?.From_Time_Line);
    data.staff = rec.Staff?.zc_display_value;
    data.start_time = rec?.Start_Time;
    data.end_time = rec?.End_Time;
    data.from_date = rec.Date_From;
    data.to_date = rec.Date_To;
    data.break = rec.Break;

    const staffName = data.staff;

    if (staffName && !runStaffList.includes(staffName)) {
      runStaffList.push(staffName);
    }

    if (
      !runRows.includes(run_name) &&
      run_name !== "Available" &&
      rec?.Available_Status !== "Off"
    ) {
      runRows.push(run_name);
    }

    if (rec?.Care_Group?.Care_Group_Name) {
      runRowDetails[rec.Care_Group.Care_Group_Name] = rec.Care_Group.ID;
    }

    const key = toYYYYMMDD(rec.Date_From);
    if (!staffRunEventDatabase[key]) {
      staffRunEventDatabase[key] = [];
    }

    const existingForStaff = staffRunEventDatabase[key].filter(
      (e) => e.staff === staffName,
    );

    // Skip Available/Off if actual run exists
    if (!isActualRun) {
      const hasActualRunAlready = existingForStaff.some(
        (e) => e.run_name !== "Available" && e.run_name !== "Off",
      );
      if (hasActualRunAlready) return;
    }

    // Remove Available/Off if real run exists
    if (isActualRun && existingForStaff.length > 0) {
      staffRunEventDatabase[key] = staffRunEventDatabase[key].filter(
        (e) =>
          !(
            e.staff === staffName &&
            (e.run_name === "Available" || e.run_name === "Off")
          ),
      );
    }

    staffRunEventDatabase[key].push(data);
  });

  runStaffList.sort();
  console.log(runRowDetails);
}
let run_service_details = {};
let runCounts = {};
async function getWeekPublishDetails() {
  runCounts = {};
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  let zoho_start_date = formatDateDDMMYYYY(weekStart);
  let zoho_end_date = formatDateDDMMYYYY(weekEnd);
  const serviceList = `[${services.join(",")}]`;
  const criteria_2 = `Service.ID == ${serviceList} && Date_field >= '${zoho_start_date}' && Date_field <= '${zoho_end_date}'`;
  var booking = {
    app_name: app_name,
    report_name: "All_Publish_Shifts",
    criteria: criteria_2,
    max_records: 1000,
  };
  try {
    booking_resp = await ZOHO.CREATOR.DATA.getRecords(booking);
    console.log(booking_resp);
    booking_resp.data.forEach(function (rec) {
      const date = rec.Date_field;
      const run = rec.Run?.zc_display_value || "Unknown";
      const count = rec.Employees?.length || 0;
      const key = toYYYYMMDD(rec.Date_field);
      if (!runCounts[key]) {
        runCounts[key] = {};
      }

      if (!runCounts[key][run]) {
        runCounts[key][run] = 0;
      }

      runCounts[key][run] += count;
    });
    console.log(runCounts);
  } catch (err) {
    console.log(err);
  }
}
async function getWeekRunDetails() {
  run_service_details = {};
  runRows = [];
  runEventDatabase = {};
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  let zoho_start_date = formatDateDDMMYYYY(weekStart);
  let zoho_end_date = formatDateDDMMYYYY(weekEnd);
  const serviceList = `[${services.join(",")}]`;
  const criteria_2 = `Site_Name.ID == ${serviceList} && Date_From >= '${zoho_start_date}' && Date_From <= '${zoho_end_date}' && Care_Group != null `;
  var booking = {
    app_name: app_name,
    report_name: "Daily_schedule_for_Staff",
    criteria: criteria_2,
    max_records: 1000,
  };
  booking_resp = await ZOHO.CREATOR.DATA.getRecords(booking);
  booking_resp.data.forEach(function (rec) {
    let runRunBooking = [];
    let data = {};
    let run_name = rec?.Care_Group?.Care_Group_Name;
    data.run_name = rec?.Care_Group?.Care_Group_Name;
    data.staff = rec.Staff?.zc_display_value;
    data.start_time = rec?.Start_Time;
    data.end_time = rec?.End_Time;
    data.off = rec?.Available_Status === "Off" ? "true" : "false";
    data.zoho_id = rec.ID;
    data.from_date = rec.Date_From;
    data.to_date = rec.Date_To;
    data.leave_Type = rec?.leave_Type;
    data.reason_for_leave = rec?.Reason_for_Leave;
    data.break = rec.Break;
    data.endMinutes = getMinutes(rec?.To_Time_Line);
    data.startMinutes = getMinutes(rec?.From_Time_Line);
    data.service = rec?.Site_Name?.zc_display_value;
    if (!runRows.includes(run_name)) {
      runRows.push(run_name);
    }
    runRunBooking.push(data);
    run_service_details[run_name] = rec?.Site_Name?.zc_display_value;
    const key = toYYYYMMDD(rec.Date_From);
    if (!runEventDatabase[key]) {
      runEventDatabase[key] = [];
    }
    runEventDatabase[key].push(...runRunBooking);
  });
}

async function renderWeekRunView() {
  await getWeekPublishDetails();
  await getWeekRunDetails();
  renderWeekDaysHeaderPerson();
  renderWeekRunRows();
  syncWeekScroll();
}

async function re_renderWeekRunView() {
  renderWeekDaysHeaderPerson();
  renderWeekRunRows();
  syncWeekScroll();
}

async function renderWeekStaffView() {
  console.log("Next1");

  await getWeekStaffRunDetails();
  console.log("Next");

  renderWeekDaysHeaderPerson();
  renderWeekStaffRunRows();
  syncWeekScroll();
}
async function re_renderWeekStaffView() {
  renderWeekDaysHeaderPerson();
  renderWeekStaffRunRows();
  syncWeekScroll();
}

async function renderWeekPersonView() {
  renderWeekDaysHeaderPerson();
  renderWeekPersonRows();
  syncWeekScroll();
}

// New function: Render week days header for person view
function renderWeekDaysHeaderPerson() {
  const header = document.getElementById("weekDaysHeader");
  header.innerHTML = "";

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);

    const dayHeader = document.createElement("div");
    dayHeader.className = "week-day-header";

    if (dayDate.toDateString() === todayDate.toDateString()) {
      dayHeader.classList.add("today");
    }

    const dName = dayNames[i].toUpperCase();
    const dNum = dayDate.getDate();
    const mName = monthNames[dayDate.getMonth()].toUpperCase();

    dayHeader.innerHTML = `
            <div class="week-day-name">${dName}, ${dNum} ${mName}</div>
        `;
    header.appendChild(dayHeader);
    document.getElementById("weekDaysSummary").innerHTML = "";
    if (currentViewType === "person") {
      document.querySelector(".week-employee-header").textContent = "Persons";
    } else if (currentViewType === "run") {
      document.querySelector(".week-employee-header").textContent = "Runs";
    } else if (currentViewType === "staff") {
      document.querySelector(".week-employee-header").textContent = "Staff";
    }
  }
}
function renderWeekStaffRunRows() {
  const rowsContainer = document.getElementById("weekCalendarRows");
  rowsContainer.innerHTML = "";

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const rowHeightsMap = {};

  if (appliedFilters.length > 0) {
    employeeValues = getEmployeesFromEventsWeek();
  } else {
    employeeValues = [...runStaffList];
  }
  const fillHeight = calculateFillHeightCount(employeeValues.length);
  // if( appliedFilters.length > 0 ){
  //     employeeValues = getEmployeesFromEvents();
  // }
  // else{
  //      employeeValues = [...employees];
  // }
  // employeeValues = employeeValues.filter(v => v !== '');
  employeeValues.forEach((person) => {
    let maxEventsInDay = 1;

    if (person !== "—") {
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + day);
        const events = getEventsForStaffRun(person, getDateKey(dayDate));
        if (events.length > 0)
          maxEventsInDay = Math.max(maxEventsInDay, events.length);
      }
    }

    const eventNeededHeight =
      maxEventsInDay * (run_event_height + EVENT_GAP) + ROW_PADDING * 2;
    const finalRowHeight = Math.max(fillHeight, eventNeededHeight);
    rowHeightsMap[person] = finalRowHeight;

    const personRow = document.createElement("div");
    personRow.className = "week-employee-calendar-row";
    personRow.style.height = finalRowHeight + "px";

    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const dateKey = getDateKey(dayDate);

      const dayColumn = document.createElement("div");
      dayColumn.className = "week-day-column";
      dayColumn.style.flex = "1 1 0";

      // No drag and drop for person view
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "week-events-container";
      const events =
        person === "—" ? [] : getEventsForStaffRun(person, dateKey);
      renderWeekStaffRunEvents(eventsContainer, events, dateKey);
      const date1 = new Date(dateKey);
      const date2 = new Date();
      date1.setHours(0, 0, 0, 0);
      date2.setHours(0, 0, 0, 0);

      dayColumn.appendChild(eventsContainer);
      if (date1 >= date2) {
        dayColumn.addEventListener("click", function (e) {
          console.log("Day column clicked!", e.target);

          // Check if we clicked on an event box
          const eventBox = e.target.closest(".week-event-box");

          if (eventBox) {
            console.log("Clicked on event, ignoring column click");
            return; // Let the event's own handler deal with it
          }

          // We clicked on empty space
          console.log("Empty space clicked!");
          const staffName = dayColumn.dataset.staffName;
          handleEmptySpaceClick(person, dateKey, e);
        });
      }
      personRow.appendChild(dayColumn);
    }
    rowsContainer.appendChild(personRow);
  });

  renderWeekStaffRunColumn(rowHeightsMap);
}

function renderWeekRunRows() {
  const rowsContainer = document.getElementById("weekCalendarRows");
  rowsContainer.innerHTML = "";

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const rowHeightsMap = {};

  if (appliedFilters.length > 0) {
    displayRuns = getRunsFromEventsWeek();
  } else {
    displayRuns = runRows.length > 0 ? [...new Set(runRows)] : ["—"];
  }
  const fillHeight = calculateFillHeightCount(displayRuns.length);
  displayRuns.forEach((person) => {
    let maxEventsInDay = 1;

    if (person !== "—") {
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + day);
        const events = getEventsForWeekRun(person, getDateKey(dayDate));
        if (events.length > 0)
          maxEventsInDay = Math.max(maxEventsInDay, events.length);
      }
    }

    const BADGE_HEIGHT = 28;
    const eventNeededHeight =
      maxEventsInDay * (run_event_height + EVENT_GAP) +
      ROW_PADDING * 2 +
      BADGE_HEIGHT;
    console.log(
      `Event Needed Height ${eventNeededHeight} and Fill Height ${fillHeight}`,
    );

    const finalRowHeight = Math.max(fillHeight, eventNeededHeight);
    rowHeightsMap[person] = finalRowHeight;

    const personRow = document.createElement("div");
    personRow.className = "week-employee-calendar-row";
    personRow.style.height = finalRowHeight + "px";

    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const dateKey = getDateKey(dayDate);

      const dayColumn = document.createElement("div");
      dayColumn.className = "week-day-column";
      dayColumn.style.flex = "1 1 0";
      dayColumn.style.position = "relative";

      const date1 = new Date(dateKey);
      const date2 = new Date();
      date1.setHours(0, 0, 0, 0);
      date2.setHours(0, 0, 0, 0);
      const events = person === "—" ? [] : getEventsForWeekRun(person, dateKey);
      // console.log("Date Key " + dateKey);

      // ── Three-dot button (top-right of cell) ──────────────────────────
      const dotsBtn = document.createElement("button");
      dotsBtn.className = "run-cell-dots-btn";
      dotsBtn.innerHTML = "&#8942;";
      dotsBtn.title = "Options";
      dotsBtn.addEventListener("click", function (e) {
        e.stopPropagation();

        // Toggle — if menu already open in this cell, close it
        const existingMenu = dayColumn.querySelector(".run-dots-menu");
        if (existingMenu) {
          existingMenu.remove();
          return;
        }

        // Close any other open menus
        closeAllRunMenus();

        // Conditional options — wrap each push with an if() as needed
        const options = [];
        options.push({ label: "Assign Staff", action: "create" });
        options.push({ label: "Publish shift", action: "publish" });

        const menu = document.createElement("div");
        menu.className = "run-dots-menu";

        options.forEach((opt) => {
          const item = document.createElement("div");
          item.className = "run-dots-menu-item";
          item.textContent = opt.label;
          item.addEventListener("click", (ev) => {
            ev.stopPropagation();
            closeAllRunMenus();
            if (opt.action === "create") {
              handleEmptySpaceClick(person, dateKey, ev);
            } else if (opt.action === "publish") {
              publishShift(person, dateKey);
            }
          });
          menu.appendChild(item);
        });

        dayColumn.appendChild(menu);
      });
      // ─────────────────────────────────────────────────────────────────

      // Events container
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "week-events-container";

      renderWeekEventsForRun(eventsContainer, events, dateKey);

      // Append events first, then dots button and badge on top
      dayColumn.appendChild(eventsContainer);
      // console.log(`${dateKey} - ${person} -> ${JSON.stringify(runCounts)} `);

      if (runCounts?.[dateKey] && person in runCounts[dateKey]) {
        const badge = document.createElement("div");

        badge.className = "run-cell-count-badge";

        badge.textContent = runCounts[dateKey][person] ?? 0;

        dayColumn.appendChild(badge);
      }
      // ─────────────────────────────────────────────────────────────────

      // Only show dots button and click handler for today or future dates
      if (date1 >= date2) {
        dayColumn.appendChild(dotsBtn);
        dayColumn.addEventListener("click", function (e) {
          console.log("Day column clicked!", e.target);
          const eventBox = e.target.closest(".week-event-box");
          if (eventBox) {
            console.log("Clicked on event, ignoring column click");
            return;
          }
          console.log("Empty space clicked!");
          // handleEmptySpaceClick(person, dateKey, e);
        });
      }

      personRow.appendChild(dayColumn);
    }

    rowsContainer.appendChild(personRow);
  });

  renderWeekRunColumn(rowHeightsMap);
}
// New function: Render person rows
function renderWeekPersonRows() {
  const rowsContainer = document.getElementById("weekCalendarRows");
  rowsContainer.innerHTML = "";

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  const rowHeightsMap = {};
  const fillHeight = calculateFillHeight();

  // Get unique persons
  if (appliedFilters.length > 0) {
    personValues = getPersonFromEventsWeek();
  } else {
    personValues = persons.length > 0 ? [...new Set(persons)] : ["—"];
  }
  console.log(personValues);

  const sorted_person = personValues.sort();
  console.log(sorted_person);

  sorted_person.forEach((person) => {
    let maxEventsInDay = 1;

    if (person !== "—") {
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + day);
        const events = getEventsForPerson(person, getDateKey(dayDate));
        if (events.length > 0)
          maxEventsInDay = Math.max(maxEventsInDay, events.length);
      }
    }

    const eventNeededHeight =
      maxEventsInDay * (EVENT_HEIGHT + EVENT_GAP) + ROW_PADDING * 2;
    const finalRowHeight = Math.max(fillHeight, eventNeededHeight);
    rowHeightsMap[person] = finalRowHeight;

    const personRow = document.createElement("div");
    personRow.className = "week-employee-calendar-row";
    personRow.style.height = finalRowHeight + "px";

    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const dateKey = getDateKey(dayDate);

      const dayColumn = document.createElement("div");
      dayColumn.className = "week-day-column";
      dayColumn.style.flex = "1 1 0";

      // No drag and drop for person view
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "week-events-container";
      const events = person === "—" ? [] : getEventsForPerson(person, dateKey);
      renderWeekEventsForPerson(eventsContainer, events, dateKey);

      dayColumn.appendChild(eventsContainer);
      personRow.appendChild(dayColumn);
    }
    rowsContainer.appendChild(personRow);
  });

  renderWeekPersonColumn(rowHeightsMap);
}

function renderWeekStaffRunColumn(rowHeightsMap = {}) {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const column = document.getElementById("weekEmployeeColumn");
  column.innerHTML = "";
  if (appliedFilters.length > 0) {
    employeeValues = getEmployeesFromEventsWeek();
  } else {
    employeeValues = [...runStaffList];
  }

  employeeValues.forEach((person) => {
    const row = document.createElement("div");
    row.className = "week-employee-row";

    let total_mins = 0;
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const events = getEventsForStaffRun(person, getDateKey(dayDate));
      if (person === "Ololade Ogunpola") {
        console.log(
          "Events for Ololade Ogunpola on " + getDateKey(dayDate) + ":",
          JSON.stringify(events),
        );
      }
      events.forEach((evt) => {
        if (evt.off === "false" && evt.event_status !== "Cancelled") {
          let duration = evt.endMinutes - evt.startMinutes;

          if (duration < 0) {
            duration += 24 * 60;
          }

          total_mins += duration;
        }
      });
    }
    // const t_count = total_mins / 60;
    const workingHours = total_mins / 60;
    let displayHours = workingHours > 0 ? workingHours.toFixed(1) : "0.0";

    // Get contracted hours from shift data

    const emp_data = employeeDetails.filter((e) => e.name === person);
    const con_hours =
      emp_data?.[0]?.week_hours === ""
        ? "0.0"
        : emp_data?.[0]?.week_hours || "0.0";

    if (person !== "—") {
      const empId = getEmpIdByName(person);
      const url =
        `https://${portal_url}/#Report:Manual_Rostering?&zc_LoadIn=dialog&Care_Providers.ID=` +
        empId;
      row.innerHTML = `
                <div class="employee-label">
                 <div class="employee-name-row">
                    <a href="${url}" 
               target="_blank"  class="employee-name">${person}</a>
                   </div>
                   <div class="employee-hours-left">
                <span class="hours-value" data-tooltip="Contracted Hours">${con_hours}</span>
                <span class="hours-separator">|</span>
                <span class="hours-value" data-tooltip="Actual Hours">${displayHours}</span>
            </div> 
                </div>
            `;
    }

    const height = rowHeightsMap[person] || MIN_ROW_HEIGHT;
    row.style.height = height + "px";
    column.appendChild(row);
  });
}
// New function: Render person column
function renderWeekPersonColumn(rowHeightsMap = {}) {
  const column = document.getElementById("weekEmployeeColumn");
  column.innerHTML = "";

  if (appliedFilters.length > 0) {
    personValues = getPersonFromEventsWeek();
  } else {
    personValues = persons.length > 0 ? [...new Set(persons)] : ["—"];
  }
  const sorted_person = personValues.sort();
  sorted_person.forEach((person) => {
    const row = document.createElement("div");
    row.className = "week-employee-row";
    const displayHours = getTotalWeekHoursPerson(person);
    if (person !== "—") {
      row.innerHTML = `
                <div class="employee-label">
                    <div class="employee-name">${person}</div>
                    <div class="week-employee-hours-row">
                        <div class="week-employee-hours-info">
                            <span class="week-employee-hours-value" data-tooltip="Total hours" >${displayHours}h</span>
                        </div>
                        <div class="week-employee-pdf-icon" onclick="openPersonWeekPDF('${person}')" title="Download Week Schedule">
                            <i class="fa fa-file-pdf"></i>
                        </div>
                    </div>
                </div>
            `;
    }

    const height = rowHeightsMap[person] || MIN_ROW_HEIGHT;
    row.style.height = height + "px";
    column.appendChild(row);
  });
}

function renderWeekRunColumn(rowHeightsMap = {}) {
  const column = document.getElementById("weekEmployeeColumn");
  column.innerHTML = "";

  if (appliedFilters.length > 0) {
    displayRuns = getRunsFromEventsWeek();
  } else {
    displayRuns = runRows.length > 0 ? [...new Set(runRows)] : ["—"];
  }
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  displayRuns.forEach((person) => {
    const row = document.createElement("div");
    row.className = "week-employee-row";
    let total_mins = 0;
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + day);
      const events = getEventsForWeekRun(person, getDateKey(dayDate));
      events.forEach((evt) => {
        total_mins += evt.endMinutes - evt.startMinutes;
      });
    }
    // const t_count = total_mins / 60;
    const workingHours = total_mins / 60;
    let displayHours = workingHours > 0 ? workingHours.toFixed(1) : "0.0";

    if (person !== "—") {
      row.innerHTML = `
        <div class="employee-label">
                    <div title="${person}" class="employee-name">${person}</div>
                    <div class="week-employee-hours-row">
                        <div class="week-employee-hours-info">
                            <span class="week-employee-hours-value" data-tooltip="${displayHours} hours">${displayHours}h</span>
                        </div>
                        
                    </div>
                </div>
                    `;
    }

    const height = rowHeightsMap[person] || MIN_ROW_HEIGHT;
    row.style.height = height + "px";
    column.appendChild(row);
  });
}
const run_event_height = 48;
function renderWeekEventsForRun(container, events, dateKey) {
  events.forEach((evt, index) => {
    const el = document.createElement("div");
    el.className = `week-event-box status-Not_Started`;
    el.draggable = false;
    el.dataset.start = evt.start_time;
    el.dataset.end = evt.end_time;
    const topPosition = ROW_PADDING + index * EVENT_GAP;

    el.style.top = `${topPosition}px`;
    el.style.height = `${run_event_height}px`;
    el.style.left = "0";
    el.style.right = "0";
    el.style.width = "calc(100% - 12px)";
    el.style.margin = "0 6px";

    const title = document.createElement("div");
    title.className = "week-event-staff-name";
    if (currentViewType !== "staff") {
      title.textContent = evt.staff || "Unassigned";
    } else {
      title.textContent = evt.run_name || "Unassigned";
    }

    const time = document.createElement("div");
    time.className = "week-event-time-range";
    time.textContent = `${evt.start_time} - ${evt.end_time}`;

    el.appendChild(title);
    el.appendChild(time);
    const date1 = new Date(dateKey);
    const date2 = new Date(currentDate);
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    if (date1 >= date2) {
      el.addEventListener("click", (e) => {
        console.log(dateKey);

        console.log("Event box clicked:", evt);
        e.stopPropagation();
        handleEventClick(evt, dateKey);
      });
    }
    container.appendChild(el);
  });
}
function renderWeekStaffRunEvents(container, events, dateKey) {
  // Clear the container first
  container.innerHTML = "";

  // Store dateKey on container for later use
  container.dataset.dateKey = dateKey;

  // Make sure container is clickable
  container.style.position = "relative";
  container.style.minHeight = "100%";
  container.style.cursor = "pointer";

  // Remove any existing click handlers

  events.forEach((evt, index) => {
    const el = document.createElement("div");
    el.className = `week-event-box status-Not_Started`;
    el.dataset.eventId = evt.zoho_id;
    el.draggable = false;
    el.dataset.viewType = "week-person";
    el.dataset.start = evt.start_time;
    el.dataset.end = evt.end_time;

    const topPosition = ROW_PADDING + index * (run_event_height + EVENT_GAP);
    el.style.top = `${topPosition}px`;
    el.style.height = `${run_event_height}px`;
    el.style.left = "0";
    el.style.right = "0";
    el.style.width = "calc(100% - 12px)";
    el.style.margin = "0 6px";
    el.style.cursor = "pointer";
    el.style.pointerEvents = "auto";
    el.style.position = "absolute";
    el.style.zIndex = "10"; // Events above background

    const title = document.createElement("div");
    if (evt.run_name === "Available") {
      title.className = "week-event-staff-name-avl";
    } else if (evt.off === "true") {
      title.className = "week-event-staff-name-off";
    } else {
      title.className = "week-event-staff-name";
    }

    title.textContent = evt.run_name || "Unassigned";
    title.style.pointerEvents = "none";

    const time = document.createElement("div");
    time.className = "week-event-time-range";
    time.textContent = `${evt.start_time} - ${evt.end_time}`;
    time.style.pointerEvents = "none";

    el.appendChild(title);
    el.appendChild(time);
    const date1 = new Date(dateKey);
    const date2 = new Date();
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    // Click handler for existing events
    if (date1 >= date2) {
      el.addEventListener("click", (e) => {
        console.log(dateKey);

        console.log("Event box clicked:", evt);
        e.stopPropagation();
        handleEventClick(evt, dateKey);
      });
    }
    container.appendChild(el);
  });

  // // Add click handler to the container for empty space
  // const containerClickHandler = (e) => {
  //     console.log('Container clicked, target:', e.target);
  //     console.log('Container element:', container);
  //     console.log('Target classList:', e.target.classList);

  //     // Check if click was directly on the container (empty space)
  //     // Accept clicks on the container itself OR elements with week-events-container class
  //     if (e.target === container ||
  //         e.target.classList.contains('week-events-container') ||
  //         e.target.classList.contains('week-day-column')) {

  //         console.log('Empty space clicked!');
  //         e.stopPropagation();
  //         handleEmptySpaceClick(container, dateKey, e);
  //     }
  // };

  // // Store the handler reference
  // container._clickHandler = containerClickHandler;
  // container.addEventListener('click', containerClickHandler);

  // console.log('Container setup complete for dateKey:', dateKey, 'with', events.length, 'events');
}

function handleEventClick(eventData, dateKey) {
  console.log("Event clicked:", eventData);
  openStaffSchedulePopup(eventData, dateKey);
}
function handleEmptySpaceClick(person, dateKey, event) {
  console.log("Empty space clicked, opening new schedule form");

  // Find the parent row to get staff index

  const staffName = "";

  // Get the date from dateKey
  const dateFromKey = parseDateKey(dateKey);
  console.log(dateKey);

  // Calculate default times based on click position (optional)
  let defaultStartTime = "06:00";
  let defaultEndTime = "22:00";

  // You can calculate time based on Y position if you want:
  // const rect = container.getBoundingClientRect();
  // const clickY = event.clientY - rect.top;
  // const totalHeight = rect.height;
  // const clickPercentage = clickY / totalHeight;
  // ... calculate time from percentage
  let emptyEventData;
  // Create empty event data structure
  if (currentViewType === "staff") {
    emptyEventData = {
      zoho_id: null, // null indicates new record
      service: "", // Default to first service if available
      staff: person,
      run_name: "",
      from_date: dateFromKey,
      to_date: dateFromKey,
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      off: "false",
    };
  } else if (currentViewType === "run") {
    let service = run_service_details[person] || "";

    emptyEventData = {
      zoho_id: null,
      service: service,
      staff: "",
      run_name: person,
      from_date: dateFromKey,
      to_date: dateFromKey,
      start_time: defaultStartTime,
      end_time: defaultEndTime,
      off: "false",
    };
  }
  openStaffSchedulePopup(emptyEventData, dateKey, true); // Pass true to indicate new record
}

function parseDateKey(dateKey) {
  // Convert dateKey format to YYYY-MM-DD
  if (!dateKey) return "";

  const parts = dateKey.split("-");
  if (parts[0].length === 4) {
    // Already in YYYY-MM-DD format
    return dateKey;
  } else {
    // Convert DD-MM-YYYY to YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
}
function formatDateForInput(dateStr) {
  if (!dateStr) return "";

  // Check if date is already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  // Handle DD-MM-YYYY format
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
  }

  return dateStr;
}

function openStaffSchedulePopup(eventData, dateKey, isNewRecord = false) {
  console.log("Opening popup with data:", eventData, "Is new:", isNewRecord);
  const template = document.getElementById("schedulePopupTemplate");
  if (!template) {
    console.error("Template not found!");
    alert("Error: Popup template not found.");
    return;
  }

  const clone = template.cloneNode(true);
  clone.id = "";
  clone.style.display = "block";
  const popup = clone.querySelector(".schedule-popup");
  const overlay = clone.querySelector(".schedule-popup-overlay");
  // Update header title
  if (isNewRecord) {
    popup.querySelector(".popup-header h2").textContent = "New Staff Schedule";
    popup.querySelector("#fromDate").disabled = false;
    popup.querySelector("#toDate").disabled = false;
  } else {
    popup.querySelector(".popup-header h2").textContent = "Edit Staff Schedule";
    popup.querySelector("#fromDate").disabled = true;
    popup.querySelector("#toDate").disabled = true;
  }

  // Convert dates to proper format for input fields
  const formattedFromDate = formatDateForInput(eventData.from_date);
  const formattedToDate = formatDateForInput(eventData.to_date);

  // Populate form fields
  popup.querySelector("#fromDate").value = formattedFromDate;
  popup.querySelector("#toDate").value = formattedToDate;
  popup.querySelector("#startTime").value = eventData.start_time || "";
  popup.querySelector("#endTime").value = eventData.end_time || "";
  popup.querySelector("#break").value = eventData.break || "00:00";
  popup.querySelector("#leaveType").value = eventData.leave_Type || "";
  popup.querySelector("#leaveReason").value = eventData.reason_for_leave || "";

  // Set availability status
  const statusSelect = popup.querySelector("#availabilityStatus");
  if (eventData.off !== "true") {
    statusSelect.value = "Available";
  } else {
    statusSelect.value = "Off";
  }
  toggleAvailabilityFields(popup);

  // Listen for changes
  statusSelect.addEventListener("change", () => {
    toggleAvailabilityFields(popup);
  });
  console.log(allStaff);

  // Initialize custom dropdowns
  initializeCustomDropdown(popup, "staff", allStaff, eventData.staff);

  // Handle Site Name based on context
  // This will populate the site field
  setupSiteNameField(popup, eventData, isNewRecord);

  // NOW get the site value AFTER setupSiteNameField has run
  let currentSite = "";
  if (!isNewRecord) {
    currentSite = eventData.service || "";
  } else {
    // For new records, get the site that was set by setupSiteNameField
    const siteNameInput = popup.querySelector("#siteName");
    const siteNameHidden = popup.querySelector("#siteNameHidden");

    if (siteNameInput && siteNameInput.value) {
      currentSite = siteNameInput.value;
    } else if (siteNameHidden && siteNameHidden.value) {
      currentSite = siteNameHidden.value;
    }
  }

  // Get runs based on the current site value
  const initialRuns = currentSite ? site_run_details[currentSite] : [];

  // Initialize run dropdown with filtered runs
  initializeCustomDropdown(
    popup,
    "run",
    initialRuns,
    eventData.off !== "true" && eventData.run_name !== "Available"
      ? eventData.run_name
      : "",
  );

  // Add event listener to staff dropdown to update site name options
  const staffDropdown = popup.querySelector("#staffDropdown");
  staffDropdown.addEventListener("click", () => {
    // When staff changes, update site name if it's a new record
    if (isNewRecord) {
      const currentStaff = popup.querySelector("#staff").value;
      if (currentStaff) {
        updateSiteNameForStaff(popup, currentStaff);
      }
    }
  });

  // Add event listener to site name dropdown/input to update run options
  const siteNameHidden = popup.querySelector("#siteNameHidden");
  const siteNameInput = popup.querySelector("#siteName");

  if (siteNameHidden) {
    // For dropdown-based site selection
    const siteNameOptions = popup.querySelector("#siteNameOptions");
    if (siteNameOptions) {
      siteNameOptions.addEventListener("click", (e) => {
        if (e.target.classList.contains("dropdown-option")) {
          setTimeout(() => {
            const selectedSite = siteNameHidden.value;
            updateRunDropdownForSite(popup, selectedSite);
          }, 100);
        }
      });
    }
  }

  document.body.appendChild(clone);

  flatpickr(popup.querySelector("#break"), {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
  });

  const closePopup = () => {
    document.body.removeChild(clone);
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  popup.querySelector(".close-popup-btn").addEventListener("click", closePopup);
  popup.querySelector(".btn-cancel").addEventListener("click", closePopup);
  popup
    .querySelector("#startTime")
    .addEventListener("input", () => calculateTotalDuration(popup));

  popup
    .querySelector("#endTime")
    .addEventListener("input", () => calculateTotalDuration(popup));

  popup
    .querySelector("#break")
    .addEventListener("change", () => calculateTotalDuration(popup));
  calculateTotalDuration(popup);
  // Form submission
  popup
    .querySelector("#staffScheduleForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = popup.querySelector("#availabilityStatus").value;
      const run = popup.querySelector("#run").value;
      const leaveType = popup.querySelector("#leaveType")?.value;
      const staff = popup.querySelector("#staff").value;
      console.log(JSON.stringify(staffRunEventDatabase[dateKey]));

      // Basic validations
      if (!staff) {
        showToast("Staff is required.", "error");
        return;
      }
      const dayRecords = staffRunEventDatabase[dateKey] || [];

      // Records for this staff on that day
      const staffRecords = dayRecords.filter((r) => r.staff === staff);

      // Are we editing an existing record?
      const isEditingExisting = !isNewRecord;

      // Count excluding the current record (when editing)
      const otherRecords = isEditingExisting
        ? staffRecords.filter((r) => r.zoho_id !== eventData.zoho_id)
        : staffRecords;

      const hasOtherRecords = otherRecords.length > 0;
      const multipleRecords = staffRecords.length > 1;

      // 🚨 RULES

      // Case 1: creating new & already record exists → run required
      if (isNewRecord && hasOtherRecords && !run) {
        showToast(
          "Run is required when multiple entries exist for this staff on the same day.",
          "error",
        );
        return;
      }

      // Case 2: editing & multiple records exist → run required
      if (isEditingExisting && multipleRecords && !run) {
        showToast(
          "Run is required when multiple entries exist for this staff on the same day.",
          "error",
        );
        return;
      }

      if (status === "Off" && !leaveType) {
        showToast("Leave type is required when status is Off.", "error");
        return;
      }

      if (isNewRecord) {
        await createNewStaffSchedule(popup, dateKey);
      } else {
        await saveStaffScheduleChanges(eventData.zoho_id, popup);
      }
      closePopup();
    });
}
function calculateTotalDuration(popup) {
  const startTime = popup.querySelector("#startTime").value;
  const endTime = popup.querySelector("#endTime").value;
  const breakTime = popup.querySelector("#break").value || "00:00";

  if (!startTime || !endTime) {
    popup.querySelector("#totalDuration").value = "";
    return;
  }

  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  let startMinutes = toMinutes(startTime);
  let endMinutes = toMinutes(endTime);
  let breakMinutes = toMinutes(breakTime);

  // Handle next day scenario
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  let totalMinutes = endMinutes - startMinutes - breakMinutes;

  if (totalMinutes < 0) totalMinutes = 0;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  popup.querySelector("#totalDuration").value =
    String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}
document.addEventListener("click", function (e) {
  document.querySelectorAll(".quick-dropdown.open").forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});
function toggleAvailabilityFields(popup) {
  const status = popup.querySelector("#availabilityStatus").value;

  const runGroup = popup.querySelector("#runDropdown").closest(".form-group");
  const leaveTypeGroup = popup.querySelector("#leaveTypeGroup");
  const leaveReasonGroup = popup.querySelector("#leaveReasonGroup");
  const runHiddenInput = popup.querySelector("#run");
  console.log(runHiddenInput.value);

  if (status === "Off") {
    runGroup.classList.add("hidden");
    runHiddenInput.value = "";

    leaveTypeGroup.classList.remove("hidden");
    leaveReasonGroup.classList.remove("hidden");
  } else {
    runGroup.classList.remove("hidden");
    console.log(popup.querySelector("#leaveReason").value);
    console.log(popup.querySelector("#leaveType").value);
    popup.querySelector("#leaveReason").value = null;
    popup.querySelector("#leaveType").value = null;
    console.log(popup.querySelector("#leaveReason").value);
    console.log(popup.querySelector("#leaveType").value);
    leaveTypeGroup.classList.add("hidden");
    leaveReasonGroup.classList.add("hidden");
  }
  console.log(runHiddenInput.value);
}

function updateRunDropdownForSite(popup, siteName) {
  const runOptions = site_run_details[siteName];
  const runDropdownMenu = popup.querySelector("#runDropdownMenu");
  const runOptionsContainer = popup.querySelector("#runOptions");
  const runDropdownText = popup.querySelector("#runDropdown .dropdown-text");
  const runHiddenInput = popup.querySelector("#run");
  const runSearchInput = popup.querySelector("#runSearch");

  // Clear existing options
  runOptionsContainer.innerHTML = "";

  // Clear current selection
  runHiddenInput.value = "";
  runDropdownText.textContent = "Select Run";
  runDropdownText.classList.add("placeholder");

  // Render new options
  renderDropdownOptions(
    runOptionsContainer,
    runOptions,
    null,
    runDropdownText,
    runHiddenInput,
    runDropdownMenu,
    "run",
  );

  // Reset search input
  if (runSearchInput) {
    runSearchInput.value = "";
  }
}
function setupSiteNameField(popup, eventData, isNewRecord) {
  const siteNameInputContainer = popup.querySelector("#siteNameInputContainer");
  const siteNameDropdownContainer = popup.querySelector(
    "#siteNameDropdownContainer",
  );
  const siteNameInput = popup.querySelector("#siteName");

  if (!isNewRecord) {
    // Editing existing record - show as readonly input
    siteNameInputContainer.style.display = "block";
    siteNameDropdownContainer.style.display = "none";
    siteNameInput.value = eventData.service || "";
  } else {
    // New record - check staff's services
    if (currentViewType === "staff") {
      const staffName = eventData.staff;
      console.log(currentViewType);

      const staffServices = getServicesForStaff(staffName);

      if (staffServices.length === 0) {
        // No staff selected yet or no services - show readonly empty
        siteNameInputContainer.style.display = "block";
        siteNameDropdownContainer.style.display = "none";
        siteNameInput.value = "";
      } else if (staffServices.length === 1) {
        // Only one service - show as readonly
        siteNameInputContainer.style.display = "block";
        siteNameDropdownContainer.style.display = "none";
        siteNameInput.value = staffServices[0];
      } else {
        // Multiple services - show as dropdown
        siteNameInputContainer.style.display = "none";
        siteNameDropdownContainer.style.display = "block";

        // Initialize site name dropdown
        const siteOptions = staffServices;
        initializeCustomDropdown(
          popup,
          "siteName",
          siteOptions,
          eventData.service || siteOptions[0],
        );
      }
    } else if (currentViewType === "run") {
      siteNameInputContainer.style.display = "block";
      siteNameDropdownContainer.style.display = "none";
      siteNameInput.value = eventData.service || "";
    }
  }
}

function updateSiteNameForStaff(popup, staffName) {
  console.log(popup, staffName);

  const siteNameInputContainer = popup.querySelector("#siteNameInputContainer");
  const siteNameDropdownContainer = popup.querySelector(
    "#siteNameDropdownContainer",
  );
  const siteNameInput = popup.querySelector("#siteName");

  const staffServices = getServicesForStaff(staffName);
  console.log(staffServices);

  if (staffServices.length === 0) {
    siteNameInputContainer.style.display = "block";
    siteNameDropdownContainer.style.display = "none";
    siteNameInput.value = "";
    // Clear runs when no site
    updateRunDropdownForSite(popup, "");
  } else if (staffServices.length === 1) {
    siteNameInputContainer.style.display = "block";
    siteNameDropdownContainer.style.display = "none";
    siteNameInput.value = staffServices[0];
    // Update runs for the single site
    updateRunDropdownForSite(popup, staffServices[0]);
  } 
  else {
    siteNameInputContainer.style.display = "none";
    siteNameDropdownContainer.style.display = "block";

    const siteOptions = staffServices;

    // ✅ Clone FIRST, then capture ALL references from the NEW element
    const oldDropdownBtn = popup.querySelector("#siteNameDropdown");
    const newDropdownBtn = oldDropdownBtn.cloneNode(true);
    oldDropdownBtn.parentNode.replaceChild(newDropdownBtn, oldDropdownBtn);

    // ✅ All references captured AFTER clone — these point to live DOM
    const dropdownMenu = popup.querySelector("#siteNameDropdownMenu");
    const optionsContainer = popup.querySelector("#siteNameOptions");
    const dropdownText = newDropdownBtn.querySelector(".dropdown-text");
    const hiddenInput = popup.querySelector("#siteNameHidden");
    const searchInput = popup.querySelector("#siteNameSearch");

    // Set default to first site
    const firstSite = siteOptions[0];
    dropdownText.textContent = firstSite;
    dropdownText.classList.remove("placeholder");
    hiddenInput.value = firstSite;

    // ✅ Pass fieldName so renderDropdownOptions can find the live button
    optionsContainer.innerHTML = "";
    renderDropdownOptions(
        optionsContainer,
        siteOptions,
        null,
        dropdownText,
        hiddenInput,
        dropdownMenu,
        "siteName"   // ← this was missing!
    );

    updateRunDropdownForSite(popup, firstSite);

    newDropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.contains("show");
        document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
            menu.classList.remove("show");
            menu.previousElementSibling?.classList.remove("active");
        });
        if (!isOpen) {
            dropdownMenu.classList.add("show");
            newDropdownBtn.classList.add("active");
            searchInput.focus();
        }
    });

    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredOptions = siteOptions.filter((opt) =>
            opt.toLowerCase().includes(searchTerm)
        );
        // ✅ Fresh references, correct fieldName
        renderDropdownOptions(
            optionsContainer,
            filteredOptions,
            null,
            dropdownText,
            hiddenInput,
            dropdownMenu,
            "siteName"
        );
    });
}
}

function getServicesForStaff(staffName) {
  console.log(allStaffDetails);

  if (!staffName || !allStaffDetails) return [];

  const employee = allStaffDetails.find((emp) => emp.name === staffName);
  if (!employee || !employee.service) return [];

  return employee.service;
}

function initializeCustomDropdown(
  container,
  fieldName,
  options,
  selectedValue,
) {
  // Special handling for siteName dropdown
  if (fieldName === "siteName") {
    const hiddenInput = container.querySelector("#siteNameHidden");
    const dropdownBtn = container.querySelector(`#${fieldName}Dropdown`);
    const dropdownMenu = container.querySelector(`#${fieldName}DropdownMenu`);
    const dropdownText = dropdownBtn.querySelector(".dropdown-text");
    const searchInput = container.querySelector(`#${fieldName}Search`);
    const optionsContainer = container.querySelector(`#${fieldName}Options`);

    // Populate options
    renderDropdownOptions(
      optionsContainer,
      options,
      selectedValue,
      dropdownText,
      hiddenInput,
      dropdownMenu,
    );

    // Set initial value
    if (selectedValue) {
      dropdownText.textContent = selectedValue;
      dropdownText.classList.remove("placeholder");
      hiddenInput.value = selectedValue;
    }

    // Toggle dropdown
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains("show");

      document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
        menu.classList.remove("show");
        menu.previousElementSibling.classList.remove("active");
      });

      if (!isOpen) {
        dropdownMenu.classList.add("show");
        dropdownBtn.classList.add("active");
        searchInput.focus();
      }
    });

    // Search functionality
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredOptions = options.filter((opt) =>
        opt.toLowerCase().includes(searchTerm),
      );
      renderDropdownOptions(
        optionsContainer,
        filteredOptions,
        selectedValue,
        dropdownText,
        hiddenInput,
        dropdownMenu,
      );
    });
    document.addEventListener("click", (e) => {
      console.log(
        !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target),
      );

      if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
        dropdownBtn.classList.remove("active");
      }
    });

    return;
  }

  // Original logic for staff and run dropdowns
  const dropdownBtn = container.querySelector(`#${fieldName}Dropdown`);
  const dropdownMenu = container.querySelector(`#${fieldName}DropdownMenu`);
  const dropdownText = dropdownBtn.querySelector(".dropdown-text");
  const searchInput = container.querySelector(`#${fieldName}Search`);
  const optionsContainer = container.querySelector(`#${fieldName}Options`);
  const hiddenInput = container.querySelector(`#${fieldName}`);

  // Populate options
  renderDropdownOptions(
    optionsContainer,
    options,
    selectedValue,
    dropdownText,
    hiddenInput,
    dropdownMenu,
    fieldName,
  );

  // Set initial value
  if (selectedValue) {
    dropdownText.textContent = selectedValue;
    dropdownText.classList.remove("placeholder");
    hiddenInput.value = selectedValue;
  }

  // Toggle dropdown
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.contains("show");

    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
      menu.previousElementSibling.classList.remove("active");
    });

    if (!isOpen) {
      dropdownMenu.classList.add("show");
      dropdownBtn.classList.add("active");
      searchInput.focus();
    }
  });

  // Search functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();

  // ✅ For staff dropdown, always filter based on currently selected site
  let currentOptions = options;

  if (fieldName === "staff") {
    const schedulePopup = container.querySelector("#staffOptions")
      ?.closest(".schedule-popup");

    if (schedulePopup) {
      const siteNameInputContainer = schedulePopup.querySelector("#siteNameInputContainer");
      const siteNameHidden = schedulePopup.querySelector("#siteNameHidden");
      const siteNameText = schedulePopup.querySelector("#siteName");

      let currentSite = "";
      if (siteNameInputContainer && siteNameInputContainer.style.display !== "none") {
        currentSite = siteNameText?.value || "";
      } else if (siteNameHidden) {
        currentSite = siteNameHidden.value || "";
      }

      if (currentSite) {
        currentOptions = allStaffDetails
          .filter((s) => s.service?.includes(currentSite))
          .map((s) => s.name);
      } else {
        currentOptions = allStaffDetails.map((s) => s.name);
      }
    }
  }

  const filteredOptions = currentOptions.filter((opt) =>
    opt.toLowerCase().includes(searchTerm)
  );

  renderDropdownOptions(
    optionsContainer,
    filteredOptions,
    selectedValue,
    dropdownText,
    hiddenInput,
    dropdownMenu,
    fieldName,
  );
});

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
      dropdownBtn.classList.remove("active");
    }
  });
}

function renderDropdownOptions(
  container,
  options,
  selectedValue,
  dropdownText,
  hiddenInput,
  dropdownMenu,
  fieldName,
) {
  container.innerHTML = "";

  if (!options || options.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "dropdown-option no-results";
    noResults.textContent = "No results found";
    container.appendChild(noResults);
    return;
  }

  options.forEach((option) => {
    const optionEl = document.createElement("div");
    optionEl.className = "dropdown-option";
    optionEl.textContent = option;

    if (option === selectedValue) {
      optionEl.classList.add("selected");
    }

    optionEl.addEventListener("click", () => {
      dropdownText.textContent = option;
      dropdownText.classList.remove("placeholder");
      hiddenInput.value = option;

      container.querySelectorAll(".dropdown-option").forEach((opt) => {
        opt.classList.remove("selected");
      });
      optionEl.classList.add("selected");

      dropdownMenu.classList.remove("show");
      dropdownMenu.previousElementSibling?.classList.remove("active");

      const schedulePopup = container.closest(".schedule-popup");

      if (fieldName === "siteName" && schedulePopup) {
        const popup = schedulePopup.parentElement;
        updateStaffDropdownForSite(popup, option);
        updateRunDropdownForSite(popup, option);
      }

      if (fieldName === "staff" && schedulePopup) {
        const popup = schedulePopup.parentElement;
        const isNew = popup
          .querySelector(".popup-header h2")
          .textContent.includes("New");
        if (isNew) {
          updateSiteNameForStaff(popup, option);
        }
      }
    });

    container.appendChild(optionEl);
  });
}
function updateStaffDropdownForSite(popup, siteName) {
  console.log(siteName);
  console.log( JSON.stringify(allStaffDetails));
  
  
  
  const staffOptions = allStaffDetails
    .filter((s) => s.service?.includes(siteName))
    .map((s) => s.name);
console.log( staffOptions.includes("Zainab") );
  const staffDropdownMenu = popup.querySelector("#staffDropdownMenu");
  const staffOptionsContainer = popup.querySelector("#staffOptions");
  const staffDropdownText = popup.querySelector("#staffDropdown .dropdown-text");
  const staffHiddenInput = popup.querySelector("#staff");
  const staffSearchInput = popup.querySelector("#staffSearch");

  staffHiddenInput.value = "";
  staffDropdownText.textContent = "Select Staff";
  staffDropdownText.classList.add("placeholder");

  if (staffSearchInput) {
    staffSearchInput.value = "";
  }

  renderDropdownOptions(
    staffOptionsContainer,
    staffOptions,
    null,
    staffDropdownText,
    staffHiddenInput,
    staffDropdownMenu,
    "staff"
  );
}

// Helper functions
function formatDateTimeForInput(date, time) {
  if (!date || !time) return "";
  const parts = date.split("-");
  let formattedDate;
  if (parts[0].length === 4) {
    formattedDate = date;
  } else {
    formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return `${formattedDate}T${time}`;
}
function formatDateForZoho(dateStr) {
  if (!dateStr) return "";

  // Check if date is in YYYY-MM-DD format (from input)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to DD-MM-YYYY
  }

  return dateStr;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
// Update save functions to get site name from correct field
async function createNewStaffSchedule(popup, dateKey) {
  showLoader();
  // Get site name from either input or hidden field depending on which is visible
  const siteNameInputContainer = popup.querySelector("#siteNameInputContainer");
  let siteName;

  if (siteNameInputContainer.style.display !== "none") {
    siteName = popup.querySelector("#siteName").value;
  } else {
    siteName = popup.querySelector("#siteNameHidden").value;
  }
  let service_id;

  services_details.forEach((obj) => {
    if (obj[siteName]) {
      service_id = obj[siteName];
    }
  });

  const empId = getEmployeeIdByName(popup.querySelector("#staff").value);
  const run_id = runRowDetails[popup.querySelector("#run").value];

  const formData = {
    Site_Name: service_id,
    Staff: empId,
    Care_Group: run_id,
    Available_Status: popup.querySelector("#availabilityStatus").value,
    Date_From: formatDateForZoho(popup.querySelector("#fromDate").value),
    Date_To: formatDateForZoho(popup.querySelector("#toDate").value),
    Start_Time: popup.querySelector("#startTime").value,
    End_Time: popup.querySelector("#endTime").value,
    Break: popup.querySelector("#break").value,
    Reason_for_Leave: popup.querySelector("#leaveReason").value,
    leave_Type: popup.querySelector("#leaveType").value,
  };

  console.log("Creating new schedule with data:", formData);

  try {
    const config = {
      app_name: app_name,
      form_name: "Daily_Staff_schedule",
      payload: {
        data: formData,
      },
    };

    const add_res = await ZOHO.CREATOR.DATA.addRecords(config);
    console.log(
      `${currentView} - ${currentViewType} - ${JSON.stringify(add_res)} `,
    );
    await getWeekStaffRunDetails();
    if (currentViewType === "staff") {
      await renderWeekStaffView();
    } else if (currentViewType === "run") {
      await renderWeekRunView();
    }
  } catch (error) {
    console.error("Error creating schedule:", error);
    alert("Failed to create schedule. Please try again.");
  }
  hideLoader();
}
function getEmployeeIdByName(empName) {
  const emp = allStaffDetails.find((e) => e.name === empName);
  return emp ? emp.id : null;
}

async function saveStaffScheduleChanges(zohoId, popup) {
  showLoader();
  const empId = getEmployeeIdByName(popup.querySelector("#staff").value);
  console.log(
    `${JSON.stringify(runRowDetails)} - ${runRowDetails[popup.querySelector("#run").value]} - ${popup.querySelector("#run").value} `,
  );

  const run_id = runRowDetails[popup.querySelector("#run").value];

  console.log(currentView, currentViewType);

  const formData = {
    Staff: empId,
    Care_Group: run_id ?? null,
    Available_Status: popup.querySelector("#availabilityStatus").value,
    Start_Time: popup.querySelector("#startTime").value,
    End_Time: popup.querySelector("#endTime").value,
    Break: popup.querySelector("#break").value,
    Reason_for_Leave: popup.querySelector("#leaveReason").value,
    leave_Type: popup.querySelector("#leaveType").value,
  };
  console.log(formData);

  try {
    const config = {
      app_name: app_name,
      report_name: "Daily_schedule_for_Staff",
      id: zohoId,
      payload: {
        data: formData,
      },
    };

    const save_res = await ZOHO.CREATOR.DATA.updateRecordById(config);
    console.log(
      `${currentView} - ${currentViewType} - ${JSON.stringify(save_res)} `,
    );

    if (currentView === "week" && currentViewType === "staff") {
      const dateKey = popup.querySelector("#fromDate").value;
      console.log(dateKey);
      console.log(staffRunEventDatabase);

      if (staffRunEventDatabase[dateKey]) {
        const record = staffRunEventDatabase[dateKey].find(
          (e) => e.zoho_id === zohoId,
        );
        const run_value = popup.querySelector("#run").value;
        if (record) {
          record.start_time = popup.querySelector("#startTime").value;
          record.end_time = popup.querySelector("#endTime").value;
          record.break = popup.querySelector("#break").value;
          record.leave_Type = popup.querySelector("#leaveType").value;
          record.reason_for_leave = popup.querySelector("#leaveReason").value;
          record.off =
            popup.querySelector("#availabilityStatus").value === "Off"
              ? "true"
              : "false";
          const runInput = popup.querySelector("#run");
          const runValue = runInput?.value?.trim();

          if (record.off === true || record.off === "true") {
            record.run_name = record.leave_Type || null;
          } else if (runValue) {
            record.run_name = runValue;
          } else {
            record.run_name = "Available";
          }

          // Update staff ONLY if changed
          const newStaff = popup.querySelector("#staff").value;
          if (record.staff !== newStaff) {
            record.staff = newStaff;
          }
          if (!runStaffList.includes(newStaff)) {
            runStaffList.push(newStaff);
          }
          // console.log(record);
        }
      }
      renderWeekStaffRunRows();
    } else if (currentView === "week" && currentViewType === "run") {
      const dateKey = popup.querySelector("#fromDate").value;

      const records = runEventDatabase[dateKey];
      if (!records) return;

      const index = records.findIndex((e) => e.zoho_id === zohoId);
      if (index === -1) return;

      const record = records[index];

      record.start_time = popup.querySelector("#startTime").value;
      record.end_time = popup.querySelector("#endTime").value;
      record.break = popup.querySelector("#break").value;
      record.leave_Type = popup.querySelector("#leaveType").value;
      record.reason_for_leave = popup.querySelector("#leaveReason").value;

      record.off = popup.querySelector("#availabilityStatus").value === "Off";
      const runValue = popup.querySelector("#run")?.value?.trim();

      let newRunName;

      if (record.off) {
        newRunName = record.leave_Type || null;
      } else if (runValue) {
        newRunName = runValue;
      } else {
        newRunName = "Available";
      }

      if (record.off || newRunName === "Available") {
        records.splice(index, 1);
      } else {
        record.run_name = newRunName;
      }

      const newStaff = popup.querySelector("#staff").value;
      if (record.staff !== newStaff) {
        record.staff = newStaff;
      }

      await renderWeekRunView();
    } else if (currentView === "day" && currentViewType === "employee") {
      await getEmployeeShifts(currentDate);
      await re_renderDayView();
    }
  } catch (error) {
    console.error("Error updating schedule:", error);
    alert("Failed to update schedule. Please try again.");
  }
  hideLoader();
}
// New function: Render events for person (no drag & drop)
function renderWeekEventsForPerson(container, events, dateKey) {
  events.forEach((evt, index) => {
    const el = document.createElement("div");
    el.className = `event status-${evt.status}`;
    el.draggable = false; // Disable dragging

    el.dataset.eventId = evt.id;
    el.dataset.viewType = "week-person";
    el.dataset.eventDate = dateKey;
    el.dataset.person = evt.title;
    el.dataset.serviceUser = evt.title || "";
    el.dataset.staff = evt.employee || "—";
    el.dataset.start =
      minutesToTime(evt.startMinutes).hour.toString().padStart(2, "0") +
      ":" +
      minutesToTime(evt.startMinutes).minute.toString().padStart(2, "0");
    el.dataset.end =
      minutesToTime(evt.endMinutes).hour.toString().padStart(2, "0") +
      ":" +
      minutesToTime(evt.endMinutes).minute.toString().padStart(2, "0");
    el.dataset.mismatch = evt.status === "Missed" ? "Visit missed" : "";
    el.dataset.status = evt.event_status;
    el.dataset.travel = evt.travel || "";

    const topPosition = ROW_PADDING + index * (EVENT_HEIGHT + EVENT_GAP);

    el.style.top = `${topPosition}px`;
    el.style.height = `${EVENT_HEIGHT}px`;
    el.style.left = "2px";
    el.style.right = "2px";
    el.style.width = "auto";

    const title = document.createElement("div");
    title.className = "event-title";
    title.textContent = evt.employee || "Unassigned";

    const time = document.createElement("div");
    time.className = "event-time";
    time.textContent = formatTimeRange(evt.startMinutes, evt.endMinutes);

    el.appendChild(title);
    el.appendChild(time);

    // Click to view details only
    el.addEventListener("mousedown", (e) => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
    });
    // if (currentViewType !== 'run') {

    //     el.addEventListener('mouseup', (e) => {
    //         const dx = Math.abs(e.clientX - mouseDownX);
    //         const dy = Math.abs(e.clientY - mouseDownY);

    //         if (dx > CLICK_TOLERANCE || dy > CLICK_TOLERANCE) return;

    //         openEventModal(evt);
    //     });
    // }
    container.appendChild(el);
  });
}

function getEventCompositeKey(evt) {
  if (!evt || !evt.zoho_id) {
    throw new Error("getEventCompositeKey: zoho_id is mandatory");
  }

  return `${evt.zoho_id}-${evt.employee || "unassigned"}-${evt.employee_id || "none"}`;
}
function hasEmployeeConflict(zohoId, employee, dateKey, draggedEventKey) {
  const events = eventDatabase[dateKey] || [];
  console.log(eventDatabase[dateKey]);
  console.log(zohoId, employee, dateKey, draggedEventKey);

  return events.some(
    (e) =>
      e.zoho_id === zohoId &&
      e.employee === employee &&
      `${e.zoho_id}-${e.employee || "unassigned"}-${e.employee_id || "none"}` !==
        draggedEventKey,
  );
}
function clearAllFilters() {
  // Clear applied filters array
  appliedFilters = [];

  // Clear all filter tags
  Object.keys(filterTags).forEach((key) => {
    filterTags[key] = [];
  });

  // Uncheck all filter checkboxes
  document
    .querySelectorAll('.search-filter input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
    });

  // Hide all filter input sections
  document.querySelectorAll(".filter-inputs").forEach((inputs) => {
    inputs.classList.remove("active");
  });

  // Reset all filter dropdowns to default (Contains)
  Object.keys(filterValues).forEach((key) => {
    filterValues[key] = "contains";
    const hiddenInput = document.getElementById(`${key}-filter`);
    if (hiddenInput) {
      hiddenInput.value = "contains";
    }
    const displayText = document.getElementById(`${key}-filter-text`);
    if (displayText) {
      displayText.textContent = "Contains";
    }
  });

  // Clear all tag displays
  Object.keys(filterTags).forEach((key) => {
    renderTags(key);
  });

  // Hide the applied filters section
  renderAppliedFilters();

  // Clear search input in employee header
  const employeeSearchInput = document.getElementById("employeeSearchInput");
  if (employeeSearchInput) {
    employeeSearchInput.value = "";
  }
}

async function renderFilteredRunRows(visibleRuns) {
  const rowsContainer = document.getElementById("calendarRows");
  rowsContainer.innerHTML = "";

  const dateKey = getCurrentDateKey();
  const rowHeightsMap = {};
  const fillHeight = calculateFillHeight();

  visibleRuns.forEach((runGroup) => {
    const rawEvents = getEventsForRunGroup(runGroup, dateKey);
    const events = detectOverlaps([...rawEvents]);

    const maxConcurrent = events.length
      ? Math.max(...events.map((e) => e.maxConcurrent))
      : 1;
    const dynamicHeight =
      maxConcurrent * (EVENT_HEIGHT + EVENT_GAP) + ROW_PADDING * 2;
    const finalRowHeight = Math.max(fillHeight, dynamicHeight);
    rowHeightsMap[runGroup] = finalRowHeight;

    const runRow = document.createElement("div");
    runRow.className = "employee-calendar-row";
    runRow.dataset.runGroup = runGroup;
    runRow.style.height = finalRowHeight + "px";

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    for (let h = 0; h < 24; h++) {
      const hourCol = document.createElement("div");
      hourCol.className = "hour-column";
      const innerGrid = document.createElement("div");
      innerGrid.className = "hour-column-inner";
      for (let i = 0; i < 4; i++) {
        const line = document.createElement("div");
        line.className = "quarter-line";
        innerGrid.appendChild(line);
      }
      hourCol.appendChild(innerGrid);

      for (let q = 0; q < 4; q++) {
        const slot = document.createElement("div");
        slot.className = "quarter-slot";
        slot.dataset.hour = h;
        slot.dataset.quarter = q;
        slot.dataset.runGroup = runGroup;
        slot.dataset.viewType = "run";

        slot.addEventListener("dragover", handleRunDragOver);
        slot.addEventListener("drop", handleRunDrop);
        slot.addEventListener("dragleave", handleDragLeave);

        hourCol.appendChild(slot);
      }
      grid.appendChild(hourCol);
    }

    const eventsContainer = document.createElement("div");
    eventsContainer.className = "events-container";
    eventsContainer.dataset.runGroup = runGroup;
    renderRunEventsForGroup(eventsContainer, events);

    grid.appendChild(eventsContainer);
    runRow.appendChild(grid);
    rowsContainer.appendChild(runRow);
  });

  renderFilteredRunColumn(rowHeightsMap, visibleRuns);
}

function renderFilteredRunColumn(rowHeightsMap = {}, visibleRuns) {
  const column = document.getElementById("employeeColumn");
  column.innerHTML = "";

  const dateKey = getCurrentDateKey();

  visibleRuns.forEach((runGroup) => {
    const row = document.createElement("div");
    row.className = "employee-row";

    if (runGroup === "") {
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
      events.forEach((evt) => {
        total_mins += evt.endMinutes - evt.startMinutes;
      });

      const workingHours = total_mins / 60;
      let displayHours = workingHours > 0 ? workingHours.toFixed(1) : "0.0";

      row.innerHTML = `
                <div class="employee-label">
                    <div class="employee-name-row">
                        <span class="employee-name">${runGroup}</span>
                    </div>
                    <div class="employee-hours-info">
                        <span class="hours-value" data-tooltip="Actual Hours">${displayHours}</span>
                    </div>
                </div>
            `;
    }

    const height = rowHeightsMap[runGroup] || MIN_ROW_HEIGHT;
    row.style.height = height + "px";
    column.appendChild(row);
  });
}

function calculateEmployeeTravelTotals(employee, dateKey) {
  if (!employee || employee === "" || employee === "—") {
    return { totalDistance: 0, totalDuration: 0 };
  }

  const events = getEventsForEmployee(employee, dateKey);
  let totalDistanceMiles = 0;
  let totalDurationMins = 0;

  events.forEach((evt) => {
    if (!evt.distance_duration || !evt.employee_id) return;

    try {
      const travelData =
        typeof evt.distance_duration === "string"
          ? JSON.parse(evt.distance_duration)
          : evt.distance_duration;

      // Find the travel data for this specific employee
      const employeeIdStr = String(evt.employee_id);
      const employeeTravelData = travelData[employeeIdStr];

      if (employeeTravelData) {
        // Parse BDist (e.g., "77 Miles" -> 77)
        if (employeeTravelData.BDist && employeeTravelData.BDist !== "N/A") {
          const distMatch = employeeTravelData.BDist.match(/(\d+(?:\.\d+)?)/);
          if (distMatch) {
            totalDistanceMiles += parseFloat(distMatch[1]);
          }
        }

        // Parse BDur (e.g., "85 Mins" -> 85)
        if (employeeTravelData.BDur && employeeTravelData.BDur !== "N/A") {
          const durMatch = employeeTravelData.BDur.match(/(\d+(?:\.\d+)?)/);
          if (durMatch) {
            totalDurationMins += parseFloat(durMatch[1]);
          }
        }
      }
    } catch (err) {
      console.error("Error parsing travel data:", err, evt.distance_duration);
    }
  });

  return {
    totalDistance: totalDistanceMiles,
    totalDuration: totalDurationMins,
  };
}

function getEmpIdByName(name) {
  const emp = employeeDetails.find((e) => e.name === name);
  return emp ? emp.id : null;
}

function openDateReport() {
  if (!currentDate) return;

  const formattedDate = formatDateDDMMYYYY(currentDate);

  const url = `https://${portal_url}/#Report:Manual_Rostering?&zc_LoadIn=dialog&Date_field1=${formattedDate}`;

  window.open(url, "_blank", "noopener");
}

function formatDateDDMMYYYY(date) {
  console.log("called");

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
function startWeekBackgroundFetch() {
  stopWeekBackgroundFetch(); // safety: clear any existing timer first

  if (!weekFetchHasMore) return; // nothing left to fetch

  weekBackgroundTimer = setInterval(async () => {
    // If user already left week view, self-stop
    if (currentView !== "week") {
      stopWeekBackgroundFetch();
      return;
    }

    console.log("Background fetch | using cursor:", weekFetchCursor);

    const nextCursor = await getBookingsForWeek(weekFetchCursor);
    weekFetchCursor = nextCursor;
    weekFetchHasMore = !!nextCursor; // truthy cursor means more pages exist

    if (currentViewType === "person") {
      await renderWeekPersonView();
    } else if (currentViewType !== "run" && currentViewType !== "staff") {
      await renderWeekView();
    }
    if (!nextCursor) {
      console.log("Background fetch | all records loaded — stopping.");
      stopWeekBackgroundFetch();
    }
  }, WEEK_POLL_INTERVAL);
}

/** Stop polling (call when leaving week view or changing dates) */
function stopWeekBackgroundFetch() {
  if (weekBackgroundTimer) {
    clearInterval(weekBackgroundTimer);
    weekBackgroundTimer = null;
  }
}

/** Reset pagination state (call whenever the week itself changes) */
function resetWeekPagination() {
  weekFetchCursor = null;
  weekFetchHasMore = true;
  stopWeekBackgroundFetch();
}

function getMinutes(dateTime) {
  if (typeof dateTime !== "string") return null;

  const parts = dateTime.split(" ");
  if (parts.length < 2) return null;

  const time = parts[1];
  const [h, m] = time.split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  return h * 60 + m;
}

function getDurationtoMintues(duration) {
  const [h, m] = duration.split(":").map(Number);

  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  return h * 60 + m;
}

function getDateFromMinutes(dateTime) {
  if (typeof dateTime !== "string") return null;

  const parts = dateTime.split(" ");
  if (parts.length < 2) return null;

  const date = parts[0];
  return date;
}
// Calculate display start minutes for a given view date
function calculateDisplayStartMinutes(fromDateTime, viewDateStr) {
  let cur_date = formatDateDDMMYYYY(currentDate);
  viewDateStr = cur_date;

  if (!fromDateTime || !viewDateStr) return 0;

  const fromDate = getDateFromDateTime(fromDateTime); // DD-MM-YYYY
  const viewDate = viewDateStr; // DD-MM-YYYY format
  if (currentView === "day") {
    if (fromDate === viewDate) {
      return getMinutesFromDateTime(fromDateTime);
    } else if (isDateBefore(fromDate, viewDate)) {
      return 0;
    } else {
      return -1;
    }
  } else {
    return getMinutesFromDateTime(fromDateTime);
  }
}

// Calculate display end minutes for a given view date
function calculateDisplayEndMinutes(toDateTime, viewDateStr, durationMins) {
  let cur_date = formatDateDDMMYYYY(currentDate);
  viewDateStr = cur_date;
  if (!toDateTime || !viewDateStr) return 1440;

  const toDate = getDateFromDateTime(toDateTime); // DD-MM-YYYY
  const viewDate = viewDateStr; // DD-MM-YYYY format
  if (currentView === "day") {
    if (toDate === viewDate) {
      // Event ends on this day - show actual end time
      return getMinutesFromDateTime(toDateTime);
    } else if (isDateAfter(toDate, viewDate)) {
      // Event continues to next day - show until midnight (1440)
      return 1440;
    } else {
      // Event ended on a previous day - shouldn't show on this view
      return 0;
    }
  } else {
    return getMinutesFromDateTime(toDateTime);
  }
}

// Helper: Extract DD-MM-YYYY from "DD-MM-YYYY HH:MM" format
function getDateFromDateTime(dateTimeStr) {
  if (!dateTimeStr || typeof dateTimeStr !== "string") return "";
  const parts = dateTimeStr.split(" ");
  return parts[0]; // Returns DD-MM-YYYY
}
function convertYYYYMMDDtoDDMMYYYY(dateKey) {
  const [yyyy, MM, dd] = dateKey.split("-");
  return `${dd}-${MM}-${yyyy}`;
}

// Helper: Extract minutes from "DD-MM-YYYY HH:MM" format
function getMinutesFromDateTime(dateTimeStr) {
  if (!dateTimeStr || typeof dateTimeStr !== "string") return 0;
  const parts = dateTimeStr.split(" ");
  if (parts.length < 2) return 0;

  const timePart = parts[1]; // HH:MM
  const [hours, minutes] = timePart.split(":").map(Number);
  return hours * 60 + minutes;
}
function addDaysToDate(dateStr, days) {
  const [dd, MM, yyyy] = dateStr.split("-").map(Number);
  const date = new Date(yyyy, MM - 1, dd);
  date.setDate(date.getDate() + days);

  const newDD = String(date.getDate()).padStart(2, "0");
  const newMM = String(date.getMonth() + 1).padStart(2, "0");
  const newYYYY = date.getFullYear();

  return `${newDD}-${newMM}-${newYYYY}`;
}
function isDateBefore(date1DDMMYYYY, date2DDMMYYYY) {
  if (!date1DDMMYYYY || !date2DDMMYYYY) return false;

  const [d1, m1, y1] = date1DDMMYYYY.split("-").map(Number);
  const [d2, m2, y2] = date2DDMMYYYY.split("-").map(Number);
  const dateObj1 = new Date(y1, m1 - 1, d1);
  const dateObj2 = new Date(y2, m2 - 1, d2);
  return dateObj1 < dateObj2;
}

// Helper: Check if date1 is after date2 (both in DD-MM-YYYY format)
function isDateAfter(date1DDMMYYYY, date2DDMMYYYY) {
  if (!date1DDMMYYYY || !date2DDMMYYYY) return false;

  const [d1, m1, y1] = date1DDMMYYYY.split("-").map(Number);
  const [d2, m2, y2] = date2DDMMYYYY.split("-").map(Number);
  const dateObj1 = new Date(y1, m1 - 1, d1);
  const dateObj2 = new Date(y2, m2 - 1, d2);
  return dateObj1 > dateObj2;
}
function getRunsFromEventsWeek() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const employeeSet = new Set();
  for (let day = 0; day < 7; day++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + day);
    const dateKey = getDateKey(dayDate);
    let filteredEvents = runEventDatabase[dateKey];
    const serviceFilter = appliedFilters.find((f) => f.field === "service");
    const employeeFilter = appliedFilters.find(
      (f) => f.field === "employee" || f.field === "staff",
    );
    const runFilter = appliedFilters.find((f) => f.field === "run");
    if (runFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        runFilter.searchValues.includes(e.run_name),
      );
    }
    if (serviceFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        serviceFilter.searchValues.includes(e.service),
      );
    }
    if (employeeFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        employeeFilter.searchValues.includes(e.staff),
      );
    }
    filteredEvents.forEach((e) => {
      if (e.run_name !== undefined && e.run_name !== null) {
        employeeSet.add(e.run_name);
      }
    });
  }

  return Array.from(employeeSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
function getPersonFromEventsWeek() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const employeeSet = new Set();
  for (let day = 0; day < 7; day++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + day);
    const dateKey = getDateKey(dayDate);
    let filteredEvents = eventDatabase[dateKey];
    const personFilter = appliedFilters.find((f) => f.field === "persons");
    const serviceFilter = appliedFilters.find((f) => f.field === "service");
    const employeeFilter = appliedFilters.find(
      (f) => f.field === "employee" || f.field === "staff",
    );
    const runFilter = appliedFilters.find((f) => f.field === "run");
    if (runFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        runFilter.searchValues.includes(e.run_view),
      );
    }
    if (serviceFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        serviceFilter.searchValues.includes(e.service),
      );
    }
    if (personFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        personFilter.searchValues.includes(e.title),
      );
    }
    if (employeeFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        employeeFilter.searchValues.includes(e.employee),
      );
    }
    filteredEvents.forEach((e) => {
      if (e.title !== undefined && e.title !== null) {
        employeeSet.add(e.title);
      }
    });
  }

  return Array.from(employeeSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function getEmployeesFromEventsWeek() {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const employeeSet = new Set();
  for (let day = 0; day < 7; day++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + day);
    const dateKey = getDateKey(dayDate);
    let filteredEvents = staffRunEventDatabase[dateKey];
    const serviceFilter = appliedFilters.find((f) => f.field === "service");
    const employeeFilter = appliedFilters.find(
      (f) => f.field === "employee" || f.field === "staff",
    );
    const runFilter = appliedFilters.find((f) => f.field === "run");
    if (runFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        runFilter.searchValues.includes(e.run_name),
      );
    }
    if (serviceFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        serviceFilter.searchValues.includes(e.service),
      );
    }
    if (employeeFilter) {
      filteredEvents = filteredEvents.filter((e) =>
        employeeFilter.searchValues.includes(e.staff),
      );
    }
    filteredEvents.forEach((e) => {
      if (e.staff !== undefined && e.staff !== null) {
        employeeSet.add(e.staff);
      }
    });
  }

  return Array.from(employeeSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}
function getEmployeesFromEvents() {
  const dateKey = getCurrentDateKey();
  let filteredEvents = eventDatabase[dateKey];
  console.log(`events for:`, filteredEvents);

  const serviceFilter = appliedFilters.find((f) => f.field === "service");
  const personFilter = appliedFilters.find((f) => f.field === "persons");
  const employeeFilter = appliedFilters.find(
    (f) => f.field === "employee" || f.field === "staff",
  );
  const runFilter = appliedFilters.find((f) => f.field === "run");
  if (serviceFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      serviceFilter.searchValues.includes(e.service),
    );
  }

  if (personFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      personFilter.searchValues.includes(e.title),
    );
  }
  if (employeeFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      employeeFilter.searchValues.includes(e.employee),
    );
  }
  if (runFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      runFilter.searchValues.includes(e.run_view),
    );
  }
  const employeeSet = new Set();
  employeeSet.add("");
  filteredEvents.forEach((e) => {
    if (e.employee !== undefined && e.employee !== null) {
      employeeSet.add(e.employee);
    }
  });

  employeeSet.add("");

  return Array.from(employeeSet);
}

function getRunFromEvents() {
  const dateKey = getCurrentDateKey();
  let filteredEvents = eventDatabase[dateKey];

  const serviceFilter = appliedFilters.find((f) => f.field === "service");
  const personFilter = appliedFilters.find((f) => f.field === "persons");
  const employeeFilter = appliedFilters.find(
    (f) => f.field === "employee" || f.field === "staff",
  );
  const runFilter = appliedFilters.find((f) => f.field === "run");
  if (serviceFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      serviceFilter.searchValues.includes(e.service),
    );
  }

  if (personFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      personFilter.searchValues.includes(e.title),
    );
  }
  if (employeeFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      employeeFilter.searchValues.includes(e.employee),
    );
  }
  if (runFilter) {
    filteredEvents = filteredEvents.filter((e) =>
      runFilter.searchValues.includes(e.run_view),
    );
  }
  const employeeSet = new Set();
  employeeSet.add("");
  filteredEvents.forEach((e) => {
    if (e.employee !== undefined && e.employee !== null) {
      employeeSet.add(e.run_view);
    }
  });

  employeeSet.add("");

  return Array.from(employeeSet);
}
function toggleAvDropdown(ddId) {
  const dd = document.getElementById(ddId);
  if (
    dd
      .querySelector(".av-custom-dropdown-display")
      .classList.contains("disabled")
  )
    return;

  document.querySelectorAll(".av-custom-dropdown.active").forEach((el) => {
    if (el.id !== ddId) {
      el.classList.remove("active");
      // Clear search in closed dropdowns
      const si = el.querySelector(".av-custom-dropdown-search input");
      if (si) {
        si.value = "";
        avFilterOptions(el, "");
      }
    }
  });

  dd.classList.toggle("active");

  // Focus the search input when opened
  if (dd.classList.contains("active")) {
    const searchInput = dd.querySelector(".av-custom-dropdown-search input");
    if (searchInput) {
      searchInput.value = "";
      avFilterOptions(dd, "");
      setTimeout(() => searchInput.focus(), 50);
    }
  }
}

function avFilterOptions(ddEl, query) {
  const q = query.toLowerCase();
  const options = ddEl.querySelectorAll(".av-custom-dropdown-option");
  let visibleCount = 0;

  options.forEach((opt) => {
    const match = opt.textContent.toLowerCase().includes(q);
    opt.style.display = match ? "block" : "none";
    if (match) visibleCount++;
  });

  // Show/hide no results message
  let noResults = ddEl.querySelector(".av-no-results");
  if (!noResults) {
    noResults = document.createElement("div");
    noResults.className = "av-no-results";
    noResults.textContent = "No results found";
    ddEl.querySelector(".av-custom-dropdown-options").appendChild(noResults);
  }
  noResults.style.display = visibleCount === 0 ? "block" : "none";
}

function selectAvOption(ddId, hiddenId, textId, value) {
  document.getElementById(hiddenId).value = value;

  const textEl = document.getElementById(textId);
  textEl.textContent = value;
  textEl.style.color = "#1f2937";

  // Mark selected option
  const dd = document.getElementById(ddId);
  dd.querySelectorAll(".av-custom-dropdown-option").forEach((opt) => {
    opt.classList.toggle("selected", opt.textContent === value);
  });

  dd.classList.remove("active");

  // If service changed, refresh person dropdown
  if (ddId === "av_service_dd") {
    onAddVisitServiceChange(value);
  }
  if (value === "Cancelled" && hiddenId === "av_status_val") {
    document.getElementById("av_cancel_row").style.display = "grid";
  } else if (hiddenId === "av_status_val") {
    document.getElementById("av_cancel_row").style.display = "none";
    document.getElementById("av_cancel_val").value = "";
    document.getElementById("av_cancel_text").textContent = "Select";
  }
}

function onAddVisitServiceChange(service) {
  const personDisplay = document.getElementById("av_person_display");
  const personOptions = document.getElementById("av_person_options");
  const personText = document.getElementById("av_person_text");
  const personVal = document.getElementById("av_person_val");

  // Reset person
  personText.textContent = "Select person";
  personText.style.color = "#9ca3af";
  personVal.value = "";
  personOptions.innerHTML = "";
  personOptions.innerHTML = `
  <div class="av-custom-dropdown-search">
    <input type="text" placeholder="Search..." oninput="avFilterOptions(document.getElementById('av_person_dd'), this.value)" onclick="event.stopPropagation()" />
  </div>
`;
  if (!service) {
    personDisplay.classList.add("disabled");
    return;
  }

  // Enable person dropdown
  personDisplay.classList.remove("disabled");

  const persons = allPersonDetails
    .filter((s) => s.service.includes(service))
    .map((s) => s.name);

  console.log(persons);

  persons.forEach((p) => {
    const opt = document.createElement("div");
    opt.className = "av-custom-dropdown-option";
    opt.textContent = p;
    opt.onclick = () =>
      selectAvOption("av_person_dd", "av_person_val", "av_person_text", p);
    personOptions.appendChild(opt);
  });
  console.log(JSON.stringify(allStaffDetails));

  if (!service) {
    avCurrentServiceStaff = [];
  } else {
    avCurrentServiceStaff = allStaffDetails
      .filter((s) => s.service.includes(service))
      .map((s) => s.name);
  }
  console.log("Service Name " + service);
  console.log(JSON.stringify(avCurrentServiceStaff));

  // Reset selected staff and re-render
  avSelectedStaff = [];
  avRenderStaffPills();
  avRenderStaffDropdown("", avCurrentServiceStaff);
}

function openAddVisitModal() {
  // Populate Service options
  const serviceOptions = document.getElementById("av_service_options");
  serviceOptions.innerHTML = "";
  let names = services_details.map((obj) => Object.keys(obj)[0]);
  names.forEach((svc) => {
    const opt = document.createElement("div");
    opt.className = "av-custom-dropdown-option";
    opt.textContent = svc;
    opt.onclick = () =>
      selectAvOption("av_service_dd", "av_service_val", "av_service_text", svc);
    serviceOptions.appendChild(opt);
  });
  document.getElementById("av_cancel_row").style.display = "none";
  document.getElementById("av_cancel_val").value = "";
  document.getElementById("av_cancel_text").textContent = "Select";
  // Reset all fields
  document.getElementById("av_service_text").textContent = "Select service";
  document.getElementById("av_service_text").style.color = "#9ca3af";
  document.getElementById("av_service_val").value = "";
  document.getElementById("av_duration").value = "";

  document.getElementById("avStaffSearchInput").value = "";

  document.getElementById("av_person_text").textContent = "Select person";
  document.getElementById("av_person_text").style.color = "#9ca3af";
  document.getElementById("av_person_val").value = "";
  document.getElementById("av_person_options").innerHTML = "";
  document.getElementById("av_person_display").classList.add("disabled"); // locked until service chosen

  initAvStaffMultiSelect();

  document.getElementById("av_status_text").textContent = "Not Started";
  document.getElementById("av_status_val").value = "Not Started";

  document.getElementById("av_title").value = "";
  document.getElementById("av_notes").value = "";
  document.getElementById("av_from").value = "";
  document.getElementById("av_to").value = "";

  // Pre-fill date to current calendar date
  const d =
    typeof currentDate !== "undefined" ? new Date(currentDate) : new Date();
  document.getElementById("av_date").value = d.toISOString().split("T")[0];

  // Close any open dropdowns
  document
    .querySelectorAll(".av-custom-dropdown.active")
    .forEach((el) => el.classList.remove("active"));

  document.getElementById("addVisitModal").classList.remove("hidden");
}

function closeAddVisitModal() {
  document.getElementById("addVisitModal").classList.add("hidden");
  document
    .querySelectorAll(".av-custom-dropdown.active")
    .forEach((el) => el.classList.remove("active"));
}

async function submitAddVisit() {
  const service = document.getElementById("av_service_val").value;
  const date = document.getElementById("av_date").value;
  const from = document.getElementById("av_from").value;
  const to = document.getElementById("av_to").value;
  const status = document.getElementById("av_status_val").value;
  const staff = avSelectedStaff;
  const cancel_notice = document.getElementById("av_cancel_val").value;

  if (!service || !date || !from || !to || !status) {
    showToast("Please fill in all required fields (*).");
    return;
  }
  if (status === "Cancelled" && !cancel_notice) {
    showToast("Please provide cancellation notice period.");
    return;
  }
  const cur_data = {
    service,
    person: document.getElementById("av_person_val").value,
    title: document.getElementById("av_title").value,
    date,
    from,
    to,
    status,
    staff,
    notes: document.getElementById("av_notes").value,
    duration: document.getElementById("av_duration").value,
    visit: document.getElementById("av_title").value,
    cancel_notice: cancel_notice,
  };
  // TODO: replace with your Zoho Creator API call
  console.log("New visit:", {
    service,
    person: document.getElementById("av_person_val").value,
    title: document.getElementById("av_title").value,
    date,
    from,
    to,
    status,
    staff,
    notes: document.getElementById("av_notes").value,
    duration: document.getElementById("av_duration").value,
    cancel_notice: cancel_notice,
  });
  showLoader();
  await createNewBookingZoho(cur_data);
  closeAddVisitModal();
  hideLoader();
}
async function createNewBookingZoho(evt) {
  let service_id;

  services_details.forEach((obj) => {
    if (obj[evt.service]) {
      service_id = obj[evt.service];
    }
  });

  let empId = [];
  evt.staff.forEach((name) => {
    empId.push(allStaffDetails.find((s) => s.name === name)?.id);
  });

  let personId = null;
  if (evt.person) {
    personId = allPersonDetails.find((p) => p.name === evt.person)?.id;
  }
  let date = formatDateDDMMYYYY(new Date(evt.date));
  let fromDateTime = `${date} ${evt.from}`;
  let toDateTime = `${date} ${evt.to}`;
  let startTime = `${evt.from}`;
  let endTime = `${evt.to}`;
  let duration = evt.duration;
  let visit = evt.visit;
  console.log("FINAL PAYLOAD:", {
    service_id,
    empId,
    personId,
    date,
    fromDateTime,
    toDateTime,
    startTime,
    endTime,
    duration,
    visit,
  });
  const fromData = {
    Site_Name: service_id,
    Care_Service_User: personId,
    Date_field1: date,
    Start_time: startTime,
    End_time: endTime,
    Duration: evt.duration,
    Manager_notes: evt.notes,
    Status: evt.status,
    Care_Providers: empId,
    Visit_Title: evt.visit,
    Select_Cancellation_Notice: evt.cancel_notice,
  };
  console.log(fromData);

  const config = {
    app_name: app_name,
    form_name: "Bookings",
    payload: {
      data: fromData,
    },
  };
  const add_res = await ZOHO.CREATOR.DATA.addRecords(config);
  if (add_res.code === 3000) {
    const newRecordId = add_res.data.ID;
    await getSingleBooking(newRecordId);
    const final_staff = evt.staff.filter((x) => !employees.includes(x));

    if (final_staff.length > 0) {
      let newEmpID = [];
      final_staff.forEach((name) => {
        newEmpID.push(allStaffDetails.find((s) => s.name === name)?.id);
      });

      await fetchNewStaffDetails(newEmpID);
    }
    if (currentView === "day") {
      if (currentViewType === "employee") {
        re_renderDayView();
      } else if (currentViewType === "run") {
        re_renderRunView();
      }
    } else if (currentView === "week") {
      if (currentViewType === "employee") {
        renderWeekView();
      } else if (currentViewType === "person") {
        await renderWeekPersonView();
      }
    }
  }
}

document.addEventListener("click", function (e) {
  // Close av dropdowns when clicking outside
  if (!e.target.closest(".av-custom-dropdown")) {
    document
      .querySelectorAll(".av-custom-dropdown.active")
      .forEach((el) => el.classList.remove("active"));
  }

  // Close modal when clicking the backdrop
  const modal = document.getElementById("addVisitModal");
  if (modal && e.target === modal) {
    closeAddVisitModal();
  }
});

async function fetchNewStaffDetails(staffNames) {
  const staffList = `[${staffNames.join(",")}]`;
  employees_config = {
    app_name,
    report_name: "Employees_Report",
    criteria: `ID == ${staffList}`,
  };
  const employee_res = await ZOHO.CREATOR.DATA.getRecords(employees_config);
  if (employee_res.code === 3000 && employee_res.data?.length) {
    for (const rec of employee_res.data) {
      console.log(rec);
      const emp_service = rec.Sites ?? [];
      console.log(`${name} => ${JSON.stringify(rec.Sites)}`);

      const serviceList = emp_service.map((site) => ({
        id: site.ID,
        zc_display: site.zc_display_value,
      }));
      const name = rec?.Name1;
      const staffId = rec?.ID;
      let week_hours = rec?.Contracted_Hours_Per_Week ?? 0.0;
      let skills = (rec?.Skills_Experience_Capacity || [])
        .map((s) => s?.Skills_Name)
        .filter(Boolean);
      employees.push(name);
      employeeDetails.push({
        name,
        id: staffId,
        skills,
        service: serviceList,
        week_hours: week_hours,
      });
    }
  }
  employees.sort();
}
// ── Add Visit Modal - Staff Multi Select ──────────────────────
async function getSingleBooking(bookingId) {
  var booking = {
    app_name: app_name,
    report_name: "Bookings_Backend",
    id: bookingId,
  };
  booking_resp = await ZOHO.CREATOR.DATA.getRecordById(booking);
  console.log(booking_resp);

  try {
    if (booking_resp.code === 3000) {
      let date_booking = [];
      const rec = booking_resp.data;
      if (rec.Care_Providers.length === 0) {
        let cur_book = createBookingObject(rec, null);
        date_booking.push(cur_book);
      }

      rec.Care_Providers.forEach(function (emp) {
        let cur_book = createBookingObject(rec, emp);
        date_booking.push(cur_book);
      });

      const key = formatDateYYYYMMDD(currentDate);

      if (!eventDatabase[key]) {
        eventDatabase[key] = [];
      }
      eventDatabase[key].push(...date_booking);
    }
  } catch (err) {
    console.error("Error fetching booking details:", err);
  }
}
function initAvStaffMultiSelect() {
  avSelectedStaff = [];
  avRenderStaffPills();
  // avRenderStaffDropdown("");

  const input = document.getElementById("avStaffSearchInput");
  const dropdown = document.getElementById("avStaffDropdown");

  // Fresh listeners — clone to remove old ones
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  // In newInput.oninput:
  newInput.oninput = () =>
    avRenderStaffDropdown(newInput.value, avCurrentServiceStaff);

  // In newInput.onkeydown (Backspace handler):
  avRenderStaffDropdown("", avCurrentServiceStaff);

  newInput.onfocus = () => dropdown.classList.add("active");

  newInput.oninput = () =>
    avRenderStaffDropdown(newInput.value, avCurrentServiceStaff);

  newInput.onkeydown = (e) => {
    if (
      e.key === "Backspace" &&
      newInput.value === "" &&
      avSelectedStaff.length
    ) {
      avSelectedStaff.pop();
      avRenderStaffPills();
      avRenderStaffDropdown("");
    }
  };

  document.addEventListener("click", function avOutsideClick(e) {
    if (!document.getElementById("avStaffMultiSelect")?.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
}

function avRenderStaffPills() {
  const container = document.getElementById("avStaffMultiInput");
  const input = document.getElementById("avStaffSearchInput");

  container.querySelectorAll(".multi-pill").forEach((p) => p.remove());

  avSelectedStaff.forEach((name, index) => {
    const pill = document.createElement("div");
    pill.className = "multi-pill";
    pill.innerHTML = `<span>${name}</span><button>&times;</button>`;
    pill.querySelector("button").onclick = () => {
      avSelectedStaff.splice(index, 1);
      avRenderStaffPills();
      avRenderStaffDropdown("");
    };
    container.insertBefore(pill, input);
  });
}

function avRenderStaffDropdown(query, allowedStaff = null) {
  const dropdown = document.getElementById("avStaffDropdown");
  dropdown.innerHTML = "";
  const q = query.toLowerCase();

  // If no service selected yet, use full employees list
  const pool =
    allowedStaff !== null && allowedStaff.length > 0
      ? allowedStaff
      : typeof employees !== "undefined"
        ? employees
        : [];

  pool
    .filter(
      (name) =>
        name &&
        !avSelectedStaff.includes(name) &&
        name.toLowerCase().includes(q),
    )
    .forEach((name) => {
      const opt = document.createElement("div");
      opt.className = "multi-option";
      opt.textContent = name;
      opt.onclick = () => {
        avSelectedStaff.push(name);
        document.getElementById("avStaffSearchInput").value = "";
        avRenderStaffPills();
        avRenderStaffDropdown("", avCurrentServiceStaff);
      };
      dropdown.appendChild(opt);
    });

  dropdown.classList.add("active");
}
let avSelectedStaff = [];
let avCurrentServiceStaff = [];

let allPerson = [];
let allPersonDetails = [];
async function getAllPersonDetails() {
  allPerson = [];
  const serviceList = `[${services.join(",")}]`;
  const criteria_2 = `Primary_Site.ID == ${serviceList} && Status == "Active"`;
  var staffs = {
    app_name: app_name,
    report_name: "Customers_Report",
    criteria: criteria_2,
  };
  staff_resp = await ZOHO.CREATOR.DATA.getRecords(staffs);
  // console.log(staff_resp);
  staff_resp.data.forEach(function (rec) {
    const name = rec?.Name ?? "";

    if (!allPerson.includes(name) && name !== "") {
      allPerson.push(name);
      allPersonDetails.push({
        name: name,
        id: rec?.ID,
        service: rec?.Primary_Site?.zc_display_value ?? "",
      });
    }
  });
  // console.log(allStaff);
  console.log(allPersonDetails);
}

function calcAvDuration() {
  const from = document.getElementById("av_from").value;
  const to = document.getElementById("av_to").value;
  const durationEl = document.getElementById("av_duration");

  if (!from || !to) {
    durationEl.value = "";
    return;
  }

  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);

  let totalMinutes = th * 60 + tm - (fh * 60 + fm);

  if (totalMinutes <= 0) {
    durationEl.value = "Invalid range";
    return;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  durationEl.value = `${hh}:${mm}`;
}

// ── Add Schedule Modal ────────────────────────────────────────

function toggleSchDropdown(ddId) {
  const dd = document.getElementById(ddId);
  if (
    dd.querySelector(".sch-dropdown-trigger").classList.contains("sch-disabled")
  )
    return;

  // Close all other sch dropdowns
  document.querySelectorAll(".sch-dropdown.sch-open").forEach((el) => {
    if (el.id !== ddId) {
      el.classList.remove("sch-open");
      const si = el.querySelector(".sch-search-box input");
      if (si) {
        si.value = "";
        schFilterItems(el.id, "");
      }
    }
  });

  dd.classList.toggle("sch-open");

  if (dd.classList.contains("sch-open")) {
    const si = dd.querySelector(".sch-search-box input");
    if (si) {
      si.value = "";
      schFilterItems(ddId, "");
      setTimeout(() => si.focus(), 50);
    }
  }
}

function selectSchOption(ddId, hiddenId, textId, value) {
  document.getElementById(hiddenId).value = value;

  const textEl = document.getElementById(textId);
  textEl.textContent = value;
  textEl.style.color = "#1f2937";

  document
    .getElementById(ddId)
    .querySelectorAll(".sch-dropdown-item")
    .forEach((opt) => {
      opt.classList.toggle("sch-selected", opt.textContent.trim() === value);
    });

  document.getElementById(ddId).classList.remove("sch-open");

  // Trigger dependent dropdowns
  if (ddId === "sch_site_dd") onSchSiteChange(value);
  if (ddId === "sch_staff_dd") onSchStaffChange(value);
  if (ddId === "sch_avail_dd") onSchAvailChange(value);
}

function onSchAvailChange(status) {
  const typeRow = document.getElementById("sch_type_row");
  const reasonRow = document.getElementById("sch_reason_row");
  const runRow = document.getElementById("sch_run_row");
  const runTrigger = document.getElementById("sch_run_trigger");

  if (status === "Off") {
    // Show type & reason
    typeRow.style.display = "grid";
    reasonRow.style.display = "grid";

    // Hide & reset run
    runRow.style.display = "none";
    document.getElementById("sch_run_text").textContent = "Select run";
    document.getElementById("sch_run_text").style.color = "#9ca3af";
    document.getElementById("sch_run_val").value = "";
    runTrigger.classList.add("sch-disabled");
  } else {
    // Hide & reset type and reason
    typeRow.style.display = "none";
    reasonRow.style.display = "none";
    document.getElementById("sch_type_text").textContent = "Select Type";
    document.getElementById("sch_type_text").style.color = "#9ca3af";
    document.getElementById("sch_type_val").value = "";
    document.getElementById("sch_reason").value = "";

    // Show run row
    runRow.style.display = "grid";

    // Re-enable run only if a site is already selected (run options already built)
    const siteVal = document.getElementById("sch_site_val").value;
    const runMenu = document.getElementById("sch_run_menu");
    const hasItems = runMenu.querySelectorAll(".sch-dropdown-item").length > 0;

    if (siteVal && hasItems) {
      runTrigger.classList.remove("sch-disabled");
    } else {
      runTrigger.classList.add("sch-disabled");
    }
  }
}

function schFilterItems(ddId, query) {
  const dd = document.getElementById(ddId);
  const q = query.toLowerCase();
  const items = dd.querySelectorAll(".sch-dropdown-item");
  let visible = 0;

  items.forEach((item) => {
    const match = item.textContent.toLowerCase().includes(q);
    item.style.display = match ? "block" : "none";
    if (match) visible++;
  });

  let noRes = dd.querySelector(".sch-no-results");
  if (!noRes) {
    noRes = document.createElement("div");
    noRes.className = "sch-no-results";
    noRes.textContent = "No results found";
    dd.querySelector(".sch-dropdown-menu").appendChild(noRes);
  }
  noRes.style.display = visible === 0 ? "block" : "none";
}

function schBuildItems(menuEl, items, ddId, hiddenId, textId) {
  // Remove old items but keep search box and no-results
  menuEl.querySelectorAll(".sch-dropdown-item").forEach((el) => el.remove());
  const noRes = menuEl.querySelector(".sch-no-results");
  if (noRes) noRes.remove();

  items.forEach((val) => {
    const item = document.createElement("div");
    item.className = "sch-dropdown-item";
    item.textContent = val;
    item.onclick = () => selectSchOption(ddId, hiddenId, textId, val);
    menuEl.appendChild(item);
  });
}

function onSchSiteChange(site) {
  // Reset & lock Staff
  const staffTrigger = document.getElementById("sch_staff_trigger");
  const staffMenu = document.getElementById("sch_staff_menu");
  staffTrigger.classList.add("sch-disabled");
  document.getElementById("sch_staff_text").textContent = "Select Staff";
  document.getElementById("sch_staff_text").style.color = "#9ca3af";
  document.getElementById("sch_staff_val").value = "";

  // Reset & lock Run
  const runTrigger = document.getElementById("sch_run_trigger");
  const runMenu = document.getElementById("sch_run_menu");
  runTrigger.classList.add("sch-disabled");
  document.getElementById("sch_run_text").textContent = "Select run";
  document.getElementById("sch_run_text").style.color = "#9ca3af";
  document.getElementById("sch_run_val").value = "";

  if (!site) return;

  // Populate Staff based on site — uses your existing employeeDetails array
  console.log(allStaffDetails);

  const siteStaff = allStaffDetails
    .filter((s) => s.service.includes(site))
    .map((s) => s.name);

  schBuildItems(
    staffMenu,
    siteStaff,
    "sch_staff_dd",
    "sch_staff_val",
    "sch_staff_text",
  );
  staffTrigger.classList.remove("sch-disabled");

  const runNames = site_run_details[site] || [];

  schBuildItems(runMenu, runNames, "sch_run_dd", "sch_run_val", "sch_run_text");
  runTrigger.classList.remove("sch-disabled");
}

function onSchStaffChange(staff) {
  // Reset & lock Run
  // const runTrigger = document.getElementById("sch_run_trigger");
  // const runMenu = document.getElementById("sch_run_menu");
  // runTrigger.classList.add("sch-disabled");
  // document.getElementById("sch_run_text").textContent = "Select run";
  // document.getElementById("sch_run_text").style.color = "#9ca3af";
  // document.getElementById("sch_run_val").value = "";
  // if (!staff) return;
  // // Populate Run — uses your existing runRowDetails object {runName: id}
  // console.log(staff);
  // const runNames = site_run_details[staff] || [];
  // schBuildItems(runMenu, runNames, "sch_run_dd", "sch_run_val", "sch_run_text");
  // runTrigger.classList.remove("sch-disabled");
}

function schCalcDuration() {
  const start = document.getElementById("sch_start_time").value;
  const end = document.getElementById("sch_end_time").value;
  if (!start || !end) return;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;

  const brk = document.getElementById("sch_break").value || "00:00";
  console.log(brk);

  const [bh, bm] = brk.split(":").map(Number);
  mins -= bh * 60 + bm;
  if (mins < 0) mins = 0;

  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");
  document.getElementById("sch_duration").value = `${hh}:${mm}`;
}

function openAddScheduleModal() {
  const siteMenu = document.getElementById("sch_site_menu");
  const siteNames = services_details.map((obj) => Object.keys(obj)[0]);
  schBuildItems(
    siteMenu,
    siteNames,
    "sch_site_dd",
    "sch_site_val",
    "sch_site_text",
  );

  // Reset all fields
  document.getElementById("sch_site_text").textContent = "Select site";
  document.getElementById("sch_site_text").style.color = "#9ca3af";
  document.getElementById("sch_site_val").value = "";
  document.getElementById("sch_run_row").style.display = "grid";

  document.getElementById("sch_staff_text").textContent = "Select Staff";
  document.getElementById("sch_staff_text").style.color = "#9ca3af";
  document.getElementById("sch_staff_val").value = "";
  document.getElementById("sch_staff_trigger").classList.add("sch-disabled");

  document.getElementById("sch_avail_text").textContent = "Available";
  document.getElementById("sch_avail_val").value = "Available";

  document.getElementById("sch_run_text").textContent = "Select run";
  document.getElementById("sch_run_text").style.color = "#9ca3af";
  document.getElementById("sch_run_val").value = "";
  document.getElementById("sch_run_trigger").classList.add("sch-disabled");

  document.getElementById("sch_type_text").textContent = "Select Type";
  document.getElementById("sch_type_text").style.color = "#9ca3af";
  document.getElementById("sch_type_val").value = "";
  document.getElementById("sch_reason").value = "";
  document.getElementById("sch_type_row").style.display = "none";
  document.getElementById("sch_reason_row").style.display = "none";

  // Pre-fill dates to current calendar date
  const d =
    typeof currentDate !== "undefined" ? new Date(currentDate) : new Date();
  const dateStr = d.toISOString().split("T")[0];
  document.getElementById("sch_from_date").value = dateStr;
  document.getElementById("sch_to_date").value = dateStr;
  document.getElementById("sch_start_time").value = "";
  document.getElementById("sch_end_time").value = "";
  document.getElementById("sch_break").value = "00:00";
  document.getElementById("sch_duration").value = "";
  flatpickr(document.getElementById("sch_break"), {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
  });
  // Close any open dropdowns
  document
    .querySelectorAll(".sch-dropdown.sch-open")
    .forEach((el) => el.classList.remove("sch-open"));

  document.getElementById("addScheduleModal").classList.remove("hidden");
}

function closeAddScheduleModal() {
  document.getElementById("addScheduleModal").classList.add("hidden");
  document
    .querySelectorAll(".sch-dropdown.sch-open")
    .forEach((el) => el.classList.remove("sch-open"));
}

async function submitAddSchedule() {
  const site = document.getElementById("sch_site_val").value;
  const staff = document.getElementById("sch_staff_val").value;

  const from = document.getElementById("sch_from_date").value;
  const to = document.getElementById("sch_to_date").value;
  const start = document.getElementById("sch_start_time").value;
  const end = document.getElementById("sch_end_time").value;

  const avail = document.getElementById("sch_avail_val").value;
  const type = document.getElementById("sch_type_val").value;
  const run = document.getElementById("sch_run_val").value;
  if (avail === "Off" && !type) {
    showToast("Please select a Type.");
    return;
  }

  if (!site || !staff || !avail || !from || !to || !start || !end) {
    showToast("Please fill in all required fields (*).");
    return;
  }

  const dayRecords = staffRunEventDatabase[from] || [];

  // Records for this staff on that day
  const staffRecords = dayRecords.filter((r) => r.staff === staff);
  const hasOtherRecords = staffRecords.length > 0;
  if (hasOtherRecords && !run) {
    showToast(
      "Run is required when multiple entries exist for this staff on the same day.",
      "error",
    );
    return;
  }

  // TODO: replace with your Zoho Creator API call
  console.log("New schedule:", {
    site,
    staff,
    avail,
    run: document.getElementById("sch_run_val").value,
    fromDate: from,
    toDate: to,
    startTime: start,
    endTime: end,
    break: document.getElementById("sch_break").value,
    duration: document.getElementById("sch_duration").value,
    type: type,
    reason: document.getElementById("sch_reason").value,
  });
  const finalData = {
    site,
    staff,
    avail,
    run: document.getElementById("sch_run_val").value,
    fromDate: from,
    toDate: to,
    startTime: start,
    endTime: end,
    break: document.getElementById("sch_break").value,
    duration: document.getElementById("sch_duration").value,
    type: type,
    reason: document.getElementById("sch_reason").value,
  };
  showLoader();
  await createNewVisitInZoho(finalData);
  closeAddScheduleModal();
  hideLoader();
}
async function createNewVisitInZoho(evt) {
  let service_id;
  services_details.forEach((obj) => {
    if (obj[evt.site]) {
      service_id = obj[evt.site];
    }
  });
  let run_id = runRowDetails[evt.run];
  const empId = getEmployeeIdByName(evt.staff);
  const formData = {
    Site_Name: service_id,
    Staff: empId,
    Care_Group: run_id,
    Available_Status: evt.avail,
    Date_From: formatDateForZoho(evt.fromDate),
    Date_To: formatDateForZoho(evt.toDate),
    Start_Time: evt.startTime,
    End_Time: evt.endTime,
    Break: evt.Break ?? "00:00",
    Reason_for_Leave: evt.reason,
    leave_Type: evt.type,
  };
  try {
    const config = {
      app_name: app_name,
      form_name: "Daily_Staff_schedule",
      payload: {
        data: formData,
      },
    };

    const add_res = await ZOHO.CREATOR.DATA.addRecords(config);
    console.log(
      `${currentView} - ${currentViewType} - ${JSON.stringify(add_res)} `,
    );
    await getWeekStaffRunDetails();
    if (currentViewType === "staff") {
      await renderWeekStaffView();
    } else if (currentViewType === "run") {
      await renderWeekRunView();
    }
  } catch (error) {
    console.error("Error creating schedule:", error);
    alert("Failed to create schedule. Please try again.");
  }
  hideLoader();
}
document.addEventListener("click", function (e) {
  // Close sch dropdowns when clicking outside
  if (!e.target.closest(".sch-dropdown")) {
    document
      .querySelectorAll(".sch-dropdown.sch-open")
      .forEach((el) => el.classList.remove("sch-open"));
  }

  // Close modal when clicking backdrop
  const modal = document.getElementById("addScheduleModal");
  if (modal && e.target === modal) closeAddScheduleModal();
});

function openPopBasedView() {
  if (
    currentView === "week" &&
    (currentViewType === "staff" || currentViewType === "run")
  ) {
    openAddScheduleModal();
  } else {
    openAddVisitModal();
  }
}

function closeAllRunMenus() {
  document.querySelectorAll(".run-dots-menu").forEach((m) => m.remove());
}
document.addEventListener("click", function () {
  closeAllRunMenus();
});

async function publishShift(run, dateKey) {
  showLoader();
  const config = {
    http_method: "POST",
    api_name: "Publish_Shift",
    public_key: "kNTGUgPh6psy9VVRMsVbRWbtq",
    payload: {
      run: runRowDetails[run],
      date: convertYYYYMMDDtoDDMMYYYY(dateKey),
      app_name: app_name,
    },
  };
  console.log(config);
  try {
    const response = await ZOHO.CREATOR.DATA.invokeCustomApi(config);
    console.log(response);
    await getWeekPublishDetails();
    await re_renderWeekRunView();
  } catch (err) {
    console.error("Error publishing shift:", err);
    // alert("Failed to publish shift. Please try again.");
  }
  hideLoader();
}
