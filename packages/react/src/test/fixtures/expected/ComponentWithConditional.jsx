/**
 * @generated 1700000000000
 * @typedef {any} AutoGen
 *
 * @typedef {{
 *  bigWinWinner: AutoGen,
 *  isLoading: AutoGen,
 * }} ComponentWithConditionalProps
 */

/** @type {(props: ComponentWithConditionalProps) => JSX.Element} */
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
