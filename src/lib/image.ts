/**
 * 이미지 파일을 긴 변 maxSize 이하로 줄인 data URL로 변환한다.
 * LocalStorage 용량(대개 5MB)을 원본 사진 한 장이 다 써 버리지 않도록 반드시 축소해서 저장한다.
 */
export function readImageAsDataUrl(file: File, maxSize: number): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("이미지 파일이 아닙니다."));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas를 사용할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    img.src = url;
  });
}
