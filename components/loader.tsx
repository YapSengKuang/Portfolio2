type LoaderProps = {
  ready: boolean;
};

export function Loader({ ready }: LoaderProps) {
  return (
    <div
      className={`loader ${ready ? "is-done" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!ready}
      aria-hidden={ready}
      data-ui
    >
      <div className="loader-ball" aria-hidden="true" />
      <p className="loader-name">Seng</p>
      <p className="loader-status">Loading</p>
    </div>
  );
}
