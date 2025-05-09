// js/confirm-order.js

// PASTE THE showModernAlert function HERE (or link a shared JS file)
function showModernAlert(message, title = "提示", type = "info") { /* ... (full function code) ... */ }


function selectAddress() { showModernAlert('选择服务地址功能待实现。', '选择地址'); }
// function selectService() { showModernAlert('选择服务类型'); } // Handled by URL or default
function selectTime() { showModernAlert('选择上门时间功能待实现。', '选择时间'); }
function selectDiscount() { showModernAlert('选择优惠券及活动功能待实现。', '选择优惠'); }
function addRemarks() { showModernAlert('添加备注功能待实现。<br>您可以输入您的特殊需求。', '添加备注'); }
function selectPaymentMethod() { showModernAlert('选择其他支付方式功能待实现。', '支付方式'); }
function viewFullNotice() { showModernAlert('此处将展示完整的购买须知内容。<br><br><strong>重要:</strong> 服务开始前120分钟可免费取消；120分钟内取消且服务人员已经接单，平台将扣除您20%的支付金额。请仔细阅读相关条款。', '购买须知详情'); }

function selectRecharge(element, amount) {
    document.querySelectorAll('.recharge-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    const statusTag = document.querySelector('.recharge-promo-header .status-tag');
    if (statusTag) {
        statusTag.textContent = '已选' + amount + '元储值';
    }
    console.log('选择了充值：', amount);
    showModernAlert(`您已选择充值 ${amount} 元的选项。\n实际充值流程将在后续版本中实现。`, '储值选择', 'success');
}

function submitOrder() {
    const agreed = document.getElementById('agreementCheckbox').checked;
    if (!agreed) {
        showModernAlert('请先阅读并同意相关服务协议！', '协议未同意', 'warning');
        return;
    }
    showModernAlert('正在为您提交订单并跳转支付... (模拟)', '订单提交中', 'info');
    // Add actual submission logic here, e.g., redirect to a payment page or send data
    // setTimeout(() => { window.location.href = 'payment-success.html'; }, 2000);
}

function goBack() {
    if (document.referrer && document.referrer.includes('service-details.html')) {
        window.location.href = 'service-details.html';
    } else {
        history.back();
    }
}

function loadOrderDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceName = urlParams.get('service');
    const servicePrice = urlParams.get('price');
    const address = urlParams.get('address');

    const serviceNameDisplay = document.getElementById('service-name-display');
    const totalAmountDisplay = document.getElementById('total-amount-display');
    const addressTextDisplay = document.getElementById('address-text');

    if (serviceName && serviceNameDisplay) {
        serviceNameDisplay.textContent = decodeURIComponent(serviceName);
    }

    if (servicePrice && totalAmountDisplay) {
        let numericPrice = parseFloat(servicePrice);
        if (!isNaN(numericPrice)) {
             totalAmountDisplay.textContent = `¥${numericPrice.toFixed(0)}`; // Ensure two decimal places if needed, or toFixed(0) for whole numbers
             // Example: update original price and discount
             const originalPriceEl = document.querySelector('.footer-bar-price .original-price');
             const discountInfoEl = document.querySelector('.footer-bar-price .discount-info');
             if (originalPriceEl && discountInfoEl) {
                 // Assuming a fixed ¥18 discount for demonstration
                 const discountAmount = 18;
                 originalPriceEl.textContent = `¥${(numericPrice + discountAmount).toFixed(0)}`;
                 discountInfoEl.textContent = `优惠 ¥${discountAmount}`;
             }
        }
    }
    
    if (address && addressTextDisplay) {
        addressTextDisplay.textContent = decodeURIComponent(address);
    } else if (addressTextDisplay) {
         // addressTextDisplay.textContent = "请选择服务地址"; // Default if no address passed
    }
}

document.addEventListener('DOMContentLoaded', loadOrderDetails);