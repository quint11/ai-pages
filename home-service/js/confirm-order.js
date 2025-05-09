// js/confirm-order.js

// Ensure showModernAlert is defined (either here or from a shared file)
// The version from previous step supporting 'isHtml' and 'qr' type is needed.
// function showModernAlert(message, title = "提示", type = "info", isHtml = false) { ... }

const serviceAddressInput = document.getElementById('service-address');
const contactPhoneInput = document.getElementById('contact-phone');
const serviceTimeInput = document.getElementById('service-time');
const serviceNameDisplay = document.getElementById('service-name-display');
const totalAmountDisplay = document.getElementById('total-amount-display');
const originalPriceDisplay = document.getElementById('original-price-display');
const discountInfoDisplay = document.getElementById('discount-info-display');
const agreementCheckbox = document.getElementById('agreementCheckbox');
const orderRemarksInput = document.getElementById('order-remarks');

function showModernAlert(message, title = "提示", type = "info", isHtml = false) {
    const existingAlert = document.getElementById('modernAlertOverlay');
    if (existingAlert) existingAlert.remove();
    const overlay = document.createElement('div');
    overlay.id = 'modernAlertOverlay';
    overlay.className = 'modern-alert-overlay';
    const alertBox = document.createElement('div');
    alertBox.className = 'modern-alert-box';
    const alertIconEl = document.createElement('i'); // Renamed to avoid conflict
    alertIconEl.className = 'fas alert-icon';
    switch(type) {
        case 'success': alertIconEl.classList.add('fa-check-circle', 'success'); break;
        case 'error': alertIconEl.classList.add('fa-times-circle', 'error'); break;
        case 'warning': alertIconEl.classList.add('fa-exclamation-triangle', 'warning'); break;
        case 'qr': // Special type for QR
            alertIconEl.classList.add('fa-qrcode'); // Example icon
            alertIconEl.style.color = 'var(--text-color)'; // Neutral color for QR icon
            break;
        case 'info': default: alertIconEl.classList.add('fa-info-circle', 'info'); break;
    }
    if (type !== 'qr-image-only') { // Don't add icon if it's just for QR image
         alertBox.appendChild(alertIconEl);
    }
   
    const alertTitleEl = document.createElement('h3'); // Renamed
    alertTitleEl.className = 'alert-title';
    alertTitleEl.textContent = title;

    const alertMessageEl = document.createElement('p'); // Renamed
    alertMessageEl.className = 'alert-message';
    if(isHtml) {
        alertMessageEl.innerHTML = message;
    } else {
        alertMessageEl.textContent = message;
    }

    const closeButton = document.createElement('button');
    closeButton.className = 'modern-alert-button';
    closeButton.textContent = (type === 'qr' || type === 'qr-image-only') ? '关闭' : '确定';

    closeButton.onclick = function() {
        overlay.classList.remove('visible');
        overlay.addEventListener('transitionend', function(e) {
            if (e.propertyName === 'opacity' && !overlay.classList.contains('visible')) overlay.remove();
        });
    };

    alertBox.appendChild(alertTitleEl);
    alertBox.appendChild(alertMessageEl);
    alertBox.appendChild(closeButton);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    void overlay.offsetWidth;
    overlay.classList.add('visible');
    closeButton.focus();
}

// --- Event Listeners and Helper Functions ---
function formatDateTimeForDisplay(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Simple format: YYYY-MM-DD HH:MM
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        return isoString; // Fallback if parsing fails
    }
}

function setMinDateTime() {
    const now = new Date();
    // Allow selection from 1 hour from now
    now.setHours(now.getHours() + 1);
    // Format for datetime-local: YYYY-MM-DDTHH:MM
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    if (serviceTimeInput) {
        serviceTimeInput.min = minDateTime;
    }
}

// --- Core Functions ---
function selectAddress() { 
    // Now handled by direct input. Could add map integration here later.
    serviceAddressInput.focus();
}

function selectDiscount() { showModernAlert('优惠券和活动选择功能即将上线，敬请期待！', '选择优惠'); }
function selectPaymentMethod() { showModernAlert('目前仅支持微信支付，更多支付方式开发中。', '支付方式'); }

function viewFullNotice() { 
    const fullNoticeText = `
        酷兔家政购买须知：<br><br>
        1. 服务范围：请确保您选择的服务地址在张家界市区及合同约定范围内。<br>
        2. 取消政策：服务开始前120分钟可免费取消；120分钟内取消且服务人员已接单，平台将扣除您20%的支付金额作为补偿。<br>
        3. 服务标准：我们将按照约定标准提供服务，如有任何不满意，请在服务完成后24小时内联系客服。<br>
        4. 安全保障：我们为服务人员购买了相关保险，保障服务过程中的意外风险。<br>
        （更多条款...）
    `;
    showModernAlert(fullNoticeText, '购买须知详情', 'info', true);
}

function showAgreement(type) {
    let title, content;
    if (type === 'service') {
        title = '酷兔家政服务协议';
        content = '这里是详细的酷兔家政服务协议内容...<br>1. 服务范围...<br>2. 双方权利与义务...';
    } else {
        title = '隐私政策';
        content = '酷兔家政非常重视您的隐私保护...<br>1. 信息收集...<br>2. 信息使用...';
    }
    showModernAlert(content, title, 'info', true);
}


