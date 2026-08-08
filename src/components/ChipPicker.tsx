interface ChipPickerItem {
  value: string;
  label: string;
}

interface Props {
  items: ChipPickerItem[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
}

export function ChipPicker({ items, selectedValue, onSelect }: Props) {
  return (
    <div className="chip-picker">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`chip-picker__item${item.value === selectedValue ? " chip-picker__item--active" : ""}`}
          onClick={() => onSelect(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
