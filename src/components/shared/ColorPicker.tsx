interface ColorOption {
  value: string;
  label: string;
}

interface ColorPickerProps {
  label?: string;
  colors: ColorOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, colors, value, onChange }: ColorPickerProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="color-picker">
        {colors.map(color => (
          <button
            key={color.value}
            type="button"
            className={`color-btn ${value === color.value ? 'selected' : ''}`}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );
}
