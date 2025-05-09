// js/service-details.js

// PASTE THE showModernAlert function HERE if not using a shared file

function switchTab(tabElement) {
    document.querySelectorAll('.header-tabs .tab-item').forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');
    console.log('切换到标签:', tabElement.textContent);
    showModernAlert(`已切换到 "${tabElement.textContent}" 服务列表。\n内容区域将相应更新 (功能待实现)。`, '标签切换');
}

function goToOrder(serviceName, servicePrice) {
    const encodedServiceName = encodeURIComponent(serviceName);
    const encodedServicePrice = encodeURIComponent(servicePrice);
    showModernAlert(`即将为您预订: ${serviceName}\n价格: ¥${servicePrice}`, '订单确认', 'info');
    setTimeout(() => { // Simulate a small delay before redirecting
        window.location.href = `confirm-order.html?service=${encodedServiceName}&price=${encodedServicePrice}`;
    }, 1500);
}

function consultService() {
    showModernAlert('在线客服功能即将上线，敬请期待！<br>您可以先查看常见问题或服务详情。', '咨询客服', 'info');
}

function bookNowDefault() {
    // Select the first item in the vertical list
    const firstServiceItem = document.querySelector('.service-options-list .service-option-item');
    if (firstServiceItem) {
        const title = firstServiceItem.querySelector('.title').textContent;
        const priceText = firstServiceItem.querySelector('.price').textContent;
        const priceMatch = priceText.match(/(\d+(\.\d+)?)/);
        const price = priceMatch ? priceMatch[1] : '0';
        goToOrder(title, price);
    } else {
        showModernAlert('当前没有可推荐的服务项目，请稍后再试。', '无服务可选', 'warning');
    }
}