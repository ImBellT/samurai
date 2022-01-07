// 姿勢推定を実行
async function runVideoPoseSimulation() {
    if (_inputVideo.getAttribute("src") === ""
        && (document.getElementById("dnn_model").value !== "custom"
                || (document.getElementById("dnn_model").value === "custom"
                && !document.getElementById("model_only").checked))) {
        alert('動画をアップロードしてください。');
        return;
    }
    if (document.getElementById("custom_data_file").files[0] === undefined
        && document.getElementById("dnn_model").value === "custom") {
        alert('学習データをアップロードしてください。');
        return;
    }
    if (document.getElementById("custom_valid_file").files[0] === undefined
        && document.getElementById("dnn_model").value === "custom"
        && document.getElementById("custom_valid").checked) {
        alert('評価用データをアップロードしてください。');
        return;
    }
    if (document.getElementById("dnn_model").value === "custom" && document.getElementById("model_only").checked) {
        ChangeInputAvailability(true);
        // モデル学習のみ
        const DataFile = URL.createObjectURL(document.getElementById("custom_data_file").files[0]); // 学習データを変数化
        const TestFile = document.getElementById("custom_valid_file").files[0] === null ? URL.createObjectURL(document.getElementById("custom_valid_file").files[0]) : null;
        document.getElementById("shuffle_seed").value = parseInt(document.getElementById("shuffle_seed").value, 10); // 小数点とかはすべて除去
        const config = {
            debug_mode: document.getElementById("debug-mode").checked,
            custom_valid: document.getElementById("custom_valid").checked,
            data_shuffle: document.getElementById("data_shuffle").checked,
            test_ratio: parseFloat(document.getElementById("valid_ratio").value),
            seed: parseInt(document.getElementById("shuffle_seed").value, 10)
        };
        model_data = await UseCustomModel(DataFile, TestFile, config); // 学習データを使用してモデル作成
        document.getElementById("save_model").disabled = false; // ダウンロードボタンを有効化（グレーアウトを解除）
        document.getElementById("save_model").title = "作成したモデルをダウンロードします";
        ChangeInputAvailability(false);
    } else {
        // 全部やる
        await RunSimulation(_Canvas, _Ctx, _inputVideo, _poseParam); // 姿勢推定
        ResetPreviewVision();
        ChangeInputAvailability(true);
        document.getElementById("save_result").disabled = false; // ダウンロードボタンを有効化（グレーアウトを解除）
        document.getElementById("save_result").title = "予測した技確率をCSV形式でダウンロードします";
        ChangeInputAvailability(false);
    }

}

// CSV形式でダウンロード
function downloadResult(Data, Filename) {
    Data.forEach(e => {
        e.data = [e.time_stamp].concat(e.data);
        delete e.time_stamp;
    })
    let csv_string = "経過フレーム数,突き技の確率,回し蹴りの確率,正蹴りの確率,技なしの確率\r\n";
    Data.forEach(d => {
        csv_string += d.data.join(","); // 配列ごとの区切りを「,」をつけて一列化
        csv_string += '\r\n';
    });
    let bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const dataBlob = new Blob([bom, csv_string], {type: "text/csv"}); // 抽出したデータをCSV形式に変換
    const DownloadUrl = URL.createObjectURL(dataBlob); // JSONデータをURLに変換
    const downloadOpen = document.createElement('a');
    downloadOpen.href = DownloadUrl;
    downloadOpen.download = Filename; // ダウンロード時のファイル名を指定
    downloadOpen.click(); // 疑似クリック
    URL.revokeObjectURL(DownloadUrl); // 作成したURLを解放（削除）
}

// ページ読み込み時に発火
window.addEventListener('load', async () => {
    ResetStyle(); // アコーディオンを初期化
    ResetPreviewVision(); // プレビュー画面を初期化
});
document.getElementById("save_result").addEventListener('click', () => {
    resumePoseDB("samurai_db", "result_store").then(e => downloadResult(e, "result.csv"));
});
document.getElementById("save_model").addEventListener('click', () => {
    downloadModel(model_data).then();
});

// 処理実行ボタン押し時に発火
document.getElementById("send_data").addEventListener('click', () => {
    runVideoPoseSimulation().then();
});