// This component doesn't have JSDoc yet
/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  text: AutoGen,
 * }} HeaderButtonProps
 */

/** @type {(props: HeaderButtonProps) => JSX.Element} */
const HeaderButton = ({ onClick, text }) => {
  return (
    <button onClick={onClick}>
      {text}
    </button>
  );
};

// This component doesn't have JSDoc yet
/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  children: AutoGen,
 * }} ContentButtonProps
 */

/** @type {(props: ContentButtonProps) => JSX.Element} */
const ContentButton = ({ onClick, children }) => {
  return (
    <button onClick={onClick} className="content-btn">
      {children}
    </button>
  );
};

/**
 * @component FooterButton
 * @description A button component for footers
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.label - Button label
 * @param {*} props.disabled - Disabled state
 * @returns {JSX.Element} React component
 */
const FooterButton = ({ onClick, label, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="footer-btn"
    >
      {label}
    </button>
  );
};

// This component doesn't have JSDoc yet
/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  onClick: AutoGen,
 *  icon: AutoGen,
 *  text: AutoGen,
 * }} SidebarButtonProps
 */

/** @type {(props: SidebarButtonProps) => JSX.Element} */
const SidebarButton = (props) => {
  const { onClick, icon, text } = props;
  
  return (
    <button onClick={onClick} className="sidebar-btn">
      {icon && <span className="icon">{icon}</span>}
      {text}
    </button>
  );
};

export { HeaderButton, ContentButton, FooterButton, SidebarButton }; 
