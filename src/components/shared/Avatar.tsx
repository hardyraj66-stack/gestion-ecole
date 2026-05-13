interface AvatarProps {
  initiales: string;
  genre?: 'M' | 'F';
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ initiales, genre, size = 'md' }: AvatarProps) {
  const genderClass = genre === 'F' ? 'female' : 'male';
  const sizeClass = size === 'lg' ? 'avatar-lg' : '';
  
  return (
    <div className={`avatar ${genderClass} ${sizeClass}`}>
      {initiales}
    </div>
  );
}
