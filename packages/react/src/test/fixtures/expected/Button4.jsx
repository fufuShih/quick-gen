/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 *  disabled: AutoGen,
 *  rest?: AutoGen,
 * }} Button4Props
 */

/** @type {(props: Button4Props) => JSX.Element} */
const Button4 = (props) => {
  const { onClick, children, disabled, ...rest } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button4;
