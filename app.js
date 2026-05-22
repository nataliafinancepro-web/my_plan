const TASKS_STORAGE_KEY = "planner.tasks";
const SETTINGS_STORAGE_KEY = "planner.settings";
const STORAGE_READ_ERROR_MESSAGE = "Данные не удалось прочитать. Создано новое пустое хранилище.";

function getTodayLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateTaskId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";

  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `task_${Date.now()}_${suffix}`;
}

function createDefaultSettings() {
  return {
    selectedDate: getTodayLocalDateString(),
    weekStartsOn: "monday",
    schemaVersion: 1,
  };
}

function warnAboutStorageReset() {
  console.warn(STORAGE_READ_ERROR_MESSAGE);
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);

  if (rawTasks === null) {
    saveTasks([]);
    return [];
  }

  try {
    const tasks = JSON.parse(rawTasks);

    if (!Array.isArray(tasks)) {
      throw new Error("Tasks storage must be an array.");
    }

    return tasks;
  } catch (error) {
    warnAboutStorageReset();
    saveTasks([]);
    return [];
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (rawSettings === null) {
    const defaultSettings = createDefaultSettings();
    saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const settings = JSON.parse(rawSettings);

    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new Error("Settings storage must be an object.");
    }

    const defaultSettings = createDefaultSettings();
    const normalizedSettings = {
      selectedDate: /^\d{4}-\d{2}-\d{2}$/.test(settings.selectedDate)
        ? settings.selectedDate
        : defaultSettings.selectedDate,
      weekStartsOn: settings.weekStartsOn === "monday" ? settings.weekStartsOn : defaultSettings.weekStartsOn,
      schemaVersion: settings.schemaVersion === 1 ? settings.schemaVersion : defaultSettings.schemaVersion,
    };

    if (JSON.stringify(normalizedSettings) !== JSON.stringify(settings)) {
      saveSettings(normalizedSettings);
    }

    return normalizedSettings;
  } catch (error) {
    warnAboutStorageReset();

    const defaultSettings = createDefaultSettings();
    saveSettings(defaultSettings);
    return defaultSettings;
  }
}

function initializeStorage() {
  const tasks = loadTasks();
  const settings = loadSettings();

  return { tasks, settings };
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatSelectedDate(dateString) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(parseLocalDate(dateString));
}

function getTaskWord(count) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "задач";
  }

  if (lastDigit === 1) {
    return "задача";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "задачи";
  }

  return "задач";
}

function getPriorityLabel(priority) {
  const labels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return labels[priority] || labels.medium;
}

function getRepeatLabel(repeatType) {
  const labels = {
    daily: "Daily",
    weekly: "Weekly",
  };

  return labels[repeatType] || "None";
}

function createTask({ text, selectedDate, priority, repeatType }) {
  const now = new Date().toISOString();
  const normalizedRepeatType = repeatType === "none" ? null : repeatType;

  return {
    id: generateTaskId(),
    text,
    date: selectedDate,
    status: "todo",
    priority,
    isRecurring: normalizedRepeatType !== null,
    repeatType: normalizedRepeatType,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    movedFromDate: null,
    movedToDate: null,
  };
}

function renderSelectedDate(dateString) {
  const selectedDate = document.querySelector(".selected-date");

  if (!selectedDate) {
    return;
  }

  selectedDate.dateTime = dateString;
  selectedDate.textContent = formatSelectedDate(dateString);
}

function renderTasks(tasks, selectedDate) {
  const taskList = document.querySelector(".task-list");
  const taskCount = document.querySelector(".task-count");

  if (!taskList) {
    return;
  }

  const visibleTasks = tasks.filter((task) => (
    task.date === selectedDate && task.status !== "overdue"
  ));

  taskList.textContent = "";

  if (taskCount) {
    taskCount.textContent = `${visibleTasks.length} ${getTaskWord(visibleTasks.length)}`;
  }

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "task-empty";
    emptyState.textContent = "На сегодня свободно. Самое время выбрать один спокойный фокус.";
    taskList.append(emptyState);
    return;
  }

  visibleTasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = `task-card priority-${task.priority || "medium"}`;
    card.dataset.taskId = task.id;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");

    title.textContent = task.text;
    meta.className = "task-meta";
    meta.textContent = `${getPriorityLabel(task.priority)} · ${getRepeatLabel(task.repeatType)}`;

    content.append(title, meta);
    card.append(content);
    taskList.append(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const backlogToggle = document.querySelector(".backlog-toggle");
  const backlog = document.querySelector("#backlog");
  const taskForm = document.querySelector(".task-form");
  const todayButton = document.querySelector(".today-button");
  const storage = initializeStorage();
  let isAddLocked = false;

  renderSelectedDate(storage.settings.selectedDate);
  renderTasks(storage.tasks, storage.settings.selectedDate);

  if (todayButton) {
    todayButton.addEventListener("click", () => {
      storage.settings.selectedDate = getTodayLocalDateString();
      saveSettings(storage.settings);
      renderSelectedDate(storage.settings.selectedDate);
      renderTasks(storage.tasks, storage.settings.selectedDate);
    });
  }

  if (taskForm) {
    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const textInput = taskForm.querySelector(".task-input");
      const taskSelects = taskForm.querySelectorAll(".task-select");
      const prioritySelect = taskSelects[0];
      const repeatSelect = taskSelects[1];
      const submitButton = taskForm.querySelector("button[type='submit']");

      if (isAddLocked) {
        return;
      }

      isAddLocked = true;

      if (submitButton) {
        submitButton.disabled = true;
      }

      window.setTimeout(() => {
        isAddLocked = false;

        if (submitButton) {
          submitButton.disabled = false;
        }
      }, 300);

      const text = textInput ? textInput.value.trim() : "";

      if (!text) {
        alert("Введите текст задачи");

        if (textInput) {
          textInput.focus();
        }

        return;
      }

      const task = createTask({
        text,
        selectedDate: storage.settings.selectedDate,
        priority: prioritySelect ? prioritySelect.value : "medium",
        repeatType: repeatSelect ? repeatSelect.value : "none",
      });

      storage.tasks.push(task);
      saveTasks(storage.tasks);
      renderTasks(storage.tasks, storage.settings.selectedDate);

      if (textInput) {
        textInput.value = "";
        textInput.focus();
      }
    });
  }

  if (!backlogToggle || !backlog) {
    return;
  }

  backlogToggle.addEventListener("click", () => {
    const isHidden = backlog.hasAttribute("hidden");

    backlog.toggleAttribute("hidden", !isHidden);
    backlogToggle.setAttribute("aria-expanded", String(isHidden));
    backlogToggle.textContent = isHidden ? "Скрыть Бэклог" : "Открыть Бэклог";
  });
});
