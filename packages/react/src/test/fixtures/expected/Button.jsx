/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 * }} ButtonProps
 */

/** @type {(props: ButtonProps) => JSX.Element} */
const Button = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button; 
