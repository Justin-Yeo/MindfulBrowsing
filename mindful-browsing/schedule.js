// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    slotDuration: '00:30:00',
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    allDaySlot: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    eventClassNames: function(arg) {
      return [`challenge-${arg.event.extendedProps.challengeType}`];
    },
    select: function(info) {
      showBlockModal('create', {
        start: info.start,
        end: info.end
      });
    },
    eventClick: function(info) {
      showBlockModal('edit', info.event);
    },
    eventDrop: function(info) {
      handleEventDrop(info);
    }
  });
  calendar.render();
  
  // Store calendar instance globally
  window.calendar = calendar;
  
  // Load initial data
  loadScheduleData();
});

// Load schedule data from storage
function loadScheduleData() {
  chrome.storage.sync.get(['scheduleBlocks', 'websites', 'fallbackChallenge'], (data) => {
    // Load fallback challenge settings
    const fallback = data.fallbackChallenge || { enabled: false, type: 'wait' };
    document.getElementById('fallbackEnabled').checked = fallback.enabled;
    document.getElementById('fallbackType').value = fallback.type;
    
    // Load websites list
    const websites = data.websites || [];
    renderWebsitesList(websites);
    
    // Load schedule blocks
    const blocks = data.scheduleBlocks || [];
    blocks.forEach(block => {
      window.calendar.addEvent({
        title: `${block.challengeType.toUpperCase()} - ${block.websites.length} sites`,
        start: block.startTime,
        end: block.endTime,
        daysOfWeek: block.days,
        extendedProps: {
          challengeType: block.challengeType,
          websites: block.websites
        }
      });
    });
  });
}

// Render websites list
function renderWebsitesList(websites) {
  const websitesList = document.getElementById('websitesList');
  websitesList.innerHTML = '';
  websites.forEach(site => {
    const li = document.createElement('li');
    li.textContent = site;
    websitesList.appendChild(li);
  });
}

// Show modal for creating/editing blocks
function showBlockModal(mode, data) {
  const modal = document.getElementById('blockModal');
  const startTime = document.getElementById('blockStartTime');
  const endTime = document.getElementById('blockEndTime');
  const challengeType = document.getElementById('blockChallengeType');
  const websitesContainer = document.getElementById('blockWebsites');
  
  modal.style.display = 'block';
  
  // Reset form
  document.querySelectorAll('.day-checkboxes input').forEach(cb => cb.checked = false);
  websitesContainer.innerHTML = '';
  
  // Load websites
  chrome.storage.sync.get(['websites'], (data) => {
    const websites = data.websites || [];
    websites.forEach(site => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = site;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${site}`));
      websitesContainer.appendChild(label);
    });
    
    if (mode === 'edit') {
      // Fill in existing data
      startTime.value = data.start.toTimeString().slice(0, 5);
      endTime.value = data.end.toTimeString().slice(0, 5);
      challengeType.value = data.extendedProps.challengeType;
      
      // Check relevant days
      data.daysOfWeek.forEach(day => {
        document.querySelector(`input[value="${day}"]`).checked = true;
      });
      
      // Check relevant websites
      data.extendedProps.websites.forEach(site => {
        const checkbox = websitesContainer.querySelector(`input[value="${site}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
  });
}

// Handle event drop (drag and drop)
function handleEventDrop(info) {
  const event = info.event;
  const overlap = checkOverlap(event);
  
  if (overlap) {
    info.revert();
    alert('This time slot overlaps with an existing schedule. Please choose a different time.');
    return;
  }
  
  saveScheduleData();
}

// Check for schedule overlap
function checkOverlap(newEvent) {
  const events = window.calendar.getEvents();
  for (let event of events) {
    if (event === newEvent) continue;
    
    // Check if events share any days
    const sharedDays = newEvent.daysOfWeek.filter(day => 
      event.daysOfWeek.includes(day)
    );
    
    if (sharedDays.length === 0) continue;
    
    // Check time overlap
    if (newEvent.start < event.end && newEvent.end > event.start) {
      return true;
    }
  }
  return false;
}

// Save schedule data
function saveScheduleData() {
  const events = window.calendar.getEvents();
  const blocks = events.map(event => ({
    startTime: event.start.toTimeString().slice(0, 5),
    endTime: event.end.toTimeString().slice(0, 5),
    days: event.daysOfWeek,
    challengeType: event.extendedProps.challengeType,
    websites: event.extendedProps.websites
  }));
  
  const fallbackChallenge = {
    enabled: document.getElementById('fallbackEnabled').checked,
    type: document.getElementById('fallbackType').value
  };
  
  chrome.storage.sync.set({
    scheduleBlocks: blocks,
    fallbackChallenge: fallbackChallenge
  }, () => {
    console.log('Schedule data saved');
  });
}

// Event Listeners
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('blockModal').style.display = 'none';
});

document.getElementById('saveBlock').addEventListener('click', () => {
  const startTime = document.getElementById('blockStartTime').value;
  const endTime = document.getElementById('blockEndTime').value;
  const challengeType = document.getElementById('blockChallengeType').value;
  
  const selectedDays = Array.from(document.querySelectorAll('.day-checkboxes input:checked'))
    .map(cb => cb.value);
    
  const selectedWebsites = Array.from(document.querySelectorAll('#blockWebsites input:checked'))
    .map(cb => cb.value);
  
  if (selectedDays.length === 0) {
    alert('Please select at least one day');
    return;
  }
  
  if (selectedWebsites.length === 0) {
    alert('Please select at least one website');
    return;
  }
  
  const newEvent = {
    title: `${challengeType.toUpperCase()} - ${selectedWebsites.length} sites`,
    startTime: startTime,
    endTime: endTime,
    daysOfWeek: selectedDays,
    extendedProps: {
      challengeType: challengeType,
      websites: selectedWebsites
    }
  };
  
  if (checkOverlap(newEvent)) {
    alert('This schedule overlaps with an existing one. Please choose a different time.');
    return;
  }
  
  window.calendar.addEvent(newEvent);
  saveScheduleData();
  document.getElementById('blockModal').style.display = 'none';
});

document.getElementById('deleteBlock').addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this schedule block?')) {
    // Implementation needed for delete functionality
    document.getElementById('blockModal').style.display = 'none';
  }
});

document.getElementById('copyBlock').addEventListener('click', () => {
  // Implementation needed for copy functionality
});

// Save fallback settings when changed
document.getElementById('fallbackEnabled').addEventListener('change', saveScheduleData);
document.getElementById('fallbackType').addEventListener('change', saveScheduleData); 