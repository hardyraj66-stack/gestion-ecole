import { InputHTMLAttributes } from 'react';
import { Icon, Icons } from './Icon';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ onSearch, onChange, ...props }: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onSearch?.(e.target.value);
  };

  return (
    <div className="search-input">
      <Icon path={Icons.search} size={18} />
      <input
        type="text"
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
