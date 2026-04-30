type ButtonVariant = 'primary' | 'secondary';

/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  label: AutoGen,
 *  disabled: AutoGen,
 *  variant: AutoGen,
 * }} TypeScriptButtonProps
 */

/** @type {(props: TypeScriptButtonProps) => JSX.Element} */
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
