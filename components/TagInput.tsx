import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Plus } from 'lucide-react';

interface TagInputProps {
    value: string; // Comma separated tags
    onChange: (value: string) => void;
    savedTags?: string[];
    onSaveTag: (tag: string) => void;
    onDeleteTag: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, savedTags = [], onSaveTag, onDeleteTag }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const currentTags = value.split(',').map(t => t.trim()).filter(Boolean);

    // Filter suggestions based on input
    useEffect(() => {
        if (!inputValue) {
            setSuggestions([]);
            return;
        }

        const filtered = savedTags.filter(tag =>
            tag.toLowerCase().includes(inputValue.toLowerCase()) &&
            !currentTags.includes(tag)
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
    }, [inputValue, savedTags, currentTags]);

    // Handle outside click to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag: string) => {
        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag];
            onChange(newTags.join(', '));
            onSaveTag(tag); // Ensure it's in saved list
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = currentTags.filter(tag => tag !== tagToRemove);
        onChange(newTags.join(', '));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue.trim());
            }
        } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
            removeTag(currentTags[currentTags.length - 1]);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[42px]">
                {currentTags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <Tag size={12} />
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-blue-900 focus:outline-none"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setShowSuggestions(true)}
                    placeholder={currentTags.length === 0 ? "Aggiungi tag (es. software, affitto)..." : ""}
                    className="flex-1 outline-none text-sm min-w-[120px]"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || inputValue) && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((tag) => (
                        <div
                            key={tag}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer group"
                            onClick={() => addTag(tag)}
                        >
                            <span className="flex items-center gap-2 text-sm text-gray-700">
                                <Tag size={14} className="text-gray-400" />
                                {tag}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag);
                                }}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Rimuovi dai salvati"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    {inputValue && !suggestions.includes(inputValue) && (
                        <div
                            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 text-sm font-medium border-t"
                            onClick={() => addTag(inputValue)}
                        >
                            <Plus size={14} />
                            Crea "{inputValue}"
                        </div>
                    )}
                </div>
            )}

            {/* Quick access to saved tags when empty */}
            {!inputValue && savedTags.length > 0 && currentTags.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {savedTags.slice(0, 5).map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-full transition-colors"
                        >
                            + {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagInput;
