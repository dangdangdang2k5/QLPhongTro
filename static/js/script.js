/**
 * Hàm sao chép văn bản vào Clipboard và hiển thị thông báo phản hồi
 */
function copyToClipboard(elementId, buttonElement) {
  const textToCopy = document.getElementById(elementId).innerText.trim();

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showCopySuccess(buttonElement);
      })
      .catch(() => {
        fallbackCopy(textToCopy, buttonElement);
      });
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
