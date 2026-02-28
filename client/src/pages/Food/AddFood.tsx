// client/src/pages/Food/AddFood.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Mock starting database for Canteens
const INITIAL_CANTEENS = [
  "Main Cafeteria",
  "Engineering Canteen",
  "Science Canteen",
  "Arts Faculty Food Court"
];

const AddFood = () => {
  const navigate = useNavigate();
  
  // ── Form State ──
  const [foodName, setFoodName] = useState("");
  const [price, setPrice] = useState("");
  
  // Canteen State
  const [canteenList, setCanteenList] = useState(INITIAL_CANTEENS);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [canteenSearch, setCanteenSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 🚨 NEW: Modal State for Canteen Creation 🚨
  const [showCanteenModal, setShowCanteenModal] = useState(false);
  const [pendingCanteenName, setPendingCanteenName] = useState("");

  // Macro State
  const [macros, setMacros] = useState({
    calories: "", protein: "", carbs: "", fat: "", sugar: ""
  });

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMacros({ ...macros, [e.target.name]: e.target.value });
  };

  const handleSelectCanteen = (name: string) => {
    setSelectedCanteen(name);
    setCanteenSearch("");
    setIsDropdownOpen(false);
  };

  // 🚨 UPDATED: Instead of creating immediately, we open the popup 🚨
  const handleInitiateCreateCanteen = () => {
    if (!canteenSearch.trim()) return;
    setPendingCanteenName(canteenSearch.trim());
    setIsDropdownOpen(false); // Close the dropdown
    setShowCanteenModal(true); // Open the popup
  };

  // 🚨 NEW: Confirm creation 🚨
  const confirmCreateCanteen = () => {
    setCanteenList([...canteenList, pendingCanteenName]);
    setSelectedCanteen(pendingCanteenName);
    setCanteenSearch("");
    setShowCanteenModal(false);
    setPendingCanteenName("");
  };

  // 🚨 NEW: Cancel creation 🚨
  const cancelCreateCanteen = () => {
    setShowCanteenModal(false);
    setPendingCanteenName("");
    // Optionally reopen dropdown if you want them to continue typing
    // setIsDropdownOpen(true); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mockPayload = {
      food_name: foodName,
      price: Number(price),
      canteen: selectedCanteen,
      macronutrient: {
        calories: Number(macros.calories),
        protein: Number(macros.protein),
        carbohydrate: Number(macros.carbs),
        fat: Number(macros.fat),
        sugar: Number(macros.sugar)
      },
      imageAttached: !!imageFile
    };

    console.log("🚀 READY TO SEND TO BACKEND:", mockPayload);
    alert("Food added successfully! (Check console for payload)");
    navigate(-1); 
  };

  // Filter canteens based on search
  const filteredCanteens = canteenList.filter(c => 
    c.toLowerCase().includes(canteenSearch.toLowerCase())
  );
  const isExactMatch = canteenList.some(c => c.toLowerCase() === canteenSearch.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-stone-50 pb-20 font-sans relative">
      
      {/* ── 🚨 NEW: Confirmation Modal Overlay 🚨 ── */}
      {showCanteenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 text-center mb-2">Create New Canteen?</h3>
            <p className="text-stone-500 text-center text-sm mb-6">
              Are you sure you want to add <span className="font-bold text-stone-900">"{pendingCanteenName}"</span> to the system? All users will be able to see this location.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={cancelCreateCanteen}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-stone-500 bg-stone-100 hover:bg-stone-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCreateCanteen}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-stone-900 bg-amber-400 hover:bg-amber-500 transition shadow-sm"
              >
                Yes, Create It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-stone-900 transition flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="font-bold text-sm hidden sm:block">Back</span>
        </button>
        <h1 className="text-xl font-serif text-stone-900 font-bold">Add New Menu</h1>
        <div className="w-16"></div> 
      </header>

      <main className="max-w-2xl mx-auto p-6 mt-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ── 1. Image Upload ── */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col items-center justify-center">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageChange} 
            />
            {imagePreview ? (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-stone-900 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">Change Image</button>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-100 hover:border-amber-400 hover:text-amber-500 transition group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-3 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="font-bold text-sm tracking-wide">Tap to upload food image</span>
              </button>
            )}
          </div>

          {/* ── 2. Basic Info ── */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Food Name</label>
              <input 
                type="text" required
                value={foodName} onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Spicy Basil Pork" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition"
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Canteen Location</label>
              
              <div 
                onClick={() => setIsDropdownOpen(true)}
                className={`w-full border rounded-xl p-4 flex items-center justify-between cursor-text transition ${isDropdownOpen ? 'border-amber-400 bg-white' : 'border-stone-200 bg-stone-50'}`}
              >
                {isDropdownOpen ? (
                  <input 
                    autoFocus
                    type="text" 
                    value={canteenSearch} 
                    onChange={(e) => setCanteenSearch(e.target.value)}
                    placeholder="Search or type new canteen..."
                    className="bg-transparent outline-none w-full text-stone-900"
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} 
                  />
                ) : (
                  <span className={selectedCanteen ? "text-stone-900 font-bold" : "text-stone-400"}>
                    {selectedCanteen || "Select a canteen..."}
                  </span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-stone-200 rounded-2xl shadow-xl z-30 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredCanteens.map((c) => (
                    <div 
                      key={c} 
                      onClick={() => handleSelectCanteen(c)}
                      className="p-4 hover:bg-stone-50 border-b border-stone-100 cursor-pointer text-stone-700 font-medium"
                    >
                      {c}
                    </div>
                  ))}
                  
                  {/* Create New Option */}
                  {canteenSearch.trim() !== "" && !isExactMatch && (
                    <div 
                      onClick={handleInitiateCreateCanteen} // 🚨 UPDATED HANDLER HERE 🚨
                      className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer flex items-center gap-2 font-bold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Create "{canteenSearch}"
                    </div>
                  )}
                  {filteredCanteens.length === 0 && canteenSearch === "" && (
                     <div className="p-4 text-stone-400 italic text-sm text-center">Start typing to search...</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Price (฿)</label>
              <input 
                type="number" required min="0"
                value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* ── 3. Macronutrients ── */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
            <h3 className="text-sm font-bold text-stone-800 mb-6">Nutritional Data (per serving)</h3>
            
            <div className="mb-6">
               <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 text-center">Total Calories (kcal)</label>
               <input 
                 type="number" required min="0" name="calories"
                 value={macros.calories} onChange={handleMacroChange}
                 placeholder="0" 
                 className="w-full text-center text-4xl font-serif text-stone-900 border-b-2 border-stone-200 focus:border-amber-400 focus:outline-none pb-2 bg-transparent transition"
               />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['protein', 'carbs', 'fat', 'sugar'].map((macro) => (
                <div key={macro} className="bg-stone-50 rounded-2xl p-3 border border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{macro} (g)</label>
                  <input 
                    type="number" required min="0" name={macro}
                    value={macros[macro as keyof typeof macros]} onChange={handleMacroChange}
                    placeholder="0" 
                    className="w-full bg-transparent text-lg font-bold text-stone-800 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button 
            type="submit"
            className="w-full bg-stone-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 hover:text-stone-900 transition shadow-lg hover:shadow-amber-400/20"
          >
            Save Menu Item
          </button>

        </form>
      </main>
    </div>
  );
};

export default AddFood;