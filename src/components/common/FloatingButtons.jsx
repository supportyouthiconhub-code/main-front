import React from "react";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-5 left-5 flex flex-col gap-3 z-50">

      {/* WhatsApp */}
      <a
        href="https://chat.whatsapp.com/EBB3fmgmU79FWKbtjTGO2i"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.52 3.48A11.8 11.8 0 0012.03 0C5.39 0 .04 5.35.04 12c0 2.11.55 4.17 1.6 5.99L0 24l6.19-1.61A11.96 11.96 0 0012.03 24c6.63 0 11.99-5.36 11.99-12 0-3.2-1.25-6.21-3.5-8.52zM12.03 21.82c-1.84 0-3.64-.5-5.2-1.45l-.37-.22-3.68.96.98-3.59-.24-.37A9.73 9.73 0 012.3 12c0-5.36 4.37-9.73 9.73-9.73 2.6 0 5.04 1.01 6.88 2.85a9.66 9.66 0 012.85 6.88c0 5.36-4.37 9.82-9.73 9.82zm5.47-7.3c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.46-.89-.79-1.5-1.76-1.67-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.5 0 1.46 1.08 2.87 1.23 3.07.15.2 2.13 3.26 5.17 4.57.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35z"/>
        </svg>
      </a>

      {/* Call */}
      <a
        href="tel:+916239922672"
        className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.07 21 3 13.93 3 5c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </a>

    </div>
  );
}
