/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  flag: AutoGen,
 *  name: AutoGen,
 * }} ComponentWithConditional2Props
 */

/** @type {(props: ComponentWithConditional2Props) => JSX.Element} */
const ComponentWithConditional2 = ({ flag, name }) => {
  if (flag) {
    return <div>{name}</div>;
  } else {
    return <span>{name}</span>;
  }
};
  
export default ComponentWithConditional2;
