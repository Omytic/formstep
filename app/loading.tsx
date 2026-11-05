export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden" aria-hidden>
      <div className="h-full w-1/3 animate-[fs-load_1s_ease-in-out_infinite] bg-sky" />
      <style>{`@keyframes fs-load{from{transform:translateX(-100%)}to{transform:translateX(300%)}}`}</style>
    </div>
  );
}