function selectRecharge(element, amount) {
    document.querySelectorAll('.recharge-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    const statusTag = document.getElementById('recharge-status-tag');
    if (statusTag) {
        statusTag.textContent = '已选' + amount + '元储值';
    }
    console.log('选择了充值：', amount);
    showModernAlert(`您已选择充值 ${amount} 元的选项。`, '储值选择', 'success');
}

function goBack() {
    // Try to go back to service details, or just history back
    if (document.referrer && document.referrer.includes('service-details.html')) {
        window.location.href = 'service-details.html';
    } else {
        history.back();
    }
}

let currentServicePrice = 0; // Store numeric price

function loadOrderDetails() {
    setMinDateTime(); // Set min selectable time

    const urlParams = new URLSearchParams(window.location.search);
    const serviceName = urlParams.get('service');
    const servicePriceParam = urlParams.get('price');

    if (serviceName && serviceNameDisplay) {
        serviceNameDisplay.textContent = decodeURIComponent(serviceName);
    }

    if (servicePriceParam) {
        currentServicePrice = parseFloat(servicePriceParam);
        if (!isNaN(currentServicePrice)) {
            // For now, assume a fixed discount for demo, e.g., 18
            const discountAmount = 18; 
            const finalPrice = currentServicePrice - discountAmount; // Example calculation
            
            if (totalAmountDisplay) totalAmountDisplay.textContent = `¥${finalPrice.toFixed(0)}`;
            if (originalPriceDisplay) originalPriceDisplay.textContent = `¥${currentServicePrice.toFixed(0)}`;
            if (discountInfoDisplay) discountInfoDisplay.textContent = `优惠 ¥${discountAmount.toFixed(0)}`;
        } else {
            currentServicePrice = 0; // Reset if price is invalid
            // Handle case where price is not a number
            if (totalAmountDisplay) totalAmountDisplay.textContent = `¥---`;
            if (originalPriceDisplay) originalPriceDisplay.textContent = `¥---`;
            if (discountInfoDisplay) discountInfoDisplay.textContent = `优惠 ¥--`;
        }
    }
}

function showQRCodeModal(orderDetails) {
    // Generate a dynamic QR code URL (example using qrserver.com)
    // In a real app, this would be a payment QR code from your payment provider
    const qrData = encodeURIComponent(`酷兔家政订单: ${orderDetails.serviceName}, 金额: ${orderDetails.amount}元, 时间: ${orderDetails.time}`);
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&format=png&bgcolor=ffffff`;

    const modalContent = `
        <p>请使用微信扫描下方二维码完成支付</p>
        <img src="${qrCodeImageUrl}" alt="支付二维码" style="width:200px; height:200px; margin:15px auto; display:block; border:1px solid #eee;">
        <p style="font-size:12px; color:#888;">订单号: ${orderDetails.orderId}<br>服务项目: ${orderDetails.serviceName}<br>应付金额: <strong style="color:var(--danger-color); font-size:16px;">¥${orderDetails.amount}</strong></p>
    `;
    showModernAlert(modalContent, '扫码支付', 'qr-image-only', true); // qr-image-only is a conceptual type
}


function submitOrder() {
    const address = serviceAddressInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    const timeValue = serviceTimeInput.value;
    const remarks = orderRemarksInput.value.trim();
    const serviceName = serviceNameDisplay.textContent;
    const amountText = totalAmountDisplay.textContent.replace('¥', '');


    if (!address) {
        showModernAlert('请输入详细的服务地址！', '信息不完整', 'warning');
        serviceAddressInput.focus();
        return;
    }
    if (!phone) {
        showModernAlert('请输入联系手机号码！', '信息不完整', 'warning');
        contactPhoneInput.focus();
        return;
    }
    if (!/^(1[3-9])\d{9}$/.test(phone)) {
        showModernAlert('请输入有效的11位手机号码！', '手机号格式错误', 'error');
        contactPhoneInput.focus();
        return;
    }
    if (!timeValue) {
        showModernAlert('请选择上门时间！', '信息不完整', 'warning');
        serviceTimeInput.focus(); // May not work well on all browsers for datetime-local
        return;
    }
    
    // Check if selected time is in the past (though input 'min' should prevent most of this)
    const selectedDateTime = new Date(timeValue);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5); // Allow a small grace period for submission lag
    if (selectedDateTime < now) {
        showModernAlert('您选择的上门时间已过，请重新选择！', '时间选择错误', 'error');
        return;
    }


    if (!agreementCheckbox.checked) {
        showModernAlert('请先阅读并同意相关服务协议和隐私政策！', '协议未同意', 'warning');
        return;
    }

    const orderDetails = {
        orderId: 'KT' + new Date().getTime(), // Simple unique order ID
        address: address,
        phone: phone,
        time: formatDateTimeForDisplay(timeValue),
        serviceName: serviceName,
        amount: amountText,
        remarks: remarks
    };

    console.log("Order Details:", orderDetails);
    // Instead of just alerting, show the QR code modal
    showQRCodeModal(orderDetails);
}

// Initialize
document.addEventListener('DOMContentLoaded', loadOrderDetails);