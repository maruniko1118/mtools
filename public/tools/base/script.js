// 初期表示する基数リスト
let activeRadixes = [2, 8, 10, 16];

// ビット数設定の記憶用
let bitsSettings = {
    on: { value: 8, isCustom: false },
    off: { value: 0, isCustom: false }
};

function init() {
    activeRadixes.sort((a, b) => a - b);
    updateBitsUI();
    convertBase();
}

function handleInputChange() {
    const inputStr = document.getElementById('base-input').value.trim();
    const toggle = document.getElementById('sign-toggle');
    
    const radixSelect = document.getElementById('base-input-radix-select');
    let inputRadix = (radixSelect.value === 'custom') 
        ? parseInt(document.getElementById('base-input-radix-custom').value) 
        : parseInt(radixSelect.value);
    
    if (isNaN(inputRadix) || inputRadix < 2 || inputRadix > 36) inputRadix = 10;

    if (inputRadix === 10) {
        if (inputStr.startsWith('-')) {
            if (!toggle.checked) {
                saveCurrentBitsSetting(false);
                toggle.checked = true;
                updateBitsUI(); 
            }
        } else {
            if (toggle.checked) {
                saveCurrentBitsSetting(true);
                toggle.checked = false;
                updateBitsUI(); 
            }
        }
    }
    
    convertBase();
}

function handleInputUI(type) {
    const selectId = type === 'radix' ? 'base-input-radix-select' : 'base-bits-select';
    const inputId = type === 'radix' ? 'base-input-radix-custom' : 'base-bits-custom';
    
    const selectEl = document.getElementById(selectId);
    const inputEl = document.getElementById(inputId);
    
    if (selectEl.value === 'custom') {
        inputEl.classList.remove('hidden');
        inputEl.focus();
    } else {
        inputEl.classList.add('hidden');
    }

    if (type === 'bits') {
        const isSignedMode = document.getElementById('sign-toggle').checked;
        saveCurrentBitsSetting(isSignedMode);
    }

    convertBase();
}

function handleSignModeChange() {
    updateBitsUI();
    convertBase();
}

function saveCurrentBitsSetting(isModeOn) {
    const selectEl = document.getElementById('base-bits-select');
    const customEl = document.getElementById('base-bits-custom');
    
    const val = selectEl.value === 'custom' ? parseInt(customEl.value) || 0 : parseInt(selectEl.value);
    const isCustom = selectEl.value === 'custom';

    if (isModeOn) {
        bitsSettings.on = { value: val, isCustom: isCustom };
    } else {
        bitsSettings.off = { value: val, isCustom: isCustom };
    }
}

function updateBitsUI() {
    const isModeOn = document.getElementById('sign-toggle').checked;
    const setting = isModeOn ? bitsSettings.on : bitsSettings.off;
    
    const selectEl = document.getElementById('base-bits-select');
    const customEl = document.getElementById('base-bits-custom');

    if (setting.isCustom) {
        selectEl.value = 'custom';
        customEl.value = setting.value;
        customEl.classList.remove('hidden');
    } else {
        const options = Array.from(selectEl.options).map(o => o.value);
        if (options.includes(String(setting.value))) {
            selectEl.value = String(setting.value);
            customEl.classList.add('hidden');
        } else {
            selectEl.value = 'custom';
            customEl.value = setting.value;
            customEl.classList.remove('hidden');
        }
    }
}

