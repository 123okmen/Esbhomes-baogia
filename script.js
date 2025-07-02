window.onload = function() {
    // Collapsible content for Influencing Factors
    document.querySelectorAll('#factors-container button').forEach(button => {
        button.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('span:last-child');
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                // Close other open items
                document.querySelectorAll('#factors-container .collapsible-content').forEach(item => {
                    item.style.maxHeight = null;
                    item.previousElementSibling.querySelector('span:last-child').style.transform = 'rotate(0deg)';
                });
                content.style.maxHeight = content.scrollHeight + "px";
                icon.style.transform = 'rotate(45deg)';
            }
        });
    });

    // Cost Estimation Logic
    const estimatorForm = document.getElementById('estimatorForm');
    const areaInput = document.getElementById('area');
    const floorsInput = document.getElementById('floors');
    const styleSelect = document.getElementById('style');
    const finishSelect = document.getElementById('finish');
    const foundationTypeSelect = document.getElementById('foundation_type');
    const mezzanineOptionSelect = document.getElementById('mezzanine_option');
    const rooftopOptionSelect = document.getElementById('rooftop_option');
    const roofTypeSelect = document.getElementById('roof_type');
    const emailInput = document.getElementById('email');

    const resultsSection = document.getElementById('resultsSection');
    const estimatedCostDisplay = document.getElementById('estimatedCost');
    const costLoadingSpinner = document.getElementById('costLoadingSpinner');
    const costError = document.getElementById('costError');
    const emailNotification = document.getElementById('emailNotification');
    const detailedBreakdownTableBody = document.getElementById('detailedBreakdownTableBody');
    const paymentScheduleTableBody = document.getElementById('paymentScheduleTableBody');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const ctxCostBreakdown = document.getElementById('costBreakdownChart').getContext('2d');

    // Variable to store the last calculated quote data
    let lastQuoteData = null;

    // Initial chart setup (will be updated on calculation)
    let costBreakdownChart = new Chart(ctxCostBreakdown, {
        type: 'bar',
        data: {
            labels: ['Phần thô', 'Hoàn thiện', 'M&E', 'Thiết kế & Giấy phép', 'Dự phòng'],
            datasets: [{
                label: 'Phân bổ Chi phí',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(251, 191, 36, 0.7)', /* Golden Yellow */
                    'rgba(245, 158, 11, 0.7)',  /* Orange-Yellow */
                    'rgba(217, 119, 6, 0.7)',   /* Darker Orange */
                    'rgba(180, 83, 9, 0.7)',    /* Brownish Orange */
                    'rgba(124, 45, 6, 0.7)'     /* Darkest Orange */
                ],
                borderColor: [
                    'rgb(251, 191, 36)',
                    'rgb(245, 158, 11)',
                    'rgb(217, 119, 6)',
                    'rgb(180, 83, 9)',
                    'rgb(124, 45, 6)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tỷ lệ (%)',
                        color: '#3a3a3a' /* Dark text for chart axis title */
                    },
                    ticks: {
                        color: '#3a3a3a' /* Dark text for chart ticks */
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)' /* Light grid lines */
                    }
                },
                x: {
                    ticks: {
                        callback: function(value, index, values) {
                            const label = this.getLabelForValue(value);
                            if (label.length > 16) { // Wrap long labels
                                return label.split(' ').reduce((acc, word) => {
                                    if (acc[acc.length - 1].length + word.length + 1 > 16) {
                                        acc.push(word);
                                    } else {
                                        acc[acc.length - 1] += (acc[acc.length - 1] ? ' ' : '') + word;
                                    }
                                    return acc;
                                }, ['']);
                            }
                            return label;
                        },
                        color: '#3a3a3a' /* Dark text for chart ticks */
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)' /* Light grid lines */
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + '%';
                            }
                            return label;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'PHÂN BỔ CHI PHÍ ƯỚC TÍNH (TỶ LỆ PHẦN TRĂM)',
                    font: { size: 16, family: 'Arial', color: '#3a3a3a' } /* Dark text for chart title */
                }
            }
        }
    });

    estimatorForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent actual form submission

        const area = parseFloat(areaInput.value);
        const floors = parseInt(floorsInput.value);
        const email = emailInput.value;

        if (isNaN(area) || area <= 0 || isNaN(floors) || floors <= 0) {
            costError.textContent = 'Vui lòng nhập diện tích và số tầng hợp lệ.';
            costError.classList.remove('hidden');
            emailNotification.classList.add('hidden');
            resultsSection.classList.add('hidden');
            return;
        } else {
            costError.classList.add('hidden');
        }

        costLoadingSpinner.style.display = 'block';
        resultsSection.classList.add('hidden');
        emailNotification.classList.add('hidden');

        // Simulate calculation delay
        setTimeout(() => {
            const style = styleSelect.value;
            const finish = finishSelect.value;
            const foundationType = foundationTypeSelect.value;
            const mezzanineOption = mezzanineOptionSelect.value;
            const rooftopOption = rooftopOptionSelect.value;
            const roofType = roofTypeSelect.value;

            let baseCostPerSqM = 5000000; // Base cost per square meter (VNĐ) for basic finish, modern style

            // Adjust for style
            if (style === 'neoclassical') baseCostPerSqM *= 1.2;
            else if (style === 'minimalist') baseCostPerSqM *= 0.95;

            // Adjust for finish level
            if (finish === 'standard') baseCostPerSqM *= 1.15;
            else if (finish === 'premium') baseCostPerSqM *= 1.35;

            // Adjust for number of floors
            let floorFactor = 1;
            if (floors === 2) floorFactor = 1.05;
            else if (floors === 3) floorFactor = 1.1;
            else if (floors === 4) floorFactor = 1.15;
            else if (floors > 4) floorFactor = 1.2;

            // Adjust for foundation type
            let foundationFactor = 1;
            if (foundationType === 'strip') foundationFactor = 1.05;
            else if (foundationType === 'pile') foundationFactor = 1.10;
            
            // Adjust for mezzanine
            let mezzanineFactor = (mezzanineOption === 'yes') ? 1.03 : 1;
            
            // Adjust for rooftop
            let rooftopFactor = (rooftopOption === 'yes') ? 1.02 : 1;

            // Adjust for roof type
            let roofFactor = 1;
            if (roofType === 'thai') roofFactor = 1.05;
            else if (roofType === 'japanese') roofFactor = 1.07;
            
            const totalArea = area * floors;
            const totalEstimatedCost = totalArea * baseCostPerSqM * floorFactor * foundationFactor * mezzanineFactor * rooftopFactor * roofFactor;

            // Store data for the email button
            lastQuoteData = {
                area,
                floors,
                style: styleSelect.options[styleSelect.selectedIndex].text,
                finish: finishSelect.options[finishSelect.selectedIndex].text,
                foundationType: foundationTypeSelect.options[foundationTypeSelect.selectedIndex].text,
                mezzanineOption: mezzanineOptionSelect.options[mezzanineOptionSelect.selectedIndex].text,
                rooftopOption: rooftopOptionSelect.options[rooftopOptionSelect.selectedIndex].text,
                roofType: roofTypeSelect.options[roofTypeSelect.selectedIndex].text,
                email,
                totalEstimatedCost
            };

            // Update main cost display
            estimatedCostDisplay.textContent = `${totalEstimatedCost.toLocaleString('vi-VN')} VNĐ`;
            
            // --- Chart and Detailed Breakdown Data ---
            const breakdownPercentages = {
                'basic':    { rough: 40, finishing: 30, me: 15, design: 10, contingency: 5 },
                'standard': { rough: 35, finishing: 35, me: 15, design: 10, contingency: 5 },
                'premium':  { rough: 30, finishing: 40, me: 15, design: 10, contingency: 5 }
            };
            const currentBreakdownPercents = breakdownPercentages[finish];
            
            costBreakdownChart.data.datasets[0].data = Object.values(currentBreakdownPercents);
            costBreakdownChart.update();

            const detailedItems = {
                'Phần thô': {
                    'Móng, kết cấu': 0.60 * currentBreakdownPercents.rough,
                    'Xây tô, chống thấm': 0.40 * currentBreakdownPercents.rough
                },
                'Hoàn thiện': {
                    'Ốp lát (sàn, tường)': 0.30 * currentBreakdownPercents.finishing,
                    'Sơn nước, trần thạch cao': 0.25 * currentBreakdownPercents.finishing,
                    'Cửa, lan can, cầu thang': 0.25 * currentBreakdownPercents.finishing,
                    'Thiết bị vệ sinh': 0.20 * currentBreakdownPercents.finishing
                },
                'Hệ thống M&E': {
                    'Hệ thống điện': 0.50 * currentBreakdownPercents.me,
                    'Hệ thống cấp thoát nước': 0.50 * currentBreakdownPercents.me
                },
                'Chi phí khác': {
                    'Thiết kế & Giấy phép': currentBreakdownPercents.design,
                    'Dự phòng': currentBreakdownPercents.contingency
                }
            };

            detailedBreakdownTableBody.innerHTML = '';
            for (const mainCategory in detailedItems) {
                let firstRow = true;
                const subItems = detailedItems[mainCategory];
                const rowSpan = Object.keys(subItems).length;
                for (const subItem in subItems) {
                    const cost = totalEstimatedCost * (subItems[subItem] / 100);
                    const row = document.createElement('tr');
                    let mainCategoryCell = '';
                    if (firstRow) {
                        mainCategoryCell = `<td rowspan="${rowSpan}" class="align-top font-semibold">${mainCategory}</td>`;
                        firstRow = false;
                    }
                    row.innerHTML = `
                        ${mainCategoryCell}
                        <td>${subItem}</td>
                        <td class="text-right">${cost.toLocaleString('vi-VN')}</td>
                    `;
                    detailedBreakdownTableBody.appendChild(row);
                }
            }

            const paymentStages = [
                { stage: 1, description: 'Tạm ứng ngay khi ký hợp đồng', percentage: 15 },
                { stage: 2, description: 'Sau khi hoàn thành phần móng', percentage: 20 },
                { stage: 3, description: 'Sau khi hoàn thành kết cấu khung bê tông', percentage: 20 },
                { stage: 4, description: 'Sau khi hoàn thành xây tô, đi hệ thống M&E', percentage: 20 },
                { stage: 5, description: 'Hoàn thiện, trước khi bàn giao nhà', percentage: 23 },
                { stage: 6, description: 'Bảo hành công trình (sau khi bàn giao)', percentage: 2 }
            ];

            paymentScheduleTableBody.innerHTML = '';
            paymentStages.forEach(item => {
                const amount = totalEstimatedCost * (item.percentage / 100);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="text-center">${item.stage}</td>
                    <td>${item.description}</td>
                    <td class="text-right">${item.percentage}%</td>
                    <td class="text-right font-semibold">${amount.toLocaleString('vi-VN')}</td>
                `;
                paymentScheduleTableBody.appendChild(row);
            });

            // Show results and hide spinner
            resultsSection.classList.remove('hidden');
            costLoadingSpinner.style.display = 'none';

        }, 800);
    });

    sendEmailBtn.addEventListener('click', () => {
        if (!lastQuoteData) {
            alert('Lỗi: Không có dữ liệu báo giá. Vui lòng thực hiện ước tính trước.');
            return;
        }

        emailNotification.textContent = 'Đang chuẩn bị mở trình gửi email của bạn...';
        emailNotification.classList.remove('hidden');

        const { email, area, floors, style, finish, foundationType, mezzanineOption, rooftopOption, roofType, totalEstimatedCost } = lastQuoteData;

        const recipient = 'esb.homes.company@gmail.com';
        const subject = `Yêu cầu Báo giá Xây dựng - ${email}`;
        const body = `
Chào ESB Homes,

Tôi muốn yêu cầu báo giá chi tiết dựa trên các thông tin sau:

--- CHI TIẾT DỰ ÁN ---
- Email liên hệ: ${email}
- Diện tích sàn: ${area} m²
- Số tầng: ${floors}
- Phong cách: ${style}
- Mức độ hoàn thiện: ${finish}
- Loại móng: ${foundationType}
- Có tầng lửng: ${mezzanineOption}
- Có sân thượng: ${rooftopOption}
- Loại mái: ${roofType}

--- CHI PHÍ ƯỚC TÍNH SƠ BỘ ---
- Tổng chi phí: ${totalEstimatedCost.toLocaleString('vi-VN')} VNĐ

Vui lòng liên hệ lại với tôi qua email trên để tư vấn thêm.
Cảm ơn.
        `.trim().replace(/^\s+/gm, '');

        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;

        setTimeout(() => {
            emailNotification.classList.add('hidden');
        }, 3000);
    });

    // Navigation Logic
    const sections = document.querySelectorAll('section');
    const navLinksDesktop = document.querySelectorAll('#desktop-nav a');
    const navLinksMobile = document.querySelectorAll('#mobile-nav a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinksDesktop.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
                navLinksMobile.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-30% 0px -70% 0px' });

    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button'); // This button is not present in your HTML, consider adding it for mobile.
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('translate-y-full');
        mobileMenuOverlay.classList.toggle('hidden');
        mobileMenuOverlay.classList.toggle('opacity-0');
        mobileMenuOverlay.classList.toggle('opacity-50');
    };

    // If you plan to add a hamburger menu button for mobile, uncomment and use this:
    // if (mobileMenuButton) {
    //     mobileMenuButton.addEventListener('click', toggleMenu);
    // }

    // For now, attaching the toggle to navigation links in mobile menu to close on click
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', toggleMenu);
    }
    navLinksMobile.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });
};

