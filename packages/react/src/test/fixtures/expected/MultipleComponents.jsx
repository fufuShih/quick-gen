// This component doesn't have JSDoc yet
/**
 * @generated 1700000000000
 * @component HeaderButton
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.text - [auto generate]
 * @returns {JSX.Element} React component
 */
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
 * @component ContentButton
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.children - [auto generate]
 * @returns {JSX.Element} React component
 */
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
 * @component SidebarButton
 *
 * @param {Object} props Component props
 * @param {*} props.onClick - [auto generate]
 * @param {*} props.icon - [auto generate]
 * @param {*} props.text - [auto generate]
 * @returns {JSX.Element} React component
 */
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