function convertBase() {
    const inputStr = document.getElementById('base-input').value.trim();
    
    const radixSelect = document.getElementById('base-input-radix-select');
    let inputRadix = (radixSelect.value === 'custom') 
        ? parseInt(document.getElementById('base-input-radix-custom').value) 
        : parseInt(radixSelect.value);
    if (isNaN(inputRadix) || inputRadix < 2 || inputRadix > 36) inputRadix = 10;

    const bitsSelect = document.getElementById('base-bits-select');
    let bitWidth = (bitsSelect.value === 'custom')
        ? (parseInt(document.getElementById('base-bits-custom').value) || 0)
        : parseInt(bitsSelect.value);
    if (isNaN(bitWidth)) bitWidth = 0;

    const isComplementMode = document.getElementById('sign-toggle').checked;

    const resultList = document.getElementById('result-list');
    resultList.innerHTML = '';

    if (!inputStr) {
        renderPlaceholders(resultList);
        return;
    }

    try {
        const pointIndex = inputStr.indexOf('.');
        const hasPoint = pointIndex !== -1;

        let integerPartStr = hasPoint ? inputStr.substring(0, pointIndex) : inputStr;
        let fractionalPartStr = hasPoint ? inputStr.substring(pointIndex + 1) : "";

        let intVal = parseInputToBigInt(integerPartStr, inputRadix);

        let fracVal = 0;
        if (hasPoint && fractionalPartStr.length > 0) {
            fracVal = parseFractionPart(fractionalPartStr, inputRadix);
        }

        const isFractional = hasPoint && fractionalPartStr.length > 0;

        activeRadixes.forEach(radix => {
            let resultStr = "";

            // --- 整数部の処理 ---
            if (isFractional) {
                let displayIntVal = intVal;
                if (!isComplementMode && bitWidth > 0) {
                    let absVal = intVal < 0n ? -intVal : intVal;
                    const mask = (1n << BigInt(bitWidth)) - 1n;
                    absVal = absVal & mask;
                    displayIntVal = (intVal < 0n) ? -absVal : absVal;
                }
                resultStr = displayIntVal.toString(radix).toUpperCase();

            } else {
                if (isComplementMode) {
                    let effectiveWidth = bitWidth;
                    if (effectiveWidth === 0) {
                        if (intVal < 0n) {
                            let w = 8n;
                            while (intVal < -(1n << (w - 1n))) w += 8n;
                            effectiveWidth = Number(w);
                        } else {
                            effectiveWidth = 8;
                        }
                    }

                    const mask = (1n << BigInt(effectiveWidth)) - 1n;
                    let maskedVal = intVal & mask;

                    if (radix === 10) {
                        const msb = 1n << BigInt(effectiveWidth - 1);
                        if ((maskedVal & msb) !== 0n) {
                            let signedVal = maskedVal - (1n << BigInt(effectiveWidth));
                            resultStr = signedVal.toString(10);
                        } else {
                            resultStr = maskedVal.toString(10);
                        }
                    } else {
                        resultStr = maskedVal.toString(radix).toUpperCase();
                        
                        const bitsPerDigit = Math.log2(radix);
                        if (Number.isInteger(bitsPerDigit)) {
                            const len = Math.ceil(effectiveWidth / bitsPerDigit);
                            if (resultStr.length < len) resultStr = resultStr.padStart(len, '0');
                        }
                    }

                } else {
                    if (bitWidth > 0) {
                        const mask = (1n << BigInt(bitWidth)) - 1n;
                        let masked = intVal & mask;
                        resultStr = masked.toString(radix).toUpperCase();
                        
                        const bitsPerDigit = Math.log2(radix);
                        if (Number.isInteger(bitsPerDigit)) {
                            const len = Math.ceil(bitWidth / bitsPerDigit);
                            if (resultStr.length < len) resultStr = resultStr.padStart(len, '0');
                        }
                    } else {
                        resultStr = intVal.toString(radix).toUpperCase();
                    }
                }
            }

            // --- 小数部の処理 ---
            if (isFractional) {
                let fracStr = convertFractionPart(fracVal, radix);
                if (fracStr) {
                    resultStr += "." + fracStr;
                }
            }

            if (radix === 2) {
                const parts = resultStr.split('.');
                let intPart = parts[0];
                const fracPart = parts.length > 1 ? parts[1] : "";

                const isNeg = intPart.startsWith('-');
                let rawInt = isNeg ? intPart.substring(1) : intPart;
                
                rawInt = rawInt.replace(/\B(?=(.{4})+(?!\d))/g, " ");
                intPart = isNeg ? '-' + rawInt : rawInt;

                if (fracPart) {
                    let rawFrac = fracPart.replace(/(.{4})/g, "$1 ").trim();
                    resultStr = intPart + "." + rawFrac;
                } else {
                    resultStr = intPart;
                }
            }

            addResultRow(resultList, radix, resultStr);
        });

    } catch (e) {
        console.error(e);
        // 【修正】エラー表示を安全に
        const div = document.createElement('div');
        div.style.color = 'var(--accent-red)';
        div.style.padding = '10px';
        div.textContent = 'エラー: 無効な値です';
        resultList.appendChild(div);
    }
}

