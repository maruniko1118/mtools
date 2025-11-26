function convertBase() {
    const input = document.getElementById('base-input').value;
    const fromBase = parseInt(document.getElementById('base-from').value);
    const toBase = parseInt(document.getElementById('base-to').value);
    const resultEl = document.getElementById('base-result');
    if (!input) return;
    try {
        const decimalValue = parseInt(input, fromBase);
        if (isNaN(decimalValue)) { resultEl.innerText = "エラー: 無効な数値"; return; }
        resultEl.innerText = decimalValue.toString(toBase).toUpperCase();
    } catch (e) { resultEl.innerText = "エラー"; }
}