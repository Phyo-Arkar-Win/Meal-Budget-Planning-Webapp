// client/src/pages/Food/FoodDatabase.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// Updated dummy data with Sugar added
const DUMMY_FOODS = [
    { food_id: "1", food_name: "Grilled Chicken Salad", price: 45, canteen: "Main Cafeteria", macronutrient: { calories: 350, protein: 40, carbohydrate: 15, fat: 12, sugar: 4 } },
    { food_id: "2", food_name: "Spicy Basil Pork with Rice", price: 50, canteen: "Engineering Canteen", macronutrient: { calories: 600, protein: 25, carbohydrate: 65, fat: 20, sugar: 8 } },
    { food_id: "3", food_name: "Fruit Bowl", price: 30, canteen: "Main Cafeteria", macronutrient: { calories: 150, protein: 2, carbohydrate: 35, fat: 1, sugar: 25 } },
    { food_id: "4", food_name: "Beef Noodle Soup", price: 60, canteen: "Science Canteen", macronutrient: { calories: 500, protein: 30, carbohydrate: 55, fat: 15, sugar: 5 } },
];

const FoodDatabase = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilterModal, setActiveFilterModal] = useState<"macro" | "price" | "canteen" | null>(null);

    // Active Filter States
    const [macroTarget, setMacroTarget] = useState({ type: "protein", amount: "" });
    const [priceTarget, setPriceTarget] = useState({ mode: "sort", sort: "asc", amount: "" });
    const [canteenFilter, setCanteenFilter] = useState("All");

    // Dynamically Filter & Sort the Food List
    const displayedFoods = useMemo(() => {
        let result = [...DUMMY_FOODS];

        // 1. Text Search
        if (searchTerm) {
            result = result.filter(f => f.food_name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 2. Canteen Filter
        if (canteenFilter !== "All") {
            result = result.filter(f => f.canteen === canteenFilter);
        }

        // 3. Macro Sorting (Closest Match)
        if (macroTarget.amount !== "") {
            const targetValue = Number(macroTarget.amount);
            result.sort((a, b) => {
                const aVal = a.macronutrient[macroTarget.type as keyof typeof a.macronutrient];
                const bVal = b.macronutrient[macroTarget.type as keyof typeof b.macronutrient];
                return Math.abs(aVal - targetValue) - Math.abs(bVal - targetValue);
            });
        }

        // 4. Price Sorting
        if (priceTarget.mode === "closest" && priceTarget.amount !== "") {
            const targetValue = Number(priceTarget.amount);
            result.sort((a, b) => Math.abs(a.price - targetValue) - Math.abs(b.price - targetValue));
        } else if (priceTarget.mode === "sort") {
            if (priceTarget.sort === "asc") result.sort((a, b) => a.price - b.price);
            if (priceTarget.sort === "desc") result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [searchTerm, macroTarget, priceTarget, canteenFilter]);

    // Get unique canteens for the dropdown
    const uniqueCanteens = ["All", ...Array.from(new Set(DUMMY_FOODS.map(f => f.canteen)))];

    return (
        <div className="min-h-screen bg-stone-50 flex font-sans">

            {/* ── LEFT PANEL (PC ONLY) ────────────────────────────── */}
            <div className="hidden md:flex flex-col w-1/3 max-w-sm bg-stone-900 text-white p-10 relative border-r border-stone-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <Link to="/" className="text-stone-400 hover:text-white flex items-center gap-2 transition w-fit group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm tracking-wide">Back to Dashboard</span>
                </Link>

                <div className="mt-32">
                    <h1 className="font-serif text-5xl text-amber-400 mb-6 leading-tight">Food<br />Database</h1>
                    <p className="text-stone-400 leading-relaxed text-sm">
                        Search, filter, and discover meals from your campus canteens to perfectly hit your macro targets.
                    </p>
                </div>

                {/* Add Food Button (Desktop) */}
                <Link
                    to="/food/add"
                    className="mt-auto bg-amber-400 text-stone-900 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition flex justify-center items-center gap-2 shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Add New Food
                </Link>
            </div>

            {/* ── RIGHT PANEL (MAIN CONTENT) ──────────────────────────────── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* Mobile Header */}
                <div className="md:hidden bg-stone-900 px-6 py-6 text-white flex items-center justify-between shadow-md z-10">
                    <Link to="/" className="text-stone-400 hover:text-white transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <h1 className="text-xl font-serif tracking-wide text-amber-400">Food Database</h1>
                    <div className="w-6" />
                </div>

                <div className="p-5 md:p-8 flex-1 overflow-y-auto">

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search foods or ingredients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition text-stone-800"
                        />
                    </div>

                    {/* ── FILTER CHIPS ROW + MOBILE ADD BUTTON ── */}
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
                        {/* Macro Filter Button */}
                        <button onClick={() => setActiveFilterModal(activeFilterModal === 'macro' ? null : 'macro')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${activeFilterModal === 'macro' || macroTarget.amount !== "" ? 'bg-amber-50 border-amber-400 text-amber-600' : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500'}`}>
                            Macros
                        </button>

                        {/* Price Filter Button */}
                        <button onClick={() => setActiveFilterModal(activeFilterModal === 'price' ? null : 'price')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${activeFilterModal === 'price' || priceTarget.amount !== "" ? 'bg-amber-50 border-amber-400 text-amber-600' : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500'}`}>
                            Price
                        </button>

                        {/* Canteen Filter Button */}
                        <button onClick={() => setActiveFilterModal(activeFilterModal === 'canteen' ? null : 'canteen')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition shadow-sm border ${activeFilterModal === 'canteen' || canteenFilter !== "All" ? 'bg-amber-50 border-amber-400 text-amber-600' : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-500'}`}>
                            Canteen
                        </button>

                        {/* Mobile Add Food Button */}
                        <Link
                            to="/food/add"
                            className="md:hidden flex-shrink-0 ml-auto flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 border border-amber-500 rounded-full text-xs font-bold uppercase tracking-widest text-stone-900 shadow-sm hover:bg-amber-300 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            Add
                        </Link>
                    </div>

                    {/* ── ACTIVE FILTER MENUS ── */}

                    {/* Macro Settings */}
                    {activeFilterModal === 'macro' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Closest Macro Match</span>
                                <button onClick={() => { setMacroTarget({ type: "protein", amount: "" }); setActiveFilterModal(null); }} className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
                            </div>
                            <div className="flex gap-2">
                                <select value={macroTarget.type} onChange={(e) => setMacroTarget({ ...macroTarget, type: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm">
                                    <option value="protein">Protein (g)</option>
                                    <option value="calories">Calories (kcal)</option>
                                    <option value="carbohydrate">Carbs (g)</option>
                                    <option value="fat">Fat (g)</option>
                                    <option value="sugar">Sugar (g)</option>
                                </select>
                                <input type="number" placeholder="Target" value={macroTarget.amount} onChange={(e) => setMacroTarget({ ...macroTarget, amount: e.target.value })} className="w-24 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
                            </div>
                        </div>
                    )}

                    {/* Price Settings */}
                    {activeFilterModal === 'price' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Price Filter</span>
                                <button onClick={() => { setPriceTarget({ mode: "sort", sort: "asc", amount: "" }); setActiveFilterModal(null); }} className="text-[10px] text-amber-700 hover:underline uppercase font-bold">Clear</button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <button onClick={() => setPriceTarget({ mode: "sort", sort: "asc", amount: "" })} className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "asc" ? 'bg-amber-400 border-amber-500 text-stone-900' : 'bg-white border-amber-200 text-stone-600'}`}>Lowest First</button>
                                    <button onClick={() => setPriceTarget({ mode: "sort", sort: "desc", amount: "" })} className={`flex-1 py-2 text-sm font-semibold rounded-xl border ${priceTarget.mode === "sort" && priceTarget.sort === "desc" ? 'bg-amber-400 border-amber-500 text-stone-900' : 'bg-white border-amber-200 text-stone-600'}`}>Highest First</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-amber-800">Or Closest to: ฿</span>
                                    <input type="number" placeholder="40" value={priceTarget.mode === "closest" ? priceTarget.amount : ""} onChange={(e) => setPriceTarget({ mode: "closest", sort: "asc", amount: e.target.value })} className="flex-1 px-3 py-2 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Canteen Settings */}
                    {activeFilterModal === 'canteen' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Select Canteen</span>
                            </div>
                            <select value={canteenFilter} onChange={(e) => setCanteenFilter(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm font-medium">
                                {uniqueCanteens.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    {/* ── FOOD GRID ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedFoods.length > 0 ? displayedFoods.map((food) => (

                            <Link to={`/food/${food.food_id}`} key={food.food_id} className="bg-white border border-stone-100 rounded-3xl p-3 shadow-sm hover:shadow-md transition group cursor-pointer flex flex-col block">

                                {/* Image Placeholder */}
                                <div className="w-full h-36 bg-stone-100 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-stone-300 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-stone-800 shadow-sm">
                                        ฿{food.price}
                                    </div>
                                </div>

                                <div className="px-1 flex-1 flex flex-col">
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">{food.canteen}</span>
                                    <h3 className="font-bold text-stone-800 mb-3 line-clamp-1">{food.food_name}</h3>

                                    {/* Macros Mini-display*/}
                                    <div className="mt-auto flex justify-between items-center pt-3 border-t border-stone-100">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-stone-800">{food.macronutrient.calories}</span>
                                            <span className="text-[10px] text-stone-400 uppercase">kcal</span>
                                        </div>
                                        <div className="flex gap-1.5 text-[9px] text-stone-500 font-medium">
                                            <span title="Protein">Protein:{food.macronutrient.protein}</span>
                                            <span title="Carbs">Carb:{food.macronutrient.carbohydrate}</span>
                                            <span title="Fat">Fat:{food.macronutrient.fat}</span>
                                            <span title="Sugar">Sugar:{food.macronutrient.sugar}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                        )) : (
                            <div className="col-span-full py-10 text-center text-stone-400 font-medium">
                                No foods match your filters. Try adjusting them!
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FoodDatabase;