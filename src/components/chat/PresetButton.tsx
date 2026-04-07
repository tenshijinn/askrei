interface PresetButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

export const PresetButton = ({ text, onClick, variant = 'default' }: PresetButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="rei-chip"
    >
      <span className="rei-chip-dot" />
      {text}
    </button>
  );
};