function parseInputToBigInt(str, radix) {
    let isNegative = false;
    str = str.replace(/\s/g, '');
    if (!str) return 0n;

    if (str.startsWith('-')) { isNegative = true; str = str.substring(1); }
    else if (str.startsWith('+')) { str = str.substring(1); }

    if (str.toLowerCase().startsWith('0x')) { str = str.substring(2); radix = 16; }
    else if (str.toLowerCase().startsWith('0b')) { str = str.substring(2); radix = 2; }
    else if (str.toLowerCase().startsWith('0o')) { str = str.substring(2); radix = 8; }

    const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".substring(0, radix);
    for (let char of str) {
        if (!validChars.includes(char.toUpperCase())) throw new Error();
    }

    let val = 0n;
    const bigRadix = BigInt(radix);
    for (let char of str) {
        const digit = parseInt(char, radix);
        val = val * bigRadix + BigInt(digit);
    }
    return isNegative ? -val : val;
}

function parseFractionPart(str, radix) {
    str = str.replace(/\s/g, '');
    if (!str) return 0;
    
    let val = 0;
    let divider = radix;
    
    const validChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".substring(0, radix);
    for (let char of str) {
        if (!validChars.includes(char.toUpperCase())) break;
        const digit = parseInt(char, radix);
        val += digit / divider;
        divider *= radix;
    }
    return val;
}

function convertFractionPart(val, radix) {
    let str = "";
    let maxDigits = 20;
    let v = val;
    
    for (let i = 0; i < maxDigits; i++) {
        if (v === 0) break;
        v *= radix;
        const digit = Math.floor(v);
        str += digit.toString(radix).toUpperCase();
        v -= digit;
    }
    return str;
}

// 【修正】安全なDOM構築に変更
function addResultRow(container, radix, value) {
    const row = document.createElement('div');
    row.className = 'result-row';
    
    let label = `${radix}進数`;
    if (radix === 10) label = "10進数";
    if (radix === 16) label = "16進数";
    if (radix === 2) label = "2進数";
    if (radix === 8) label = "8進数";

    const divLabel = document.createElement('div');
    divLabel.className = 'result-label';
    divLabel.textContent = label;

    const divValue = document.createElement('div');
    divValue.className = 'result-value';
    divValue.textContent = value;

    const divActions = document.createElement('div');
    divActions.className = 'result-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'コピー';
    copyBtn.onclick = function() { copyToClipboard(this, value.replace(/\s/g, '')); };

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.title = '削除';
    removeBtn.textContent = '✕';
    removeBtn.onclick = function() { removeResult(radix); };

    divActions.appendChild(copyBtn);
    divActions.appendChild(removeBtn);

    row.appendChild(divLabel);
    row.appendChild(divValue);
    row.appendChild(divActions);

    container.appendChild(row);
}

function renderPlaceholders(container) {
    activeRadixes.sort((a, b) => a - b).forEach(radix => {
        addResultRow(container, radix, "-");
    });
}

function addCustomBase() {
    const radixInput = document.getElementById('custom-radix');
    const r = parseInt(radixInput.value);
    if (isNaN(r) || r < 2 || r > 36) { alert("2〜36の範囲で入力"); return; }
    if (!activeRadixes.includes(r)) {
        activeRadixes.push(r);
        activeRadixes.sort((a, b) => a - b);
        convertBase();
    }
    radixInput.value = '';
}

function removeResult(radix) {
    activeRadixes = activeRadixes.filter(r => r !== radix);
    convertBase();
}

function copyToClipboard(btn, text) {
    if (text === '-') return;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "コピー済";
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('copied');
        }, 1000);
    });
}

init();