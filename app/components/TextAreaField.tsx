type TextAreaFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  onChange: (value: string) => void;
};

export default function TextAreaField({
  label,
  value,
  placeholder = "",
  required = false,
  rows = 4,
  onChange,
}: TextAreaFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
      />
    </label>
  );
}
