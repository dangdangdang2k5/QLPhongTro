/**
 * QLPhongTro PRO - Frontend Client Scripts
 */

// 1. Sao chép vào bộ nhớ tạm (Clipboard)
function copyToClipboard(elementId, buttonElement) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const textToCopy = el.innerText.trim();

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => showCopySuccess(buttonElement))
            .catch(() => fallbackCopy(textToCopy, buttonElement));
    } else {
        fallbackCopy(textToCopy, buttonElement);
    }
}

function fallbackCopy(text, buttonElement) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand("copy");
        showCopySuccess(buttonElement);
    } catch (err) {
        console.error("Không thể copy:", err);
    }
    document.body.removeChild(textArea);
}

function showCopySuccess(buttonElement) {
    const originalText = buttonElement.innerText;
    buttonElement.innerText = "✓ Đã chép!";
    buttonElement.classList.add("copied");

    setTimeout(() => {
        buttonElement.innerText = originalText;
        buttonElement.classList.remove("copied");
    }, 2000);
}

// 2. Tìm kiếm nhanh bảng dữ liệu
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const filter = input.value.toLowerCase();
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        let match = false;
        const cells = rows[i].getElementsByTagName('td');
        for (let j = 0; j < cells.length; j++) {
            if (cells[j] && cells[j].innerText.toLowerCase().indexOf(filter) > -1) {
                match = true;
                break;
            }
        }
        rows[i].style.display = match ? '' : 'none';
    }
}
