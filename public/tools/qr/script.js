function generateQR() {
    const text = document.getElementById('qr-input').value;
    const container = document.getElementById('qrcode');
    container.innerHTML = ""; 
    if (text.trim() === "") return;
    new QRCode(container, { text: text, width: 160, height: 160, colorDark : "#000000", colorLight : "#ffffff" });
}