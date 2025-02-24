/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 * }} Button2Props
 */

/** @type {(props: Button2Props) => JSX.Element} */
const Button2 = (props) => {
  const { onClick, children, disabled } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button2;
