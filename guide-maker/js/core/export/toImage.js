// core/export/toImage.js
// 右側プレビューのシート要素をPNG画像として書き出す。html2canvas（CDN）に依存。
export async function exportSheetAsImage(targetEl, filename = "guide.png") {
  if (typeof window.html2canvas !== "function") {
    throw new Error("html2canvas が読み込まれていません");
  }
  const canvas = await window.html2canvas(targetEl, {
    backgroundColor: "#10151a",
    scale: 2,
    // 削除ボタン・リサイズハンドル・設定パネル・選択中ハイライトは編集用のUIなので、
    // 書き出し画像には含めない。
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll(".sheet-block__delete").forEach((el) => el.remove());
      clonedDoc.querySelectorAll(".sheet-block__resize").forEach((el) => el.remove());
      clonedDoc.querySelectorAll("#miniPanel").forEach((el) => el.remove());
      clonedDoc.querySelectorAll(".sheet-block.is-selected").forEach((el) => el.classList.remove("is-selected"));
    },
  });
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
