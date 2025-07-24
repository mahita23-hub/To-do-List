document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('priority-select');
    const dueDateInput = document.getElementById('due-date');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const totalTasksSpan = document.getElementById('total-tasks');
    const completedTasksSpan = document.getElementById('completed-tasks');
    
    // Set default due date to today
    dueDateInput.valueAsDate = new Date();
    
    // Load tasks from local storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Load theme preference
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitcher.checked = true;
    }
    
    // Render tasks
    renderTasks();
    updateStats();
    
    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
    });
    
    themeSwitcher.addEventListener('change', toggleTheme);
    
    // Functions
    function addTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        
        if (text) {
            const newTask = {
                id: Date.now(),
                text,
                priority,
                dueDate,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            updateStats();
            
            // Reset input
            taskInput.value = '';
            taskInput.focus();
            prioritySelect.value = 'medium';
            dueDateInput.valueAsDate = new Date();
        }
    }
    
    function renderTasks() {
        // Clear the task list
        taskList.innerHTML = '';
        
        // Get active filter
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        
        // Filter tasks
        let filteredTasks = [...tasks];
        if (activeFilter !== 'all') {
            if (activeFilter === 'completed') {
                filteredTasks = tasks.filter(task => task.completed);
            } else {
                filteredTasks = tasks.filter(task => task.priority === activeFilter);
            }
        }
        
        // Sort tasks: completed last, then by priority (high to low), then by due date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let dueDateText = '';
            if (dueDate) {
                if (dueDate < today && !task.completed) {
                    dueDateText = 'Overdue';
                } else {
                    const options = { month: 'short', day: 'numeric' };
                    dueDateText = dueDate.toLocaleDateString('en-US', options);
                }
            }
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-priority ${task.priority}">${task.priority}</span>
                ${dueDateText ? `<span class="task-due">${dueDateText}</span>` : ''}
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            taskList.appendChild(taskItem);
            
            // Add event listeners to the new task
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', function() {
                toggleTaskComplete(task.id, this.checked);
            });
            
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        });
    }
    
    function toggleTaskComplete(id, completed) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
        const newText = prompt('Edit your task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            
            const newPriority = prompt('Edit priority (high/medium/low):', task.priority);
            if (newPriority && ['high', 'medium', 'low'].includes(newPriority.toLowerCase())) {
                task.priority = newPriority.toLowerCase();
            }
            
            const newDueDate = prompt('Edit due date (YYYY-MM-DD):', task.dueDate);
            if (newDueDate) {
                // Simple date validation
                if (!isNaN(Date.parse(newDueDate))) {
                    task.dueDate = newDueDate;
                } else {
                    alert('Invalid date format. Please use YYYY-MM-DD.');
                }
            }
            
            saveTasks();
            renderTasks();
        }
    }
    
    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
        }
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    }
    
    function updateStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        
        totalTasksSpan.textContent = `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`;
        completedTasksSpan.textContent = `${completedTasks} completed`;
    }
});