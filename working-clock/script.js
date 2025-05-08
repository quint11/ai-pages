document.addEventListener('DOMContentLoaded', () => {
    const settingsModal = document.getElementById('settingsModal');
    const settingsForm = document.getElementById('settingsForm');
    const incomeAmountEl = document.getElementById('incomeAmount');
    const progressBarEl = document.getElementById('progressBar');
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const openSettingsButton = document.getElementById('openSettingsButton');

    const restScheduleSelect = document.getElementById('restSchedule'); // Get select element
    const anchorDateGroup = document.getElementById('anchorDateGroup'); // Get anchor date group
    const anchorBigWeekMondayInput = document.getElementById('anchorBigWeekMonday'); // Get anchor date input

    let userSettings = {};
    let currentPeriod = 'day';
    let hourlyRate = 0;
    let dailySalary = 0;

    // --- Helper Functions ---

    function getWeekNumberSinceReference(date, referenceMondayConfig) {
        if (!referenceMondayConfig) return 0; // Default if no reference, might need better handling

        const currentMonday = getWeekBoundaries(date).startOfWeek;
        const refMonday = new Date(referenceMondayConfig); // Use user-configured date
        refMonday.setHours(0,0,0,0);

        const diffTime = currentMonday.getTime() - refMonday.getTime(); // Order matters for positive/negative weeks
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7);
    }

    function isPotentialWorkDay(date, settings) { // Pass full settings object
        const dayOfWeek = date.getDay();

        switch (settings.restSchedule) {
            case 'none':
                return true;
            case 'dual':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'single_sun_off':
                return dayOfWeek >= 1 && dayOfWeek <= 6;
            case 'alternate_single_dual':
                if (!settings.anchorBigWeekMondayString) {
                    // If anchor date is not set for alternate, treat as dual for safety or return false
                    console.warn("大小周模式下未设置锚定大周日期，默认按双休处理");
                    return dayOfWeek >= 1 && dayOfWeek <= 5;
                }
                const weekDiff = getWeekNumberSinceReference(date, settings.anchorBigWeekMondayString);
                // Assuming reference week (weekDiff = 0) is Big Week (dual).
                if (weekDiff % 2 === 0) { // Big Week
                    return dayOfWeek >= 1 && dayOfWeek <= 5;
                } else { // Small Week
                    return dayOfWeek >= 1 && dayOfWeek <= 6;
                }
            default:
                return false;
        }
    }

    function isWorkDay(date, settings) {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Ensure settings.startDate is a Date object if it comes from userSettings
        const compareStartDate = settings.startDate instanceof Date ? settings.startDate : new Date(settings.startDateString + "T00:00:00");
        compareStartDate.setHours(0, 0, 0, 0);

        if (checkDate < compareStartDate) return false;
        return isPotentialWorkDay(checkDate, settings); // Pass full settings
    }


    function calculateWorkDaysInMonth(targetDateForMonth, settings) {
        const year = targetDateForMonth.getFullYear();
        const month = targetDateForMonth.getMonth();
        const daysInCalMonth = new Date(year, month + 1, 0).getDate();
        let workDaysCount = 0;

        for (let day = 1; day <= daysInCalMonth; day++) {
            const currentDate = new Date(year, month, day);
            if (isWorkDay(currentDate, settings)) {
                workDaysCount++;
            }
        }
        return workDaysCount;
    }

    function getWeekBoundaries(date) {
        // ... (same as before)
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

    function calculateBaseRates() {
        // ... (same as before, logic for alternate_single_dual is already correct based on average)
        if (Object.keys(userSettings).length === 0 || !userSettings.restSchedule || !userSettings.monthlySalary || !userSettings.workHoursPerDay) {
            dailySalary = 0;
            hourlyRate = 0;
            return;
        }

        let averageWorkDaysPerMonth;
        const daysInYear = 365.25;
        const weeksInYear = daysInYear / 7;

        switch (userSettings.restSchedule) {
            case 'dual':
                averageWorkDaysPerMonth = (5 * weeksInYear) / 12;
                break;
            case 'single_sun_off':
                averageWorkDaysPerMonth = (6 * weeksInYear) / 12;
                break;
            case 'alternate_single_dual':
                averageWorkDaysPerMonth = ((5 + 6) / 2 * weeksInYear) / 12;
                break;
            case 'none':
                averageWorkDaysPerMonth = (7 * weeksInYear) / 12;
                break;
            default:
                averageWorkDaysPerMonth = (5 * weeksInYear) / 12;
        }

        if (averageWorkDaysPerMonth > 0 && userSettings.monthlySalary > 0) {
            dailySalary = userSettings.monthlySalary / averageWorkDaysPerMonth;
            hourlyRate = dailySalary / userSettings.workHoursPerDay;
        } else {
            dailySalary = 0;
            hourlyRate = 0;
        }
    }

    // Function to toggle anchor date visibility
    function toggleAnchorDateVisibility() {
        if (restScheduleSelect.value === 'alternate_single_dual') {
            anchorDateGroup.style.display = 'block';
            anchorBigWeekMondayInput.required = true; // Make it required if visible
        } else {
            anchorDateGroup.style.display = 'none';
            anchorBigWeekMondayInput.required = false; // Not required if hidden
            // anchorBigWeekMondayInput.value = ''; // Optionally clear if hidden
        }
    }
    // Event listener for rest schedule change
    restScheduleSelect.addEventListener('change', toggleAnchorDateVisibility);


    function populateSettingsForm() {
        if (userSettings && Object.keys(userSettings).length > 0) {
            document.getElementById('monthlySalary').value = userSettings.monthlySalary;
            document.getElementById('startDate').value = userSettings.startDateString;
            document.getElementById('restSchedule').value = userSettings.restSchedule || "dual";
            document.getElementById('workHoursPerDay').value = userSettings.workHoursPerDay;
            document.getElementById('workStartTime').value = userSettings.workStartTime;
            // Populate anchor date if it exists
            anchorBigWeekMondayInput.value = userSettings.anchorBigWeekMondayString || '';
        } else {
            // Default values
            const today = new Date();
            const oneMonthAgo = new Date(today); // Create a new Date object from today
            oneMonthAgo.setMonth(today.getMonth() - 1); // Set it to one month ago
            if (oneMonthAgo.getDate() !== today.getDate()) {
                oneMonthAgo.setDate(0); // Sets to the last day of the previous month
            }
            document.getElementById('startDate').value = `${oneMonthAgo.getFullYear()}-${String(oneMonthAgo.getMonth() + 1).padStart(2, '0')}-${String(oneMonthAgo.getDate()).padStart(2, '0')}`;
            document.getElementById('monthlySalary').value = "10000";
            document.getElementById('restSchedule').value = "dual";
            document.getElementById('workHoursPerDay').value = "8";
            document.getElementById('workStartTime').value = "09:00";
            anchorBigWeekMondayInput.value = ''; // Default anchor date is empty
        }
        toggleAnchorDateVisibility(); // Ensure correct visibility on form load/populate
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('salaryCalculatorSettings');
        if (savedSettings) {
            userSettings = JSON.parse(savedSettings);
            if (userSettings.startDateString) {
                userSettings.startDate = new Date(userSettings.startDateString + "T00:00:00");
            }
            // anchorBigWeekMondayString is already a string, no conversion needed here for storage
            populateSettingsForm();
            calculateBaseRates();
            updateDisplay();
        } else {
            populateSettingsForm();
            settingsModal.style.display = 'flex';
        }
    }

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedRestSchedule = document.getElementById('restSchedule').value;
        let anchorDateValue = null;

        if (selectedRestSchedule === 'alternate_single_dual') {
            anchorDateValue = anchorBigWeekMondayInput.value;
            if (!anchorDateValue) {
                alert('请为“大小周”模式选择一个锚定大周的周一日期。');
                anchorBigWeekMondayInput.focus();
                return;
            }
            const anchorD = new Date(anchorDateValue + "T00:00:00");
            if (anchorD.getDay() !== 1) {
                 alert('锚定日期必须是一个周一。');
                 anchorBigWeekMondayInput.focus();
                 return;
            }
        }

        userSettings = {
            monthlySalary: parseFloat(document.getElementById('monthlySalary').value),
            startDateString: document.getElementById('startDate').value,
            startDate: new Date(document.getElementById('startDate').value + "T00:00:00"),
            restSchedule: selectedRestSchedule,
            anchorBigWeekMondayString: anchorDateValue,
            workHoursPerDay: parseFloat(document.getElementById('workHoursPerDay').value),
            workStartTime: document.getElementById('workStartTime').value,
        };
        localStorage.setItem('salaryCalculatorSettings', JSON.stringify(userSettings));
        settingsModal.style.display = 'none';

        calculateBaseRates(); // Calculate dailySalary and hourlyRate based on new userSettings

        // --- 打印薪资信息 ---
        if (dailySalary && hourlyRate && userSettings.monthlySalary) {
            const weeksInMonthApproximation = (365.25 / 7) / 12; // 約 4.348 周/月
            const weeklySalary = dailySalary * (userSettings.restSchedule === 'dual' ? 5 :
                                                userSettings.restSchedule === 'single_sun_off' ? 6 :
                                                userSettings.restSchedule === 'alternate_single_dual' ? 5.5 : 7); // 平均每周工作日

            const monthlySalaryFromSettings = userSettings.monthlySalary; // 已知月薪
            const yearlySalary = monthlySalaryFromSettings * 12;

            console.group("用户薪资概览 (基于平均值计算):");
            console.log(`日薪 (平均): ${dailySalary.toFixed(2)} 元`);
            console.log(`时薪 (平均): ${hourlyRate.toFixed(2)} 元`);
            console.log(`周薪 (估算, 基于平均每周工作日): ${weeklySalary.toFixed(2)} 元`);
            console.log(`月薪 (用户设定): ${monthlySalaryFromSettings.toFixed(2)} 元`);
            console.log(`年薪 (基于用户设定月薪): ${yearlySalary.toFixed(2)} 元`);
            console.groupEnd();
        } else {
            console.warn("未能计算完整的薪资概览，请检查设置。");
        }
        // --- 结束打印 ---


        const activeButton = document.querySelector('.toggle-btn.active');
        currentPeriod = activeButton ? activeButton.dataset.period : 'day';
        if (!activeButton) {
            document.querySelector('.toggle-btn[data-period="day"]').classList.add('active');
        }
        updateDisplay();
    });


    openSettingsButton.addEventListener('click', () => {
        populateSettingsForm(); // This will also call toggleAnchorDateVisibility
        settingsModal.style.display = 'flex';
    });

    // ... (toggleButtons event listener remains the same) ...
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPeriod = button.dataset.period;
            updateDisplay();
        });
    });


    function updateDisplay() {
        // ... (updateDisplay remains largely the same as the previous version,
        //      it relies on isWorkDay which now uses the user-configured anchor date)
        //      Ensure checks for dailySalary and userSettings.startDate are robust.
        //      Minor addition to ensure startDate is a Date object when passed to isWorkDay
        if (Object.keys(userSettings).length === 0 || !userSettings.startDateString) { // Check startDateString
            incomeAmountEl.textContent = "0.0000";
            progressBarEl.style.width = "0%";
            return;
        }
        if (!userSettings.startDate) { // Ensure startDate object exists
             userSettings.startDate = new Date(userSettings.startDateString + "T00:00:00");
        }


        if (!dailySalary && userSettings.monthlySalary > 0) {
             calculateBaseRates();
             if(!dailySalary && currentPeriod !== 'cumulative' && currentPeriod !== 'month'){ // if still no dailySalary and not a period that can show monthly salary
                incomeAmountEl.textContent = "0.0000";
                progressBarEl.style.width = "0%";
                return;
             }
        }
        // ... (rest of updateDisplay, see previous full version for context) ...
        let incomeToDisplay = 0;
        let progress = 0;
        const now = new Date();

        if (now < userSettings.startDate && currentPeriod !== 'cumulative') {
            incomeAmountEl.textContent = "0.0000";
            progressBarEl.style.width = "0%";
            return;
        }

        const [startHour, startMinute] = userSettings.workStartTime.split(':').map(Number);
        const totalWorkMsPerDay = userSettings.workHoursPerDay * 60 * 60 * 1000;
        let earnedMsForPeriod = 0;

        // --- Daily Calculation ---
        if (currentPeriod === 'day') {
            if (isWorkDay(now, userSettings)) {
                const workStartToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
                if (now >= workStartToday) {
                    earnedMsForPeriod = Math.min(now.getTime() - workStartToday.getTime(), totalWorkMsPerDay);
                    progress = Math.min(100, (earnedMsForPeriod / totalWorkMsPerDay) * 100);
                }
            }
            incomeToDisplay = (earnedMsForPeriod / totalWorkMsPerDay) * dailySalary;
            if (isNaN(incomeToDisplay)) incomeToDisplay = 0;
        }
        // --- Weekly Calculation ---
        else if (currentPeriod === 'week') {
            const { startOfWeek, endOfWeek } = getWeekBoundaries(now);
            let completedWorkDaysThisWeek = 0; // 新增：统计本周已完成的完整工作日数
            let msWorkedTodayThisWeek = 0;     // 新增：统计今天已工作的毫秒数 (如果今天在本周内)
            let actualWorkDaysInThisCalendarWeek = 0; // 本周（日历周）应有的工作日总数，用于进度条分母

            for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
                // 判断循环到的这一天 d 是否是用户的工作日 (考虑休息制度和入职日期)
                if (isWorkDay(new Date(d), userSettings)) {
                    actualWorkDaysInThisCalendarWeek++; // 累加本周应工作日总数

                    // 只计算到今天为止的已工作时间
                    if (d <= now) {
                        const workStartCurrentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMinute);
                        // 判断循环到的这一天 d 是否就是今天
                        if (d.toDateString() === now.toDateString()) {
                            // 如果是今天，并且当前时间已经过了今天的上班时间
                            if (now >= workStartCurrentDay) {
                                msWorkedTodayThisWeek = Math.min(now.getTime() - workStartCurrentDay.getTime(), totalWorkMsPerDay);
                            }
                        } else {
                            // 如果是本周内今天之前的某个工作日，则完整算一天
                            completedWorkDaysThisWeek++;
                        }
                    }
                }
            }

            // 计算本周到目前为止实际赚取的收入
            // (已完成的完整工作日数 * 日薪) + (今天已工作的毫秒数 / 每天总工作毫秒数 * 日薪)
            incomeToDisplay = (completedWorkDaysThisWeek * dailySalary) + ( (msWorkedTodayThisWeek / totalWorkMsPerDay) * dailySalary );
            if (isNaN(incomeToDisplay)) incomeToDisplay = 0; // 处理 dailySalary 可能为0的情况

            // 进度条计算:
            // earnedMsForPeriod 是本周至今实际工作的总毫秒数
            const earnedMsForPeriod = (completedWorkDaysThisWeek * totalWorkMsPerDay) + msWorkedTodayThisWeek;
            // totalPotentialWorkMsThisWeek 是本周应工作的总毫秒数
            const totalPotentialWorkMsThisWeek = actualWorkDaysInThisCalendarWeek * totalWorkMsPerDay;

            if (totalPotentialWorkMsThisWeek > 0) {
                progress = Math.min(100, (earnedMsForPeriod / totalPotentialWorkMsThisWeek) * 100);
            } else {
                progress = 0;
            }
        }
        // --- Monthly Calculation ---
        else if (currentPeriod === 'month') {
            const workDaysInCurrentMonth = calculateWorkDaysInMonth(now, userSettings);
            let completedWorkDaysThisMonth = 0; // 新增：统计本月已完成的完整工作日数
            let msWorkedTodayThisMonth = 0;     // 新增：统计今天已工作的毫秒数
        
            for (let d = new Date(now.getFullYear(), now.getMonth(), 1); d <= now; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() !== now.getMonth()) break;
                if (isWorkDay(new Date(d), userSettings)) {
                    const workStartCurrentDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, startMinute);
                    if (d.toDateString() === now.toDateString()) {
                        if (now >= workStartCurrentDay) {
                            msWorkedTodayThisMonth = Math.min(now.getTime() - workStartCurrentDay.getTime(), totalWorkMsPerDay);
                        }
                    } else {
                        completedWorkDaysThisMonth++; // 是过去的工作日，完整算一天
                    }
                }
            }
        
            // 计算本月到目前为止实际赚取的收入
            // (已完成的完整工作日数 * 日薪) + (今天已工作的毫秒数 / 每天总工作毫秒数 * 日薪)
            incomeToDisplay = (completedWorkDaysThisMonth * dailySalary) + ( (msWorkedTodayThisMonth / totalWorkMsPerDay) * dailySalary );
            if (isNaN(incomeToDisplay)) incomeToDisplay = 0; // 处理 dailySalary 可能为0的情况
        
            // 进度条的计算逻辑可以保持不变，或者也可以基于已赚取收入 / 月薪
            // 当前是基于已工作时间 / 总应工作时间
            const earnedMsForPeriod = (completedWorkDaysThisMonth * totalWorkMsPerDay) + msWorkedTodayThisMonth;
            const totalPotentialWorkMsThisMonth = workDaysInCurrentMonth * totalWorkMsPerDay;
        
            if (totalPotentialWorkMsThisMonth > 0) {
                 progress = Math.min(100, (earnedMsForPeriod / totalPotentialWorkMsThisMonth) * 100);
            } else {
                progress = 0;
            }
        
            // 如果希望进度条也基于 金额 / 月薪 (假设月薪是目标)
            // if (userSettings.monthlySalary > 0) {
            //     progress = Math.min(100, (incomeToDisplay / userSettings.monthlySalary) * 100);
            // } else {
            //     progress = 0;
            // }
        }
        // --- Cumulative Income Calculation ---
        else if (currentPeriod === 'cumulative') {
            let cumulativeEarned = 0;
            if (userSettings.startDate && now >= userSettings.startDate && dailySalary > 0) {
                for (let d = new Date(userSettings.startDate); d <= now; d.setDate(d.getDate() + 1)) {
                    let currentLoopDay = new Date(d);
                    if (isWorkDay(currentLoopDay, userSettings)) {
                        const workStartForLoopDay = new Date(currentLoopDay.getFullYear(), currentLoopDay.getMonth(), currentLoopDay.getDate(), startHour, startMinute);
                        if (currentLoopDay.toDateString() === now.toDateString()) {
                            if (now >= workStartForLoopDay) {
                                const msWorkedToday = Math.min(now.getTime() - workStartForLoopDay.getTime(), totalWorkMsPerDay);
                                cumulativeEarned += (msWorkedToday / totalWorkMsPerDay) * dailySalary;
                            }
                        } else {
                            cumulativeEarned += dailySalary;
                        }
                    }
                }
            }
            incomeToDisplay = cumulativeEarned;
            progress = 99;
            if (isNaN(incomeToDisplay)) incomeToDisplay = 0;
        }

        let formattedIncomeString = incomeToDisplay.toLocaleString('zh-CN', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        });

        let integerPart = "";
        let decimalPart = "";
        const decimalSeparator = "."; // Assuming standard decimal separator

        const separatorIndex = formattedIncomeString.indexOf(decimalSeparator);

        if (separatorIndex !== -1) {
            integerPart = formattedIncomeString.substring(0, separatorIndex);
            decimalPart = formattedIncomeString.substring(separatorIndex); // Includes the decimal point
        } else {
            integerPart = formattedIncomeString; // No decimal part
        }

        let htmlOutput = "";
        if (incomeToDisplay > 0) {
            htmlOutput += `<span class="income-plus-sign">+</span> `; // Optional: style the plus sign separately too
        }

        htmlOutput += `<span class="income-integer">${integerPart}</span>`;
        if (decimalPart) {
            // The decimalPart already includes the ".", so we just append it.
            htmlOutput += `<span class="income-decimal-part">${decimalPart}</span>`;
        }
        
        incomeAmountEl.innerHTML = htmlOutput; // Use innerHTML to render the spans
        // --- End of modification ---

        progressBarEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }


    loadSettings();
    setInterval(updateDisplay, 500);
});