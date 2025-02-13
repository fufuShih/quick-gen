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
