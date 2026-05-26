const TASKS_STORAGE_KEY = "planner.tasks";
const SETTINGS_STORAGE_KEY = "planner.settings";
const SPHERES_STORAGE_KEY = "planner.spheres";
const GOALS_STORAGE_KEY = "planner.goals";
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

function generateEntityId(prefix) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";

  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${prefix}_${Date.now()}_${suffix}`;
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

function saveSpheres(spheres) {
  localStorage.setItem(SPHERES_STORAGE_KEY, JSON.stringify(spheres));
}

function loadSpheres() {
  const rawSpheres = localStorage.getItem(SPHERES_STORAGE_KEY);

  if (rawSpheres === null) {
    saveSpheres([]);
    return [];
  }

  try {
    const spheres = JSON.parse(rawSpheres);

    if (!Array.isArray(spheres)) {
      throw new Error("Spheres storage must be an array.");
    }

    return spheres;
  } catch (error) {
    warnAboutStorageReset();
    saveSpheres([]);
    return [];
  }
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

function loadGoals() {
  const rawGoals = localStorage.getItem(GOALS_STORAGE_KEY);

  if (rawGoals === null) {
    saveGoals([]);
    return [];
  }

  try {
    const goals = JSON.parse(rawGoals);

    if (!Array.isArray(goals)) {
      throw new Error("Goals storage must be an array.");
    }

    return goals;
  } catch (error) {
    warnAboutStorageReset();
    saveGoals([]);
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
  const spheres = loadSpheres();
  const goals = loadGoals();

  return { tasks, settings, spheres, goals };
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addLocalDays(date, days) {
  const result = new Date(date);

  result.setDate(result.getDate() + days);
  return result;
}

function getMondayOfWeek(dateString) {
  const date = parseLocalDate(dateString);
  const dayIndex = date.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;

  return addLocalDays(date, mondayOffset);
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

function getStatusLabel(status) {
  const labels = {
    todo: "Todo",
    in_progress: "In Progress",
    done: "Done",
    cancelled: "Cancelled",
    overdue: "Overdue",
  };

  return labels[status] || labels.todo;
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

function updateTask(task, updates = {}) {
  Object.assign(task, updates, {
    updatedAt: new Date().toISOString(),
  });
}

function checkOverdueTasks(tasks) {
  const today = getTodayLocalDateString();
  let hasChanges = false;

  tasks.forEach((task) => {
    const canBecomeOverdue = task.status === "todo" || task.status === "in_progress";

    if (canBecomeOverdue && task.date < today) {
      updateTask(task, { status: "overdue" });
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveTasks(tasks);
  }

  return hasChanges;
}

function getRecurringRootId(task) {
  return task.parentTaskId || task.id;
}

function getRootRecurringTask(tasks, rootId) {
  return tasks.find((task) => task.id === rootId) || null;
}

function hasRecurringTaskOnDate(tasks, rootId, targetDate) {
  return tasks.some((task) => (
    getRecurringRootId(task) === rootId && task.date === targetDate
  ));
}

function createRecurringTaskCopy(sourceTask, rootId, targetDate) {
  const now = new Date().toISOString();

  return {
    id: generateTaskId(),
    text: sourceTask.text,
    date: targetDate,
    status: "todo",
    priority: sourceTask.priority || "medium",
    isRecurring: true,
    repeatType: sourceTask.repeatType,
    parentTaskId: rootId,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    movedFromDate: null,
    movedToDate: null,
  };
}

function shouldCreateRecurringTask(sourceTask, rootTask, targetDate) {
  if (targetDate < rootTask.date) {
    return false;
  }

  if (sourceTask.repeatType === "daily") {
    return true;
  }

  if (sourceTask.repeatType === "weekly") {
    return parseLocalDate(rootTask.date).getDay() === parseLocalDate(targetDate).getDay();
  }

  return false;
}

function generateRecurringTasks(tasks, selectedDate) {
  const targetDates = Array.from(new Set([
    selectedDate,
    getTodayLocalDateString(),
  ]));
  const recurringRoots = new Map();
  let hasChanges = false;

  tasks.forEach((task) => {
    if (!task.isRecurring || (task.repeatType !== "daily" && task.repeatType !== "weekly")) {
      return;
    }

    const rootId = getRecurringRootId(task);

    if (!recurringRoots.has(rootId)) {
      recurringRoots.set(rootId, task);
    }
  });

  recurringRoots.forEach((sourceTask, rootId) => {
    const rootTask = getRootRecurringTask(tasks, rootId) || sourceTask;
    const templateTask = rootTask || sourceTask;

    targetDates.forEach((targetDate) => {
      if (hasRecurringTaskOnDate(tasks, rootId, targetDate)) {
        return;
      }

      if (!shouldCreateRecurringTask(sourceTask, rootTask, targetDate)) {
        return;
      }

      tasks.push(createRecurringTaskCopy(templateTask, rootId, targetDate));
      hasChanges = true;
    });
  });

  if (hasChanges) {
    saveTasks(tasks);
  }

  return hasChanges;
}

function applyTaskStatus(task, status) {
  const now = new Date().toISOString();
  const updates = { status };

  if (status === "todo") {
    updates.startedAt = null;
    updates.completedAt = null;
    updates.cancelledAt = null;
  }

  if (status === "in_progress") {
    updates.startedAt = task.startedAt || now;
    updates.completedAt = null;
    updates.cancelledAt = null;
  }

  if (status === "done") {
    updates.startedAt = task.startedAt || now;
    updates.completedAt = now;
    updates.cancelledAt = null;
  }

  if (status === "cancelled") {
    updates.completedAt = null;
    updates.cancelledAt = now;
  }

  updateTask(task, updates);
}

function getNextPriority(priority) {
  const priorityOrder = ["low", "medium", "high"];
  const currentIndex = priorityOrder.indexOf(priority);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % priorityOrder.length;

  return priorityOrder[nextIndex];
}

function renderSelectedDate(dateString) {
  const selectedDate = document.querySelector(".selected-date");

  if (!selectedDate) {
    return;
  }

  selectedDate.dateTime = dateString;
  selectedDate.textContent = formatSelectedDate(dateString);
}

function renderWeek(selectedDate, onSelectDate) {
  const weekStrip = document.querySelector(".week-strip");

  if (!weekStrip) {
    return;
  }

  const weekDayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const today = getTodayLocalDateString();
  const weekStart = getMondayOfWeek(selectedDate);

  weekStrip.textContent = "";

  weekDayLabels.forEach((label, index) => {
    const date = addLocalDays(weekStart, index);
    const dateString = formatLocalDateString(date);
    const dayButton = document.createElement("button");
    const weekDay = document.createElement("span");
    const dayNumber = document.createElement("strong");

    dayButton.type = "button";
    dayButton.className = "day-pill";
    dayButton.dataset.date = dateString;
    dayButton.setAttribute("aria-label", `${label}, ${formatSelectedDate(dateString)}`);

    if (dateString === selectedDate) {
      dayButton.classList.add("is-selected");
      dayButton.setAttribute("aria-current", "date");
    }

    if (dateString === today) {
      dayButton.classList.add("is-today");
    }

    weekDay.textContent = label;
    dayNumber.textContent = String(date.getDate());

    dayButton.append(weekDay, dayNumber);
    dayButton.addEventListener("click", () => {
      onSelectDate(dateString);
    });
    weekStrip.append(dayButton);
  });
}

function calculateWeekProgress(tasks, selectedDate) {
  const weekStart = getMondayOfWeek(selectedDate);
  const weekStartString = formatLocalDateString(weekStart);
  const weekEndString = formatLocalDateString(addLocalDays(weekStart, 6));
  const relevantTasks = tasks.filter((task) => (
    task.date >= weekStartString
    && task.date <= weekEndString
    && task.status !== "cancelled"
    && task.deleted !== true
    && task.isDeleted !== true
  ));
  const totalRelevantTasks = relevantTasks.length;
  const doneTasks = relevantTasks.filter((task) => task.status === "done").length;
  const progress = totalRelevantTasks === 0
    ? 0
    : Math.round((doneTasks / totalRelevantTasks) * 100);

  return {
    progress,
    doneTasks,
    totalRelevantTasks,
  };
}

function renderWeekProgress(tasks, selectedDate) {
  const progressFill = document.querySelector(".progress-fill");
  const progressPercent = document.querySelector(".progress-percent");
  const progressSummary = document.querySelector(".progress-summary");
  const { progress, doneTasks, totalRelevantTasks } = calculateWeekProgress(tasks, selectedDate);

  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  if (progressPercent) {
    progressPercent.textContent = `${progress}%`;
  }

  if (progressSummary) {
    progressSummary.textContent = `Прогресс недели: ${progress}% (${doneTasks} из ${totalRelevantTasks} задач выполнено)`;
  }
}

function saveAndRenderTasks(tasks, selectedDate) {
  saveTasks(tasks);
  renderTasks(tasks, selectedDate);
  renderBacklog(tasks, selectedDate);
  renderWeekProgress(tasks, selectedDate);
}

function moveTaskToDate({ task, tasks, selectedDate, targetDate }) {
  const today = getTodayLocalDateString();

  if (targetDate < today) {
    alert("Выберите сегодняшнюю или будущую дату");
    return;
  }

  updateTask(task, {
    movedFromDate: task.date,
    movedToDate: targetDate,
    date: targetDate,
    status: "todo",
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
  });
  saveAndRenderTasks(tasks, selectedDate);
}

function renderBacklog(tasks, selectedDate) {
  const backlog = document.querySelector("#backlog");
  const backlogBadge = document.querySelector(".backlog-badge");

  if (!backlog) {
    return;
  }

  const heading = backlog.querySelector(".section-heading");
  const overdueTasks = tasks.filter((task) => task.status === "overdue");

  backlog.querySelectorAll(".backlog-list, .backlog-empty").forEach((element) => {
    element.remove();
  });

  if (backlogBadge) {
    backlogBadge.textContent = String(overdueTasks.length);
    backlogBadge.hidden = overdueTasks.length === 0;
  }

  if (overdueTasks.length === 0) {
    const emptyState = document.createElement("p");

    emptyState.className = "backlog-empty";
    emptyState.textContent = "Бэклог пуст";
    backlog.append(emptyState);
    return;
  }

  const backlogList = document.createElement("div");
  backlogList.className = "backlog-list";

  overdueTasks.forEach((task) => {
    const item = document.createElement("article");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const controls = document.createElement("div");
    const moveTodayButton = document.createElement("button");
    const dateInput = document.createElement("input");
    const moveDateButton = document.createElement("button");
    const cancelButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    item.className = `backlog-item priority-${task.priority || "medium"}`;
    content.className = "backlog-item-content";
    controls.className = "backlog-controls";

    title.textContent = task.text;
    meta.className = "task-meta";
    meta.textContent = `${formatSelectedDate(task.date)} · ${getPriorityLabel(task.priority)}`;

    moveTodayButton.type = "button";
    moveTodayButton.className = "task-action";
    moveTodayButton.textContent = "Перенести на сегодня";
    moveTodayButton.addEventListener("click", () => {
      moveTaskToDate({
        task,
        tasks,
        selectedDate,
        targetDate: getTodayLocalDateString(),
      });
    });

    dateInput.type = "date";
    dateInput.className = "backlog-date-input";
    dateInput.min = getTodayLocalDateString();
    dateInput.value = getTodayLocalDateString();
    dateInput.setAttribute("aria-label", "Дата переноса задачи");

    moveDateButton.type = "button";
    moveDateButton.className = "task-action";
    moveDateButton.textContent = "Перенести на дату...";
    moveDateButton.addEventListener("click", () => {
      moveTaskToDate({
        task,
        tasks,
        selectedDate,
        targetDate: dateInput.value,
      });
    });

    cancelButton.type = "button";
    cancelButton.className = "task-action";
    cancelButton.textContent = "Отменить";
    cancelButton.addEventListener("click", () => {
      updateTask(task, {
        status: "cancelled",
        completedAt: null,
        cancelledAt: new Date().toISOString(),
      });
      saveAndRenderTasks(tasks, selectedDate);
    });

    deleteButton.type = "button";
    deleteButton.className = "task-action task-action-danger";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => {
      const isConfirmed = window.confirm("Удалить задачу окончательно? Это действие нельзя отменить");

      if (!isConfirmed) {
        return;
      }

      const taskIndex = tasks.findIndex((itemTask) => itemTask.id === task.id);

      if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        saveAndRenderTasks(tasks, selectedDate);
      }
    });

    content.append(title, meta);
    controls.append(moveTodayButton, dateInput, moveDateButton, cancelButton, deleteButton);
    item.append(content, controls);
    backlogList.append(item);
  });

  if (heading) {
    heading.after(backlogList);
    return;
  }

  backlog.append(backlogList);
}

function getSphereWord(count) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "сфер";
  }

  if (lastDigit === 1) {
    return "сфера";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "сферы";
  }

  return "сфер";
}

function saveAndRenderGoalsBalance(spheres, goals) {
  saveSpheres(spheres);
  saveGoals(goals);
  renderGoalsBalance(spheres, goals);
}

function createGoal({ sphereId, title, targetValue }) {
  const now = new Date().toISOString();

  return {
    id: generateEntityId("goal"),
    sphereId,
    title,
    targetValue,
    createdAt: now,
    updatedAt: now,
  };
}

function renderGoalsBalance(spheres, goals) {
  const spheresList = document.querySelector(".spheres-list");
  const balanceSummary = document.querySelector(".balance-summary");

  if (!spheresList) {
    return;
  }

  spheresList.textContent = "";

  if (balanceSummary) {
    balanceSummary.textContent = `${spheres.length} ${getSphereWord(spheres.length)}`;
  }

  if (spheres.length === 0) {
    const emptyState = document.createElement("p");

    emptyState.className = "task-empty";
    emptyState.textContent = "Добавьте первую сферу, чтобы связать цели с важными областями жизни.";
    spheresList.append(emptyState);
    return;
  }

  spheres.forEach((sphere) => {
    const sphereGoals = goals.filter((goal) => goal.sphereId === sphere.id);
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("h3");
    const actions = document.createElement("div");
    const createGoalButton = document.createElement("button");
    const editSphereButton = document.createElement("button");
    const deleteSphereButton = document.createElement("button");
    const goalsList = document.createElement("div");

    card.className = "sphere-card";
    header.className = "sphere-header";
    actions.className = "sphere-actions";
    goalsList.className = "goal-list";

    title.textContent = sphere.name;

    createGoalButton.type = "button";
    createGoalButton.className = "task-action";
    createGoalButton.textContent = "Создать цель";
    createGoalButton.addEventListener("click", () => {
      const titleValue = window.prompt("Название цели");

      if (titleValue === null) {
        return;
      }

      const goalTitle = titleValue.trim();

      if (!goalTitle) {
        alert("Введите название цели");
        return;
      }

      const targetValueInput = window.prompt("Целевое количество действий");

      if (targetValueInput === null) {
        return;
      }

      const targetValue = Number(targetValueInput);

      if (!Number.isFinite(targetValue) || targetValue <= 0) {
        alert("Введите число больше нуля");
        return;
      }

      goals.push(createGoal({
        sphereId: sphere.id,
        title: goalTitle,
        targetValue,
      }));
      saveAndRenderGoalsBalance(spheres, goals);
    });

    editSphereButton.type = "button";
    editSphereButton.className = "task-action";
    editSphereButton.textContent = "Редактировать";
    editSphereButton.addEventListener("click", () => {
      const nextNameInput = window.prompt("Название сферы", sphere.name);

      if (nextNameInput === null) {
        return;
      }

      const nextName = nextNameInput.trim();

      if (!nextName) {
        alert("Введите название сферы");
        return;
      }

      sphere.name = nextName;
      sphere.updatedAt = new Date().toISOString();
      saveAndRenderGoalsBalance(spheres, goals);
    });

    deleteSphereButton.type = "button";
    deleteSphereButton.className = "task-action task-action-danger";
    deleteSphereButton.textContent = "Удалить";
    deleteSphereButton.addEventListener("click", () => {
      const hasGoals = goals.some((goal) => goal.sphereId === sphere.id);

      if (hasGoals) {
        alert("Сначала удалите цели из этой сферы");
        return;
      }

      const sphereIndex = spheres.findIndex((item) => item.id === sphere.id);

      if (sphereIndex !== -1) {
        spheres.splice(sphereIndex, 1);
        saveAndRenderGoalsBalance(spheres, goals);
      }
    });

    actions.append(createGoalButton, editSphereButton, deleteSphereButton);
    header.append(title, actions);
    card.append(header);

    if (sphereGoals.length === 0) {
      const emptyGoals = document.createElement("p");

      emptyGoals.className = "goal-empty";
      emptyGoals.textContent = "Целей в этой сфере пока нет.";
      goalsList.append(emptyGoals);
    } else {
      sphereGoals.forEach((goal) => {
        const goalItem = document.createElement("div");
        const goalInfo = document.createElement("div");
        const goalTitle = document.createElement("strong");
        const goalTarget = document.createElement("span");
        const deleteGoalButton = document.createElement("button");

        goalItem.className = "goal-item";
        goalInfo.className = "goal-info";
        goalTitle.textContent = goal.title;
        goalTarget.textContent = `${Number(goal.targetValue)} действий`;

        deleteGoalButton.type = "button";
        deleteGoalButton.className = "task-action task-action-danger";
        deleteGoalButton.textContent = "Удалить";
        deleteGoalButton.addEventListener("click", () => {
          const goalIndex = goals.findIndex((item) => item.id === goal.id);

          if (goalIndex !== -1) {
            goals.splice(goalIndex, 1);
            saveAndRenderGoalsBalance(spheres, goals);
          }
        });

        goalInfo.append(goalTitle, goalTarget);
        goalItem.append(goalInfo, deleteGoalButton);
        goalsList.append(goalItem);
      });
    }

    card.append(goalsList);
    spheresList.append(card);
  });
}

function startTaskEditing({ titleButton, task, tasks, selectedDate }) {
  if (!titleButton.isConnected) {
    return;
  }

  const editInput = document.createElement("input");
  let isCancelled = false;
  let isFinished = false;

  editInput.className = "task-edit-input";
  editInput.type = "text";
  editInput.maxLength = 300;
  editInput.value = task.text;
  editInput.setAttribute("aria-label", "Редактировать текст задачи");

  const finishEditing = () => {
    if (isCancelled || isFinished) {
      return;
    }

    isFinished = true;
    const nextText = editInput.value.trim();

    if (!nextText) {
      alert("Текст задачи не может быть пустым");
      renderTasks(tasks, selectedDate);
      return;
    }

    if (nextText !== task.text) {
      updateTask(task, { text: nextText });
      saveAndRenderTasks(tasks, selectedDate);
      return;
    }

    renderTasks(tasks, selectedDate);
  };

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finishEditing();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      isCancelled = true;
      isFinished = true;
      renderTasks(tasks, selectedDate);
    }
  });

  editInput.addEventListener("blur", finishEditing);
  titleButton.replaceWith(editInput);
  editInput.focus();
  editInput.select();
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

    if (task.status === "cancelled") {
      card.classList.add("is-cancelled");
    }

    const content = document.createElement("div");
    const title = document.createElement("button");
    const meta = document.createElement("p");
    const controls = document.createElement("div");
    const priorityButton = document.createElement("button");
    const statusSelect = document.createElement("select");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    content.className = "task-content";

    title.type = "button";
    title.className = "task-title-button";
    title.textContent = task.text;
    title.addEventListener("click", () => {
      startTaskEditing({ titleButton: title, task, tasks, selectedDate });
    });

    meta.className = "task-meta";
    meta.textContent = `${getStatusLabel(task.status)} · ${getPriorityLabel(task.priority)} · ${getRepeatLabel(task.repeatType)}`;

    priorityButton.type = "button";
    priorityButton.className = `priority-toggle priority-toggle-${task.priority || "medium"}`;
    priorityButton.title = "Сменить приоритет";
    priorityButton.setAttribute("aria-label", `Сменить приоритет. Сейчас ${getPriorityLabel(task.priority)}`);
    priorityButton.addEventListener("click", () => {
      updateTask(task, { priority: getNextPriority(task.priority || "medium") });
      saveAndRenderTasks(tasks, selectedDate);
    });

    ["todo", "in_progress", "done", "cancelled"].forEach((status) => {
      const option = document.createElement("option");

      option.value = status;
      option.textContent = getStatusLabel(status);
      option.selected = task.status === status;
      statusSelect.append(option);
    });

    statusSelect.className = "task-status-select";
    statusSelect.setAttribute("aria-label", "Статус задачи");
    statusSelect.addEventListener("change", () => {
      applyTaskStatus(task, statusSelect.value);
      saveAndRenderTasks(tasks, selectedDate);
    });

    editButton.type = "button";
    editButton.className = "task-action";
    editButton.textContent = "Редактировать";
    editButton.addEventListener("click", () => {
      startTaskEditing({ titleButton: title, task, tasks, selectedDate });
    });

    deleteButton.type = "button";
    deleteButton.className = "task-action task-action-danger";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => {
      const isConfirmed = window.confirm("Удалить задачу окончательно? Это действие нельзя отменить");

      if (!isConfirmed) {
        return;
      }

      const taskIndex = tasks.findIndex((item) => item.id === task.id);

      if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        saveAndRenderTasks(tasks, selectedDate);
      }
    });

    controls.className = "task-controls";
    controls.append(priorityButton, statusSelect, editButton, deleteButton);

    content.append(title, meta);
    card.append(content, controls);
    taskList.append(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const backlogToggle = document.querySelector(".backlog-toggle");
  const backlogToggleLabel = document.querySelector(".backlog-toggle-label");
  const backlog = document.querySelector("#backlog");
  const balanceToggle = document.querySelector(".balance-toggle");
  const balanceToggleLabel = document.querySelector(".balance-toggle-label");
  const balance = document.querySelector("#balance");
  const sphereForm = document.querySelector(".sphere-form");
  const taskForm = document.querySelector(".task-form");
  const todayButton = document.querySelector(".today-button");
  const storage = initializeStorage();
  let isAddLocked = false;
  let knownToday = getTodayLocalDateString();

  const syncTodayButtonState = () => {
    if (!todayButton) {
      return;
    }

    todayButton.disabled = storage.settings.selectedDate === getTodayLocalDateString();
  };

  const selectDate = (dateString) => {
    if (storage.settings.selectedDate !== dateString) {
      storage.settings.selectedDate = dateString;
      saveSettings(storage.settings);
    }

    checkOverdueTasks(storage.tasks);
    generateRecurringTasks(storage.tasks, storage.settings.selectedDate);
    checkOverdueTasks(storage.tasks);
    renderSelectedDate(storage.settings.selectedDate);
    renderWeek(storage.settings.selectedDate, selectDate);
    renderTasks(storage.tasks, storage.settings.selectedDate);
    renderBacklog(storage.tasks, storage.settings.selectedDate);
    renderWeekProgress(storage.tasks, storage.settings.selectedDate);
    syncTodayButtonState();
  };

  selectDate(storage.settings.selectedDate);
  renderGoalsBalance(storage.spheres, storage.goals);

  const refreshAfterLocalDayChange = () => {
    const currentToday = getTodayLocalDateString();

    if (currentToday === knownToday) {
      return;
    }

    knownToday = currentToday;
    checkOverdueTasks(storage.tasks);
    generateRecurringTasks(storage.tasks, storage.settings.selectedDate);
    checkOverdueTasks(storage.tasks);
    renderSelectedDate(storage.settings.selectedDate);
    renderWeek(storage.settings.selectedDate, selectDate);
    renderTasks(storage.tasks, storage.settings.selectedDate);
    renderBacklog(storage.tasks, storage.settings.selectedDate);
    renderWeekProgress(storage.tasks, storage.settings.selectedDate);
    syncTodayButtonState();
  };

  window.setInterval(refreshAfterLocalDayChange, 60000);
  window.addEventListener("focus", refreshAfterLocalDayChange);

  if (todayButton) {
    todayButton.addEventListener("click", () => {
      const today = getTodayLocalDateString();

      if (storage.settings.selectedDate === today) {
        return;
      }

      selectDate(today);
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
      checkOverdueTasks(storage.tasks);
      saveAndRenderTasks(storage.tasks, storage.settings.selectedDate);

      if (textInput) {
        textInput.value = "";
        textInput.focus();
      }
    });
  }

  if (sphereForm) {
    sphereForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const sphereInput = sphereForm.querySelector(".sphere-input");
      const name = sphereInput ? sphereInput.value.trim() : "";

      if (!name) {
        alert("Введите название сферы");

        if (sphereInput) {
          sphereInput.focus();
        }

        return;
      }

      const now = new Date().toISOString();

      storage.spheres.push({
        id: generateEntityId("sphere"),
        name,
        createdAt: now,
        updatedAt: now,
      });
      saveAndRenderGoalsBalance(storage.spheres, storage.goals);

      if (sphereInput) {
        sphereInput.value = "";
        sphereInput.focus();
      }
    });
  }

  if (backlogToggle && backlog) {
    backlogToggle.addEventListener("click", () => {
      const isHidden = backlog.hasAttribute("hidden");

      backlog.toggleAttribute("hidden", !isHidden);
      backlogToggle.setAttribute("aria-expanded", String(isHidden));

      if (backlogToggleLabel) {
        backlogToggleLabel.textContent = isHidden ? "Скрыть Бэклог" : "Открыть Бэклог";
      }
    });
  }

  if (balanceToggle && balance) {
    balanceToggle.addEventListener("click", () => {
      const isHidden = balance.hasAttribute("hidden");

      balance.toggleAttribute("hidden", !isHidden);
      balanceToggle.setAttribute("aria-expanded", String(isHidden));

      if (balanceToggleLabel) {
        balanceToggleLabel.textContent = isHidden ? "Скрыть Цели и Баланс" : "Цели и Баланс";
      }
    });
  }
});
