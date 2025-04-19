import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Make sure you have lucide-react installed

const categories = [
  { label: 'General', value: 'general' },
  { label: 'Business', value: 'business' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Health', value: 'health' },
  { label: 'Science', value: 'science' },
  { label: 'Sports', value: 'sports' },
  { label: 'Technology', value: 'technology' }
];

const CategorySelector = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null); // Ref for the menu container

  const handleSelect = (category) => {
    setOpen(false); // Close menu on selection
    navigate(`/category/${category}`);
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close if clicked outside the menuRef element and the menu is open
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    // Add event listener if menu is open
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Clean up listener if menu is closed or component unmounts
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]); // Re-run effect when 'open' state changes

  return (
    // Use the ref on the container div that includes button and dropdown
    <div ref={menuRef} className="fixed top-4 left-4 z-50">
      {/* --- Trigger Button --- */}
      <button
        // --- UPDATED: Light background, dark icon color ---
        className="bg-white text-gray-800 p-2 rounded-md shadow-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" // Adjusted hover/focus too
        onClick={() => setOpen(!open)}
        aria-label="Toggle category menu"
        aria-expanded={open} // Accessibility improvement
        aria-controls={open ? "category-menu" : undefined} // Link button to menu when open
      >
        {/* Show appropriate icon */}
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* --- Vertical Dropdown --- */}
      {open && (
        <div
          id="category-menu" // Added ID for aria-controls
          // --- UPDATED: Light background, lighter border ---
          className="absolute mt-2 bg-white border border-gray-300 rounded-lg shadow-lg w-48 flex flex-col overflow-hidden" // Use light theme colors
          role="menu" // Accessibility improvement
          aria-orientation="vertical"
          aria-labelledby="menu-button" // Assuming your button could have id="menu-button"
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              role="menuitem" // Accessibility improvement
              // --- UPDATED: Dark text, light hover/focus/border ---
              className="text-gray-800 text-left px-4 py-2 hover:bg-gray-100 w-full border-b border-gray-200 last:border-b-0 transition duration-150 ease-in-out focus:outline-none focus:bg-gray-100"
              onClick={() => handleSelect(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;