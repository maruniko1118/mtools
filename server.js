const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// publicフォルダを静的ファイルとして公開
app.use(express.static(path.join(__dirname, 'public')));

// ツール一覧を取得するAPI
app.get('/api/tools', (req, res) => {
    const toolsDir = path.join(__dirname, 'public', 'tools');

    if (!fs.existsSync(toolsDir)){
        fs.mkdirSync(toolsDir);
        return res.json([]);
    }

    // ディレクトリをスキャン (withFileTypes: true でディレクトリ判定を容易に)
    fs.readdir(toolsDir, { withFileTypes: true }, (err, entries) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to scan tools directory' });
        }

        const tools = [];
        entries.forEach(entry => {
            // ディレクトリであり、その中に index.html がある場合のみツールとみなす
            if (entry.isDirectory()) {
                const toolId = entry.name; // フォルダ名をIDとする (例: calc)
                const indexPath = path.join(toolsDir, toolId, 'index.html');

                if (fs.existsSync(indexPath)) {
                    const content = fs.readFileSync(indexPath, 'utf-8');
                    
                    // <h2>タグからタイトル抽出
                    const h2Match = content.match(/<h2[^>]*>\s*(.*?)\s*<\/h2>/i);
                    let title = toolId;
                    if (h2Match && h2Match[1]) {
                        title = h2Match[1].trim();
                    }
                    
                    tools.push({
                        id: toolId,
                        name: title,
                        // ファイルパスではなく、アクセス用のベースパス情報などを持たせてもよいが
                        // ここでは app.js 側で `/tools/{id}/index.html` を推測させるためシンプルに返す
                    });
                }
            }
        });
        res.json(tools);
    });
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});