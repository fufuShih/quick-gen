/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 * }} ButtonWithJSDocProps
 */

/** @type {(props: ButtonWithJSDocProps) => JSX.Element} */
const ButtonWithJSDoc = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ButtonWithJSDoc; 
