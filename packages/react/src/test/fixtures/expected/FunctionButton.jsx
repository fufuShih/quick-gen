/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  type: AutoGen,
 *  onClick: AutoGen,
 *  children: AutoGen,
 * }} FunctionButtonProps
 */

/** @type {(props: FunctionButtonProps) => JSX.Element} */
function FunctionButton({ type, onClick, children }) {
  return (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export default FunctionButton; 
