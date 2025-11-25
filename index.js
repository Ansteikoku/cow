// index.js — 2025最新版（確実に板が表示される）
// Supabase クライアントは supabaseClient.js で生成済みとする

document.addEventListener("DOMContentLoaded", async () => {
    const boardList = document.getElementById("boardList");

    if (!boardList) {
        console.error("Error: #boardList が index.html に存在しません");
        return;
    }

    try {
        // --- Supabase から boards を取得 ---
        const { data: boards, error } = await supabase
            .from("boards")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("Supabase Error:", error);
            boardList.innerHTML = `<p style="color:red;">板一覧の読み込みに失敗しました。</p>`;
            return;
        }

        console.log("Loaded boards:", boards);

        // --- boards テーブルが空の場合 ---
        if (!boards || boards.length === 0) {
            boardList.innerHTML = `<p>まだ板がありません。</p>`;
            return;
        }

        // --- HTMLとして板を表示 ---
        boardList.innerHTML = boards.map(board => `
            <div class="board-item">
                <a href="board.html?id=${board.id}" class="board-link">
                    ${board.name}
                </a>
                <div class="board-desc">${board.description || ""}</div>
            </div>
        `).join("");

    } catch (e) {
        console.error("JS Error:", e);
        boardList.innerHTML = `<p style="color:red;">読み込み中にエラーが発生しました。</p>`;
    }
});
