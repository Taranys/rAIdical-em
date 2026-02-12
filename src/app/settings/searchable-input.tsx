"use client";

// US-006: Reusable searchable input with dropdown suggestions
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SearchableInputProps<T> {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  filterItem: (item: T, query: string) => boolean;
  onSelect: (item: T) => void;
  listLabel?: string;
  isLoading?: boolean;
  loadingText?: string;
  showAllOnFocus?: boolean;
}

export function SearchableInput<T>({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  items,
  getKey,
  renderItem,
  filterItem,
  onSelect,
  listLabel,
  isLoading,
  loadingText,
  showAllOnFocus = false,
}: SearchableInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = showAll
    ? items
    : items.filter((item) => filterItem(item, value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAll(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(newValue: string) {
    onChange(newValue);
    setShowAll(false);
    const matches = items.filter((item) => filterItem(item, newValue));
    setIsOpen(matches.length > 0);
  }

  function handleFocus() {
    if (items.length > 0) {
      if (showAllOnFocus) setShowAll(true);
      setIsOpen(true);
    }
  }

  function handleSelect(item: T) {
    onSelect(item);
    setIsOpen(false);
    setShowAll(false);
  }

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        disabled={disabled}
      />
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          {loadingText ?? "Searching..."}
        </p>
      )}
      {isOpen && filtered.length > 0 && (
        <ul
          role="listbox"
          aria-label={listLabel}
          className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {filtered.map((item) => (
            <li
              key={getKey(item)}
              role="option"
              aria-selected={getKey(item) === value}
              className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
              onClick={() => handleSelect(item)}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
