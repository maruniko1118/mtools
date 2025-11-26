var calcApp = {
    current: '', 
    prev: '', 
    op: null,
    history: [],

    init: function() {
        try {
            const saved = localStorage.getItem('marutility_calc_history');
            if (saved) this.history = JSON.parse(saved);
        } catch(e) {}
        this.renderHistory();
    },

    append: function(n) {
        if (n === '.' && this.current.includes('.')) return;
        if (n === '00' && (this.current === '' || this.current === '0')) return;
        if (this.current === '0' && n !== '.') this.current = '';
        
        if (n === '%') {
            if (this.current === '') return;
            this.current = String(parseFloat(this.current) / 100);
            this.update();
            return;
        }

        this.current += n;
        this.update();
    },

    setOp: function(op) {
        if (this.current === '') {
            if(this.prev !== '') {
                this.op = op; 
                this.updateSub();
            }
            return;
        }
        if (this.prev !== '') this.calc(true);
        
        this.op = op;
        this.prev = this.current;
        this.current = '';
        this.updateSub();
    },

    calc: function(isContinuous = false) {
        const p = parseFloat(this.prev);
        const c = parseFloat(this.current);
        if (isNaN(p) || isNaN(c)) return;
        
        let res = 0;
        switch(this.op) {
            case '+': res = p + c; break;
            case '-': res = p - c; break;
            case '*': res = p * c; break;
            case '/': res = p / c; break;
        }
        
        res = Math.round(res * 1000000000) / 1000000000;
        const resStr = String(res);

        if (!isContinuous) {
            this.addHistory(`${this.prev} ${this.op} ${this.current} =`, resStr);
        }

        this.current = resStr;
        this.op = null;
        this.prev = '';
        this.update();
        this.updateSub();
    },

    clear: function() {
        this.current = ''; this.prev = ''; this.op = null;
        this.update(); this.updateSub();
    },

    backspace: function() {
        this.current = this.current.slice(0, -1);
        this.update();
    },

    update: function() {
        const d = document.getElementById('calc-main');
        if(d) d.innerText = this.current || '0';
    },

    updateSub: function() {
        const d = document.getElementById('calc-sub');
        if(d) d.innerText = this.op ? `${this.prev} ${this.op}` : '';
    },

    addHistory: function(expression, result) {
        this.history.unshift({ expr: expression, res: result });
        if (this.history.length > 20) this.history.pop();
        this.saveHistory();
        this.renderHistory();
    },

    clearHistory: function() {
        if(confirm('履歴をすべて削除しますか？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    },

    saveHistory: function() {
        localStorage.setItem('marutility_calc_history', JSON.stringify(this.history));
    },

    renderHistory: function() {
        const list = document.getElementById('history-list');
        if (!list) return;
        list.innerHTML = '';

        if (this.history.length === 0) {
            list.innerHTML = '<li style="padding:20px; text-align:center; color:var(--text-sub);">履歴なし</li>';
            return;
        }

        this.history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `<div class="history-expr">${item.expr}</div><div class="history-res">${item.res}</div>`;
            li.onclick = () => {
                this.current = item.res;
                this.update();
            };
            list.appendChild(li);
        });
    }
};

calcApp.init();