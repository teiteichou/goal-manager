export function SegmentedControl<T extends string>({
  active,
  items,
  onChange,
}: {
  active: T;
  items: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented">
      {items.map((item) => (
        <button className={`segment ${active === item.value ? "active" : ""}`} key={item.value} onClick={() => onChange(item.value)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}
