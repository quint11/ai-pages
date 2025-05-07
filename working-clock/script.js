document.addEventListener('DOMContentLoaded', () => {
    const settingsModal = document.getElementById('settingsModal');
    const settingsForm = document.getElementById('settingsForm');
    const incomeAmountEl = document.getElementById('incomeAmount');
    const progressBarEl = document.getElementById('progressBar');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const openSettingsButton = document.getElementById('openSettingsButton'); // GET THE NEW BUTTON

    let userSettings = {};
    let currentPeriod = 'day';
    let hourlyRate = 0;
    let dailySalary = 0;

    // Function to pre-fill settings form
    function populateSettingsForm() {
        if (userSettings && Object.keys(userSettings).length > 0) {
            document.getElementById('monthlySalary').value = userSettings.monthlySalary;
            document.getElementById('startDate').value = userSettings.startDateString; // Use the string representation
            document.getElementById('workDaysPerMonth').value = userSettings.workDaysPerMonth;
            document.getElementById('workHoursPerDay').value = userSettings.workHoursPerDay;
            document.getElementById('workStartTime').value = userSettings.workStartTime;
        } else {
            // Set default start date for the input if no settings exist (for first open)
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('startDate').value = `${yyyy}-${mm}-${dd}`;
            // You can set other defaults here if desired
            document.getElementById('monthlySalary').value = "10000";
            document.getElementById('workDaysPerMonth').value = "21.75";
            document.getElementById('workHoursPerDay').value = "8";
            document.getElementById('workStartTime').value = "09:00";
        }
    }


    // Load settings from localStorage or show modal
    function loadSettings() {
        const savedSettings = localStorage.getItem('salaryCalculatorSettings');
        if (savedSettings) {
            userSettings = JSON.parse(savedSettings);
            userSettings.startDate = new Date(userSettings.startDateString);
            calculateBaseRates();
            populateSettingsForm(); // Populate form with loaded settings
            updateDisplay();
        } else {
            populateSettingsForm(); // Populate with defaults if no saved settings
            settingsModal.style.display = 'flex';
        }
    }

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userSettings = {
            monthlySalary: parseFloat(document.getElementById('monthlySalary').value),
            startDate: new Date(document.getElementById('startDate').value + "T00:00:00"),
            startDateString: document.getElementById('startDate').value,
            workDaysPerMonth: parseFloat(document.getElementById('workDaysPerMonth').value),
            workHoursPerDay: parseFloat(document.getElementById('workHoursPerDay').value),
            workStartTime: document.getElementById('workStartTime').value,
        };
        localStorage.setItem('salaryCalculatorSettings', JSON.stringify(userSettings));
        settingsModal.style.display = 'none';
        calculateBaseRates();
        
        const activeButton = document.querySelector('.toggle-btn.active');
        if (activeButton) {
            currentPeriod = activeButton.dataset.period;
        } else {
            // Default to 'day' if no button is active (e.g., after first settings save)
            document.querySelector('.toggle-btn[data-period="day"]').classList.add('active');
            currentPeriod = 'day';
        }
        updateDisplay();
    });

    // Event listener for the new settings button
    openSettingsButton.addEventListener('click', () => {
        populateSettingsForm(); // Ensure form is pre-filled with current or default settings
        settingsModal.style.display = 'flex';
    });

    function calculateBaseRates() {
        // ... (rest of the function is the same)
        if (Object.keys(userSettings).length === 0 || !userSettings.workDaysPerMonth || !userSettings.workHoursPerDay) return;
        dailySalary = userSettings.monthlySalary / userSettings.workDaysPerMonth;
        hourlyRate = dailySalary / userSettings.workHoursPerDay;
    }

    toggleButtons.forEach(button => {
        // ... (rest of the function is the same)
        button.addEventListener('click', () => {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPeriod = button.dataset.period;
            updateDisplay();
        });
    });

    function updateDisplay() {
        // ... (rest of the function is the same)
        if (Object.keys(userSettings).length === 0 || !dailySalary) { 
            incomeAmountEl.textContent = "0.00";
            progressBarEl.style.width = "0%";
            return;
        }

        let income = 0;
        let progress = 0;
        const now = new Date();

        if (now < userSettings.startDate && currentPeriod !== 'cumulative') { 
            incomeAmountEl.textContent = "0.00";
            progressBarEl.style.width = "0%";
            return;
        }

        const [startHour, startMinute] = userSettings.workStartTime.split(':').map(Number);
        const totalWorkMsPerDay = userSettings.workHoursPerDay * 60 * 60 * 1000;

        // --- Daily Calculation ---
        if (currentPeriod === 'day') {
            const workStartToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
            const workEndToday = new Date(workStartToday.getTime() + totalWorkMsPerDay);

            if (isWorkDay(now, userSettings.startDate) && now >= workStartToday) {
                if (now >= workEndToday) {
                    income = dailySalary;
                    progress = 100;
                } else {
                    const msWorkedToday = now.getTime() - workStartToday.getTime();
                    progress = Math.min(100, (msWorkedToday / totalWorkMsPerDay) * 100);
                    income = dailySalary * (progress / 100);
                }
            } else {
                income = 0;
                progress = 0;
            }
        }
        // --- Weekly Calculation ---
        else if (currentPeriod === 'week') {
            const { startOfWeek, endOfWeek } = getWeekBoundaries(now);
            let msWorkedThisWeek = 0;
            let workDaysInPeriod = 0; 

            for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
                if (isWorkDay(new Date(d), userSettings.startDate)) { 
                    workDaysInPeriod++;
                    if (d <= now) { 
                        if (d < userSettings.startDate) continue;

                        const workStartCurrentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMinute);
                        const workEndCurrentDay = new Date(workStartCurrentDay.getTime() + totalWorkMsPerDay);

                        if (d.toDateString() === now.toDateString()) {
                            if (now >= workStartCurrentDay) {
                                msWorkedThisWeek += Math.min(now.getTime() - workStartCurrentDay.getTime(), totalWorkMsPerDay);
                            }
                        } else { 
                            msWorkedThisWeek += totalWorkMsPerDay;
                        }
                    }
                }
            }
            
            income = (msWorkedThisWeek / (60 * 60 * 1000)) * hourlyRate;
            const totalPotentialWorkMsThisWeek = workDaysInPeriod * totalWorkMsPerDay;
            if (totalPotentialWorkMsThisWeek > 0) {
                progress = Math.min(100, (msWorkedThisWeek / totalPotentialWorkMsThisWeek) * 100);
            } else {
                progress = 0;
            }
        }
        // --- Monthly Calculation ---
        else if (currentPeriod === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
            let msWorkedThisMonth = 0;
            let actualWorkDaysCountedThisMonth = 0; 

            for (let d = new Date(startOfMonth); d <= now && d <= endOfMonth; d.setDate(d.getDate() + 1)) {
                 if (d < userSettings.startDate || !isWorkDay(new Date(d), userSettings.startDate)) continue; 

                actualWorkDaysCountedThisMonth++;
                const workStartCurrentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMinute);
                const workEndCurrentDay = new Date(workStartCurrentDay.getTime() + totalWorkMsPerDay);
                
                if (d.toDateString() === now.toDateString()) {
                    if (now >= workStartCurrentDay) {
                        msWorkedThisMonth += Math.min(now.getTime() - workStartCurrentDay.getTime(), totalWorkMsPerDay);
                    }
                } else { 
                    msWorkedThisMonth += totalWorkMsPerDay;
                }
            }
            
            income = (msWorkedThisMonth / (60 * 60 * 1000)) * hourlyRate;
            const totalConfiguredWorkMsThisMonth = userSettings.workDaysPerMonth * totalWorkMsPerDay;
            if (totalConfiguredWorkMsThisMonth > 0) {
                 progress = Math.min(100, (msWorkedThisMonth / totalConfiguredWorkMsThisMonth) * 100);
            } else {
                progress = 0;
            }
            income = Math.min(income, userSettings.monthlySalary); 
        }
        // --- Cumulative Income Calculation ---
        else if (currentPeriod === 'cumulative') {
            income = 0;
            if (now >= userSettings.startDate) {
                for (let d = new Date(userSettings.startDate); d <= now; d.setDate(d.getDate() + 1)) {
                    let currentLoopDay = new Date(d); 
                    currentLoopDay.setHours(0,0,0,0); 

                    if (isWorkDay(currentLoopDay, userSettings.startDate)) {
                        const workStartForLoopDay = new Date(currentLoopDay.getFullYear(), currentLoopDay.getMonth(), currentLoopDay.getDate(), startHour, startMinute);
                        const workEndForLoopDay = new Date(workStartForLoopDay.getTime() + totalWorkMsPerDay);

                        if (currentLoopDay.toDateString() === now.toDateString()) { 
                            if (now >= workStartForLoopDay) { 
                                const msWorkedToday = Math.min(now.getTime() - workStartForLoopDay.getTime(), totalWorkMsPerDay);
                                income += (msWorkedToday / totalWorkMsPerDay) * dailySalary;
                            }
                        } else { 
                            income += dailySalary;
                        }
                    }
                }
            }
            progress = 99; 
        }

        incomeAmountEl.textContent = income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        progressBarEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }


    function isWorkDay(date, userStartDateConfig) {
        // ... (rest of the function is the same)
        const checkDate = new Date(date); 
        checkDate.setHours(0, 0, 0, 0);

        const compareStartDate = new Date(userStartDateConfig);
        compareStartDate.setHours(0, 0, 0, 0);

        if (checkDate < compareStartDate) return false;
        
        const day = checkDate.getDay();
        return day !== 0 && day !== 6; 
    }
    
    function getWeekBoundaries(date) {
        // ... (rest of the function is the same)
        const d = new Date(date);
        const day = d.getDay();
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diffToMonday));
        startOfWeek.setHours(0,0,0,0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        return { startOfWeek, endOfWeek };
    }

    loadSettings();
    setInterval(updateDisplay, 1000);
});