type ButtonVariant = 'primary' | 'secondary';

const TypeScriptButton = ({ label, disabled, variant }: {
  label: string;
  disabled?: boolean;
  variant?: ButtonVariant;
}) => {
  return (
    <button disabled={disabled} data-variant={variant}>
      {label}
    </button>
  );
};

export default TypeScriptButton;
