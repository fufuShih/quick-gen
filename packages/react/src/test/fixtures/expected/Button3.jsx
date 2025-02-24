/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 *  props?: AutoGen,
 * }} Button3Props
 */

/** @type {(props: Button3Props) => JSX.Element} */
const Button3 = ({ onClick, children, disabled, ...props }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button3;
