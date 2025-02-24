/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  flag: AutoGen,
 *  name: AutoGen,
 *  useBlock: AutoGen,
 * }} ComponentWithConditional3Props
 */

/** @type {(props: ComponentWithConditional3Props) => JSX.Element} */
const ComponentWithConditional3 = ({ flag, name, useBlock }) => {
  if (useBlock) {
    if (flag) {
      return <div>{name}</div>;
    } else {
      return <span>{name}</span>;
    }
  }
  if (flag) return <div>{name}</div>;
  return <span>{name}</span>;
};
  
export default ComponentWithConditional3;
