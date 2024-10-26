import { createSignal, Show } from 'solid-js';

function App() {
  const [selectedImage, setSelectedImage] = createSignal(null);
  const [imagePreview, setImagePreview] = createSignal(null);
  const [extractedText, setExtractedText] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractText = async () => {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('language', 'ara');
    formData.append('isOverlayRequired', 'false');
    formData.append('base64Image', await toBase64(selectedImage()));
    formData.append('apikey', import.meta.env.VITE_OCR_API_KEY);

    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.IsErroredOnProcessing) {
        setError(result.ErrorMessage[0]);
      } else {
        setExtractedText(result.ParsedResults[0].ParsedText);
      }
    } catch (err) {
      setError('حدث خطأ أثناء استخراج النص. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4" dir="rtl">
      <div class="max-w-2xl mx-auto h-full">
        <h1 class="text-4xl font-bold text-purple-600 text-center mb-8">استخراج النصوص من الصورة</h1>
        <div class="bg-white p-6 rounded-lg shadow-md h-full">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">اختر صورة:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              class="w-full p-2 border border-gray-300 rounded-lg cursor-pointer box-border"
            />
          </div>
          <Show when={imagePreview()}>
            <div class="mb-4">
              <img src={imagePreview()} alt="Selected" class="w-full h-auto rounded-lg" />
            </div>
          </Show>
          <button
            onClick={handleExtractText}
            class={`w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
              loading() || !selectedImage() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading() || !selectedImage()}
          >
            {loading() ? 'جاري استخراج النص ...' : 'استخراج النص'}
          </button>
          <Show when={error()}>
            <div class="mt-4 text-red-600 text-center">{error()}</div>
          </Show>
          <Show when={extractedText()}>
            <div class="mt-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">النص المستخرج:</label>
              <textarea
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border"
                rows="6"
                value={extractedText()}
                readOnly
              />
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default App;