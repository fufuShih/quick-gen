/**
 * @generated 1700000000000
 * @component ComponentWithConditional
 *
 * @param {Object} props Component props
 * @param {*} props.bigWinWinner - [auto generate]
 * @param {*} props.isLoading - [auto generate]
 * @returns {JSX.Element} React component
 */
export const ComponentWithConditional = (props) => {
  const { bigWinWinner, isLoading } = props;
  return isLoading || !bigWinWinner ? (
    <LoadingDiv />
  ) : (
    <div className="userInfo-private">
      <p className="userName">{bigWinWinner.NickName}</p>
    </div>
  );
};
