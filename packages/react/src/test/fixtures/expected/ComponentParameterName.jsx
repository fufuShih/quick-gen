/**
 * @component DataComponent
 * @description React component
 * @param {Object} data Component props
 * @param {*} data.title - title prop
 * @returns {JSX.Element} React component
 */
const DataComponent = (data) => {
    return <div>{data.title}</div>;
};
export default DataComponent;
