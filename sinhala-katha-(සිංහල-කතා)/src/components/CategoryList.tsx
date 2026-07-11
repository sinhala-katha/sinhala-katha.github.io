import { Category } from '../types';
import { Layers, Bookmark } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryList({
  categories,
  selectedCategoryId,
  onSelectCategory
}: CategoryListProps) {
  return (
    <div className="mb-8" id="category-selector-container">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="text-[#c9a86a]" size={18} />
        <h3 className="text-sm font-serif italic tracking-wider text-[#c9a86a]">
          ප්‍රධාන මෙනුව / ප්‍රවර්ග (Categories)
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2.5">
        <button
          id="cat-btn-all"
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-[#c9a86a] text-black shadow-lg shadow-[#c9a86a33] border border-[#c9a86a] scale-[1.02]'
              : 'bg-[#111] hover:bg-[#161616] text-gray-400 hover:text-white border border-[#222]'
          }`}
        >
          <Bookmark size={14} />
          සියලුම කතා (All)
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            id={`cat-btn-${category.id}`}
            onClick={() => onSelectCategory(category.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
              selectedCategoryId === category.id
                ? 'bg-[#c9a86a] text-black shadow-lg shadow-[#c9a86a33] border border-[#c9a86a] scale-[1.02]'
                : 'bg-[#111] hover:bg-[#161616] text-gray-400 hover:text-white border border-[#222]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectedCategoryId === category.id ? 'bg-black' : 'bg-[#c9a86a]'}`}></span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
